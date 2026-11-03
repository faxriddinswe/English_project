"""Normal student records are approved and not deleted; no activity switch exists."""

from sqlalchemy import and_
from app.db.models import Student


def listed_student():
    return and_(Student.deleted_at.is_(None), Student.admission_status == "approved")
