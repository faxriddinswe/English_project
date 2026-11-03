from datetime import date
from decimal import Decimal
from typing import Literal
from uuid import UUID
from pydantic import Field, HttpUrl, field_validator, ValidationError
from sqlalchemy import select, and_, or_, func
from app.core.config import get_settings
from app.core.schemas import Payload, Phone
from app.core.errors import fail
from app.core.helpers import get, project
from app.db.models import Content, MediaAsset


class HeroData(Payload):
    subheading: str = Field(min_length=5, max_length=1000)


class TextData(Payload):
    body: str = Field(min_length=2, max_length=20000)


class BioData(TextData):
    experience: str = Field(default="", max_length=40)
    students_taught: str = Field(default="", max_length=40)
    video_url: HttpUrl | None = None
    certificate_ids: list[UUID] = Field(default_factory=list, max_length=12)


class BenefitData(TextData):
    tags: list[str] = Field(default_factory=list, max_length=8)


class StatData(Payload):
    value: str = Field(min_length=1, max_length=30)
    label: str = Field(min_length=2, max_length=200)


class ResultData(Payload):
    is_sample: bool = False
    sample_key: str | None = Field(default=None, max_length=100)
    type: Literal["ielts", "cefr"]
    student_name: str = Field(min_length=2, max_length=200)
    exam_date: date
    listening: Decimal | None = None
    reading: Decimal | None = None
    writing: Decimal | None = None
    speaking: Decimal | None = None
    overall: Decimal | None = None
    level: Literal["A1", "A2", "B1", "B2", "C1", "C2"] | None = None
    cefr_score: str | None = Field(default=None, max_length=100)

    @field_validator("listening", "reading", "writing", "speaking", "overall")
    @classmethod
    def band(cls, v):
        if v is not None and (v < 0 or v > 9 or v % Decimal(".5") != 0):
            raise ValueError("IELTS 0–9 va 0.5 qadam bilan")
        return v

    @__import__("pydantic").model_validator(mode="after")
    def fields(self):
        bands = [self.listening, self.reading, self.writing, self.speaking, self.overall]
        if self.type == "ielts" and (any(v is None for v in bands) or self.level is not None):
            raise ValueError("IELTS uchun rasmiy beshta ball kerak")
        if self.type == "cefr" and (not self.level or any(v is not None for v in bands)):
            raise ValueError("CEFR uchun daraja kerak; IELTS ballari emas")
        return self


class TestimonialData(TextData):
    student_name: str = Field(min_length=2, max_length=200)
    video_url: HttpUrl | None = None


class GalleryData(Payload):
    alt: str = Field(min_length=2, max_length=500)
    video_url: HttpUrl | None = None


class ContactData(Payload):
    phone: Phone | None = None
    address: str = Field(default="", max_length=1000)
    telegram: HttpUrl | None = None
    instagram: HttpUrl | None = None
    youtube: HttpUrl | None = None


class OperationalSettings(Payload):
    absence_threshold: int = Field(default=2, ge=1, le=30)
    billing_due_day: int = Field(default=10, ge=1, le=28)


CONTENT_SCHEMAS = {
    "hero": HeroData,
    "bio": BioData,
    "benefit": BenefitData,
    "stat": StatData,
    "result": ResultData,
    "testimonial": TestimonialData,
    "gallery": GalleryData,
    "faq": TextData,
    "contact": ContactData,
    "privacy": TextData,
    "settings": OperationalSettings,
}
COURSE_FIELDS = "id name slug short_description description audience level features duration lessons_per_week lesson_minutes format schedule marketing_price sort_order"


def public_asset(db, oid):
    if not oid:
        return None
    m = get(db, MediaAsset, oid)
    if m.visibility != "public" or not m.public_prepared:
        fail(422, "private_media", "Public uchun alohida tayyorlangan faylni tanlang")
    return f"/api/v1/media/{m.id}"


def publish(db, obj):
    if getattr(obj, "archived", False):
        fail(409, "archived_content", "O‘chirilgan kontentni nashr qilib bo‘lmaydi")
    try:
        data = CONTENT_SCHEMAS[obj.kind].model_validate(obj.data).model_dump(mode="json")
    except ValidationError:
        fail(422, "invalid_content", "Kontent maydonlarini tekshiring")
    sample = data.get("is_sample", False)
    if sample and get_settings().app_env != "development":
        fail(422, "sample_not_allowed", "Namuna natija faqat development muhitida")
    if (
        not sample
        and obj.kind in ("result", "testimonial", "gallery")
        and (not obj.approved or not obj.consent)
    ):
        fail(422, "consent_required", "Rozilik va ustoz tasdig‘i kerak")
    if obj.kind in ("result", "gallery") and not obj.media_id:
        fail(422, "media_required", "Tayyorlangan public fayl kerak")
    public_asset(db, obj.media_id)
    if obj.kind == "bio":
        for oid in data.get("certificate_ids", []):
            public_asset(db, UUID(oid))
            if not get(db, MediaAsset, UUID(oid)).mime.startswith("image/"):
                fail(422, "image_required", "Sertifikat preview uchun rasm kerak")
    if obj.media_id and obj.kind in ("result", "gallery", "hero", "bio"):
        if not get(db, MediaAsset, obj.media_id).mime.startswith("image/"):
            fail(
                422,
                "image_required",
                "Public preview uchun alohida rasm tayyorlang; original PDF private saqlansin",
            )
    obj.published_data = data
    obj.published_title = obj.title
    obj.published_media_id = obj.media_id
    obj.published = True


def public_content(obj):
    return {
        "id": str(obj.id),
        "kind": obj.kind,
        "title": obj.published_title,
        "data": obj.published_data,
        "sort_order": obj.sort_order,
        "media_url": f"/api/v1/media/{obj.published_media_id}" if obj.published_media_id else None,
    }


def course_view(obj):
    return {
        **project(obj, COURSE_FIELDS),
        "image_url": f"/api/v1/media/{obj.image_id}" if obj.image_id else None,
    }


def visible_results():
    """Real results always require consent; fixtures are development-only."""
    sample = func.coalesce(Content.published_data["is_sample"].as_boolean(), False)
    real = and_(~sample, Content.consent.is_(True), Content.approved.is_(True))
    allowed = or_(real, sample) if get_settings().app_env == "development" else real
    return and_(
        Content.kind == "result", Content.published.is_(True), Content.archived.is_(False), allowed
    )


def site(db):
    rows = db.scalars(
        select(Content)
        .where(Content.published.is_(True), Content.kind.not_in(["settings", "result"]))
        .order_by(Content.sort_order, Content.created_at)
        .limit(200)
    )
    results = db.scalars(
        select(Content)
        .where(
            visible_results(),
        )
        .order_by(Content.sort_order, Content.created_at.desc())
        .limit(60)
    )
    return {
        "brand": "Sherzod English",
        "content": [public_content(x) for x in rows] + [public_content(x) for x in results],
    }
