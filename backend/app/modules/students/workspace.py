from fastapi import APIRouter, Depends
from sqlalchemy import select, func, or_, exists, Date
from app.db.session import get_db
from app.db.base import utcnow
from app.db.models import (
    Lesson,
    Group,
    Membership,
    Attendance,
    Invoice,
    Payment,
    Assignment,
    Material,
    AssessmentResult,
    SubmissionRevision,
    Submission,
)
from app.core.schemas import StudentContact
from app.core.helpers import project, page_query, page_rows
from app.modules.auth.service import student_profile
from app.modules.billing.service import student_finance, invoice_query, invoice_view
from app.modules.learning.router import current_groups

router = APIRouter(prefix="/student", tags=["student workspace"])


@router.get("/profile")
def profile(student=Depends(student_profile)):
    return project(student, "id full_name phone parent_phone joined_on")


@router.patch("/profile")
def update_profile(
    payload: StudentContact, student=Depends(student_profile), db=Depends(get_db, scope="function")
):
    student.phone = payload.phone
    student.parent_phone = payload.parent_phone
    return project(student, "id full_name phone parent_phone")


@router.get("/dashboard")
def dashboard(student=Depends(student_profile), db=Depends(get_db, scope="function")):
    next_lesson = db.scalar(
        select(Lesson)
        .where(
            Lesson.group_id.in_(current_groups(student)),
            Lesson.starts_at >= utcnow(),
            Lesson.status != "cancelled",
        )
        .order_by(Lesson.starts_at)
        .limit(1)
    )
    next_assignment = db.scalar(
        select(Assignment)
        .where(
            Assignment.group_id.in_(current_groups(student)),
            Assignment.published.is_(True),
            Assignment.deadline >= utcnow(),
        )
        .order_by(Assignment.deadline)
        .limit(1)
    )
    feedback = db.scalar(
        select(SubmissionRevision)
        .join(Submission, Submission.id == SubmissionRevision.submission_id)
        .where(Submission.student_id == student.id, SubmissionRevision.feedback != "")
        .order_by(SubmissionRevision.updated_at.desc())
        .limit(1)
    )
    return {
        "student": project(student, "id full_name"),
        "billing": student_finance(db, student.id),
        "next_lesson": project(next_lesson, "id group_id starts_at ends_at")
        if next_lesson
        else None,
        "next_assignment": project(next_assignment, "id title deadline")
        if next_assignment
        else None,
        "feedback": project(feedback, "id feedback score max_score") if feedback else None,
    }


@router.get("/schedule")
def schedule(
    page: int = 1,
    page_size: int = 20,
    student=Depends(student_profile),
    db=Depends(get_db, scope="function"),
):
    local_day = func.timezone("Asia/Tashkent", Lesson.starts_at).cast(Date)
    eligible = exists(
        select(Membership.id).where(
            Membership.student_id == student.id,
            Membership.group_id == Lesson.group_id,
            Membership.start_date <= local_day,
            or_(Membership.end_date.is_(None), Membership.end_date > local_day),
        )
    )
    stmt = (
        select(Lesson, Group.name)
        .join(Group, Group.id == Lesson.group_id)
        .where(eligible)
        .order_by(Lesson.starts_at.desc())
    )
    return page_rows(
        db,
        stmt,
        lambda r: {
            **project(r[0], "id group_id starts_at ends_at status change_reason"),
            "group_name": r[1],
        },
        page,
        page_size,
    )


@router.get("/attendance")
def attendance(
    page: int = 1,
    page_size: int = 20,
    student=Depends(student_profile),
    db=Depends(get_db, scope="function"),
):
    stmt = (
        select(Attendance, Lesson.starts_at)
        .join(Lesson, Lesson.id == Attendance.lesson_id)
        .where(Attendance.student_id == student.id)
        .order_by(Lesson.starts_at.desc())
    )
    d = page_rows(
        db,
        stmt,
        lambda r: {
            **project(r[0], "id lesson_id status created_at"),
            "starts_at": r[1].isoformat(),
        },
        page,
        page_size,
    )
    counts = dict(
        db.execute(
            select(Attendance.status, func.count())
            .where(Attendance.student_id == student.id)
            .group_by(Attendance.status)
        ).all()
    )
    marked = sum(counts.values())
    d["statistics"] = {
        "counts": counts,
        "percent": round(100 * (counts.get("present", 0) + counts.get("late", 0)) / marked, 1)
        if marked
        else None,
        "rule": "present + late / all marked; excused in denominator",
    }
    return d


@router.get("/billing")
def billing(
    page: int = 1,
    page_size: int = 20,
    student=Depends(student_profile),
    db=Depends(get_db, scope="function"),
):
    from app.core.errors import fail

    if page < 1 or page_size not in (20, 50):
        fail(422, "pagination", "page_size 20 yoki 50")
    stmt = invoice_query().where(Invoice.student_id == student.id, Invoice.status != "draft")
    return {
        **student_finance(db, student.id),
        "items": [
            invoice_view(r)
            for r in db.execute(
                stmt.order_by(Invoice.period_start.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ],
        "total": db.scalar(select(func.count()).select_from(stmt.subquery())),
        "page": page,
        "page_size": page_size,
    }


@router.get("/payments")
def payments(
    page: int = 1,
    page_size: int = 20,
    student=Depends(student_profile),
    db=Depends(get_db, scope="function"),
):
    return page_query(
        db,
        select(Payment)
        .where(Payment.student_id == student.id)
        .order_by(Payment.received_at.desc()),
        lambda x: project(x, "id amount received_at method reference void_reason"),
        page,
        page_size,
    )


@router.get("/results")
def results(
    page: int = 1,
    page_size: int = 20,
    student=Depends(student_profile),
    db=Depends(get_db, scope="function"),
):
    return page_query(
        db,
        select(AssessmentResult)
        .where(AssessmentResult.student_id == student.id)
        .order_by(AssessmentResult.created_at.desc()),
        lambda x: project(x, "id group_id title score max_score feedback created_at"),
        page,
        page_size,
    )


@router.get("/materials")
def materials(
    page: int = 1,
    page_size: int = 20,
    student=Depends(student_profile),
    db=Depends(get_db, scope="function"),
):
    return page_query(
        db,
        select(Material)
        .where(Material.published.is_(True), Material.group_id.in_(current_groups(student)))
        .order_by(Material.created_at.desc()),
        lambda x: project(x, "id title media_id link group_id"),
        page,
        page_size,
    )
