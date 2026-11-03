"""Explicit, repeatable development fixtures; never run during application startup."""

from io import BytesIO
from uuid import uuid4
from PIL import Image, ImageDraw, ImageFont
from sqlalchemy import select
from app.core.config import get_settings
from app.db.models import Content, Course, MediaAsset, User
from app.db.session import SessionLocal
from app.modules.content.service import publish
from app.modules.media.service import storage


def certificate(number, kind, score):
    image = Image.new("RGB", (600, 800), "#f7f5fb")
    draw = ImageDraw.Draw(image)

    def font(size):
        return ImageFont.truetype("DejaVuSans.ttf", size)

    accent = "#752b91" if kind == "ielts" else "#23785f"
    draw.rounded_rectangle((24, 24, 576, 776), radius=12, outline=accent, width=3)
    draw.rectangle((24, 24, 576, 145), fill=accent)
    draw.text((300, 65), "NAMUNA", font=font(42), fill="white", anchor="mt")
    draw.text((300, 185), "SHERZOD ENGLISH", font=font(26), fill=accent, anchor="mt")
    draw.text(
        (300, 250), f"{kind.upper()} | DIZAYN NAMUNASI", font=font(22), fill="#351240", anchor="mt"
    )
    draw.text(
        (300, 320), f"Namuna o'quvchi {number:02}", font=font(26), fill="#351240", anchor="mt"
    )
    draw.text((300, 398), str(score), font=font(92), fill=accent, anchor="mt")
    draw.text((300, 530), "NAMUNAVIY NATIJA", font=font(20), fill="#75627f", anchor="mt")
    draw.line((75, 605, 525, 605), fill=accent, width=2)
    draw.text((300, 642), "HAQIQIY SERTIFIKAT EMAS", font=font(21), fill="#351240", anchor="mt")
    draw.text(
        (300, 690), "Faqat interfeysni tekshirish uchun", font=font(17), fill="#75627f", anchor="mt"
    )
    out = BytesIO()
    image.save(out, "WEBP", quality=85)
    return out.getvalue()


def seed_public_preview():
    if get_settings().app_env != "development":
        raise SystemExit("Public namuna faqat development muhitida yaratiladi")
    with SessionLocal.begin() as db:
        teacher = db.scalar(select(User).where(User.role == "teacher"))
        if not teacher:
            raise SystemExit("Avval teacher yarating")
        specifications = [
            (
                "general-english",
                "Grammatika",
                "Ingliz tili grammatikasi va kundalik muloqot uchun mustahkam poydevor.",
                [
                    "Grammatika mavzulari",
                    "Lug‘at boyligini rivojlantirish",
                    "O‘qish, yozish va muloqot",
                ],
            ),
            (
                "ielts",
                "IELTS",
                "IELTS imtihonining to‘rtta ko‘nikmasi bo‘yicha tayyorgarlik.",
                ["Listening va Reading", "Writing va Speaking", "Imtihon formatiga tayyorgarlik"],
            ),
            (
                "cefr",
                "SEFR",
                "CEFR darajalari bo‘yicha ingliz tili bilimlarini rivojlantirish.",
                [
                    "Til ko‘nikmalarini rivojlantirish",
                    "O‘qish va tinglab tushunish",
                    "Yozma va og‘zaki mashqlar",
                ],
            ),
        ]
        for order, (slug, name, description, features) in enumerate(specifications):
            course = db.scalar(select(Course).where(Course.slug == slug))
            if course is None:
                course = Course(
                    slug=slug,
                    name=name,
                    short_description=description,
                    description=description,
                    features=features,
                    sort_order=order,
                    published=True,
                )
                db.add(course)
            elif course.short_description.startswith("NAMUNA"):
                course.name, course.short_description, course.description = (
                    name,
                    description,
                    description,
                )
                course.features, course.published = features, True
        sections = [
            (
                "bio",
                "Ustoz haqida",
                {
                    "body": "Sherzod ustoz — ingliz tili o‘qituvchisi. Sherzod English’da Grammatika, IELTS va SEFR yo‘nalishlari bilan tanishishingiz va kursga ariza qoldirishingiz mumkin."
                },
            ),
            (
                "benefit",
                "Uch yo‘nalish, aniq maqsad",
                {
                    "body": "Grammatika, IELTS va SEFR: o‘zingizga mos yo‘nalish bilan tanishing.",
                    "tags": ["Grammatika", "IELTS", "SEFR"],
                },
            ),
            (
                "benefit",
                "Ta’lim jarayoni bir joyda",
                {
                    "body": "Shaxsiy kabinetda dars jadvali, davomat, vazifalar va to‘lovlar haqidagi o‘z ma’lumotlaringizni ko‘ring.",
                    "tags": ["Jadval", "Vazifalar", "Shaxsiy kabinet"],
                },
            ),
            (
                "faq",
                "Kursga qanday yozilaman?",
                {
                    "body": "Kurs kartasidagi «Kursga yozilish» tugmasini bosing, ism va telefon raqamingizni kiriting va arizani yuboring."
                },
            ),
            (
                "faq",
                "Qaysi yo‘nalishlar bor?",
                {
                    "body": "Grammatika, IELTS va SEFR yo‘nalishlari mavjud. Yo‘nalish tafsilotlari kurs kartalarida berilgan."
                },
            ),
            (
                "faq",
                "Narx va dars jadvalini qanday bilaman?",
                {
                    "body": "Qiziqqan kursingizni tanlab ariza qoldiring. Narx va jadvalni ustoz bilan aniqlashtiring."
                },
            ),
        ]
        for order, (kind, title, data) in enumerate(sections):
            # Never overwrite teacher-authored content or existing published sections.
            if db.scalar(select(Content.id).where(Content.kind == kind, Content.title == title)):
                continue
            if kind == "bio" and db.scalar(
                select(Content.id).where(Content.kind == kind, Content.published.is_(True))
            ):
                continue
            obj = Content(kind=kind, title=title, data=data, sort_order=order)
            db.add(obj)
            publish(db, obj)
        for number in range(1, 41):
            key = f"public-preview-v1-{number:02}"
            if db.scalar(
                select(Content.id).where(
                    Content.kind == "result", Content.data["sample_key"].astext == key
                )
            ):
                continue
            kind = "ielts" if number <= 20 else "cefr"
            score = (
                [6, 6.5, 7, 7.5, 8][(number - 1) % 5]
                if kind == "ielts"
                else ["B1", "B2", "C1"][(number - 21) % 3]
            )
            payload = certificate(number, kind, score)
            object_key = f"{uuid4()}.webp"
            storage().put(object_key, payload, "image/webp")
            media = MediaAsset(
                owner_id=teacher.id,
                visibility="public",
                object_key=object_key,
                mime="image/webp",
                size=len(payload),
                alt=f"NAMUNA {number:02} — haqiqiy sertifikat emas",
                public_prepared=True,
            )
            db.add(media)
            db.flush()
            data = dict(
                type=kind,
                student_name=f"Namuna o‘quvchi {number:02}",
                exam_date="2026-01-01",
                is_sample=True,
                sample_key=key,
            )
            if kind == "ielts":
                data.update(
                    {
                        name: str(score)
                        for name in ("listening", "reading", "writing", "speaking", "overall")
                    }
                )
            else:
                data["level"] = score
            obj = Content(
                kind="result",
                title=f"NAMUNA — {number:02}",
                data=data,
                media_id=media.id,
                sort_order=number,
            )
            db.add(obj)
            publish(db, obj)
    print("Public preview tayyor: 40 ta NAMUNA natija. Mavjud tahrirlar saqlandi.")


if __name__ == "__main__":
    seed_public_preview()
