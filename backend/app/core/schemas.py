import re
from datetime import date, time
from decimal import Decimal
from typing import Annotated, Literal, Any
from uuid import UUID
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    AfterValidator,
    BeforeValidator,
    AwareDatetime,
    HttpUrl,
    model_validator,
    StringConstraints,
)


def normalize_phone(v: str):
    digits = re.sub(r"[\s()+-]", "", v)
    if len(digits) == 9:
        digits = "998" + digits
    if not re.fullmatch(r"998\d{9}", digits):
        raise ValueError("+998XXXXXXXXX raqamini kiriting")
    return "+" + digits


def money_string(value):
    if not isinstance(value, (str, Decimal)):
        raise ValueError("Pul qiymatini decimal string sifatida yuboring")
    return value


Phone = Annotated[str, AfterValidator(normalize_phone)]
# Passwords are exact, non-empty strings; no length cap, composition rule or trimming.
Password = Annotated[str, StringConstraints(min_length=1, strip_whitespace=False)]
Money = Annotated[
    Decimal,
    BeforeValidator(money_string, json_schema_input_type=str),
    Field(ge=0, max_digits=18, decimal_places=2),
]
PositiveMoney = Annotated[
    Decimal,
    BeforeValidator(money_string, json_schema_input_type=str),
    Field(gt=0, max_digits=18, decimal_places=2),
]


class Payload(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Login(Payload):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=False)
    username: str = Field(min_length=1, max_length=100)
    password: Password


class PasswordChange(Payload):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=False)
    current_password: Password
    new_password: Password


class RegisterIn(Payload):
    full_name: str = Field(min_length=2, max_length=200)
    phone: Phone
    password: Password
    course_id: UUID | None = None


class StudentIn(Payload):
    full_name: str = Field(min_length=2, max_length=200)
    phone: Phone
    parent_phone: Phone | None = None
    joined_on: date
    private_note: str = Field(default="", max_length=5000)


class StudentPatch(Payload):
    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    phone: Phone | None = None
    parent_phone: Phone | None = None
    private_note: str | None = Field(default=None, max_length=5000)


class Reason(Payload):
    reason: str = Field(min_length=3, max_length=2000)


class CourseIn(Payload):
    name: str = Field(min_length=2, max_length=200)
    slug: str = Field(min_length=2, max_length=100, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    short_description: str = Field(min_length=5, max_length=1000)
    description: str = Field(default="", max_length=20000)
    audience: str = Field(default="", max_length=5000)
    level: str = Field(default="", max_length=100)
    features: list[str] = Field(default_factory=list, max_length=20)
    duration: str = Field(default="", max_length=100)
    lessons_per_week: int | None = Field(default=None, ge=1, le=7)
    lesson_minutes: int | None = Field(default=None, ge=15, le=480)
    format: Literal["", "online", "offline", "hybrid"] = ""
    schedule: str = Field(default="", max_length=200)
    marketing_price: Money | None = None
    image_id: UUID | None = None
    sort_order: int = 0
    published: bool = False


class RuleIn(Payload):
    weekday: int = Field(ge=0, le=6)
    local_time: time
    duration_minutes: int = Field(ge=15, le=480)


class GroupIn(Payload):
    course_id: UUID
    name: str = Field(min_length=2, max_length=200)
    level: str = Field(default="", max_length=100)
    capacity: int = Field(ge=1, le=100)
    start_date: date
    end_date: date | None = None
    monthly_price: Money
    location: str = Field(default="", max_length=500)
    rules: list[RuleIn] = Field(default_factory=list, max_length=14)

    @model_validator(mode="after")
    def dates(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("Sana oralig‘i noto‘g‘ri")
        return self


class MembershipIn(Payload):
    student_id: UUID
    start_date: date | None = None
    end_date: date | None = None
    capacity_override: bool = False
    note: str = Field(default="", max_length=2000)


class TransferIn(Payload):
    target_group_id: UUID
    on_date: date
    reason: str = Field(min_length=3, max_length=2000)
    capacity_override: bool = False


class EndMembership(Payload):
    end_date: date
    reason: Literal["transfer", "pause", "left", "completed", "other"]
    note: str = Field(default="", max_length=2000)


class GenerateLessons(Payload):
    start_date: date
    end_date: date


class RescheduleIn(Reason):
    starts_at: AwareDatetime
    duration_minutes: int = Field(ge=15, le=480)


class AttendanceItem(Payload):
    student_id: UUID
    status: Literal["present", "late", "absent", "excused"]


class AttendanceIn(Payload):
    items: list[AttendanceItem] = Field(max_length=100)


class InvoiceIn(Payload):
    student_id: UUID
    membership_id: UUID | None = None
    period_start: date | None = None
    period_end: date | None = None
    due_date: date | None = None
    month: date | str | None = Field(default=None, exclude=True)
    amount: Money

    @model_validator(mode="before")
    @classmethod
    def resolve_dates(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data = dict(data)
            month_val = data.get("month")
            p_start = data.get("period_start")
            p_end = data.get("period_end")
            due = data.get("due_date")

            if month_val:
                if isinstance(month_val, str) and len(month_val) == 7 and "-" in month_val:
                    y, m = map(int, month_val.split("-"))
                    d_start = date(y, m, 1)
                elif isinstance(month_val, str) and len(month_val) >= 10:
                    dt = date.fromisoformat(month_val[:10])
                    d_start = date(dt.year, dt.month, 1)
                elif isinstance(month_val, date):
                    d_start = date(month_val.year, month_val.month, 1)
                else:
                    d_start = date.today().replace(day=1)
                y, m = d_start.year, d_start.month
                data.setdefault("period_start", d_start)
                data.setdefault("period_end", date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1))
            elif p_start:
                if isinstance(p_start, str):
                    d_start = date.fromisoformat(p_start)
                else:
                    d_start = p_start
                if not p_end:
                    y, m = d_start.year, d_start.month
                    data["period_end"] = date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1)
            elif due:
                if isinstance(due, str):
                    d_due = date.fromisoformat(due)
                else:
                    d_due = due
                y, m = d_due.year, d_due.month
                data.setdefault("period_start", date(y, m, 1))
                data.setdefault("period_end", date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1))

            if not data.get("due_date"):
                data["due_date"] = data.get("period_start") or date.today()
        return data


class GenerateInvoices(Payload):
    month: date
    group_id: UUID | None = None
    due_day: int | None = Field(default=None, ge=1, le=28)


class AdjustmentIn(Reason):
    amount: Annotated[
        Decimal,
        BeforeValidator(money_string, json_schema_input_type=str),
        Field(max_digits=18, decimal_places=2),
    ]


class AllocationIn(Payload):
    invoice_id: UUID
    amount: PositiveMoney


class PaymentIn(Payload):
    student_id: UUID
    amount: PositiveMoney
    received_at: AwareDatetime
    method: Literal["cash", "bank_transfer", "other"]
    reference: str = Field(default="", max_length=200)
    allocations: list[AllocationIn] = Field(default_factory=list, max_length=100)


class PaymentEdit(Reason):
    amount: PositiveMoney
    received_at: AwareDatetime
    method: Literal["cash", "bank_transfer", "other"]
    reference: str = Field(default="", max_length=200)


class RefundIn(Reason):
    amount: PositiveMoney


class LeadIn(Payload):
    full_name: str = Field(min_length=2, max_length=200)
    phone: Phone
    course_id: UUID | None = None
    comment: str = Field(default="", max_length=2000)
    source: str = Field(default="/", max_length=500, pattern=r"^/[^\r\n]*$")
    privacy_accepted: Literal[True]
    website: str = Field(default="", max_length=0)


class LeadPatch(Payload):
    status: Literal["new", "contacted", "trial_scheduled", "converted", "closed"]
    follow_up_at: AwareDatetime | None = None
    trial_at: AwareDatetime | None = None
    closed_reason: str | None = Field(default=None, max_length=2000)
    note: str = Field(default="", max_length=5000)


class ConvertLead(Payload):
    existing_student_id: UUID | None = None


class AssignmentIn(Payload):
    group_id: UUID
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=1, max_length=20000)
    media_id: UUID | None = None
    link: HttpUrl | None = None
    deadline: AwareDatetime
    published: bool = False
    deadline_lock: bool = False


class SubmissionIn(Payload):
    text: str = Field(default="", max_length=20000)
    media_id: UUID | None = None

    @model_validator(mode="after")
    def content(self):
        if not self.text and not self.media_id:
            raise ValueError("Javob yoki fayl kerak")
        return self


class FeedbackIn(Payload):
    feedback: str = Field(default="", max_length=10000)
    private_note: str = Field(default="", max_length=10000)
    score: Money | None = None
    max_score: PositiveMoney | None = None

    @model_validator(mode="after")
    def scores(self):
        if self.score is not None and (self.max_score is None or self.score > self.max_score):
            raise ValueError("Ball maksimal balldan oshmasin")
        return self


class AssessmentIn(FeedbackIn):
    student_id: UUID
    group_id: UUID
    title: str = Field(min_length=2, max_length=200)
    score: Money
    max_score: PositiveMoney


class MaterialIn(Payload):
    group_id: UUID
    title: str = Field(min_length=2, max_length=200)
    media_id: UUID | None = None
    link: HttpUrl | None = None
    published: bool = False


class ContentIn(Payload):
    kind: Literal[
        "hero",
        "bio",
        "stat",
        "benefit",
        "result",
        "testimonial",
        "gallery",
        "faq",
        "contact",
        "privacy",
        "settings",
    ]
    title: str = Field(min_length=2, max_length=200)
    data: dict
    media_id: UUID | None = None
    consent: bool = False
    approved: bool = False
    sort_order: int = 0


class CertificateIn(ContentIn):
    kind: Literal["result"] = "result"
    student_id: UUID
    published: bool = True


class StudentContact(Payload):
    phone: Phone
    parent_phone: Phone | None = None
