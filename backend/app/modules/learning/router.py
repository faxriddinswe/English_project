from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, or_
from app.db.session import get_db
from app.db.base import utcnow
from app.db.models import (
    Assignment,
    Submission,
    SubmissionRevision,
    AssessmentResult,
    Material,
    Membership,
    MediaAsset,
    Student,
    Group,
)
from app.core.schemas import AssignmentIn, SubmissionIn, FeedbackIn, AssessmentIn, MaterialIn
from app.core.helpers import get, project, audit, page_query, local_today, teacher_lock
from app.core.errors import fail
from app.modules.auth.service import teacher, student_profile

router = APIRouter(tags=["learning"])
ASSIGNMENT_FIELDS = (
    "id group_id title description media_id link deadline published deadline_lock created_at"
)


def current_groups(student):
    return (
        select(Membership.group_id)
        .join(Group, Group.id == Membership.group_id)
        .where(
            Group.deleted_at.is_(None),
            Membership.student_id == student.id,
            Membership.start_date <= local_today(),
            or_(Membership.end_date.is_(None), Membership.end_date > local_today()),
        )
    )


def available_group(db, actor, oid):
    teacher_lock(db, actor)
    group = get(db, Group, oid, lock=True)
    if group.deleted_at is not None:
        fail(409, "deleted_group", "O‘chirilgan guruhga yangi ta’lim yozuvi qo‘shilmaydi")
    return group


def check_media(db, oid, owner=None):
    if oid:
        asset = get(db, MediaAsset, oid)
        if owner and asset.owner_id != owner:
            fail(404, "not_found", "Fayl topilmadi")


def assignment_data(db, obj, student_id=None):
    d = project(obj, ASSIGNMENT_FIELDS)
    if student_id:
        sub = db.scalar(
            select(Submission).where(
                Submission.assignment_id == obj.id, Submission.student_id == student_id
            )
        )
        rev = (
            db.scalar(
                select(SubmissionRevision)
                .where(SubmissionRevision.submission_id == sub.id)
                .order_by(SubmissionRevision.revision.desc())
                .limit(1)
            )
            if sub
            else None
        )
        d["submission"] = (
            project(rev, "id revision text media_id late feedback score max_score created_at")
            if rev
            else None
        )
    return d


@router.get("/teacher/assignments")
def assignments(
    group_id: UUID | None = None,
    page: int = 1,
    page_size: int = 20,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    stmt = select(Assignment)
    if group_id:
        stmt = stmt.where(Assignment.group_id == group_id)
    return page_query(
        db,
        stmt.order_by(Assignment.deadline.desc()),
        lambda x: assignment_data(db, x),
        page,
        page_size,
    )


@router.post("/teacher/assignments", status_code=201)
def create(payload: AssignmentIn, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    available_group(db, actor, payload.group_id)
    check_media(db, payload.media_id)
    obj = Assignment(
        **payload.model_dump(mode="python", exclude={"link"}),
        link=str(payload.link) if payload.link else None,
    )
    db.add(obj)
    db.flush()
    audit(db, actor, "assignment_created", obj.id)
    return assignment_data(db, obj)


@router.put("/teacher/assignments/{oid}")
def update(
    oid: UUID, payload: AssignmentIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    available_group(db, actor, payload.group_id)
    obj = get(db, Assignment, oid, lock=True)
    if obj.group_id != payload.group_id and db.scalar(
        select(Submission.id).where(Submission.assignment_id == oid).limit(1)
    ):
        fail(409, "has_submissions", "Topshirilgan vazifani boshqa guruhga o‘tkazmang")
    check_media(db, payload.media_id)
    for k, v in payload.model_dump(exclude={"link"}).items():
        setattr(obj, k, v)
    obj.link = str(payload.link) if payload.link else None
    audit(db, actor, "assignment_updated", oid)
    return assignment_data(db, obj)


@router.get("/teacher/assignments/{oid}")
def detail(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    d = assignment_data(db, get(db, Assignment, oid))
    rows = db.execute(
        select(SubmissionRevision, Submission.student_id, Student.full_name)
        .join(Submission, Submission.id == SubmissionRevision.submission_id)
        .join(Student, Student.id == Submission.student_id)
        .where(Submission.assignment_id == oid)
        .order_by(Student.full_name, SubmissionRevision.revision.desc())
        .limit(500)
    )
    d["revisions"] = [
        {
            **project(
                r,
                "id submission_id revision text media_id late feedback private_note score max_score created_at",
            ),
            "student_id": str(sid),
            "student_name": name,
        }
        for r, sid, name in rows
    ]
    return d


@router.post("/teacher/submission-revisions/{oid}/feedback")
def feedback(
    oid: UUID, payload: FeedbackIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    rev = get(db, SubmissionRevision, oid, lock=True)
    for k, v in payload.model_dump().items():
        setattr(rev, k, v)
    audit(db, actor, "submission_feedback", oid)
    return project(rev, "id feedback score max_score")


@router.get("/student/assignments")
def student_assignments(
    page: int = 1,
    page_size: int = 20,
    student=Depends(student_profile),
    db=Depends(get_db, scope="function"),
):
    from app.core.helpers import page_rows

    latest = (
        select(SubmissionRevision.id)
        .where(SubmissionRevision.submission_id == Submission.id)
        .order_by(SubmissionRevision.revision.desc())
        .limit(1)
        .correlate(Submission)
        .scalar_subquery()
    )
    stmt = (
        select(Assignment, SubmissionRevision)
        .outerjoin(
            Submission,
            (Submission.assignment_id == Assignment.id) & (Submission.student_id == student.id),
        )
        .outerjoin(SubmissionRevision, SubmissionRevision.id == latest)
        .where(Assignment.published.is_(True), Assignment.group_id.in_(current_groups(student)))
        .order_by(Assignment.deadline)
    )

    def serialize(row):
        assignment, revision = row
        return {
            **project(assignment, ASSIGNMENT_FIELDS),
            "submission": project(
                revision, "id revision text media_id late feedback score max_score created_at"
            )
            if revision
            else None,
        }

    return page_rows(db, stmt, serialize, page, page_size)


@router.get("/student/assignments/{oid}")
def student_assignment(
    oid: UUID, student=Depends(student_profile), db=Depends(get_db, scope="function")
):
    obj = db.scalar(
        select(Assignment).where(
            Assignment.id == oid,
            Assignment.published.is_(True),
            Assignment.group_id.in_(current_groups(student)),
        )
    )
    if not obj:
        fail(404, "not_found", "Vazifa topilmadi")
    return assignment_data(db, obj, student.id)


@router.post("/student/assignments/{oid}/submission", status_code=201)
def submit(
    oid: UUID,
    payload: SubmissionIn,
    student=Depends(student_profile),
    db=Depends(get_db, scope="function"),
):
    get(db, Student, student.id, lock=True)
    obj = db.scalar(
        select(Assignment)
        .where(
            Assignment.id == oid,
            Assignment.published.is_(True),
            Assignment.group_id.in_(current_groups(student)),
        )
        .with_for_update()
    )
    if not obj:
        fail(404, "not_found", "Vazifa topilmadi")
    if obj.deadline_lock and obj.deadline < utcnow():
        fail(409, "deadline_locked", "Topshirish muddati yopilgan")
    check_media(db, payload.media_id, student.user_id)
    sub = db.scalar(
        select(Submission)
        .where(Submission.assignment_id == oid, Submission.student_id == student.id)
        .with_for_update()
    )
    if not sub:
        sub = Submission(assignment_id=oid, student_id=student.id)
        db.add(sub)
        db.flush()
    revision = (
        db.scalar(
            select(func.max(SubmissionRevision.revision)).where(
                SubmissionRevision.submission_id == sub.id
            )
        )
        or 0
    ) + 1
    rev = SubmissionRevision(
        submission_id=sub.id,
        revision=revision,
        text=payload.text,
        media_id=payload.media_id,
        late=utcnow() > obj.deadline,
    )
    db.add(rev)
    db.flush()
    return project(rev, "id revision text media_id late created_at")


@router.post("/teacher/assessments", status_code=201)
def assessment(payload: AssessmentIn, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    available_group(db, actor, payload.group_id)
    student = get(db, Student, payload.student_id, lock=True)
    if student.deleted_at is not None or student.admission_status != "approved":
        fail(409, "unavailable_student", "O‘quvchi o‘chirilgan yoki arizasi tasdiqlanmagan")
    if not db.scalar(
        select(Membership.id)
        .where(Membership.student_id == payload.student_id, Membership.group_id == payload.group_id)
        .limit(1)
    ):
        fail(422, "not_enrolled", "O‘quvchi shu guruhga a’zo bo‘lmagan")
    obj = AssessmentResult(**payload.model_dump())
    db.add(obj)
    db.flush()
    audit(db, actor, "assessment_created", obj.id)
    return project(obj, "id student_id group_id title score max_score feedback")


@router.get("/teacher/assessments")
def assessments(
    page: int = 1, page_size: int = 20, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    return page_query(
        db,
        select(AssessmentResult).order_by(AssessmentResult.created_at.desc()),
        lambda x: project(
            x, "id student_id group_id title score max_score feedback private_note created_at"
        ),
        page,
        page_size,
    )


@router.get("/teacher/assessments/{oid}")
def assessment_detail(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    return project(
        get(db, AssessmentResult, oid),
        "id student_id group_id title score max_score feedback private_note created_at",
    )


@router.get("/teacher/materials")
def materials(
    page: int = 1, page_size: int = 20, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    return page_query(
        db,
        select(Material).order_by(Material.created_at.desc()),
        lambda x: project(x, "id group_id title media_id link published"),
        page,
        page_size,
    )


@router.post("/teacher/materials", status_code=201)
def create_material(
    payload: MaterialIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    available_group(db, actor, payload.group_id)
    check_media(db, payload.media_id)
    if not payload.media_id and not payload.link:
        fail(422, "material_content", "Fayl yoki havola kerak")
    obj = Material(
        **payload.model_dump(exclude={"link"}), link=str(payload.link) if payload.link else None
    )
    db.add(obj)
    db.flush()
    return project(obj, "id group_id title media_id link published")


@router.get("/teacher/materials/{oid}")
def material_detail(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    return project(get(db, Material, oid), "id group_id title media_id link published")


@router.put("/teacher/materials/{oid}")
def update_material(
    oid: UUID, payload: MaterialIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    available_group(db, actor, payload.group_id)
    obj = get(db, Material, oid, lock=True)
    check_media(db, payload.media_id)
    if not payload.media_id and not payload.link:
        fail(422, "material_content", "Fayl yoki havola kerak")
    for k, v in payload.model_dump(exclude={"link"}).items():
        setattr(obj, k, v)
    obj.link = str(payload.link) if payload.link else None
    return project(obj, "id group_id title media_id link published")
