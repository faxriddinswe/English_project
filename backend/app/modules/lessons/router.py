from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select, exists, or_, func, Date
from sqlalchemy.dialects.postgresql import insert
from app.core.schemas import RescheduleIn, Reason, AttendanceIn
from app.core.helpers import get, project, audit, page_rows, teacher_lock, aware
from app.core.errors import fail
from app.db.base import utcnow
from app.db.session import get_db
from app.db.models import Lesson, Student, Attendance, Group, Membership
from app.modules.auth.service import teacher
from app.modules.groups.service import roster_ids, check_lesson_overlap

router = APIRouter(prefix="/teacher/lessons", tags=["lessons", "attendance"])
FIELDS = "id group_id starts_at ends_at original_starts_at status change_reason"


@router.get("")
def lessons(
    group_id: UUID | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    unmarked: bool = False,
    exclude_cancelled: bool = False,
    page: int = 1,
    page_size: int = 20,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    stmt = select(Lesson, Group.name).join(Group, Group.id == Lesson.group_id)
    if group_id:
        stmt = stmt.where(Lesson.group_id == group_id)
    if exclude_cancelled:
        stmt = stmt.where(Lesson.status != "cancelled")
    if start:
        stmt = stmt.where(Lesson.starts_at >= aware(start))
    if end:
        stmt = stmt.where(Lesson.starts_at < aware(end))
    if unmarked:
        local_day = func.timezone("Asia/Tashkent", Lesson.starts_at).cast(Date)
        missing = exists(
            select(Membership.id)
            .join(Student, Student.id == Membership.student_id)
            .where(
                Student.admission_status == "approved",
                or_(Student.deleted_at.is_(None), Student.deleted_at > Lesson.starts_at),
                Membership.group_id == Lesson.group_id,
                Membership.start_date <= local_day,
                or_(Membership.end_date.is_(None), Membership.end_date > local_day),
                ~exists(
                    select(Attendance.id).where(
                        Attendance.lesson_id == Lesson.id,
                        Attendance.student_id == Membership.student_id,
                    )
                ).correlate(Lesson, Membership),
            )
        )
        stmt = stmt.where(Lesson.starts_at < utcnow(), Lesson.status != "cancelled", missing)
    return page_rows(
        db,
        stmt.order_by(Lesson.starts_at),
        lambda r: {**project(r[0], FIELDS), "group_name": r[1]},
        page,
        page_size,
    )


@router.get("/{oid}")
def detail(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    lesson = get(db, Lesson, oid)
    d = project(lesson, FIELDS)
    ids = roster_ids(db, lesson)
    statuses = {
        a.student_id: a.status
        for a in db.scalars(select(Attendance).where(Attendance.lesson_id == oid))
    }
    d["roster"] = [
        {**project(s, "id full_name"), "status": statuses.get(s.id)}
        for s in db.scalars(select(Student).where(Student.id.in_(ids)).order_by(Student.full_name))
    ]
    return d


@router.post("/{oid}/reschedule")
def reschedule(
    oid: UUID, payload: RescheduleIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    teacher_lock(db, actor)
    lesson = get(db, Lesson, oid, lock=True)
    if lesson.starts_at < utcnow() or payload.starts_at < utcnow() or lesson.status == "cancelled":
        fail(409, "historical_lesson", "O‘tgan yoki bekor qilingan darsni ko‘chirish mumkin emas")
    end = payload.starts_at + timedelta(minutes=payload.duration_minutes)
    check_lesson_overlap(db, payload.starts_at, end, oid)
    old = lesson.starts_at.isoformat()
    lesson.starts_at = payload.starts_at
    lesson.ends_at = end
    lesson.change_reason = payload.reason
    audit(db, actor, "lesson_rescheduled", oid, old_starts_at=old, reason=payload.reason)
    return project(lesson, FIELDS)


@router.post("/{oid}/cancel")
def cancel(
    oid: UUID, payload: Reason, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    teacher_lock(db, actor)
    lesson = get(db, Lesson, oid, lock=True)
    if db.scalar(select(Attendance.id).where(Attendance.lesson_id == oid).limit(1)):
        fail(409, "has_attendance", "Davomatli darsni bekor qilish mumkin emas")
    lesson.status = "cancelled"
    lesson.change_reason = payload.reason
    audit(db, actor, "lesson_cancelled", oid, reason=payload.reason)
    return project(lesson, FIELDS)


@router.put("/{oid}/attendance")
def attendance(
    oid: UUID, payload: AttendanceIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    teacher_lock(db, actor)
    lesson = get(db, Lesson, oid, lock=True)
    if lesson.status == "cancelled":
        fail(409, "cancelled_lesson", "Bekor qilingan darsga davomat yozilmaydi")
    allowed = roster_ids(db, lesson)
    ids = [x.student_id for x in payload.items]
    if len(ids) != len(set(ids)) or not set(ids) <= allowed:
        fail(422, "invalid_roster", "Faqat dars sanasidagi a’zolarni bir martadan kiriting")
    for item in payload.items:
        stmt = insert(Attendance).values(
            lesson_id=oid, student_id=item.student_id, status=item.status, actor_id=actor.id
        )
        db.execute(
            stmt.on_conflict_do_update(
                index_elements=["lesson_id", "student_id"],
                set_={"status": item.status, "actor_id": actor.id, "updated_at": utcnow()},
            )
        )
    audit(
        db,
        actor,
        "attendance_saved",
        oid,
        items=[{"student_id": str(i.student_id), "status": i.status} for i in payload.items],
    )
    return {"saved": len(payload.items)}
