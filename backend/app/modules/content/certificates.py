"""Repeatable, development-only previews from supplied certificate photos."""

import json
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from PIL import Image, ImageDraw, ImageOps
from sqlalchemy import select, text

from app.core.config import get_settings
from app.core.helpers import audit
from app.db.models import Content, MediaAsset, User
from app.db.session import SessionLocal
from app.modules.content.service import publish
from app.modules.media.service import prepare, storage

# Original names and scores live in a private, explicit import manifest.


def public_preview(raw, masks):
    """Deterministic privacy processing; scores and names are never generated."""
    prepare(raw, "image/jpeg")
    with Image.open(BytesIO(raw)) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        draw = ImageDraw.Draw(image)
        width, height = image.size
        for left, top, right, bottom in masks:
            draw.rectangle(
                (
                    round(left * width),
                    round(top * height),
                    round(right * width),
                    round(bottom * height),
                ),
                fill="#ece9e2",
            )
        image.thumbnail((2000, 2000))
        output = BytesIO()
        image.save(output, "WEBP", quality=90, exif=b"")
        return output.getvalue()


def _asset(db, teacher, key, raw, mime, visibility, alt):
    asset = db.scalar(select(MediaAsset).where(MediaAsset.object_key == key))
    if asset:
        return asset
    storage().put(key, raw, mime)
    asset = MediaAsset(
        owner_id=teacher.id,
        object_key=key,
        mime=mime,
        visibility=visibility,
        size=len(raw),
        alt=alt,
        public_prepared=visibility == "public",
    )
    db.add(asset)
    db.flush()
    return asset


def load_certificate_specs(manifest):
    """Read explicit owner input; never keep personal certificate data in source."""
    path = Path(manifest)
    if not path.is_file():
        raise ValueError("Private sertifikat manifesti kerak; README yo‘riqnomasini ko‘ring")
    specs = json.loads(path.read_text())
    if (
        not isinstance(specs, list)
        or len(specs) != 5
        or any(not isinstance(spec, dict) for spec in specs)
        or [spec.get("type") for spec in specs] != ["ielts"] * 3 + ["cefr"] * 2
        or any(
            not isinstance(spec.get("filename"), str)
            or Path(spec["filename"]).name != spec["filename"]
            or not spec.get("student_name")
            or not spec.get("masks")
            for spec in specs
        )
    ):
        raise ValueError("Manifest 3 IELTS va 2 CEFR sertifikat tavsifidan iborat bo‘lishi kerak")
    return specs


def import_certificates(source_dir=None, manifest=None):
    if get_settings().app_env != "development":
        raise SystemExit("Takroriy namunalar faqat development muhitida yaratiladi")
    source_dir = (
        Path(source_dir) if source_dir else Path(__file__).resolve().parents[4] / "Screenshots"
    )
    manifest = manifest or Path(__file__).resolve().parents[4] / ".local/certificate-import.json"
    specifications = load_certificate_specs(manifest)
    prepared = []
    for spec in specifications:
        raw = (source_dir / spec["filename"]).read_bytes()
        prepared.append((spec, raw, public_preview(raw, spec["masks"]), sha256(raw).hexdigest()))
    with SessionLocal.begin() as db:
        db.execute(text("SELECT pg_advisory_xact_lock(734289104)"))
        teacher = db.scalar(select(User).where(User.role == "teacher"))
        if not teacher:
            raise SystemExit("Avval teacher yarating")
        sources = []
        for spec, raw, preview, digest in prepared:
            _asset(
                db,
                teacher,
                f"private/{uuid5(NAMESPACE_URL, 'certificate-original:' + digest)}.jpg",
                raw,
                "image/jpeg",
                "private",
                f"Private original — {spec['filename']}",
            )
            media = _asset(
                db,
                teacher,
                f"public/{uuid5(NAMESPACE_URL, 'certificate-redacted-v2:' + sha256(preview).hexdigest())}.webp",
                preview,
                "image/webp",
                "public",
                f"Shaxsiy raqamlari berkitilgan sertifikat — {spec['filename']}",
            )
            sources.append((spec, media))
        for index in range(60):
            number = index + 1
            spec, media = sources[index % 3 if index < 30 else 3 + (index - 30) % 2]
            key = f"public-preview-v1-{number:02}"
            obj = db.scalar(
                select(Content)
                .where(Content.kind == "result", Content.data["sample_key"].astext == key)
                .with_for_update()
            )
            if obj and obj.data.get("is_sample") is not True:
                raise ValueError("Ustoz tahrirlagan haqiqiy natija almashtirilmadi")
            if not obj:
                obj = Content(kind="result")
                db.add(obj)
            obj.title = f"NAMUNA — {spec['student_name']} — {number:02}"
            obj.data = {k: v for k, v in spec.items() if k not in ("filename", "masks")}
            obj.data.update(is_sample=True, sample_key=key)
            obj.media_id = media.id
            obj.sort_order = number
            obj.consent = False
            obj.approved = False
            publish(db, obj)
        audit(db, teacher, "certificate_preview_imported", teacher.id)
    print(
        "60 ta takroriy NAMUNA: IELTS 30, SEFR 30. Asl rasmlar private; ommaviy nusxalar tahrirlangan."
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path)
    parser.add_argument("--manifest", type=Path)
    args = parser.parse_args()
    import_certificates(args.source_dir, args.manifest)
