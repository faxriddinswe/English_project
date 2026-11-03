from datetime import timedelta, datetime, timezone
from sqlalchemy import select, or_
from app.core.helpers import get, teacher_lock, TZ, audit, local_today
from app.core.errors import fail
from app.db.models import Group, Student, Membership, ScheduleRule, Lesson
from app.modules.students.policy import listed_student


def overlaps(start, end, other_start, other_end):
    return (end is None or other_start < end) and (other_end is None or start < other_end)


def enroll(db, actor, group_id, payload):
    teacher_lock(db, actor)
    group = get(db, Group, group_id, lock=True)
    student = get(db, Student, payload.student_id, lock=True)
    if (
        group.deleted_at is not None
        or student.deleted_at is not None
        or student.admission_status != "approved"
    ):
        fail(409, "unavailable", "Guruh yoki o‘quvchi o‘chirilgan yoxud ariza hali tasdiqlanmagan")
    if payload.start_date is None:
        # Quick enrollment uses the server's local day, never the browser clock.
        payload = payload.model_copy(
            update={
                "start_date": max(local_today(), group.start_date),
                "end_date": payload.end_date
                if payload.end_date is not None
                else (group.end_date + timedelta(days=1) if group.end_date else None),
            }
        )
    if payload.end_date and payload.end_date <= payload.start_date:
        fail(422, "invalid_interval", "A’zolik oralig‘i noto‘g‘ri")
    if payload.start_date < group.start_date or (
        group.end_date
        and (payload.end_date is None or payload.end_date > group.end_date + timedelta(days=1))
    ):
        fail(422, "group_dates", "A’zolik guruh sanalariga mos bo‘lsin")
    relevant = list(
        db.scalars(
            select(Membership)
            .join(Student, Membership.student_id == Student.id)
            .where(Membership.group_id == group_id, listed_student())
        )
    )
    for m in relevant:
        if m.student_id == student.id and overlaps(
            payload.start_date, payload.end_date, m.start_date, m.end_date
        ):
            fail(409, "membership_overlap", "O‘quvchi shu oraliqda guruhga a’zo")
    # Capacity is checked at every boundary within the requested interval, not just today.
    points = {payload.start_date} | {
        m.start_date
        for m in relevant
        if m.start_date >= payload.start_date
        and (payload.end_date is None or m.start_date < payload.end_date)
    }
    peak = max(
        sum(m.start_date <= day and (m.end_date is None or day < m.end_date) for m in relevant)
        for day in points
    )
    if peak >= group.capacity and not payload.capacity_override:
        fail(409, "capacity", "Guruh sig‘imi to‘lgan; sig‘imdan oshirish tasdig‘i kerak")
    if peak >= group.capacity and not payload.note:
        fail(422, "override_reason", "Sig‘imni oshirish sababini yozing")
    obj = Membership(
        group_id=group_id,
        student_id=student.id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        note=payload.note,
    )
    db.add(obj)
    db.flush()
    audit(db, actor, "membership_created", obj.id, override=payload.capacity_override)
    return obj


def check_lesson_overlap(db, start, end, exclude=None):
    stmt = select(Lesson.id).where(
        Lesson.status != "cancelled", Lesson.starts_at < end, Lesson.ends_at > start
    )
    if exclude:
        stmt = stmt.where(Lesson.id != exclude)
    if db.scalar(stmt.limit(1)):
        fail(409, "schedule_overlap", "Ustozning shu vaqtda boshqa darsi bor")


def generate_lessons(db, actor, group_id, start, end):
    teacher_lock(db, actor)
    group = get(db, Group, group_id)
    if end < start or (end - start).days > 92:
        fail(422, "date_range", "Eng ko‘pi 93 kunlik oraliq tanlang")
    if group.deleted_at is not None:
        fail(409, "deleted_group", "Guruh o‘chirilgan")
    rules = list(db.scalars(select(ScheduleRule).where(ScheduleRule.group_id == group_id)))
    if not rules:
        fail(422, "no_schedule", "Avval dars kunlarini kiriting")
    created = 0
    day = max(start, group.start_date)
    while day <= end and (group.end_date is None or day <= group.end_date):
        for rule in rules:
            if day.weekday() != rule.weekday:
                continue
            begins = datetime.combine(day, rule.local_time, tzinfo=TZ).astimezone(timezone.utc)
            if db.scalar(
                select(Lesson.id).where(
                    Lesson.group_id == group_id, Lesson.original_starts_at == begins
                )
            ):
                continue
            ends = begins + timedelta(minutes=rule.duration_minutes)
            check_lesson_overlap(db, begins, ends)
            db.add(
                Lesson(group_id=group_id, starts_at=begins, ends_at=ends, original_starts_at=begins)
            )
            db.flush()
            created += 1
        day += timedelta(days=1)
    audit(db, actor, "lessons_generated", group_id, count=created)
    return created


def roster_ids(db, lesson):
    day = lesson.starts_at.astimezone(TZ).date()
    return set(
        db.scalars(
            select(Membership.student_id)
            .join(Student, Membership.student_id == Student.id)
            .where(
                Membership.group_id == lesson.group_id,
                Student.admission_status == "approved",
                or_(Student.deleted_at.is_(None), Student.deleted_at > lesson.starts_at),
                Membership.start_date <= day,
                or_(Membership.end_date.is_(None), Membership.end_date > day),
            )
        )
    )
