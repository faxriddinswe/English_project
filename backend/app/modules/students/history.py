from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import (
    Student,
    Attendance,
    Lesson,
    AssessmentResult,
    Submission,
    SubmissionRevision,
    Assignment,
)
from app.core.helpers import get, project, page_rows, page_query
from app.core.errors import fail
from app.modules.auth.service import teacher

router = APIRouter(prefix="/teacher/students", tags=["student history"])


@router.get("/{oid}/history")
def history(
    oid: UUID,
    resource: str = "attendance",
    page: int = 1,
    page_size: int = 20,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    get(db, Student, oid)
    if resource == "attendance":
        stmt = (
            select(Attendance, Lesson.starts_at)
            .join(Lesson, Lesson.id == Attendance.lesson_id)
            .where(Attendance.student_id == oid)
            .order_by(Lesson.starts_at.desc())
        )
        return page_rows(
            db,
            stmt,
            lambda r: {**project(r[0], "id status"), "starts_at": r[1].isoformat()},
            page,
            page_size,
        )
    if resource == "assessments":
        return page_query(
            db,
            select(AssessmentResult)
            .where(AssessmentResult.student_id == oid)
            .order_by(AssessmentResult.created_at.desc()),
            lambda r: project(r, "id title score max_score feedback created_at"),
            page,
            page_size,
        )
    if resource == "submissions":
        stmt = (
            select(SubmissionRevision, Assignment.title)
            .join(Submission, Submission.id == SubmissionRevision.submission_id)
            .join(Assignment, Assignment.id == Submission.assignment_id)
            .where(Submission.student_id == oid)
            .order_by(SubmissionRevision.created_at.desc())
        )
        return page_rows(
            db,
            stmt,
            lambda r: {
                **project(r[0], "id revision text late feedback score max_score created_at"),
                "title": r[1],
            },
            page,
            page_size,
        )
    fail(422, "history_resource", "Tarix turi noto‘g‘ri")
