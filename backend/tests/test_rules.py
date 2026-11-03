from datetime import date, datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4
from io import BytesIO
import pytest
from pydantic import ValidationError
from fastapi import HTTPException
from PIL import Image
from app.core.schemas import (
    normalize_phone,
    StudentContact,
    PaymentIn,
    FeedbackIn,
    LeadIn,
    PasswordChange,
)
from app.core.config import Settings
from app.modules.content.service import ResultData, publish
from app.modules.billing.service import invoice_view, month_bounds, utc_month_bounds
from app.modules.groups.service import overlaps
from app.modules.media.service import prepare
from app.workers.telegram import retry_decision


@pytest.mark.parametrize("raw", ["90 123 45 67", "+998 (90) 123-45-67", "998901234567"])
def test_phone_normalization(raw):
    assert normalize_phone(raw) == "+998901234567"


@pytest.mark.parametrize("raw", ["+79990123456", "99890123", "hello", "+9989012345678"])
def test_invalid_phones(raw):
    with pytest.raises(ValueError):
        normalize_phone(raw)


def test_student_profile_forbids_privilege_and_private_fields():
    for extra in [
        {"role": "teacher"},
        {"full_name": "Changed"},
        {"private_note": "private"},
        {"monthly_price": "0"},
    ]:
        with pytest.raises(ValidationError):
            StudentContact(phone="+998901234567", **extra)


def test_payment_money_must_be_decimal_string_and_aware():
    values = {
        "student_id": uuid4(),
        "amount": "300000.00",
        "received_at": "2026-11-01T10:00:00+05:00",
        "method": "cash",
    }
    assert PaymentIn(**values).amount == Decimal("300000")
    for amount in [0, -1, 0.1, "-1", "1.001", "NaN", "Infinity"]:
        with pytest.raises(ValidationError):
            PaymentIn(**{**values, "amount": amount})
    with pytest.raises(ValidationError):
        PaymentIn(**{**values, "received_at": "2026-11-01T10:00:00"})


def test_official_result_types_do_not_mix():
    ielts = {
        "type": "ielts",
        "student_name": "NAMUNA",
        "exam_date": "2026-01-01",
        "listening": "8",
        "reading": "7.5",
        "writing": "7",
        "speaking": "7.5",
        "overall": "7.5",
    }
    assert ResultData(**ielts).overall == Decimal("7.5")
    for change in [{"overall": "9.5"}, {"reading": "7.2"}, {"writing": None}, {"level": "C1"}]:
        with pytest.raises(ValidationError):
            ResultData(**{**ielts, **change})
    assert (
        ResultData(type="cefr", student_name="NAMUNA", exam_date="2026-01-01", level="B2").level
        == "B2"
    )
    with pytest.raises(ValidationError):
        ResultData(
            type="cefr", student_name="NAMUNA", exam_date="2026-01-01", level="B2", overall="7"
        )


def test_publish_requires_consent_and_preserves_previous_version():
    obj = SimpleNamespace(
        kind="result",
        data={"type": "cefr", "student_name": "NAMUNA", "exam_date": "2026-01-01", "level": "B2"},
        approved=True,
        consent=False,
        published_data={"old": "published"},
        media_id=None,
    )
    with pytest.raises(HTTPException) as ex:
        publish(None, obj)
    assert ex.value.status_code == 422
    assert obj.published_data == {"old": "published"}


def test_finance_example_and_due_date_distinction():
    inv = SimpleNamespace(
        id=uuid4(),
        student_id=uuid4(),
        membership_id=None,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 2, 1),
        due_date=date(2099, 1, 10),
        amount=Decimal("600000"),
        status="issued",
        void_reason=None,
    )
    result = invoice_view((inv, Decimal("-100000"), Decimal("300000")))
    assert (
        result["debt"] == "200000.00"
        and result["payable"] == "500000.00"
        and result["overdue"] is False
    )
    inv.due_date = date(2000, 1, 1)
    assert invoice_view((inv, Decimal("-100000"), Decimal("300000")))["overdue"] is True
    inv.status = "void"
    assert invoice_view((inv, Decimal("-100000"), Decimal(0)))["debt"] == "0.00"


def test_calendar_and_tashkent_month_boundaries():
    assert month_bounds(date(2024, 2, 29)) == (date(2024, 2, 1), date(2024, 3, 1))
    assert month_bounds(date(2026, 12, 31)) == (date(2026, 12, 1), date(2027, 1, 1))
    start, end = utc_month_bounds(date(2026, 11, 1))
    assert start == datetime(2026, 10, 31, 19, tzinfo=timezone.utc)
    assert end == datetime(2026, 11, 30, 19, tzinfo=timezone.utc)


def test_membership_half_open_intervals():
    assert not overlaps(date(2026, 1, 1), date(2026, 2, 1), date(2026, 2, 1), None)
    assert overlaps(date(2026, 1, 1), None, date(2027, 1, 1), None)


def test_feedback_limits():
    for fields in [{"score": "11", "max_score": "10"}, {"score": "1"}, {"max_score": "0"}]:
        with pytest.raises(ValidationError):
            FeedbackIn(**fields)


def test_lead_consent_required_and_unknown_fields_rejected():
    lead = {"full_name": "NAMUNA", "phone": "901234567", "privacy_accepted": True}
    assert LeadIn(**lead).phone == "+998901234567"
    with pytest.raises(ValidationError):
        LeadIn(**{**lead, "privacy_accepted": False})
    with pytest.raises(ValidationError):
        LeadIn(**{**lead, "teacher": True})


def test_upload_signature_size_and_metadata_minimization():
    with pytest.raises(HTTPException):
        prepare(b'<svg onload="alert(1)">', "image/png")
    im = Image.new("RGB", (16, 16))
    out = BytesIO()
    im.save(out, format="PNG")
    data, mime, ext = prepare(out.getvalue(), "image/png")
    assert mime == "image/webp" and ext == "webp"
    assert Image.open(BytesIO(data)).getexif() == {}
    with pytest.raises(HTTPException):
        prepare(out.getvalue(), "image/jpeg")
    with pytest.raises(HTTPException):
        prepare(b"x" * (10 * 1024 * 1024 + 1), "application/pdf")


def test_portrait_transparency_is_preserved():
    im = Image.new("RGBA", (8, 8), (100, 100, 100, 0))
    out = BytesIO()
    im.save(out, format="PNG")
    data, _, _ = prepare(out.getvalue(), "image/png")
    assert Image.open(BytesIO(data)).convert("RGBA").getpixel((0, 0))[3] == 0


def test_delivery_retry_policy():
    assert retry_decision(429, 1, 120) == ("retry", 120, "telegram_rate_limit")
    assert retry_decision(401, 1)[0] == "failed"
    assert retry_decision(403, 1)[0] == "failed"
    assert retry_decision(500, 2)[0] == "retry"
    assert retry_decision(None, 1)[0] == "retry"
    assert retry_decision(None, 8)[0] == "failed"


def test_production_cannot_use_placeholders_or_sqlite():
    with pytest.raises(ValidationError):
        Settings(database_url="sqlite:///test.db")
    with pytest.raises(ValidationError):
        Settings(
            app_env="production",
            public_app_url="https://example.invalid",
            session_secret="local-development-only-change-this-secret",
            csrf_secret="local-csrf-only-change-this-secret-12345",
        )
    assert (
        PasswordChange(
            current_password="  original password  ", new_password="  new password  "
        ).current_password
        == "  original password  "
    )
