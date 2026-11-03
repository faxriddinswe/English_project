from datetime import date, datetime, time, timedelta, timezone
from fastapi import APIRouter, Depends, Response
from sqlalchemy import select, func, case, exists, or_
from app.core.helpers import project, page_query, local_today, TZ
from app.core.config import get_settings
from app.core.errors import fail
from app.db.session import get_db
from app.db.base import utcnow
from app.db.models import (
    User,
    Student,
    Group,
    Lesson,
    Attendance,
    Payment,
    Refund,
    Lead,
    Membership,
    AuditLog,
    Content,
)
from app.modules.auth.service import teacher
from app.modules.billing.service import invoice_query, utc_month_bounds
from app.modules.content.service import OperationalSettings
from app.modules.students.registration import pending_registration
from app.modules.reports.dashboard import dashboard_analytics
from app.modules.students.policy import listed_student

router = APIRouter(prefix="/teacher", tags=["dashboard", "reports"])


def metrics(db, month):
    if not 2 <= month.year <= 9998:
        fail(422, "invalid_month", "Hisobot oyi noto‘g‘ri")
    start, end = utc_month_bounds(month)
    today = local_today()
    day_start = datetime.combine(today, time.min, TZ).astimezone(timezone.utc)
    day_end = day_start + timedelta(days=1)
    count = lambda stmt: db.scalar(stmt) or 0
    gross = count(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.received_at >= start, Payment.received_at < end, Payment.void_reason.is_(None)
        )
    )
    refunded = count(
        select(func.coalesce(func.sum(Refund.amount), 0)).where(
            Refund.created_at >= start, Refund.created_at < end
        )
    )
    sub = invoice_query().subquery()
    outstanding = func.greatest(0, sub.c.amount + sub.c.adjustment - sub.c.paid)
    overdue = count(
        select(func.coalesce(func.sum(outstanding), 0)).where(
            sub.c.status == "issued", sub.c.due_date < today
        )
    )
    att = (
        select(Attendance.status)
        .join(Lesson, Lesson.id == Attendance.lesson_id)
        .where(Lesson.starts_at >= start, Lesson.starts_at < end, Lesson.status != "cancelled")
        .subquery()
    )
    marked = count(select(func.count()).select_from(att))
    present = count(
        select(func.count()).select_from(att).where(att.c.status.in_(["present", "late"]))
    )
    # Missing attendance is an eligible membership/lesson pair, independent of current student status.
    local_day = func.timezone("Asia/Tashkent", Lesson.starts_at).cast(__import__("sqlalchemy").Date)
    unmarked = count(
        select(func.count())
        .select_from(Lesson)
        .join(Membership, Membership.group_id == Lesson.group_id)
        .join(Student, Student.id == Membership.student_id)
        .where(
            Student.admission_status == "approved",
            or_(Student.deleted_at.is_(None), Student.deleted_at > Lesson.starts_at),
            Lesson.starts_at >= start,
            Lesson.starts_at < end,
            Lesson.starts_at < utcnow(),
            Lesson.status != "cancelled",
            Membership.start_date <= local_day,
            or_(Membership.end_date.is_(None), Membership.end_date > local_day),
            ~exists(
                select(Attendance.id).where(
                    Attendance.lesson_id == Lesson.id,
                    Attendance.student_id == Membership.student_id,
                )
            ),
        )
    )
    return {
        "month": month.replace(day=1).isoformat(),
        "timezone": "Asia/Tashkent",
        "student_count": count(select(func.count(Student.id)).where(listed_student())),
        "group_count": count(select(func.count(Group.id)).where(Group.deleted_at.is_(None))),
        "today_lessons": count(
            select(func.count(Lesson.id)).where(
                Lesson.starts_at >= day_start,
                Lesson.starts_at < day_end,
                Lesson.status != "cancelled",
            )
        ),
        "received": format(gross, ".2f"),
        "refunded": format(refunded, ".2f"),
        "net_receipts": format(gross - refunded, ".2f"),
        "overdue": format(overdue, ".2f"),
        "pending_students": count(
            select(func.count(Student.id))
            .join(User, Student.user_id == User.id)
            .where(pending_registration())
        ),
        "new_leads": count(select(func.count(Lead.id)).where(Lead.status == "new")),
        "attendance_percent": round(100 * present / marked, 1) if marked else None,
        "marked_attendance": marked,
        "unmarked_attendance": unmarked,
        "attendance_rule": "(present + late) / all marked; excused included; unmarked excluded",
        "telegram_configured": bool(
            get_settings().telegram_bot_token and get_settings().telegram_chat_id
        ),
    }


@router.get("/dashboard")
def dashboard(
    month: date | None = None, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    data = metrics(db, month or local_today())
    data["attention"] = [
        {"label": "Muddati o‘tgan hisoblar", "href": "/teacher/finance?overdue=true"},
        {"label": "Yangi murojaatlar", "href": "/teacher/leads?status=new"},
        {"label": "Davomatni tekshirish", "href": "/teacher/attendance"},
    ]
    if data.get("pending_students"):
        data["attention"].insert(
            0,
            {
                "label": f"Yangi o‘quvchilar arizalari ({data['pending_students']} ta)",
                "href": "/teacher/pending-students",
            },
        )
    ranked = (
        select(
            Attendance.student_id,
            Attendance.status,
            func.row_number()
            .over(partition_by=Attendance.student_id, order_by=Lesson.starts_at.desc())
            .label("rn"),
        )
        .join(Lesson, Lesson.id == Attendance.lesson_id)
        .where(Lesson.status != "cancelled")
        .subquery()
    )
    n = operational_settings(db).absence_threshold
    absent = (
        select(ranked.c.student_id)
        .where(ranked.c.rn <= n)
        .group_by(ranked.c.student_id)
        .having(func.count() == n, func.sum(case((ranked.c.status == "absent", 1), else_=0)) == n)
    )
    data["consecutive_absences"] = [
        project(x, "id full_name")
        for x in db.scalars(
            select(Student).where(Student.id.in_(absent), listed_student()).limit(20)
        )
    ]
    data["absence_threshold"] = n
    data["analytics"] = dashboard_analytics(db, month or local_today())
    return data


@router.get("/reports/summary")
def summary(
    month: date | None = None, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    return metrics(db, month or local_today())


@router.get(
    "/reports/export.xlsx",
    response_class=Response,
    responses={
        200: {
            "content": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}},
            "description": "Excel hisoboti",
        }
    },
)
def export_excel(
    resource: str = "all",
    month: date | None = None,
    actor=Depends(teacher),
    db=Depends(get_db, scope="function"),
):
    from sqlalchemy.orm import Session
    from app.modules.reports.excel import RESOURCES, MIME, build_workbook

    if resource not in RESOURCES:
        fail(422, "invalid_resource", "Hisobot turi noto‘g‘ri")
    selected = month or local_today()
    # Authenticate in the request session, then read every sheet from one immutable snapshot.
    with db.get_bind().connect().execution_options(isolation_level="REPEATABLE READ") as connection:
        with connection.begin():
            connection.exec_driver_sql("SET TRANSACTION READ ONLY")
            with Session(bind=connection) as snapshot:
                values = metrics(snapshot, selected)
                content = build_workbook(snapshot, resource, selected, values)
    return Response(
        content,
        media_type=MIME,
        headers={
            "Content-Disposition": f'attachment; filename="sherzod-{resource}-{selected:%Y-%m}.xlsx"',
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.get("/audit")
def audit_log(
    page: int = 1, page_size: int = 20, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    return page_query(
        db,
        select(AuditLog).order_by(AuditLog.created_at.desc()),
        lambda x: project(x, "id actor_id action object_id details created_at"),
        page,
        page_size,
    )


@router.get("/settings")
def settings(actor=Depends(teacher), db=Depends(get_db, scope="function")):
    s = get_settings()
    return {
        "timezone": s.timezone,
        **operational_settings(db).model_dump(),
        "telegram_configured": bool(s.telegram_bot_token and s.telegram_chat_id),
        "storage_backend": s.storage_backend,
    }


def operational_settings(db):
    obj = db.scalar(select(Content).where(Content.kind == "settings").limit(1))
    return (
        OperationalSettings.model_validate(obj.data)
        if obj
        else OperationalSettings(
            absence_threshold=get_settings().absence_threshold,
            billing_due_day=get_settings().billing_due_day,
        )
    )


@router.put("/settings")
def update_settings(
    payload: OperationalSettings, actor=Depends(teacher), db=Depends(get_db, scope="function")
):
    from app.core.helpers import teacher_lock, audit

    teacher_lock(db, actor)
    obj = db.scalar(select(Content).where(Content.kind == "settings").with_for_update().limit(1))
    if not obj:
        obj = Content(kind="settings", title="Operational settings", data={})
        db.add(obj)
    obj.data = payload.model_dump()
    db.flush()
    audit(db, actor, "settings_updated", obj.id)
    return payload.model_dump()
