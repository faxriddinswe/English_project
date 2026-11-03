"""Shared relational model. Business rules live in module services, not in generic CRUD."""

from datetime import date, datetime, time
from decimal import Decimal
from uuid import UUID
from sqlalchemy import (
    String,
    Text,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    Numeric,
    DateTime,
    Index,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Entity

money = Numeric(18, 2)


class User(Entity):
    __tablename__ = "users"
    username: Mapped[str] = mapped_column(String(100), unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(20))
    active: Mapped[bool] = mapped_column(default=True)
    must_change_password: Mapped[bool] = mapped_column(default=False)
    registration_pending: Mapped[bool] = mapped_column(default=False, server_default=text("false"))
    __table_args__ = (
        CheckConstraint("role IN ('teacher','student')"),
        Index("one_teacher_only", "role", unique=True, postgresql_where=text("role = 'teacher'")),
    )


class AuthSession(Entity):
    __tablename__ = "sessions"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    revoked: Mapped[bool] = mapped_column(default=False)


class RateLimit(Entity):
    __tablename__ = "rate_limits"
    key: Mapped[str] = mapped_column(String(64), unique=True)
    window: Mapped[int]
    count: Mapped[int] = mapped_column(default=0)


class Student(Entity):
    __tablename__ = "students"
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), unique=True)
    full_name: Mapped[str] = mapped_column(String(200), index=True)
    phone: Mapped[str] = mapped_column(String(13), index=True)
    parent_phone: Mapped[str | None] = mapped_column(String(13))
    joined_on: Mapped[date]
    # Historical columns remain private during the non-destructive transition.
    legacy_status: Mapped[str] = mapped_column("status", String(20), default="active", index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    admission_status: Mapped[str] = mapped_column(
        String(20), default="approved", server_default="approved"
    )
    private_note: Mapped[str] = mapped_column(Text, default="")
    __table_args__ = (
        CheckConstraint("status IN ('active','paused','left','archived')"),
        CheckConstraint(
            "admission_status IN ('pending','approved','rejected')", name="student_admission_status"
        ),
    )


class Course(Entity):
    __tablename__ = "courses"
    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    short_description: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text, default="")
    audience: Mapped[str] = mapped_column(Text, default="")
    level: Mapped[str] = mapped_column(String(100), default="")
    features: Mapped[list] = mapped_column(JSONB, default=list)
    duration: Mapped[str] = mapped_column(String(100), default="")
    lessons_per_week: Mapped[int | None]
    lesson_minutes: Mapped[int | None]
    format: Mapped[str] = mapped_column(String(30), default="")
    schedule: Mapped[str] = mapped_column(String(200), default="")
    marketing_price: Mapped[Decimal | None] = mapped_column(money)
    image_id: Mapped[UUID | None] = mapped_column(ForeignKey("media_assets.id"))
    sort_order: Mapped[int] = mapped_column(default=0)
    legacy_active: Mapped[bool] = mapped_column("active", default=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    published: Mapped[bool] = mapped_column(default=False)
    __table_args__ = (CheckConstraint("marketing_price IS NULL OR marketing_price >= 0"),)


class Group(Entity):
    __tablename__ = "groups"
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id"))
    name: Mapped[str] = mapped_column(String(200))
    level: Mapped[str] = mapped_column(String(100), default="")
    capacity: Mapped[int]
    start_date: Mapped[date]
    end_date: Mapped[date | None]
    legacy_status: Mapped[str] = mapped_column("status", String(20), default="active", index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    monthly_price: Mapped[Decimal] = mapped_column(money)
    location: Mapped[str] = mapped_column(String(500), default="")
    billing_policy: Mapped[str] = mapped_column(String(30), default="calendar_month")
    __table_args__ = (
        CheckConstraint("capacity > 0 AND monthly_price >= 0"),
        CheckConstraint("end_date IS NULL OR end_date >= start_date"),
        CheckConstraint("status IN ('active','paused','ended','archived')"),
    )


class Membership(Entity):
    __tablename__ = "memberships"
    student_id: Mapped[UUID] = mapped_column(ForeignKey("students.id"), index=True)
    group_id: Mapped[UUID] = mapped_column(ForeignKey("groups.id"), index=True)
    start_date: Mapped[date]
    end_date: Mapped[date | None]
    exit_reason: Mapped[str | None] = mapped_column(String(40))
    note: Mapped[str] = mapped_column(Text, default="")
    __table_args__ = (
        UniqueConstraint("student_id", "group_id", "start_date"),
        CheckConstraint("end_date IS NULL OR end_date > start_date"),
        Index("ix_membership_interval", "group_id", "start_date", "end_date"),
    )


class ScheduleRule(Entity):
    __tablename__ = "schedule_rules"
    group_id: Mapped[UUID] = mapped_column(ForeignKey("groups.id"), index=True)
    weekday: Mapped[int]
    local_time: Mapped[time]
    duration_minutes: Mapped[int]
    timezone: Mapped[str] = mapped_column(String(40), default="Asia/Tashkent")
    __table_args__ = (
        UniqueConstraint("group_id", "weekday", "local_time"),
        CheckConstraint("weekday BETWEEN 0 AND 6 AND duration_minutes BETWEEN 15 AND 480"),
    )


class Lesson(Entity):
    __tablename__ = "lessons"
    group_id: Mapped[UUID] = mapped_column(ForeignKey("groups.id"))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    original_starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="scheduled")
    change_reason: Mapped[str] = mapped_column(Text, default="")
    __table_args__ = (
        UniqueConstraint("group_id", "original_starts_at"),
        CheckConstraint("ends_at > starts_at"),
        CheckConstraint("status IN ('scheduled','completed','cancelled')"),
        Index("ix_lesson_group_start", "group_id", "starts_at"),
    )


class Attendance(Entity):
    __tablename__ = "attendance"
    lesson_id: Mapped[UUID] = mapped_column(ForeignKey("lessons.id"))
    student_id: Mapped[UUID] = mapped_column(ForeignKey("students.id"), index=True)
    status: Mapped[str] = mapped_column(String(20))
    actor_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    __table_args__ = (
        UniqueConstraint("lesson_id", "student_id"),
        CheckConstraint("status IN ('present','late','absent','excused')"),
    )


class Invoice(Entity):
    __tablename__ = "invoices"
    student_id: Mapped[UUID] = mapped_column(ForeignKey("students.id"), index=True)
    membership_id: Mapped[UUID | None] = mapped_column(ForeignKey("memberships.id"))
    period_start: Mapped[date]
    period_end: Mapped[date]
    due_date: Mapped[date]
    amount: Mapped[Decimal] = mapped_column(money)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    void_reason: Mapped[str | None] = mapped_column(Text)
    __table_args__ = (
        UniqueConstraint("membership_id", "period_start", "period_end"),
        CheckConstraint("amount >= 0 AND period_end > period_start"),
        CheckConstraint("status IN ('draft','issued','void')"),
        Index("ix_invoice_student_period", "student_id", "period_start"),
    )


class InvoiceLine(Entity):
    __tablename__ = "invoice_lines"
    invoice_id: Mapped[UUID] = mapped_column(ForeignKey("invoices.id"), index=True)
    description: Mapped[str] = mapped_column(Text)
    amount: Mapped[Decimal] = mapped_column(money)
    __table_args__ = (CheckConstraint("amount >= 0"),)


class Adjustment(Entity):
    __tablename__ = "adjustments"
    invoice_id: Mapped[UUID] = mapped_column(ForeignKey("invoices.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(money)
    reason: Mapped[str] = mapped_column(Text)
    actor_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))


class Payment(Entity):
    __tablename__ = "payments"
    student_id: Mapped[UUID] = mapped_column(ForeignKey("students.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(money)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    method: Mapped[str] = mapped_column(String(30))
    reference: Mapped[str] = mapped_column(String(200), default="")
    actor_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    idempotency_key: Mapped[str] = mapped_column(String(100))
    payload_hash: Mapped[str] = mapped_column(String(64))
    idempotency_response: Mapped[dict | None] = mapped_column(JSONB)
    void_reason: Mapped[str | None] = mapped_column(Text)
    __table_args__ = (
        UniqueConstraint("actor_id", "idempotency_key"),
        CheckConstraint("amount > 0"),
        CheckConstraint("method IN ('cash','bank_transfer','other')"),
    )


class Allocation(Entity):
    __tablename__ = "payment_allocations"
    payment_id: Mapped[UUID] = mapped_column(ForeignKey("payments.id"), index=True)
    invoice_id: Mapped[UUID] = mapped_column(ForeignKey("invoices.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(money)
    __table_args__ = (UniqueConstraint("payment_id", "invoice_id"), CheckConstraint("amount >= 0"))


class Refund(Entity):
    __tablename__ = "refunds"
    payment_id: Mapped[UUID] = mapped_column(ForeignKey("payments.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(money)
    reason: Mapped[str] = mapped_column(Text)
    actor_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    __table_args__ = (CheckConstraint("amount > 0"),)


class Assignment(Entity):
    __tablename__ = "assignments"
    group_id: Mapped[UUID] = mapped_column(ForeignKey("groups.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    media_id: Mapped[UUID | None] = mapped_column(ForeignKey("media_assets.id"))
    link: Mapped[str | None] = mapped_column(String(1000))
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    published: Mapped[bool] = mapped_column(default=False)
    deadline_lock: Mapped[bool] = mapped_column(default=False)


class Submission(Entity):
    __tablename__ = "submissions"
    assignment_id: Mapped[UUID] = mapped_column(ForeignKey("assignments.id"))
    student_id: Mapped[UUID] = mapped_column(ForeignKey("students.id"), index=True)
    __table_args__ = (UniqueConstraint("assignment_id", "student_id"),)


class SubmissionRevision(Entity):
    __tablename__ = "submission_revisions"
    submission_id: Mapped[UUID] = mapped_column(ForeignKey("submissions.id"), index=True)
    revision: Mapped[int]
    text: Mapped[str] = mapped_column(Text)
    media_id: Mapped[UUID | None] = mapped_column(ForeignKey("media_assets.id"))
    late: Mapped[bool]
    feedback: Mapped[str] = mapped_column(Text, default="")
    private_note: Mapped[str] = mapped_column(Text, default="")
    score: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    max_score: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    __table_args__ = (
        UniqueConstraint("submission_id", "revision"),
        CheckConstraint("score IS NULL OR (max_score > 0 AND score >= 0 AND score <= max_score)"),
    )


class AssessmentResult(Entity):
    __tablename__ = "assessment_results"
    student_id: Mapped[UUID] = mapped_column(ForeignKey("students.id"), index=True)
    group_id: Mapped[UUID] = mapped_column(ForeignKey("groups.id"))
    title: Mapped[str] = mapped_column(String(200))
    score: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    max_score: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    feedback: Mapped[str] = mapped_column(Text, default="")
    private_note: Mapped[str] = mapped_column(Text, default="")
    __table_args__ = (CheckConstraint("max_score > 0 AND score >= 0 AND score <= max_score"),)


class Material(Entity):
    __tablename__ = "materials"
    group_id: Mapped[UUID] = mapped_column(ForeignKey("groups.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    media_id: Mapped[UUID | None] = mapped_column(ForeignKey("media_assets.id"))
    link: Mapped[str | None] = mapped_column(String(1000))
    published: Mapped[bool] = mapped_column(default=False)


class Lead(Entity):
    __tablename__ = "leads"
    full_name: Mapped[str] = mapped_column(String(200))
    phone: Mapped[str] = mapped_column(String(13), index=True)
    course_id: Mapped[UUID | None] = mapped_column(ForeignKey("courses.id"))
    comment: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(30), default="new", index=True)
    follow_up_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    trial_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_reason: Mapped[str | None] = mapped_column(Text)
    student_id: Mapped[UUID | None] = mapped_column(ForeignKey("students.id"))
    __table_args__ = (
        CheckConstraint("status IN ('new','contacted','trial_scheduled','converted','closed')"),
    )


class LeadHistory(Entity):
    __tablename__ = "lead_history"
    lead_id: Mapped[UUID] = mapped_column(ForeignKey("leads.id"), index=True)
    actor_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    note: Mapped[str] = mapped_column(Text)


class Content(Entity):
    __tablename__ = "content"
    student_id: Mapped[UUID | None] = mapped_column(ForeignKey("students.id"), index=True)
    archived: Mapped[bool] = mapped_column(default=False, server_default=text("false"))
    kind: Mapped[str] = mapped_column(String(40), index=True)
    title: Mapped[str] = mapped_column(String(200))
    data: Mapped[dict] = mapped_column(JSONB, default=dict)
    published_data: Mapped[dict | None] = mapped_column(JSONB)
    published_title: Mapped[str | None] = mapped_column(String(200))
    media_id: Mapped[UUID | None] = mapped_column(ForeignKey("media_assets.id"))
    published_media_id: Mapped[UUID | None] = mapped_column(ForeignKey("media_assets.id"))
    published: Mapped[bool] = mapped_column(default=False)
    consent: Mapped[bool] = mapped_column(default=False)
    approved: Mapped[bool] = mapped_column(default=False)
    sort_order: Mapped[int] = mapped_column(default=0)
    # PublicResult/Testimonial/Gallery/FAQ/SiteSettings share a versioned content envelope.
    __table_args__ = (
        CheckConstraint(
            "kind IN ('hero','bio','stat','benefit','result','testimonial','gallery','faq','contact','privacy','settings')"
        ),
    )


class MediaAsset(Entity):
    __tablename__ = "media_assets"
    owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    visibility: Mapped[str] = mapped_column(String(20))
    object_key: Mapped[str] = mapped_column(String(200), unique=True)
    mime: Mapped[str] = mapped_column(String(100))
    size: Mapped[int]
    alt: Mapped[str] = mapped_column(String(500), default="")
    public_prepared: Mapped[bool] = mapped_column(default=False)
    __table_args__ = (CheckConstraint("visibility IN ('public','private') AND size > 0"),)


class NotificationOutbox(Entity):
    __tablename__ = "notification_outbox"
    lead_id: Mapped[UUID] = mapped_column(ForeignKey("leads.id"), unique=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    attempts: Mapped[int] = mapped_column(default=0)
    next_attempt_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    lease_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    lease_token: Mapped[str | None] = mapped_column(String(64))
    last_safe_error: Mapped[str | None] = mapped_column(String(100))
    __table_args__ = (Index("ix_outbox_due", "status", "next_attempt_at"),)


class AuditLog(Entity):
    __tablename__ = "audit_logs"
    actor_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(100))
    object_id: Mapped[UUID]
    details: Mapped[dict] = mapped_column(JSONB, default=dict)
