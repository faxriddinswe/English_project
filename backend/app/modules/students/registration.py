"""Registration approval is independent of a student's business lifecycle."""

from sqlalchemy import and_, select
from app.db.models import Lead, Student, User


def registration_lead_id():
    return (
        select(Lead.id)
        .where(
            Lead.student_id == Student.id,
            Lead.source == "cabinet_signup",
        )
        .order_by(Lead.created_at, Lead.id)
        .limit(1)
        .correlate(Student)
        .scalar_subquery()
    )


def pending_registration():
    return and_(
        User.registration_pending.is_(True),
        Student.deleted_at.is_(None),
        User.role == "student",
        User.active.is_(False),
    )
