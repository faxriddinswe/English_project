"""Bounded, database-backed dashboard series. Money stays Decimal until serialization."""

from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy import Date, func, or_, select, exists
from app.core.helpers import TZ, local_today
from app.db.base import utcnow
from app.db.models import (
    Attendance,
    Course,
    Group,
    Lead,
    Lesson,
    Membership,
    Payment,
    Refund,
    Student,
)
from app.modules.billing.service import utc_month_bounds, month_bounds
from app.modules.students.policy import listed_student

ZERO = Decimal("0.00")


def month_shift(month: date, offset: int):
    index = month.year * 12 + month.month - 1 + offset
    return date(index // 12, index % 12 + 1, 1)


def local_date(column):
    return func.timezone("Asia/Tashkent", column).cast(Date)


def dashboard_analytics(db, month):
    month = month.replace(day=1)
    today = local_today()
    history_start = month_shift(month, -5)
    start, end = utc_month_bounds(month)
    history_utc, _ = utc_month_bounds(history_start)

    # At most six months of day/method aggregates, never raw payment records.
    payment_day = local_date(Payment.received_at)
    payment_rows = db.execute(
        select(payment_day.label("day"), Payment.method, func.sum(Payment.amount).label("amount"))
        .where(
            Payment.received_at >= history_utc,
            Payment.received_at < end,
            Payment.void_reason.is_(None),
        )
        .group_by(payment_day, Payment.method)
    ).all()
    refund_day = local_date(Refund.created_at)
    refund_rows = db.execute(
        select(refund_day.label("day"), func.sum(Refund.amount).label("amount"))
        .where(Refund.created_at >= history_utc, Refund.created_at < end)
        .group_by(refund_day)
    ).all()
    received = defaultdict(lambda: ZERO)
    refunds = defaultdict(lambda: ZERO)
    monthly_received = defaultdict(lambda: ZERO)
    monthly_refunds = defaultdict(lambda: ZERO)
    methods = defaultdict(lambda: ZERO)
    for row in payment_rows:
        received[row.day] += row.amount
        monthly_received[row.day.replace(day=1)] += row.amount
        if row.day.replace(day=1) == month:
            methods[row.method] += row.amount
    for row in refund_rows:
        refunds[row.day] += row.amount
        monthly_refunds[row.day.replace(day=1)] += row.amount

    def finance_point(day, gross, returned):
        return {
            "date": day.isoformat(),
            "received": format(gross, ".2f"),
            "refunded": format(returned, ".2f"),
            "net": format(gross - returned, ".2f"),
        }

    daily = []
    _, month_end = month_bounds(month)
    day = month
    while day < month_end:
        daily.append(
            {
                **finance_point(day, received[day], refunds[day]),
                "observed": day <= today or received[day] != ZERO or refunds[day] != ZERO,
            }
        )
        day += timedelta(days=1)
    months = [month_shift(month, offset) for offset in range(-5, 1)]
    registration_month = func.date_trunc(
        "month", func.timezone("Asia/Tashkent", Student.created_at)
    ).cast(Date)
    registration_counts = dict(
        db.execute(
            select(registration_month, func.count(Student.id))
            .where(Student.created_at >= history_utc, Student.created_at < end)
            .group_by(registration_month)
        ).all()
    )
    monthly = [
        {
            **finance_point(day, monthly_received[day], monthly_refunds[day]),
            "registrations": registration_counts.get(day, 0),
            "observed": day <= today.replace(day=1)
            or monthly_received[day] != ZERO
            or monthly_refunds[day] != ZERO,
        }
        for day in months
    ]

    student_total = db.scalar(select(func.count(Student.id)).where(listed_student())) or 0
    assigned = (
        db.scalar(
            select(func.count(Student.id)).where(
                listed_student(),
                exists(
                    select(Membership.id)
                    .join(Group, Membership.group_id == Group.id)
                    .where(
                        Membership.student_id == Student.id,
                        Group.deleted_at.is_(None),
                        Membership.start_date <= today,
                        or_(Membership.end_date.is_(None), Membership.end_date > today),
                    )
                ),
            )
        )
        or 0
    )
    student_groups = [
        {"kind": "assigned", "count": assigned},
        {"kind": "unassigned", "count": student_total - assigned},
    ]

    # Capacity is membership-based, matching the existing group list.
    members = (
        select(
            Membership.group_id, func.count(func.distinct(Membership.student_id)).label("students")
        )
        .join(Student, Membership.student_id == Student.id)
        .where(
            listed_student(),
            Membership.start_date <= today,
            or_(Membership.end_date.is_(None), Membership.end_date > today),
        )
        .group_by(Membership.group_id)
        .subquery()
    )
    occupied = func.coalesce(members.c.students, 0)
    groups_query = (
        select(
            Group.id,
            Group.name,
            Course.name.label("course_name"),
            Group.capacity,
            occupied.label("students"),
        )
        .join(Course, Group.course_id == Course.id)
        .outerjoin(members, members.c.group_id == Group.id)
        .where(Group.deleted_at.is_(None))
    )
    totals = db.execute(
        select(
            func.count(),
            func.coalesce(func.sum(Group.capacity), 0),
            func.coalesce(func.sum(occupied), 0),
        )
        .select_from(Group)
        .outerjoin(members, members.c.group_id == Group.id)
        .where(Group.deleted_at.is_(None))
    ).one()
    group_rows = db.execute(
        groups_query.order_by(occupied.desc(), Group.name, Group.id).limit(8)
    ).all()
    attendance = dict(
        db.execute(
            select(Attendance.status, func.count(Attendance.id))
            .join(Lesson, Attendance.lesson_id == Lesson.id)
            .where(Lesson.starts_at >= start, Lesson.starts_at < end, Lesson.status != "cancelled")
            .group_by(Attendance.status)
        ).all()
    )
    leads = dict(db.execute(select(Lead.status, func.count(Lead.id)).group_by(Lead.status)).all())
    return {
        "generated_at": utcnow().astimezone(TZ).isoformat(),
        "daily_finance": daily,
        "monthly": monthly,
        "student_groups": student_groups,
        "student_total": student_total,
        "groups": [
            {
                "id": str(row.id),
                "name": row.name,
                "course_name": row.course_name,
                "capacity": row.capacity,
                "students": row.students,
            }
            for row in group_rows
        ],
        "group_totals": {"groups": totals[0], "capacity": totals[1], "occupied": totals[2]},
        "attendance": [
            {"status": key, "count": attendance.get(key, 0)}
            for key in ("present", "late", "absent", "excused")
        ],
        "payment_methods": [
            {"method": key, "amount": format(methods[key], ".2f")}
            for key in ("cash", "bank_transfer", "other")
        ],
        "lead_status": [{"status": key, "count": value} for key, value in sorted(leads.items())],
    }
