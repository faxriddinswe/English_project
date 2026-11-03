"""Teacher-managed public certificates, privately linked to their student owner."""

from uuid import UUID
from pydantic import ValidationError
from fastapi import APIRouter, Depends
from sqlalchemy import select, or_
from app.core.schemas import CertificateIn
from app.core.helpers import get, audit, page_query
from app.core.errors import fail
from app.db.models import Content, Student
from app.db.session import get_db
from app.modules.auth.service import teacher, student_profile
from app.modules.content.router import content_view
from app.modules.content.service import publish, public_content, visible_results, ResultData

router = APIRouter(tags=["certificates"])


def certificate(db, oid):
    obj = get(db, Content, oid, lock=True)
    if obj.kind != "result" or obj.archived:
        fail(404, "not_found", "Sertifikat topilmadi")
    return obj


def view(obj):
    return {
        **content_view(obj),
        "student_id": str(obj.student_id) if obj.student_id else None,
        "certificate_type": obj.data.get("type", ""),
        "result_score": str(
            obj.data.get("overall")
            if obj.data.get("type") == "ielts"
            else obj.data.get("level", "")
        ),
        "media_url": f"/api/v1/media/{obj.media_id}" if obj.media_id else None,
    }


def save(db, actor, payload, obj=None):
    get(db, Student, payload.student_id)
    # Validate even drafts: a certificate must not mix IELTS and CEFR fields.
    try:
        ResultData.model_validate(payload.data)
    except ValidationError:
        fail(422, "invalid_content", "Imtihon turi va sertifikat ballarini tekshiring")
    values = payload.model_dump(exclude={"published"})
    if obj is None:
        obj = Content(**values)
        db.add(obj)
        db.flush()
        action = "certificate_created"
    else:
        for key, value in values.items():
            setattr(obj, key, value)
        action = "certificate_updated"
    if payload.published:
        publish(db, obj)
    else:
        obj.published = False
    db.flush()
    audit(db, actor, action, obj.id, published=obj.published, student_id=str(obj.student_id))
    return view(obj)


@router.get("/teacher/certificates")
def listing(
    q: str = "",
    page: int = 1,
    page_size: int = 20,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    return page_query(
        db,
        select(Content)
        .where(
            Content.kind == "result",
            Content.archived.is_(False),
            or_(
                Content.title.ilike("%" + q[:100] + "%"),
                Content.data["student_name"].astext.ilike("%" + q[:100] + "%"),
            ),
        )
        .order_by(Content.created_at.desc()),
        view,
        page,
        page_size,
    )


@router.get("/teacher/certificates/{oid}")
def detail(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    return view(certificate(db, oid))


@router.post("/teacher/certificates", status_code=201)
def create(payload: CertificateIn, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    return save(db, actor, payload)


@router.put("/teacher/certificates/{oid}")
def edit(
    oid: UUID, payload: CertificateIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    return save(db, actor, payload, certificate(db, oid))


@router.delete("/teacher/certificates/{oid}")
def remove(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    obj = get(db, Content, oid, lock=True)
    if obj.kind != "result":
        fail(404, "not_found", "Sertifikat topilmadi")
    if not obj.archived:
        obj.archived = True
        obj.published = False
        audit(db, actor, "certificate_deleted", oid)
    return {"id": str(oid), "deleted": True}


@router.get("/student/certificates")
def own(
    page: int = 1,
    page_size: int = 20,
    student=Depends(student_profile),
    db=Depends(get_db, scope="function"),
):
    return page_query(
        db,
        select(Content)
        .where(visible_results(), Content.student_id == student.id)
        .order_by(Content.created_at.desc()),
        public_content,
        page,
        page_size,
    )


@router.get("/student/certificates/{oid}")
def own_detail(oid: UUID, student=Depends(student_profile), db=Depends(get_db, scope="function")):
    obj = db.scalar(
        select(Content).where(
            Content.id == oid, Content.student_id == student.id, visible_results()
        )
    )
    if not obj:
        fail(404, "not_found", "Sertifikat topilmadi")
    return public_content(obj)
