from app.modules.auth.service import client_ip
from app.modules.content.responses import LeadAccepted
from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from app.core.schemas import LeadIn, LeadPatch, ConvertLead
from app.core.helpers import get, project, audit, local_today
from app.core.errors import fail
from app.core.config import get_settings
from app.db.base import utcnow
from app.db.models import Lead, LeadHistory, Course, NotificationOutbox, Student
from app.db.session import get_db, SessionLocal
from app.modules.auth.service import teacher, rate_limit

public_router = APIRouter(prefix="/public", tags=["public"])
router = APIRouter(prefix="/teacher/leads", tags=["leads"])
FIELDS = "id full_name phone course_id comment source status follow_up_at trial_at closed_reason student_id created_at"


@public_router.post("/leads", status_code=201, response_model=LeadAccepted)
def create_lead(payload: LeadIn, request: Request, db=Depends(get_db, scope="function")):
    with SessionLocal.begin() as limits:
        rate_limit(
            limits,
            "lead_ip",
            client_ip(request),
            get_settings().lead_limit,
        )
        rate_limit(limits, "lead_phone", payload.phone, 3, 3600)
    if payload.course_id:
        course = get(db, Course, payload.course_id)
        if course.deleted_at is not None or not course.published:
            fail(422, "course_unavailable", "Bu kursga hozir ariza qabul qilinmayapti")
    lead = Lead(**payload.model_dump(exclude={"privacy_accepted", "website"}))
    db.add(lead)
    db.flush()
    enabled = bool(get_settings().telegram_bot_token and get_settings().telegram_chat_id)
    db.add(
        NotificationOutbox(
            lead_id=lead.id, status="pending" if enabled else "disabled", next_attempt_at=utcnow()
        )
    )
    db.add(LeadHistory(lead_id=lead.id, note="Ariza qabul qilindi; maxfiylik xabari tasdiqlandi"))
    db.flush()
    return {"id": str(lead.id), "message": "Arizangiz qabul qilindi."}


def lead_view(db, obj):
    outbox = db.scalar(select(NotificationOutbox).where(NotificationOutbox.lead_id == obj.id))
    return {**project(obj, FIELDS), "telegram_status": outbox.status if outbox else "disabled"}


@router.get("")
def leads(
    status: str = "",
    q: str = "",
    page: int = 1,
    page_size: int = 20,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    from app.core.helpers import page_rows

    stmt = select(Lead, NotificationOutbox.status).outerjoin(
        NotificationOutbox, NotificationOutbox.lead_id == Lead.id
    )
    if status:
        stmt = stmt.where(Lead.status == status)
    if q:
        stmt = stmt.where(Lead.full_name.ilike("%" + q[:100] + "%") | Lead.phone.contains(q[:30]))
    return page_rows(
        db,
        stmt.order_by(Lead.created_at.desc()),
        lambda r: {**project(r[0], FIELDS), "telegram_status": r[1] or "disabled"},
        page,
        page_size,
    )


@router.get("/{oid}")
def detail(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    lead = get(db, Lead, oid)
    d = lead_view(db, lead)
    d["history"] = [
        project(x, "id note created_at")
        for x in db.scalars(
            select(LeadHistory).where(LeadHistory.lead_id == oid).order_by(LeadHistory.created_at)
        )
    ]
    d["possible_students"] = [
        project(x, "id full_name phone")
        for x in db.scalars(
            select(Student)
            .where(Student.phone == lead.phone, Student.deleted_at.is_(None))
            .limit(20)
        )
    ]
    return d


@router.patch("/{oid}")
def update(
    oid: UUID, payload: LeadPatch, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    lead = get(db, Lead, oid, lock=True)
    if payload.status == "converted" and not lead.student_id:
        fail(422, "use_conversion", "O‘quvchiga aylantirish amalidan foydalaning")
    if payload.status == "trial_scheduled" and not payload.trial_at:
        fail(422, "trial_date_required", "Sinov sanasini kiriting")
    if payload.status == "closed" and not payload.closed_reason:
        fail(422, "close_reason_required", "Yopish sababini kiriting")
    old = lead.status
    for k, v in payload.model_dump(exclude={"note"}).items():
        setattr(lead, k, v)
    db.add(
        LeadHistory(
            lead_id=oid, actor_id=actor.id, note=f"{old} → {payload.status}. {payload.note}"
        )
    )
    audit(db, actor, "lead_updated", oid)
    return lead_view(db, lead)


@router.post("/{oid}/convert")
def convert(
    oid: UUID, payload: ConvertLead, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    lead = get(db, Lead, oid, lock=True)
    if lead.student_id:
        return {"student_id": str(lead.student_id), "already_converted": True}
    if payload.existing_student_id:
        student = get(db, Student, payload.existing_student_id)
        if student.deleted_at is not None or student.admission_status != "approved":
            fail(409, "unavailable_student", "O‘quvchi o‘chirilgan yoki arizasi tasdiqlanmagan")
    else:
        student = Student(full_name=lead.full_name, phone=lead.phone, joined_on=local_today())
        db.add(student)
        db.flush()
    lead.student_id = student.id
    lead.status = "converted"
    db.add(LeadHistory(lead_id=oid, actor_id=actor.id, note="O‘quvchiga aylantirildi"))
    audit(db, actor, "lead_converted", oid, student_id=str(student.id))
    return {"student_id": str(student.id), "already_converted": False}


@router.post("/{oid}/retry-notification")
def retry(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    get(db, Lead, oid)
    if not (get_settings().telegram_bot_token and get_settings().telegram_chat_id):
        fail(409, "telegram_disabled", "Telegram hali sozlanmagan")
    job = db.scalar(
        select(NotificationOutbox).where(NotificationOutbox.lead_id == oid).with_for_update()
    )
    if job.status in ("processing", "sent"):
        fail(409, "notification_status", "Xabar yuborilmoqda yoki allaqachon yuborilgan")
    job.status = "pending"
    job.attempts = 0
    job.next_attempt_at = utcnow()
    job.last_safe_error = None
    return {"status": "pending"}
