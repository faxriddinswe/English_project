"""Teacher report snapshots. No pagination, credentials or client-side financial math."""

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from io import BytesIO
import math
from tempfile import TemporaryDirectory

import xlsxwriter
from sqlalchemy import select, func, case, or_

from app.core.errors import fail
from app.core.helpers import TZ, local_today
from app.db.base import utcnow
from app.db.models import (
    User,
    Student,
    Group,
    Course,
    Membership,
    Invoice,
    Payment,
    Refund,
    Allocation,
    Lead,
    Attendance,
    Lesson,
    AssessmentResult,
)
from app.modules.billing.service import invoice_query
from app.modules.reports.dashboard import dashboard_analytics
from app.modules.students.policy import listed_student
from app.modules.students.registration import pending_registration

MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
ROWS_PER_SHEET = 1_000_000
ZERO = Decimal("0.00")
RESOURCES = {
    "all": (
        "students",
        "groups",
        "pending",
        "balances",
        "invoices",
        "payments",
        "refunds",
        "allocations",
        "leads",
        "attendance",
        "results",
        "monthly",
    ),
    "finance": ("balances", "invoices", "payments", "refunds", "allocations", "monthly"),
    "students": ("students",),
    "groups": ("groups",),
    "pending": ("pending",),
    "invoices": ("invoices",),
    "payments": ("payments", "refunds", "allocations"),
    "leads": ("leads",),
    "attendance": ("attendance",),
    "results": ("results",),
}
STATES = {
    "draft": "Qoralama",
    "issued": "Chiqarilgan",
    "void": "Bekor qilingan",
    "new": "Yangi",
    "contacted": "Bog‘lanilgan",
    "trial_scheduled": "Sinov rejalangan",
    "converted": "O‘quvchiga aylantirilgan",
    "closed": "Yopilgan",
    "present": "Keldi",
    "late": "Kechikdi",
    "absent": "Kelmadi",
    "excused": "Sababli kelmadi",
    "cash": "Naqd",
    "bank_transfer": "Bank o‘tkazmasi",
    "other": "Boshqa",
}


@dataclass(frozen=True)
class Column:
    title: str
    kind: str = "text"
    width: int = 24
    total: bool = False


def money_column(title, total=False):
    return Column(title + " (so‘m)", "money", 25, total)


def financial_rows():
    """Aggregate each ledger independently so joins never multiply allocations/refunds."""
    inv = invoice_query().subquery()
    owing = func.greatest(0, inv.c.amount + inv.c.adjustment - inv.c.paid)
    debts = (
        select(
            inv.c.student_id,
            func.sum(case((inv.c.status == "issued", owing), else_=0)).label("debt"),
            func.sum(
                case(
                    ((inv.c.status == "issued") & (inv.c.due_date < local_today()), owing), else_=0
                )
            ).label("overdue"),
        )
        .group_by(inv.c.student_id)
        .subquery()
    )
    refunds = (
        select(Refund.payment_id, func.sum(Refund.amount).label("refunded"))
        .group_by(Refund.payment_id)
        .subquery()
    )
    allocations = (
        select(Allocation.payment_id, func.sum(Allocation.amount).label("allocated"))
        .group_by(Allocation.payment_id)
        .subquery()
    )
    refunded = func.coalesce(refunds.c.refunded, 0)
    allocated = func.coalesce(allocations.c.allocated, 0)
    payments = (
        select(
            Payment.id,
            Payment.student_id,
            Payment.amount,
            Payment.received_at,
            Payment.method,
            Payment.reference,
            Payment.void_reason,
            refunded.label("refunded"),
            allocated.label("allocated"),
            case(
                (Payment.void_reason.is_(None), Payment.amount - refunded - allocated), else_=0
            ).label("credit"),
            case((Payment.void_reason.is_(None), Payment.amount), else_=0).label("received"),
        )
        .outerjoin(refunds, refunds.c.payment_id == Payment.id)
        .outerjoin(allocations, allocations.c.payment_id == Payment.id)
        .subquery()
    )
    credits = (
        select(payments.c.student_id, func.sum(payments.c.credit).label("credit"))
        .group_by(payments.c.student_id)
        .subquery()
    )
    balances = (
        select(
            Student.id,
            Student.full_name,
            Student.phone,
            Student.deleted_at,
            func.coalesce(debts.c.debt, 0).label("debt"),
            func.coalesce(debts.c.overdue, 0).label("overdue"),
            func.coalesce(credits.c.credit, 0).label("credit"),
        )
        .outerjoin(debts, debts.c.student_id == Student.id)
        .outerjoin(credits, credits.c.student_id == Student.id)
        .subquery()
    )
    return inv, payments, balances


def current_memberships():
    return (
        Membership.start_date <= local_today(),
        or_(Membership.end_date.is_(None), Membership.end_date > local_today()),
        Group.deleted_at.is_(None),
    )


def datasets(db, resource, analytics):
    inv, payments, balances = financial_rows()
    names = (
        select(
            Membership.student_id,
            func.string_agg(Group.name, ", ").label("groups"),
        )
        .join(Group, Group.id == Membership.group_id)
        .where(*current_memberships())
        .group_by(Membership.student_id)
        .subquery()
    )
    members = (
        select(
            Membership.group_id, func.count(func.distinct(Membership.student_id)).label("students")
        )
        .join(Student, Student.id == Membership.student_id)
        .where(
            listed_student(),
            Membership.start_date <= local_today(),
            or_(Membership.end_date.is_(None), Membership.end_date > local_today()),
        )
        .group_by(Membership.group_id)
        .subquery()
    )
    d = lambda title: Column(title, "date", 17)
    dt = lambda title: Column(title, "datetime", 23)
    text = Column
    number = lambda title: Column(title, "number", 19)
    m = money_column
    specs = {
        "students": (
            "O‘quvchilar",
            [
                text("Ism va familiya", width=32),
                text("Telefon", width=21),
                text("Ota-ona telefoni", width=21),
                d("Qo‘shilgan sana"),
                text("Guruhlar", width=42),
                m("Qarz", True),
                m("Muddati o‘tgan qarz", True),
                m("Erkin mablag‘", True),
            ],
            select(
                Student.full_name,
                Student.phone,
                Student.parent_phone,
                Student.joined_on,
                names.c.groups,
                balances.c.debt,
                balances.c.overdue,
                balances.c.credit,
            )
            .outerjoin(names, names.c.student_id == Student.id)
            .join(balances, balances.c.id == Student.id)
            .where(listed_student())
            .order_by(Student.full_name, Student.id),
        ),
        "groups": (
            "Guruhlar",
            [
                text("Guruh", width=32),
                text("Kurs", width=30),
                text("Daraja", width=16),
                number("O‘quvchilar soni"),
                number("Sig‘im"),
                m("Oylik narx"),
                d("Boshlanish sanasi"),
                d("Tugash sanasi"),
                text("Dars manzili", width=34),
            ],
            select(
                Group.name,
                Course.name,
                Group.level,
                func.coalesce(members.c.students, 0),
                Group.capacity,
                Group.monthly_price,
                Group.start_date,
                Group.end_date,
                Group.location,
            )
            .join(Course, Course.id == Group.course_id)
            .outerjoin(members, members.c.group_id == Group.id)
            .where(Group.deleted_at.is_(None))
            .order_by(Group.name, Group.id),
        ),
        "pending": (
            "Yangi arizalar",
            [text("Ism va familiya", width=32), text("Telefon", width=21), dt("Ariza vaqti")],
            select(Student.full_name, Student.phone, Student.created_at)
            .join(User, User.id == Student.user_id)
            .where(pending_registration())
            .order_by(Student.created_at, Student.id),
        ),
        "balances": (
            "Qarzdorlik",
            [
                text("Ism va familiya", width=32),
                text("Telefon", width=21),
                m("Qarz", True),
                m("Muddati o‘tgan qarz", True),
                m("Erkin mablag‘", True),
                d("O‘chirilgan sana"),
            ],
            select(
                balances.c.full_name,
                balances.c.phone,
                balances.c.debt,
                balances.c.overdue,
                balances.c.credit,
                balances.c.deleted_at,
            )
            .where(or_(balances.c.debt != 0, balances.c.credit != 0))
            .order_by(balances.c.full_name, balances.c.id),
        ),
        "invoices": (
            "Hisoblar",
            [
                text("Ism va familiya", width=32),
                text("Telefon", width=21),
                text("Guruh", width=30),
                d("Davr boshi"),
                d("Davr oxiri (kirmaydi)"),
                d("To‘lov muddati"),
                Column("Hisob holati", "state"),
                m("Asosiy summa"),
                m("Summa tuzatishi"),
                m("To‘lanishi kerak"),
                m("To‘langan", True),
                m("Qarz", True),
                m("Muddati o‘tgan qarz", True),
                text("Bekor qilish sababi", width=42),
                text("Hisob raqami", width=38),
            ],
            select(
                Student.full_name,
                Student.phone,
                Group.name,
                inv.c.period_start,
                inv.c.period_end,
                inv.c.due_date,
                inv.c.status,
                inv.c.amount,
                inv.c.adjustment,
                inv.c.amount + inv.c.adjustment,
                inv.c.paid,
                case(
                    (
                        inv.c.status == "issued",
                        func.greatest(0, inv.c.amount + inv.c.adjustment - inv.c.paid),
                    ),
                    else_=0,
                ),
                case(
                    (
                        (inv.c.status == "issued") & (inv.c.due_date < local_today()),
                        func.greatest(0, inv.c.amount + inv.c.adjustment - inv.c.paid),
                    ),
                    else_=0,
                ),
                inv.c.void_reason,
                inv.c.id,
            )
            .join(Student, Student.id == inv.c.student_id)
            .outerjoin(Membership, Membership.id == inv.c.membership_id)
            .outerjoin(Group, Group.id == Membership.group_id)
            .order_by(inv.c.period_start, inv.c.id),
        ),
        "payments": (
            "To‘lovlar",
            [
                text("Ism va familiya", width=32),
                text("Telefon", width=21),
                dt("Qabul qilingan vaqt"),
                Column("To‘lov usuli", "state"),
                m("Kiritilgan summa"),
                m("Hisobga olingan tushum", True),
                m("Qaytarilgan", True),
                m("Hisoblarga taqsimlangan", True),
                m("Erkin mablag‘", True),
                text("Izoh", width=42),
                text("Bekor qilish sababi", width=42),
                text("To‘lov raqami", width=38),
            ],
            select(
                Student.full_name,
                Student.phone,
                payments.c.received_at,
                payments.c.method,
                payments.c.amount,
                payments.c.received,
                payments.c.refunded,
                payments.c.allocated,
                payments.c.credit,
                payments.c.reference,
                payments.c.void_reason,
                payments.c.id,
            )
            .join(Student, Student.id == payments.c.student_id)
            .order_by(payments.c.received_at, payments.c.id),
        ),
        "refunds": (
            "Qaytarishlar",
            [
                text("Ism va familiya", width=32),
                text("Telefon", width=21),
                dt("Qaytarilgan vaqt"),
                m("Qaytarilgan summa", True),
                text("Sabab", width=48),
                text("To‘lov raqami", width=38),
            ],
            select(
                Student.full_name,
                Student.phone,
                Refund.created_at,
                Refund.amount,
                Refund.reason,
                Refund.payment_id,
            )
            .join(Payment, Payment.id == Refund.payment_id)
            .join(Student, Student.id == Payment.student_id)
            .order_by(Refund.created_at, Refund.id),
        ),
        "allocations": (
            "Taqsimotlar",
            [
                text("Ism va familiya", width=32),
                dt("To‘lov vaqti"),
                d("Hisob davri"),
                m("Taqsimlangan summa", True),
                text("To‘lov raqami", width=38),
                text("Hisob raqami", width=38),
            ],
            select(
                Student.full_name,
                Payment.received_at,
                Invoice.period_start,
                Allocation.amount,
                Allocation.payment_id,
                Allocation.invoice_id,
            )
            .join(Payment, Payment.id == Allocation.payment_id)
            .join(Invoice, Invoice.id == Allocation.invoice_id)
            .join(Student, Student.id == Payment.student_id)
            .order_by(Payment.received_at, Allocation.id),
        ),
        "leads": (
            "Murojaatlar",
            [
                text("Ism va familiya", width=32),
                text("Telefon", width=21),
                text("Kurs", width=30),
                Column("Murojaat holati", "state"),
                dt("Kelgan vaqt"),
                dt("Qayta bog‘lanish"),
                text("Izoh", width=54),
                text("Yopish sababi", width=42),
            ],
            select(
                Lead.full_name,
                Lead.phone,
                Course.name,
                Lead.status,
                Lead.created_at,
                Lead.follow_up_at,
                Lead.comment,
                Lead.closed_reason,
            )
            .outerjoin(Course, Course.id == Lead.course_id)
            .order_by(Lead.created_at, Lead.id),
        ),
        "attendance": (
            "Davomat",
            [
                text("Ism va familiya", width=32),
                text("Guruh", width=30),
                dt("Dars vaqti"),
                Column("Davomat", "state"),
            ],
            select(Student.full_name, Group.name, Lesson.starts_at, Attendance.status)
            .join(Student, Student.id == Attendance.student_id)
            .join(Lesson, Lesson.id == Attendance.lesson_id)
            .join(Group, Group.id == Lesson.group_id)
            .order_by(Lesson.starts_at, Attendance.id),
        ),
        "results": (
            "Baholar",
            [
                text("Ism va familiya", width=32),
                text("Guruh", width=30),
                text("Baholash nomi", width=34),
                Column("Ball", "score", 19),
                Column("Eng yuqori ball", "score", 19),
                dt("Sana"),
                text("Ustoz izohi", width=54),
            ],
            select(
                Student.full_name,
                Group.name,
                AssessmentResult.title,
                AssessmentResult.score,
                AssessmentResult.max_score,
                AssessmentResult.created_at,
                AssessmentResult.feedback,
            )
            .join(Student, Student.id == AssessmentResult.student_id)
            .join(Group, Group.id == AssessmentResult.group_id)
            .order_by(AssessmentResult.created_at, AssessmentResult.id),
        ),
    }
    for key in RESOURCES[resource]:
        if key == "monthly":
            yield (
                "Oylik moliya",
                [d("Sana"), m("Tushum", True), m("Qaytarilgan", True), m("Sof tushum", True)],
                (
                    (
                        date.fromisoformat(row["date"]),
                        Decimal(row["received"]),
                        Decimal(row["refunded"]),
                        Decimal(row["net"]),
                    )
                    for row in analytics["daily_finance"]
                ),
            )
        else:
            title, columns, stmt = specs[key]
            yield title, columns, db.execute(stmt.execution_options(yield_per=1000))


def excel_money_is_exact(value):
    value = Decimal(value)
    return (
        len(value.normalize().as_tuple().digits) <= 15
        and Decimal(str(float(value))).quantize(Decimal("0.01")) == value
    )


class ReportBook:
    def __init__(self, workbook, month):
        self.book, self.month = workbook, month
        self.created_at = utcnow().astimezone(TZ)
        self.styles = {}

    def style(self, kind="text", band=False):
        key = kind, band
        if key not in self.styles:
            props = {
                "font_name": "Arial",
                "font_size": 10,
                "font_color": "#351141",
                "valign": "vcenter",
            }
            if band:
                props["bg_color"] = "#F5F1FA"
            if kind == "money":
                props.update(num_format='#,##0.00;[Red](#,##0.00);"—"', align="right")
            elif kind == "number":
                props.update(num_format="#,##0", align="right")
            elif kind == "score":
                props.update(num_format="#,##0.00", align="right")
            elif kind in ("date", "datetime"):
                props.update(num_format="yyyy-mm-dd" + (" hh:mm" if kind == "datetime" else ""))
            elif kind == "header":
                props.update(
                    bg_color="#5B2178",
                    font_color="#FFFFFF",
                    bold=True,
                    text_wrap=True,
                    align="center",
                    bottom=1,
                    bottom_color="#FFFFFF",
                )
            elif kind == "title":
                props.update(font_size=15, bold=True)
            elif kind == "note":
                props.update(font_color="#675B70", italic=True)
            elif kind == "exact":
                props.update(num_format="@", align="right", font_color="#7C3510")
            if kind in ("text", "state"):
                props["num_format"] = "@"
                props["text_wrap"] = True
            self.styles[key] = self.book.add_format(props)
        return self.styles[key]

    def write(self, sheet, row, col, value, kind="text", band=False):
        fmt = self.style(kind, band)
        if value is None or value == "":
            return sheet.write_blank(row, col, None, fmt)
        if isinstance(value, datetime):
            value = value.astimezone(TZ).replace(tzinfo=None) if value.tzinfo else value
            return sheet.write_datetime(row, col, value, fmt)
        if isinstance(value, date):
            return sheet.write_datetime(row, col, value, fmt)
        if kind in ("money", "number", "score"):
            if isinstance(value, Decimal) and not excel_money_is_exact(value):
                sheet.write_string(row, col, format(value, ".2f"), self.style("exact", band))
                return True
            sheet.write_number(row, col, value, fmt)
            return False
        text = str(value)
        if len(text) > 32767:
            fail(
                422,
                "excel_cell_limit",
                "Excel katagiga sig‘maydigan uzun matn bor. Matnni qisqartirib qayta yuklang.",
            )
        # Explicit strings preserve phones/IDs and prevent formula/hyperlink injection.
        sheet.write_string(row, col, text, fmt)
        return False

    def new_sheet(self, title, columns, part):
        name = title if part == 1 else f"{title[:27]} {part}"
        sheet = self.book.add_worksheet(name)
        sheet.hide_gridlines(2)
        sheet.set_default_row(22)
        sheet.set_tab_color("#8E35B4")
        sheet.set_landscape()
        sheet.fit_to_pages(1, 0)
        sheet.repeat_rows(5)
        sheet.set_header("&LSherzod English&R" + title)
        sheet.set_footer("&L" + self.created_at.strftime("%Y-%m-%d %H:%M") + " (Toshkent)&R&P / &N")
        sheet.set_column(0, 0, 7)
        for col, spec in enumerate(columns, 1):
            sheet.set_column(col, col, spec.width)
        self.write(sheet, 1, 0, "Sherzod English", "title")
        self.write(sheet, 2, 0, title + (f" ({part})" if part > 1 else ""), "title")
        self.write(
            sheet,
            3,
            0,
            "Yuklab olingan vaqt: " + self.created_at.strftime("%Y-%m-%d %H:%M") + " (Toshkent)",
            "note",
        )
        sheet.set_row(5, 34)
        sheet.write_row(5, 0, ["№", *(c.title for c in columns)], self.style("header"))
        sheet.freeze_panes(6, min(2, len(columns)))
        return sheet

    def detail(self, title, columns, rows):
        part, count, row, exact = 1, 0, 6, False
        sheet = self.new_sheet(title, columns, part)
        totals = [ZERO for _ in columns]

        def finish():
            nonlocal exact
            sheet.autofilter(5, 0, max(5, row - 1), len(columns))
            if row == 6:
                self.write(sheet, row, 1, "Ma’lumot yo‘q", "note")
            if any(spec.total for spec in columns):
                self.write(sheet, row + 1, 1, "Jami (barcha yozuvlar)", "header")
            for col, spec in enumerate(columns, 1):
                if spec.total:
                    exact = bool(self.write(sheet, row + 1, col, totals[col - 1], "money")) or exact
            self.write(sheet, row + 3, 1, f"Yozuvlar soni (ushbu varaq): {row - 6}", "note")
            if exact:
                self.write(
                    sheet,
                    row + 4,
                    1,
                    "Katta summalar aniqligini saqlash uchun matn sifatida berildi; ular Excel yig‘indisiga avtomatik kirmaydi.",
                    "note",
                )
            sheet.print_area(1, 0, row + (4 if exact else 3), len(columns))

        for values in rows:
            if row - 6 == ROWS_PER_SHEET:
                finish()
                part += 1
                row, exact = 6, False
                totals = [ZERO for _ in columns]
                sheet = self.new_sheet(title, columns, part)
            count += 1

            lines = max(
                (
                    sum(
                        max(1, math.ceil(len(line) / max(1, spec.width - 2)))
                        for line in str(value or "").splitlines()
                    )
                    for spec, value in zip(columns, values)
                ),
                default=1,
            )
            sheet.set_row(row, min(120, max(22, lines * 15)))
            self.write(sheet, row, 0, count, "number", count % 2 == 0)
            for col, (spec, value) in enumerate(zip(columns, values, strict=True), 1):
                if spec.total:
                    totals[col - 1] += Decimal(value or 0)
                if spec.kind == "state" and value is not None:
                    value = STATES.get(value, value)
                exact = bool(self.write(sheet, row, col, value, spec.kind, count % 2 == 0)) or exact
            row += 1
        finish()

    def summary(self, metrics, analytics, balances):
        sheet = self.book.add_worksheet("Umumiy")
        sheet.hide_gridlines(2)
        sheet.set_tab_color("#351141")
        sheet.set_column("A:A", 3)
        sheet.set_column("B:B", 39)
        sheet.set_column("C:C", 29)
        sheet.set_column("D:D", 3)
        sheet.set_column("E:F", 25)
        sheet.set_column("G:G", 23)
        sheet.set_column("H:L", 12)
        sheet.set_default_row(24)
        self.write(sheet, 1, 1, "Sherzod English", "title")
        self.write(sheet, 2, 1, "Ta’lim va moliya hisoboti", "title")
        self.write(sheet, 4, 1, "Hisobot oyi")
        self.write(sheet, 4, 2, self.month, "date")
        self.write(sheet, 5, 1, "Yuklab olingan vaqt (Toshkent)")
        self.write(sheet, 5, 2, self.created_at, "datetime")
        sheet.write_row(7, 1, ["Ko‘rsatkich", "Qiymat"], self.style("header"))
        data = [
            ("O‘quvchilar soni", metrics["student_count"], "number"),
            ("Guruhlar soni", metrics["group_count"], "number"),
            ("Tasdiq kutilayotgan arizalar", metrics["pending_students"], "number"),
            ("Tanlangan oy tushumi (so‘m)", Decimal(metrics["received"]), "money"),
            ("Tanlangan oy qaytarishlari (so‘m)", Decimal(metrics["refunded"]), "money"),
            ("Tanlangan oy sof tushumi (so‘m)", Decimal(metrics["net_receipts"]), "money"),
            ("Jami qarz hozir (so‘m)", balances[0], "money"),
            ("Muddati o‘tgan qarz hozir (so‘m)", balances[1], "money"),
            ("Erkin mablag‘ hozir (so‘m)", balances[2], "money"),
        ]
        exact = False
        for row, (label, value, kind) in enumerate(data, 8):
            self.write(sheet, row, 1, label, band=row % 2 == 0)
            exact = bool(self.write(sheet, row, 2, value, kind, row % 2 == 0)) or exact
        self.write(
            sheet,
            18,
            1,
            "O‘quvchilar va guruhlar — hozirgi ro‘yxat. Moliyaviy tarixda o‘chirilgan o‘quvchilar ham saqlanadi.",
            "note",
        )
        self.write(
            sheet,
            19,
            1,
            "Sof tushum = tushum − qaytarishlar. Qarz va erkin mablag‘ — yuklab olingan paytdagi qoldiq.",
            "note",
        )
        self.write(
            sheet,
            20,
            1,
            "Oylik moliya tanlangan oy uchun; boshqa batafsil varaqlar barcha davrlarni qamrab oladi.",
            "note",
        )
        for col, title in zip(
            (1, 2, 4, 5, 6),
            (
                "Oy",
                "Tushum (so‘m)",
                "Qaytarilgan (so‘m)",
                "Sof tushum (so‘m)",
                "Ro‘yxatdan o‘tishlar",
            ),
        ):
            self.write(sheet, 23, col, title, "header")
        sheet.set_row(23, 36)
        for row, item in enumerate(analytics["monthly"], 24):
            for col, value in zip(
                (1, 2, 4, 5, 6),
                [
                    date.fromisoformat(item["date"]),
                    Decimal(item["received"]),
                    Decimal(item["refunded"]),
                    Decimal(item["net"]),
                    item["registrations"],
                ],
            ):
                if col != 1 and not item["observed"]:
                    value = None
                self.write(
                    sheet,
                    row,
                    col,
                    value,
                    "date" if col == 1 else "number" if col == 6 else "money",
                    row % 2 == 0,
                )
        if exact:
            self.write(
                sheet,
                31,
                1,
                "Katta summalar aniqligi uchun matn sifatida saqlanadi; ular Excel yig‘indisiga avtomatik kirmaydi.",
                "note",
            )
        # A native chart uses only the six bounded historical monthly rows.
        chart = self.book.add_chart({"type": "line"})
        for col, label, color in ((2, "Tushum", "#8E35B4"), (4, "Qaytarilgan", "#D5762F")):
            chart.add_series(
                {
                    "name": label,
                    "categories": ["Umumiy", 24, 1, 29, 1],
                    "values": ["Umumiy", 24, col, 29, col],
                    "line": {"color": color, "width": 2.5},
                    "smooth": False,
                }
            )
        chart.set_title({"name": "6 oylik pul oqimi"})
        chart.set_x_axis({"date_axis": True, "num_format": "mmm yy"})
        chart.set_y_axis({"num_format": "#,##0", "name": "so‘m"})
        chart.set_legend({"position": "bottom"})
        chart.show_blanks_as("gap")
        chart.set_size({"width": 590, "height": 290})
        sheet.insert_chart("E8", chart)
        sheet.set_landscape()
        sheet.fit_to_pages(1, 1)
        sheet.print_area("B2:L32")


def build_workbook(db, resource, month, metrics):
    if resource not in RESOURCES:
        fail(422, "invalid_resource", "Hisobot turi noto‘g‘ri")
    analytics = dashboard_analytics(db, month)
    _, _, balances = financial_rows()
    totals = db.execute(
        select(
            *(func.coalesce(func.sum(balances.c[key]), 0) for key in ("debt", "overdue", "credit"))
        )
    ).one()
    output = BytesIO()
    with TemporaryDirectory(prefix="sherzod-excel-") as temp:
        with xlsxwriter.Workbook(
            output,
            {
                "constant_memory": True,
                "tmpdir": temp,
                "strings_to_formulas": False,
                "strings_to_urls": False,
            },
        ) as workbook:
            workbook.set_properties(
                {"title": "Sherzod English — ta’lim va moliya", "author": "Sherzod English"}
            )
            report = ReportBook(workbook, month.replace(day=1))
            report.summary(metrics, analytics, totals)
            for title, columns, rows in datasets(db, resource, analytics):
                report.detail(title, columns, rows)
    return output.getvalue()
