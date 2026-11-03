from typing import Literal
from uuid import UUID
from pydantic import BaseModel


class PublicContent(BaseModel):
    id: UUID
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
    ]
    title: str
    data: dict
    sort_order: int
    media_url: str | None


class SiteResponse(BaseModel):
    brand: Literal["Sherzod English"]
    content: list[PublicContent]


class PublicCourse(BaseModel):
    id: UUID
    name: str
    slug: str
    short_description: str
    description: str
    audience: str
    level: str
    features: list[str]
    duration: str
    lessons_per_week: int | None
    lesson_minutes: int | None
    format: str
    schedule: str
    marketing_price: str | None
    sort_order: int
    image_url: str | None


class CourseList(BaseModel):
    items: list[PublicCourse]


class ContentList(BaseModel):
    items: list[PublicContent]


class ResultPage(ContentList):
    page: int
    page_size: int
    total: int


class LeadAccepted(BaseModel):
    id: UUID
    message: Literal["Arizangiz qabul qilindi."]
