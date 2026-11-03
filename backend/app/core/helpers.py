from datetime import date, datetime, timezone
from decimal import Decimal
from uuid import UUID
from zoneinfo import ZoneInfo
from sqlalchemy import select, func
from app.core.errors import fail
from app.db.models import AuditLog, User

TZ = ZoneInfo("Asia/Tashkent")


def local_today():
    return datetime.now(TZ).date()


def value(v):
    if isinstance(v, Decimal):
        return format(v, ".2f")
    if isinstance(v, UUID):
        return str(v)
    if isinstance(v, (date, datetime)):
        return v.isoformat()
    return v


def project(obj, fields):
    return {k: value(getattr(obj, k)) for k in fields.split()}


def get(db, model, oid, *, lock=False):
    stmt = select(model).where(model.id == oid)
    if lock:
        stmt = stmt.with_for_update()
    obj = db.scalar(stmt)
    if obj is None:
        fail(404, "not_found", "Ma’lumot topilmadi")
    return obj


def audit(db, actor, action, oid, **details):
    db.add(
        AuditLog(
            actor_id=actor.id if actor else None, action=action, object_id=oid, details=details
        )
    )


def teacher_lock(db, actor):
    # A single teacher owns the schedule. Serialize calendar/membership changes across requests.
    db.scalar(select(User).where(User.id == actor.id).with_for_update())


def page_query(db, stmt, serializer, page=1, page_size=20):
    if page < 1 or page_size not in (20, 50):
        fail(422, "pagination", "page_size 20 yoki 50 bo‘lsin")
    count = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery()))
    return {
        "items": [
            serializer(x) for x in db.scalars(stmt.offset((page - 1) * page_size).limit(page_size))
        ],
        "page": page,
        "page_size": page_size,
        "total": count,
    }


def aware(v: datetime):
    if v.tzinfo is None:
        fail(422, "timezone_required", "Vaqt timezone bilan berilsin")
    return v.astimezone(timezone.utc)


def page_rows(db, stmt, serializer, page=1, page_size=20):
    if page < 1 or page_size not in (20, 50):
        fail(422, "pagination", "page_size 20 yoki 50 bo‘lsin")
    count = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery()))
    return {
        "items": [
            serializer(row)
            for row in db.execute(stmt.offset((page - 1) * page_size).limit(page_size))
        ],
        "page": page,
        "page_size": page_size,
        "total": count,
    }
