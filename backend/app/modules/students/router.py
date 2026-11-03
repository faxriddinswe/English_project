from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select, update, exists
from app.core.schemas import StudentIn, StudentPatch, Reason
from app.core.helpers import get, project, audit, page_query, local_today
from app.core.errors import fail
from app.db.session import get_db
from app.db.models import Student, User, AuthSession, Membership, Group, Course
from app.modules.auth.service import teacher
from app.modules.students.policy import listed_student
from app.db.base import utcnow
from app.core.helpers import teacher_lock

router = APIRouter(prefix="/teacher/students", tags=["students"])
FIELDS = "id full_name phone parent_phone joined_on private_note user_id created_at deleted_at"


@router.get("")
def students(
    q: str = "",
    group_id: UUID | None = None,
    has_debt: bool | None = None,
    sort: str = "name",
    page: int = 1,
    page_size: int = 20,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    stmt = select(Student).where(listed_student())
    if q:
        stmt = stmt.where(
            Student.full_name.ilike("%" + q[:100] + "%") | Student.phone.contains(q[:30])
        )
    if group_id:
        stmt = stmt.where(
            exists(
                select(Membership.id).where(
                    Membership.student_id == Student.id,
                    Membership.group_id == group_id,
                    Membership.start_date <= local_today(),
                    (Membership.end_date.is_(None)) | (Membership.end_date > local_today()),
                )
            )
        )
    if has_debt is not None:
        from app.modules.billing.service import invoice_query

        financial = invoice_query().subquery()
        owing = exists(
            select(financial.c.id).where(
                financial.c.student_id == Student.id,
                financial.c.status == "issued",
                financial.c.amount + financial.c.adjustment - financial.c.paid > 0,
            )
        )
        stmt = stmt.where(owing if has_debt else ~owing)
    ordering = {"name": Student.full_name, "newest": Student.created_at.desc()}
    if sort not in ordering:
        fail(422, "invalid_sort", "Saralash noto‘g‘ri")
    return page_query(
        db, stmt.order_by(ordering[sort], Student.id), lambda x: project(x, FIELDS), page, page_size
    )


@router.post("", status_code=201)
def create(payload: StudentIn, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    obj = Student(**payload.model_dump())
    db.add(obj)
    db.flush()
    audit(db, actor, "student_created", obj.id)
    return project(obj, FIELDS)


@router.get("/{oid}")
def detail(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    obj = get(db, Student, oid)
    data = project(obj, FIELDS)
    data["memberships"] = [
        {
            **project(m, "id group_id start_date end_date exit_reason note"),
            "group_name": group_name,
            "course_name": course_name,
            "is_current": obj.deleted_at is None
            and group_deleted_at is None
            and m.start_date <= local_today()
            and (m.end_date is None or m.end_date > local_today()),
        }
        for m, group_name, course_name, group_deleted_at in db.execute(
            select(Membership, Group.name, Course.name, Group.deleted_at)
            .join(Group, Group.id == Membership.group_id)
            .join(Course, Course.id == Group.course_id)
            .where(Membership.student_id == oid)
            .order_by(Membership.start_date.desc())
        )
    ]
    return data


@router.patch("/{oid}")
def patch(
    oid: UUID, payload: StudentPatch, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    obj = get(db, Student, oid, lock=True)
    if obj.deleted_at is not None:
        fail(409, "deleted", "O‘chirilgan o‘quvchini tahrirlab bo‘lmaydi")
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is None and k != "parent_phone":
            fail(422, "required_field", "Maydon bo‘sh bo‘lmasin")
        setattr(obj, k, v)
    audit(db, actor, "student_updated", oid)
    return project(obj, FIELDS)


@router.delete("/{oid}")
@router.post("/{oid}/archive", deprecated=True)
def archive(
    oid: UUID, payload: Reason, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    teacher_lock(db, actor)
    obj = get(db, Student, oid, lock=True)
    if obj.deleted_at is not None:
        return {"message": "O‘quvchi o‘chirilgan; tarix saqlangan"}
    obj.deleted_at = utcnow()
    if obj.user_id:
        login = get(db, User, obj.user_id)
        login.active = False
        login.registration_pending = False
        db.execute(
            update(AuthSession).where(AuthSession.user_id == obj.user_id).values(revoked=True)
        )
    audit(db, actor, "student_deleted", oid, reason=payload.reason)
    return {"message": "O‘quvchi o‘chirildi; davomat va moliyaviy tarix saqlandi"}
