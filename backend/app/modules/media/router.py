from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, Body, Request, Response
from sqlalchemy import select, or_
from app.db.session import get_db
from app.db.models import MediaAsset, Student, Assignment, Material, Membership
from app.core.helpers import get, project, local_today
from app.core.errors import fail
from app.modules.auth.service import teacher, current_user
from app.modules.media.service import prepare, storage

router = APIRouter(tags=["media"])


def save_upload(db, actor, payload, mime, visibility, alt, prepared):
    if visibility == "public" and (actor.role != "teacher" or not prepared or not alt):
        fail(422, "public_media", "Public uchun tayyorlanganini tasdiqlang va alt yozing")
    data, mime, ext = prepare(payload, mime)
    key = f"{visibility}/{uuid4()}.{ext}"
    storage().put(key, data, mime)
    asset = MediaAsset(
        owner_id=actor.id,
        visibility=visibility,
        object_key=key,
        mime=mime,
        size=len(data),
        alt=alt[:500],
        public_prepared=prepared if visibility == "public" else False,
    )
    db.add(asset)
    db.flush()
    return project(asset, "id visibility mime size alt public_prepared")


@router.post("/teacher/media/uploads", status_code=201)
def upload(
    request: Request,
    payload: bytes = Body(media_type="application/octet-stream"),
    visibility: str = "private",
    alt: str = "",
    public_prepared: bool = False,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    if visibility not in ("public", "private"):
        fail(422, "visibility", "Visibility noto‘g‘ri")
    return save_upload(
        db, actor, payload, request.headers.get("x-file-type", ""), visibility, alt, public_prepared
    )


@router.get("/teacher/media")
def list_media(
    page: int = 1, page_size: int = 20, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    from app.core.helpers import page_query

    return page_query(
        db,
        select(MediaAsset).order_by(MediaAsset.created_at.desc()),
        lambda m: project(m, "id visibility mime size alt public_prepared created_at"),
        page,
        page_size,
    )


@router.post("/student/media/uploads", status_code=201)
def student_upload(
    request: Request,
    payload: bytes = Body(media_type="application/octet-stream"),
    actor=Depends(current_user),
    db=Depends(get_db, scope="function"),
):
    if actor.role != "student":
        fail(403, "forbidden", "O‘quvchi fayli")
    return save_upload(
        db, actor, payload, request.headers.get("x-file-type", ""), "private", "", False
    )


@router.get("/media/{oid}")
def download(oid: UUID, request: Request, db=Depends(get_db, scope="function")):
    m = get(db, MediaAsset, oid)
    if m.visibility != "public" or not m.public_prepared:
        # Authenticate only private requests; public images do not need a session.
        user = current_user(request, db)
        allowed = user.role == "teacher" or m.owner_id == user.id
        if not allowed:
            student = db.scalar(
                select(Student).where(Student.user_id == user.id, Student.deleted_at.is_(None))
            )
            if student:
                groups = select(Membership.group_id).where(
                    Membership.student_id == student.id,
                    Membership.start_date <= local_today(),
                    or_(Membership.end_date.is_(None), Membership.end_date > local_today()),
                )
                allowed = bool(
                    db.scalar(
                        select(Assignment.id)
                        .where(
                            Assignment.group_id.in_(groups),
                            Assignment.published.is_(True),
                            Assignment.media_id == oid,
                        )
                        .limit(1)
                    )
                    or db.scalar(
                        select(Material.id)
                        .where(
                            Material.group_id.in_(groups),
                            Material.published.is_(True),
                            Material.media_id == oid,
                        )
                        .limit(1)
                    )
                )
        if not allowed:
            fail(404, "not_found", "Fayl topilmadi")
    headers = {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": f'attachment; filename="{oid}.pdf"'
        if m.mime == "application/pdf"
        else "inline",
        "Content-Security-Policy": "default-src 'none'; sandbox",
    }
    return Response(storage().read(m.object_key), media_type=m.mime, headers=headers)
