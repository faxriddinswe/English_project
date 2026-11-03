from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from app.core.helpers import get, audit
from app.core.errors import fail
from app.db.session import get_db
from app.db.models import Student, User, AuthSession, Lead, LeadHistory, Course
from app.modules.auth.service import teacher
from app.modules.students.registration import pending_registration, registration_lead_id
from app.db.base import utcnow

router = APIRouter(prefix="/teacher/pending-students", tags=["students"])


def registration_lead(db, student_id):
    return db.scalar(
        select(Lead)
        .where(Lead.student_id == student_id, Lead.source == "cabinet_signup")
        .order_by(Lead.created_at, Lead.id)
        .limit(1)
        .with_for_update()
    )


@router.get("")
def pending_students(
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    """List all pending student registrations waiting for teacher approval."""
    stmt = (
        select(
            Student,
            User,
            Lead.course_id,
            Course.name.label("course_name"),
            Lead.full_name.label("requested_name"),
        )
        .join(User, Student.user_id == User.id)
        .outerjoin(Lead, Lead.id == registration_lead_id())
        .outerjoin(Course, Course.id == Lead.course_id)
        .where(pending_registration())
        .order_by(Student.created_at.desc())
    )
    results = db.execute(stmt).all()
    items = []
    for student, user, course_id, course_name, requested_name in results:
        # Fallback to parsing private_note if course name wasn't in Lead/Course join
        display_course = course_name or ""
        if not display_course and student.private_note.startswith("Tanlangan kurs: "):
            display_course = student.private_note.replace("Tanlangan kurs: ", "").strip()

        items.append(
            {
                "id": str(student.id),
                "user_id": str(user.id),
                "full_name": student.full_name,
                "phone": student.phone,
                "course_id": str(course_id) if course_id else None,
                "course_name": display_course,
                "existing_profile": student.admission_status == "approved",
                "requested_name": requested_name or student.full_name,
                "created_at": student.created_at.isoformat() if student.created_at else None,
            }
        )
    return {"items": items, "total": len(items)}


@router.post("/{student_id}/approve")
def approve_student(
    student_id: UUID,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    """Approve a student registration: activates account and student profile immediately."""
    student = get(db, Student, student_id, lock=True)
    user = get(db, User, student.user_id, lock=True) if student.user_id else None
    if not user or not db.scalar(
        select(Student.id)
        .join(User, Student.user_id == User.id)
        .where(Student.id == student.id, pending_registration())
    ):
        fail(409, "invalid_state", "Bu o‘quvchi arizasi holatida emas")

    student.admission_status = "approved"
    user.active = True
    user.registration_pending = False

    lead = registration_lead(db, student.id)
    if lead:
        lead.status = "converted"
        lead.closed_reason = ""
        db.add(
            LeadHistory(
                lead_id=lead.id,
                actor_id=actor.id,
                note="Ustoz tomonidan tasdiqlandi va kabinet ochildi",
            )
        )

    audit(db, actor, "student_approved", student.id)
    return {
        "message": f"{student.full_name} tasdiqlandi. Kabinetga kirish ochildi.",
        "id": str(student.id),
    }


@router.post("/{student_id}/reject")
def reject_student(
    student_id: UUID,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    """Reject a student registration: archives student profile and deactivates user."""
    student = get(db, Student, student_id, lock=True)
    user = get(db, User, student.user_id, lock=True) if student.user_id else None
    if not user or not db.scalar(
        select(Student.id)
        .join(User, Student.user_id == User.id)
        .where(Student.id == student.id, pending_registration())
    ):
        fail(409, "invalid_state", "Bu o‘quvchi arizasi holatida emas")

    if student.admission_status == "pending":
        student.admission_status = "rejected"
        student.deleted_at = utcnow()
    user.active = False
    user.registration_pending = False
    db.execute(update(AuthSession).where(AuthSession.user_id == user.id).values(revoked=True))

    lead = registration_lead(db, student.id)
    if lead:
        lead.status = "closed"
        lead.closed_reason = "Ustoz rad etdi"
        db.add(LeadHistory(lead_id=lead.id, actor_id=actor.id, note="Ustoz tomonidan rad etildi"))

    audit(db, actor, "student_rejected", student.id)
    return {"message": "Ariza rad etildi.", "id": str(student.id)}


@router.post("/approve-all")
def approve_all_students(
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    """Bulk approve all pending student registrations simultaneously."""
    stmt = (
        select(Student, User)
        .join(User, Student.user_id == User.id)
        .where(pending_registration())
        .order_by(Student.id)
        .with_for_update(of=[Student, User])
    )
    rows = db.execute(stmt).all()
    count = 0
    for student, user in rows:
        student.admission_status = "approved"
        user.active = True
        user.registration_pending = False
        count += 1

        lead = registration_lead(db, student.id)
        if lead:
            lead.status = "converted"
            lead.closed_reason = ""
            db.add(
                LeadHistory(
                    lead_id=lead.id,
                    actor_id=actor.id,
                    note="Ustoz tomonidan barchasi bilan birga tasdiqlandi",
                )
            )

        audit(db, actor, "student_approved", student.id)

    return {
        "approved_count": count,
        "message": f"{count} ta o‘quvchi bir vaqtda tasdiqlandi. Hammasiga kabinet ochildi.",
    }
