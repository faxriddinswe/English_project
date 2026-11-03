from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select, delete, func, or_
from app.core.schemas import (
    GroupIn,
    MembershipIn,
    TransferIn,
    GenerateLessons,
    EndMembership,
    Reason,
)
from app.core.helpers import get, project, audit, page_query, teacher_lock, local_today
from app.core.errors import fail
from app.db.session import get_db
from app.db.models import Course, Group, ScheduleRule, Membership, Student, Lesson
from app.db.base import utcnow
from app.modules.auth.service import teacher
from app.modules.groups.service import enroll, generate_lessons
from app.modules.students.policy import listed_student

router = APIRouter(prefix="/teacher", tags=["groups"])
GROUP_FIELDS = "id course_id name level capacity start_date end_date monthly_price location billing_policy deleted_at"


def enrich_groups(db, rows):
    ids = [UUID(row["id"]) for row in rows]
    if not ids:
        return rows
    rules = {str(oid): [] for oid in ids}
    for rule in db.scalars(
        select(ScheduleRule)
        .where(ScheduleRule.group_id.in_(ids))
        .order_by(ScheduleRule.weekday, ScheduleRule.local_time)
    ):
        start = rule.local_time.hour * 60 + rule.local_time.minute
        end = start + rule.duration_minutes
        rules[str(rule.group_id)].append(
            {
                "weekday": rule.weekday,
                "local_time": rule.local_time.isoformat(),
                "duration_minutes": rule.duration_minutes,
                "end_time": f"{(end // 60) % 24:02}:{end % 60:02}",
                "end_day_offset": end // 1440,
            }
        )
    counts = dict(
        db.execute(
            select(Membership.group_id, func.count(func.distinct(Membership.student_id)))
            .join(Student, Membership.student_id == Student.id)
            .where(
                listed_student(),
                Membership.group_id.in_(ids),
                Membership.start_date <= local_today(),
                or_(Membership.end_date.is_(None), Membership.end_date > local_today()),
            )
            .group_by(Membership.group_id)
        ).all()
    )
    courses = dict(
        db.execute(
            select(Group.id, Course.name)
            .join(Course, Course.id == Group.course_id)
            .where(Group.id.in_(ids))
        ).all()
    )
    for row in rows:
        oid = UUID(row["id"])
        row.update(
            rules=rules[row["id"]],
            course_name=courses[oid],
            student_count=counts.get(oid, 0) if row["deleted_at"] is None else 0,
        )
    return rows


def group_data(db, obj):
    return enrich_groups(db, [project(obj, GROUP_FIELDS)])[0]


@router.get("/groups")
def groups(
    q: str = "",
    page: int = 1,
    page_size: int = 20,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    result = page_query(
        db,
        select(Group)
        .where(
            Group.name.ilike("%" + q[:100] + "%"),
            Group.deleted_at.is_(None),
        )
        .order_by(Group.created_at.desc()),
        lambda x: project(x, GROUP_FIELDS),
        page,
        page_size,
    )
    result["items"] = enrich_groups(db, result["items"])
    return result


@router.post("/groups", status_code=201)
def create(payload: GroupIn, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    teacher_lock(db, actor)
    course = get(db, Course, payload.course_id)
    if course.deleted_at is not None:
        fail(409, "deleted_course", "Kurs o‘chirilgan")
    obj = Group(**payload.model_dump(exclude={"rules"}))
    db.add(obj)
    db.flush()
    for rule in payload.rules:
        db.add(ScheduleRule(group_id=obj.id, **rule.model_dump()))
    db.flush()
    audit(db, actor, "group_created", obj.id)
    return group_data(db, obj)


@router.get("/groups/{oid}")
def detail(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    d = group_data(db, get(db, Group, oid))
    d["memberships"] = [
        {
            **project(member, "id student_id start_date end_date exit_reason note"),
            "student_name": student.full_name,
            "is_current": d["deleted_at"] is None
            and student.deleted_at is None
            and student.admission_status == "approved"
            and member.start_date <= local_today()
            and (member.end_date is None or member.end_date > local_today()),
        }
        for member, student in db.execute(
            select(Membership, Student)
            .join(Student, Student.id == Membership.student_id)
            .where(Membership.group_id == oid)
            .order_by(Membership.start_date.desc())
        )
    ]
    return d


@router.put("/groups/{oid}")
def update_group(
    oid: UUID, payload: GroupIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    teacher_lock(db, actor)
    obj = get(db, Group, oid, lock=True)
    course = get(db, Course, payload.course_id)
    if obj.deleted_at is not None or course.deleted_at is not None:
        fail(409, "deleted", "O‘chirilgan guruh yoki kursni tahrirlab bo‘lmaydi")
    members = list(
        db.scalars(
            select(Membership)
            .join(Student, Membership.student_id == Student.id)
            .where(Membership.group_id == oid, listed_student())
        )
    )
    if any(m.start_date < payload.start_date for m in members):
        fail(409, "membership_history", "Guruh boshi mavjud a’zolikdan keyin bo‘lmasin")
    points = {max(local_today(), m.start_date) for m in members}
    peak = max(
        (
            sum(m.start_date <= day and (m.end_date is None or day < m.end_date) for m in members)
            for day in points
        ),
        default=0,
    )
    if payload.capacity < peak:
        fail(409, "capacity", "Yangi sig‘im amaldagi a’zolar sonidan kam")
    for k, v in payload.model_dump(exclude={"rules"}).items():
        setattr(obj, k, v)
    # Existing lessons retain their times. Only future bounded generation uses these rules.
    db.execute(delete(ScheduleRule).where(ScheduleRule.group_id == oid))
    for r in payload.rules:
        db.add(ScheduleRule(group_id=oid, **r.model_dump()))
    db.flush()
    audit(db, actor, "group_rules_updated", oid)
    return group_data(db, obj)


@router.post("/groups/{oid}/memberships", status_code=201)
def add_member(
    oid: UUID, payload: MembershipIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    return project(enroll(db, actor, oid, payload), "id student_id group_id start_date end_date")


@router.post("/memberships/{oid}/end")
def end_member(
    oid: UUID, payload: EndMembership, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    teacher_lock(db, actor)
    m = get(db, Membership, oid, lock=True)
    if get(db, Student, m.student_id).deleted_at or get(db, Group, m.group_id).deleted_at:
        fail(409, "deleted", "O‘chirilgan yozuvning a’zolik tarixi o‘zgartirilmaydi")
    if (
        payload.end_date < local_today()
        or payload.end_date <= m.start_date
        or (m.end_date and m.end_date < local_today())
    ):
        fail(422, "historical_change", "O‘tgan a’zolik tarixini o‘zgartirish mumkin emas")
    m.end_date = payload.end_date
    m.exit_reason = payload.reason
    m.note = payload.note
    audit(db, actor, "membership_ended", oid, reason=payload.reason)
    return project(m, "id start_date end_date exit_reason")


@router.post("/memberships/{oid}/transfer")
def transfer(
    oid: UUID, payload: TransferIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    teacher_lock(db, actor)
    m = get(db, Membership, oid, lock=True)
    if get(db, Student, m.student_id).deleted_at or get(db, Group, m.group_id).deleted_at:
        fail(409, "deleted", "O‘chirilgan yozuvning a’zolik tarixi o‘zgartirilmaydi")
    if (
        m.end_date is not None
        or payload.on_date <= m.start_date
        or payload.on_date < local_today()
        or payload.target_group_id == m.group_id
    ):
        fail(409, "invalid_transfer", "Ko‘chirish sanasi yoki a’zolik holati noto‘g‘ri")
    m.end_date = payload.on_date
    m.exit_reason = "transfer"
    m.note = payload.reason
    db.flush()
    new = enroll(
        db,
        actor,
        payload.target_group_id,
        MembershipIn(
            student_id=m.student_id,
            start_date=payload.on_date,
            capacity_override=payload.capacity_override,
            note=payload.reason,
        ),
    )
    audit(db, actor, "membership_transferred", oid, target_id=str(new.id))
    return project(new, "id student_id group_id start_date")


@router.post("/groups/{oid}/generate-lessons")
def generate(
    oid: UUID,
    payload: GenerateLessons,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    return {"created": generate_lessons(db, actor, oid, payload.start_date, payload.end_date)}


@router.delete("/groups/{oid}")
def archive_group(
    oid: UUID, payload: Reason, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    teacher_lock(db, actor)
    group = get(db, Group, oid, lock=True)
    if group.deleted_at is not None:
        return group_data(db, group)
    group.deleted_at = utcnow()
    cancelled = 0
    for lesson in db.scalars(
        select(Lesson)
        .where(Lesson.group_id == oid, Lesson.starts_at >= utcnow(), Lesson.status == "scheduled")
        .with_for_update()
    ):
        lesson.status = "cancelled"
        lesson.change_reason = payload.reason
        audit(
            db, actor, "lesson_cancelled", lesson.id, reason=payload.reason, source="group_deletion"
        )
        cancelled += 1
    db.flush()
    audit(db, actor, "group_deleted", oid, reason=payload.reason, cancelled_lessons=cancelled)
    return group_data(db, group)
