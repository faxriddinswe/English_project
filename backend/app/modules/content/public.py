from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from app.db.session import get_db
from app.db.models import Course, Content
from app.core.errors import fail
from app.modules.content.service import site, course_view, public_content, visible_results
from app.modules.content.responses import (
    SiteResponse,
    PublicCourse,
    CourseList,
    ContentList,
    ResultPage,
)

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/site", response_model=SiteResponse)
def public_site(db=Depends(get_db, scope="function")):
    return site(db)


@router.get("/courses", response_model=CourseList)
def courses(db=Depends(get_db, scope="function")):
    return {
        "items": [
            course_view(x)
            for x in db.scalars(
                select(Course)
                .where(Course.published.is_(True), Course.deleted_at.is_(None))
                .order_by(Course.sort_order)
                .limit(50)
            )
        ]
    }


@router.get("/courses/{slug}", response_model=PublicCourse)
def course(slug: str, db=Depends(get_db, scope="function")):
    obj = db.scalar(
        select(Course).where(
            Course.slug == slug, Course.published.is_(True), Course.deleted_at.is_(None)
        )
    )
    if not obj:
        fail(404, "not_found", "Kurs topilmadi")
    return course_view(obj)


@router.get("/results", response_model=ResultPage)
def results(
    type: str = "", page: int = 1, page_size: int = 20, db=Depends(get_db, scope="function")
):
    if type not in ("", "ielts", "cefr") or page < 1 or page_size not in (20, 50, 60):
        fail(422, "invalid_filter", "Filtr yoki sahifa noto‘g‘ri")
    stmt = select(Content).where(
        visible_results(),
    )
    if type:
        stmt = stmt.where(Content.published_data["type"].astext == type)
    return {
        "items": [
            public_content(x)
            for x in db.scalars(
                stmt.order_by(Content.sort_order, Content.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ],
        "page": page,
        "page_size": page_size,
        "total": db.scalar(select(func.count()).select_from(stmt.subquery())),
    }


@router.get("/faqs", response_model=ContentList)
def faqs(db=Depends(get_db, scope="function")):
    return {
        "items": [
            public_content(x)
            for x in db.scalars(
                select(Content)
                .where(Content.kind == "faq", Content.published.is_(True))
                .order_by(Content.sort_order)
                .limit(100)
            )
        ]
    }


@router.get("/revision")
def revision(db=Depends(get_db, scope="function")):
    import hashlib

    content = db.execute(
        select(func.max(Content.updated_at), func.count(Content.id)).where(
            Content.published.is_(True), Content.archived.is_(False), Content.kind != "settings"
        )
    ).one()
    courses = db.execute(
        select(func.max(Course.updated_at), func.count(Course.id)).where(
            Course.published.is_(True), Course.deleted_at.is_(None)
        )
    ).one()
    return {"revision": hashlib.sha256(repr((tuple(content), tuple(courses))).encode()).hexdigest()}
