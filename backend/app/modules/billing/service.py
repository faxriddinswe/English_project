import hashlib
from datetime import date, datetime, time, timezone
from decimal import Decimal
from sqlalchemy import select, func, or_
from app.db.models import (
    Invoice,
    Adjustment,
    Allocation,
    Payment,
    Refund,
    Student,
    Membership,
    Group,
    InvoiceLine,
)
from app.core.helpers import get, project, audit, teacher_lock, local_today, TZ
from app.core.errors import fail

ZERO = Decimal("0.00")


def month_bounds(day: date):
    first = day.replace(day=1)
    end = date(first.year + 1, 1, 1) if first.month == 12 else date(first.year, first.month + 1, 1)
    return first, end


def utc_month_bounds(day: date):
    start, end = month_bounds(day)
    return datetime.combine(start, time.min, TZ).astimezone(timezone.utc), datetime.combine(
        end, time.min, TZ
    ).astimezone(timezone.utc)


def invoice_query():
    adj = (
        select(Adjustment.invoice_id, func.sum(Adjustment.amount).label("adjustment"))
        .group_by(Adjustment.invoice_id)
        .subquery()
    )
    alloc = (
        select(Allocation.invoice_id, func.sum(Allocation.amount).label("paid"))
        .group_by(Allocation.invoice_id)
        .subquery()
    )
    return (
        select(
            Invoice,
            func.coalesce(adj.c.adjustment, 0).label("adjustment"),
            func.coalesce(alloc.c.paid, 0).label("paid"),
        )
        .outerjoin(adj, adj.c.invoice_id == Invoice.id)
        .outerjoin(alloc, alloc.c.invoice_id == Invoice.id)
    )


def invoice_view(row):
    inv, adjustment, paid = row
    payable = inv.amount + adjustment
    debt = max(ZERO, payable - paid) if inv.status == "issued" else ZERO
    return {
        **project(
            inv,
            "id student_id membership_id period_start period_end due_date amount status void_reason",
        ),
        "adjustment": format(adjustment, ".2f"),
        "payable": format(payable, ".2f"),
        "paid": format(paid, ".2f"),
        "debt": format(debt, ".2f"),
        "overdue": inv.status == "issued" and inv.due_date < local_today() and debt > 0,
    }


def invoice_detail(db, oid):
    row = db.execute(invoice_query().where(Invoice.id == oid)).first()
    if not row:
        fail(404, "not_found", "Hisob topilmadi")
    return invoice_view(row)


def student_finance(db, student_id):
    rows = invoice_query().where(Invoice.student_id == student_id).subquery()
    # Monetary aggregates run in PostgreSQL; no full financial history is loaded into Python.
    debt = func.greatest(0, rows.c.amount + rows.c.adjustment - rows.c.paid)
    total = db.scalar(select(func.coalesce(func.sum(debt), 0)).where(rows.c.status == "issued"))
    overdue = db.scalar(
        select(func.coalesce(func.sum(debt), 0)).where(
            rows.c.status == "issued", rows.c.due_date < local_today()
        )
    )
    ref = (
        select(Refund.payment_id, func.sum(Refund.amount).label("refunded"))
        .group_by(Refund.payment_id)
        .subquery()
    )
    alloc = (
        select(Allocation.payment_id, func.sum(Allocation.amount).label("allocated"))
        .group_by(Allocation.payment_id)
        .subquery()
    )
    credit = db.scalar(
        select(
            func.coalesce(
                func.sum(
                    Payment.amount
                    - func.coalesce(ref.c.refunded, 0)
                    - func.coalesce(alloc.c.allocated, 0)
                ),
                0,
            )
        )
        .outerjoin(ref, ref.c.payment_id == Payment.id)
        .outerjoin(alloc, alloc.c.payment_id == Payment.id)
        .where(Payment.student_id == student_id, Payment.void_reason.is_(None))
    )
    return {
        "debt": format(total, ".2f"),
        "overdue": format(overdue, ".2f"),
        "unallocated_credit": format(credit, ".2f"),
        "currency": "UZS",
    }


def add_invoice(db, actor, payload):
    teacher_lock(db, actor)
    student = get(db, Student, payload.student_id, lock=True)
    if student.deleted_at is not None or student.admission_status != "approved":
        fail(
            409,
            "unavailable_student",
            "O‘chirilgan yoki tasdiqlanmagan o‘quvchiga yangi hisob yaratilmaydi",
        )
    if payload.period_end <= payload.period_start:
        fail(422, "invalid_period", "Davr oxiri boshlanishidan keyin bo‘lsin")
    if payload.membership_id:
        m = get(db, Membership, payload.membership_id)
        if m.student_id != payload.student_id:
            fail(422, "membership_owner", "A’zolik shu o‘quvchiga tegishli emas")
        if get(db, Group, m.group_id).deleted_at is not None:
            fail(409, "deleted_group", "O‘chirilgan guruh a’zoligiga yangi hisob yaratilmaydi")
    obj = Invoice(**payload.model_dump())
    db.add(obj)
    db.flush()
    db.add(
        InvoiceLine(
            invoice_id=obj.id, description="O‘quv to‘lovi — narx nusxasi", amount=obj.amount
        )
    )
    audit(db, actor, "invoice_drafted", obj.id)
    return obj


def generate(db, actor, payload):
    from app.modules.reports.router import operational_settings

    teacher_lock(db, actor)
    start, end = month_bounds(payload.month)
    created = []
    skipped = []
    stmt = (
        select(Membership, Student, Group)
        .join(Student, Student.id == Membership.student_id)
        .join(Group, Group.id == Membership.group_id)
        .where(
            Membership.start_date < end,
            or_(Membership.end_date.is_(None), Membership.end_date > start),
        )
    )
    if payload.group_id:
        stmt = stmt.where(Group.id == payload.group_id)
    from app.core.schemas import InvoiceIn

    for member, student, group in db.execute(stmt):
        if (
            student.deleted_at is not None
            or student.admission_status != "approved"
            or group.deleted_at is not None
        ):
            skipped.append({"membership_id": str(member.id), "reason": "removed_student_or_group"})
            continue
        existing = db.scalar(
            select(Invoice.id).where(
                Invoice.membership_id == member.id,
                Invoice.period_start == start,
                Invoice.period_end == end,
            )
        )
        if existing:
            skipped.append({"membership_id": str(member.id), "reason": "already_generated"})
            continue
        inv = add_invoice(
            db,
            actor,
            InvoiceIn(
                student_id=student.id,
                membership_id=member.id,
                period_start=start,
                period_end=end,
                due_date=start.replace(
                    day=payload.due_day or operational_settings(db).billing_due_day
                ),
                amount=group.monthly_price,
            ),
        )
        created.append(str(inv.id))
    return {
        "created": created,
        "skipped": skipped,
        "rule": "calendar_month_full_price_manual_adjustment",
        "period_start": str(start),
        "period_end_exclusive": str(end),
    }


def adjustment(db, actor, oid, payload):
    teacher_lock(db, actor)
    inv = get(db, Invoice, oid)
    get(db, Student, inv.student_id, lock=True)
    inv = get(db, Invoice, oid, lock=True)
    if inv.status == "void":
        fail(409, "void_invoice", "Bekor qilingan hisob")
    info = invoice_detail(db, oid)
    payable = Decimal(info["payable"]) + payload.amount
    if payable < 0 or payable < Decimal(info["paid"]):
        fail(
            409,
            "invalid_adjustment",
            "Hisob manfiy yoki taqsimlangan to‘lovdan kam bo‘lmasin; avval allocationni kamaytiring",
        )
    db.add(
        Adjustment(invoice_id=oid, amount=payload.amount, reason=payload.reason, actor_id=actor.id)
    )
    audit(db, actor, "invoice_adjustment", oid, amount=str(payload.amount), reason=payload.reason)
    db.flush()
    return invoice_detail(db, oid)


def payment_view(db, p):
    refunded = db.scalar(
        select(func.coalesce(func.sum(Refund.amount), 0)).where(Refund.payment_id == p.id)
    )
    allocations = list(db.scalars(select(Allocation).where(Allocation.payment_id == p.id)))
    return {
        **project(p, "id student_id amount received_at method reference void_reason"),
        "refunded": format(refunded, ".2f"),
        "unallocated_credit": format(
            p.amount - refunded - sum((a.amount for a in allocations), ZERO), ".2f"
        )
        if not p.void_reason
        else "0.00",
        "allocations": [project(a, "invoice_id amount") for a in allocations],
    }


def allocate(db, actor, payment, items):
    get(db, Student, payment.student_id, lock=True)
    if payment.void_reason:
        fail(409, "void_payment", "Bekor qilingan to‘lov")
    ids = [i.invoice_id for i in items]
    if len(ids) != len(set(ids)):
        fail(422, "duplicate_allocation", "Hisobni bir marta tanlang")
    info = payment_view(db, payment)
    available = Decimal(info["unallocated_credit"])
    if sum((i.amount for i in items), ZERO) > available:
        fail(409, "over_allocation", "To‘lovdagi erkin mablag‘ yetarli emas")
    for item in sorted(items, key=lambda i: str(i.invoice_id)):
        inv = get(db, Invoice, item.invoice_id, lock=True)
        if inv.student_id != payment.student_id or inv.status != "issued":
            fail(409, "invalid_invoice", "Faqat shu o‘quvchining chiqarilgan hisobiga taqsimlang")
        d = invoice_detail(db, inv.id)
        if item.amount > Decimal(d["debt"]):
            fail(409, "over_allocation", "Hisob qarzidan ortiq taqsimlash mumkin emas")
        a = db.scalar(
            select(Allocation).where(
                Allocation.payment_id == payment.id, Allocation.invoice_id == inv.id
            )
        )
        if a:
            a.amount += item.amount
        else:
            db.add(Allocation(payment_id=payment.id, invoice_id=inv.id, amount=item.amount))
        db.flush()
    audit(db, actor, "payment_allocated", payment.id)


def create_payment(db, actor, payload, key):
    if not key or len(key) > 100:
        fail(422, "idempotency_key", "Idempotency-Key kerak (1–100 belgi)")
    teacher_lock(db, actor)
    get(db, Student, payload.student_id, lock=True)
    digest = hashlib.sha256(payload.model_dump_json().encode()).hexdigest()
    prior = db.scalar(
        select(Payment).where(Payment.actor_id == actor.id, Payment.idempotency_key == key)
    )
    if prior:
        if prior.payload_hash != digest:
            fail(409, "idempotency_conflict", "Bu kalit boshqa so‘rov uchun ishlatilgan")
        return prior.idempotency_response or payment_view(db, prior)
    p = Payment(
        **payload.model_dump(exclude={"allocations"}),
        actor_id=actor.id,
        idempotency_key=key,
        payload_hash=digest,
    )
    db.add(p)
    db.flush()
    allocate(db, actor, p, payload.allocations)
    audit(db, actor, "payment_received", p.id, amount=str(p.amount))
    db.flush()
    result = payment_view(db, p)
    p.idempotency_response = result
    return result


def refund(db, actor, oid, payload):
    teacher_lock(db, actor)
    p = get(db, Payment, oid)
    get(db, Student, p.student_id, lock=True)
    p = get(db, Payment, oid, lock=True)
    info = payment_view(db, p)
    if p.void_reason or payload.amount > p.amount - Decimal(info["refunded"]):
        fail(409, "refund_limit", "Qaytariladigan summa to‘lovning qolgan qismidan oshdi")
    # Consume free credit first, then release allocations. Debt returns; tuition is not cancelled.
    release = max(ZERO, payload.amount - Decimal(info["unallocated_credit"]))
    for a in db.scalars(
        select(Allocation)
        .where(Allocation.payment_id == oid)
        .order_by(Allocation.created_at.desc())
        .with_for_update()
    ):
        delta = min(release, a.amount)
        a.amount -= delta
        release -= delta
        if release == 0:
            break
    db.add(Refund(payment_id=oid, amount=payload.amount, reason=payload.reason, actor_id=actor.id))
    audit(db, actor, "payment_refunded", oid, amount=str(payload.amount), reason=payload.reason)
    db.flush()
    return payment_view(db, p)


def edit_payment(db, actor, oid, payload):
    """Serialize correction and allocation release; preserve receipt identity/history."""
    teacher_lock(db, actor)
    payment = get(db, Payment, oid)
    get(db, Student, payment.student_id, lock=True)
    payment = get(db, Payment, oid, lock=True)
    if payment.void_reason:
        fail(409, "void_payment", "O‘chirilgan to‘lovni tahrirlab bo‘lmaydi")
    if db.scalar(select(Refund.id).where(Refund.payment_id == oid).limit(1)):
        fail(
            409,
            "has_refunds",
            "Pul qaytarilgan to‘lov uchun yangi tuzatish o‘rniga refund tarixidan foydalaning",
        )
    before = project(payment, "amount received_at method reference")
    allocations = list(
        db.scalars(
            select(Allocation)
            .where(Allocation.payment_id == oid)
            .order_by(Allocation.created_at.desc(), Allocation.id)
            .with_for_update()
        )
    )
    for invoice_id in sorted({a.invoice_id for a in allocations}, key=str):
        get(db, Invoice, invoice_id, lock=True)
    excess = max(sum((a.amount for a in allocations), ZERO) - payload.amount, ZERO)
    released = excess
    for allocation in allocations:
        take = min(allocation.amount, excess)
        allocation.amount -= take
        excess -= take
    for field in ("amount", "received_at", "method", "reference"):
        setattr(payment, field, getattr(payload, field))
    db.flush()
    audit(
        db,
        actor,
        "payment_corrected",
        oid,
        reason=payload.reason,
        before=before,
        after=project(payment, "amount received_at method reference"),
        released_allocation=format(released, ".2f"),
    )
    return payment_view(db, payment)


def void_payment(db, actor, oid, reason):
    teacher_lock(db, actor)
    payment = get(db, Payment, oid)
    get(db, Student, payment.student_id, lock=True)
    payment = get(db, Payment, oid, lock=True)
    if payment.void_reason:
        return payment_view(db, payment)
    if db.scalar(select(Refund.id).where(Refund.payment_id == oid).limit(1)):
        fail(
            409,
            "has_refunds",
            "Pul qaytarilgan to‘lovni o‘chirish mumkin emas; qolganini refund qiling",
        )
    allocations = list(
        db.scalars(select(Allocation).where(Allocation.payment_id == oid).with_for_update())
    )
    for invoice_id in sorted({a.invoice_id for a in allocations}, key=str):
        get(db, Invoice, invoice_id, lock=True)
    for allocation in allocations:
        allocation.amount = ZERO
    payment.void_reason = reason
    db.flush()
    audit(db, actor, "payment_voided", oid, reason=reason)
    return payment_view(db, payment)
