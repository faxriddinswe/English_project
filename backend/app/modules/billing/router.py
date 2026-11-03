from uuid import UUID
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, Header
from sqlalchemy import select, func, or_, cast, String
from app.core.schemas import (
    InvoiceIn,
    GenerateInvoices,
    AdjustmentIn,
    PaymentIn,
    PaymentEdit,
    RefundIn,
    AllocationIn,
    Reason,
)
from app.core.helpers import get, project, audit, teacher_lock, aware
from app.core.errors import fail
from app.db.session import get_db
from app.db.models import Invoice, Payment, Allocation, Student, Adjustment, InvoiceLine
from app.modules.auth.service import teacher
from app.modules.billing import service as s

router = APIRouter(prefix="/teacher", tags=["billing"])


@router.get("/invoices")
def invoices(
    student_id: UUID | None = None,
    q: str = "",
    status: str = "",
    overdue: bool = False,
    page: int = 1,
    page_size: int = 20,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    if page < 1 or page_size not in (20, 50):
        fail(422, "pagination", "page_size 20 yoki 50")
    stmt = s.invoice_query()
    if q.strip():
        search = "%" + q.strip()[:100] + "%"
        stmt = stmt.where(
            or_(
                Invoice.student_id.in_(
                    select(Student.id).where(
                        or_(
                            Student.full_name.ilike(search),
                            Student.phone.ilike(search),
                        )
                    )
                ),
                cast(Invoice.period_start, String).ilike(search),
                cast(Invoice.amount, String).ilike("%" + q.replace(" ", "")[:100] + "%"),
            )
        )
    if student_id:
        stmt = stmt.where(Invoice.student_id == student_id)
    if status:
        stmt = stmt.where(Invoice.status == status)
    if overdue:
        stmt = stmt.where(Invoice.status == "issued", Invoice.due_date < s.local_today())
    # Debt filtering happens in SQL using the aggregate query.
    if overdue:
        sub = stmt.subquery()
        ids = select(sub.c.id).where(sub.c.amount + sub.c.adjustment - sub.c.paid > 0)
        stmt = s.invoice_query().where(Invoice.id.in_(ids))
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    result = {
        "items": [
            s.invoice_view(r)
            for r in db.execute(
                stmt.order_by(Invoice.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
    names = dict(
        db.execute(
            select(Student.id, Student.full_name).where(
                Student.id.in_([r["student_id"] for r in result["items"]])
            )
        ).all()
    )
    for row in result["items"]:
        row["student_name"] = names.get(UUID(row["student_id"]), "")
    return result


@router.post("/invoices", status_code=201)
def create_invoice(
    payload: InvoiceIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    obj = s.add_invoice(db, actor, payload)
    return s.invoice_detail(db, obj.id)


@router.post("/invoices/generate")
def generate(
    payload: GenerateInvoices, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    return s.generate(db, actor, payload)


@router.get("/invoices/{oid}")
def detail(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    d = s.invoice_detail(db, oid)
    d["lines"] = [
        project(x, "id description amount")
        for x in db.scalars(select(InvoiceLine).where(InvoiceLine.invoice_id == oid))
    ]
    d["adjustments"] = [
        project(x, "id amount reason created_at")
        for x in db.scalars(select(Adjustment).where(Adjustment.invoice_id == oid))
    ]
    return d


@router.put("/invoices/{oid}")
def update_draft(
    oid: UUID, payload: InvoiceIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    teacher_lock(db, actor)
    inv = get(db, Invoice, oid, lock=True)
    if inv.status != "draft":
        fail(409, "immutable_invoice", "Chiqarilgan hisob uchun adjustment yoki void ishlating")
    get(db, Student, payload.student_id, lock=True)
    if payload.period_end <= payload.period_start:
        fail(422, "invalid_period", "Davr noto‘g‘ri")
    membership_id = (
        payload.membership_id if "membership_id" in payload.model_fields_set else inv.membership_id
    )
    if membership_id:
        from app.db.models import Membership

        if get(db, Membership, membership_id).student_id != payload.student_id:
            fail(422, "membership_owner", "A’zolik shu o‘quvchiga tegishli emas")
    adj = db.scalar(
        select(func.coalesce(func.sum(Adjustment.amount), 0)).where(Adjustment.invoice_id == oid)
    )
    if payload.amount + adj < 0:
        fail(409, "invalid_adjustment", "Tuzatish bilan hisob manfiy bo‘lmasin")
    for k, v in payload.model_dump().items():
        if k == "membership_id":
            v = membership_id
        setattr(inv, k, v)
    for line in db.scalars(select(InvoiceLine).where(InvoiceLine.invoice_id == oid)):
        line.amount = payload.amount
    db.flush()
    audit(db, actor, "invoice_draft_updated", oid)
    return s.invoice_detail(db, oid)


@router.post("/invoices/{oid}/issue")
def issue(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    teacher_lock(db, actor)
    obj = get(db, Invoice, oid, lock=True)
    if obj.status != "draft":
        fail(409, "invoice_status", "Faqat draft hisob chiqariladi")
    obj.status = "issued"
    db.flush()
    audit(db, actor, "invoice_issued", oid)
    return s.invoice_detail(db, oid)


@router.post("/invoices/{oid}/void")
def void_invoice(
    oid: UUID, payload: Reason, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    teacher_lock(db, actor)
    inv = get(db, Invoice, oid)
    get(db, Student, inv.student_id, lock=True)
    inv = get(db, Invoice, oid, lock=True)
    for a in db.scalars(select(Allocation).where(Allocation.invoice_id == oid).with_for_update()):
        a.amount = Decimal(0)
    inv.status = "void"
    inv.void_reason = payload.reason
    db.flush()
    audit(db, actor, "invoice_voided", oid, reason=payload.reason)
    return s.invoice_detail(db, oid)


@router.post("/invoices/{oid}/adjustments")
def adjust(
    oid: UUID, payload: AdjustmentIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    return s.adjustment(db, actor, oid, payload)


@router.post("/payments", status_code=201)
def payment(
    payload: PaymentIn,
    idempotency_key: str | None = Header(default=None),
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    return s.create_payment(db, actor, payload, idempotency_key)


@router.get("/payments")
def payments(
    student_id: UUID | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    page: int = 1,
    page_size: int = 20,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    from app.core.helpers import page_query

    stmt = select(Payment)
    if student_id:
        stmt = stmt.where(Payment.student_id == student_id)
    if start:
        stmt = stmt.where(Payment.received_at >= aware(start))
    if end:
        stmt = stmt.where(Payment.received_at < aware(end))
    result = page_query(
        db,
        stmt.order_by(Payment.received_at.desc()),
        lambda p: project(p, "id student_id amount received_at method reference void_reason"),
        page,
        page_size,
    )
    names = dict(
        db.execute(
            select(Student.id, Student.full_name).where(
                Student.id.in_([r["student_id"] for r in result["items"]])
            )
        ).all()
    )
    for row in result["items"]:
        row["student_name"] = names.get(UUID(row["student_id"]), "")
    return result


@router.get("/payments/{oid}")
def payment_detail(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    return s.payment_view(db, get(db, Payment, oid))


@router.post("/payments/{oid}/allocations")
def allocate(
    oid: UUID,
    payload: list[AllocationIn],
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    teacher_lock(db, actor)
    p = get(db, Payment, oid)
    s.allocate(db, actor, p, payload)
    return s.payment_view(db, p)


@router.post("/payments/{oid}/refunds")
def refund(
    oid: UUID, payload: RefundIn, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    return s.refund(db, actor, oid, payload)


@router.post("/payments/{oid}/void")
def void_payment(
    oid: UUID, payload: Reason, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    return s.void_payment(db, actor, oid, payload.reason)


@router.put("/payments/{oid}")
def edit_payment(
    oid: UUID, payload: PaymentEdit, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    return s.edit_payment(db, actor, oid, payload)


@router.delete("/payments/{oid}")
def delete_payment(
    oid: UUID, payload: Reason, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    return s.void_payment(db, actor, oid, payload.reason)


@router.get("/students/{oid}/billing")
def student_billing(oid: UUID, actor=Depends(teacher), db=Depends(get_db, scope="function")):
    get(db, Student, oid)
    return s.student_finance(db, oid)
