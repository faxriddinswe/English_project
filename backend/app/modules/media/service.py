from io import BytesIO
from PIL import Image, ImageOps, UnidentifiedImageError
from app.core.config import get_settings
from app.core.errors import fail

Image.MAX_IMAGE_PIXELS = 30_000_000


def prepare(data: bytes, declared: str):
    if not data or len(data) > 10 * 1024 * 1024:
        fail(422, "file_size", "Fayl bo‘sh yoki 10 MB dan katta")
    if declared == "application/pdf":
        if not data.startswith(b"%PDF-") or b"%%EOF" not in data[-2048:]:
            fail(422, "file_signature", "PDF fayl noto‘g‘ri")
        # PDFs are attachment-only, including public prepared certificates; no inline active content.
        return data, "application/pdf", "pdf"
    if declared not in ("image/jpeg", "image/png", "image/webp") or len(data) > 5 * 1024 * 1024:
        fail(422, "image_type", "JPEG/PNG/WebP, eng ko‘pi 5 MB")
    try:
        with Image.open(BytesIO(data)) as image:
            expected = {"image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WEBP"}[declared]
            if image.format != expected:
                fail(422, "file_signature", "MIME va fayl formati mos emas")
            image.load()
            mode = "RGBA" if image.mode in ("RGBA", "LA") or "transparency" in image.info else "RGB"
            im = ImageOps.exif_transpose(image).convert(mode)
            im.thumbnail((2000, 2000))
            out = BytesIO()
            im.save(out, format="WEBP", quality=85, exif=b"")
            return out.getvalue(), "image/webp", "webp"
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        fail(422, "invalid_image", "Rasm ochilmadi yoki o‘lchami juda katta")


class DiskStorage:
    def __init__(self):
        self.root = get_settings().media_root.resolve()

    def path(self, key):
        path = (self.root / key).resolve()
        if not path.is_relative_to(self.root):
            fail(404, "not_found", "Fayl topilmadi")
        return path

    def put(self, key, data, mime):
        path = self.path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def read(self, key):
        path = self.path(key)
        if not path.is_file():
            fail(404, "file_missing", "Fayl topilmadi")
        return path.read_bytes()


class S3Storage:
    def __init__(self):
        import boto3

        s = get_settings()
        self.bucket = s.s3_bucket
        if not self.bucket:
            fail(503, "storage_unconfigured", "Storage sozlanmagan")
        self.client = boto3.client("s3", endpoint_url=s.s3_endpoint_url or None)

    def put(self, key, data, mime):
        self.client.put_object(
            Bucket=self.bucket, Key=key, Body=data, ContentType=mime, ServerSideEncryption="AES256"
        )

    def read(self, key):
        return self.client.get_object(Bucket=self.bucket, Key=key)["Body"].read()


def storage():
    return S3Storage() if get_settings().storage_backend == "s3" else DiskStorage()
