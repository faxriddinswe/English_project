from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select
from app.core.schemas import ContentIn, CourseIn, Reason
from app.core.helpers import get, project, audit, page_query, teacher_lock
from app.db.models import Content, Course, Group
from app.db.base import utcnow
from app.core.errors import fail
from app.db.session import get_db
from app.modules.auth.service import teacher
from app.modules.content import service as s

router = APIRouter(prefix="/teacher", tags=["content"])


def content_view(obj):
    return project(
        obj,
        "id kind title data media_id published consent approved sort_order published_data published_title published_media_id",
    )


@router.get("/content")
def content(
    kind: str = "",
    page: int = 1,
    page_size: int = 20,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    stmt = select(Content).where(Content.archived.is_(False))
    if kind:
        stmt = stmt.where(Content.kind == kind)
    return page_query(
        db,
        stmt.order_by(Content.sort_order, Content.created_at.desc()),
        content_view,
        page,
        page_size,
    )


@router.post("/content", status_code=201)
def create(payload: ContentIn, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    if payload.media_id:
        get(db, s.MediaAsset, payload.media_id)
    obj = Content(**payload.model_dump())
    db.add(obj)
    db.flush()
    audit(db, actor, "content_drafted", obj.id)
    return content_view(obj)


@router.get("/content/preview")
def preview(actor=Depends(teacher), db=Depends(get_db, scope="function")):
    return {
        "items": [
            content_view(x)
            for x in db.scalars(
                select(Content)
                .where(Content.archived.is_(False))
                .order_by(Content.sort_order)
                .limit(500)
            )
        ],
        "draft_preview": True,
    }


@router.get("/content/{oid}")
def detail(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    return content_view(get(db, Content, oid))


@router.put("/content/{oid}")
def update(
    oid: UUID, payload: ContentIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    obj = get(db, Content, oid, lock=True)
    if payload.kind != obj.kind:
        __import__("app.core.errors", fromlist=["fail"]).fail(
            422, "immutable_kind", "Kontent turini o‘zgartirmang"
        )
    if payload.media_id:
        get(db, s.MediaAsset, payload.media_id)
    for k, v in payload.model_dump().items():
        setattr(obj, k, v)
    if obj.kind in ("result", "testimonial", "gallery") and (not obj.consent or not obj.approved):
        obj.published = False
    audit(db, actor, "content_draft_updated", oid)
    return content_view(obj)


@router.post("/content/{oid}/publish")
def publish(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    obj = get(db, Content, oid, lock=True)
    s.publish(db, obj)
    audit(db, actor, "content_published", oid)
    return content_view(obj)


@router.post("/content/{oid}/unpublish")
def unpublish(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    obj = get(db, Content, oid, lock=True)
    obj.published = False
    audit(db, actor, "content_unpublished", oid)
    return content_view(obj)


@router.get("/courses")
def courses(
    q: str = "",
    page: int = 1,
    page_size: int = 20,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    return page_query(
        db,
        select(Course)
        .where(Course.name.ilike("%" + q[:100] + "%"), Course.deleted_at.is_(None))
        .order_by(Course.sort_order),
        lambda x: {
            **s.course_view(x),
            "published": x.published,
            "image_id": str(x.image_id) if x.image_id else None,
        },
        page,
        page_size,
    )


@router.post("/courses", status_code=201)
def create_course(payload: CourseIn, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    if payload.image_id:
        s.public_asset(db, payload.image_id)
    obj = Course(**payload.model_dump())
    db.add(obj)
    db.flush()
    audit(db, actor, "course_created", obj.id)
    return s.course_view(obj)


@router.get("/courses/{oid}")
def course_detail(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    obj = get(db, Course, oid)
    return {
        **s.course_view(obj),
        "deleted_at": obj.deleted_at.isoformat() if obj.deleted_at else None,
        "published": obj.published,
        "image_id": str(obj.image_id) if obj.image_id else None,
    }


@router.put("/courses/{oid}")
def update_course(
    oid: UUID, payload: CourseIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    obj = get(db, Course, oid, lock=True)
    if obj.deleted_at is not None:
        fail(409, "deleted_course", "Kurs o‘chirilgan")
    if payload.image_id:
        s.public_asset(db, payload.image_id)
    for k, v in payload.model_dump().items():
        setattr(obj, k, v)
    audit(db, actor, "course_updated", oid)
    return s.course_view(obj)


@router.delete("/courses/{oid}")
def delete_course(
    oid: UUID, payload: Reason, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    teacher_lock(db, actor)
    obj = get(db, Course, oid, lock=True)
    if obj.deleted_at is not None:
        return {"message": "Kurs o‘chirilgan; tarix saqlangan"}
    if db.scalar(
        select(Group.id).where(Group.course_id == oid, Group.deleted_at.is_(None)).limit(1)
    ):
        fail(409, "course_has_groups", "Avval bu kursga tegishli guruhlarni o‘chiring")
    obj.deleted_at = utcnow()
    obj.published = False
    audit(db, actor, "course_deleted", oid, reason=payload.reason)
    return {"message": "Kurs o‘chirildi; tarix saqlandi"}
