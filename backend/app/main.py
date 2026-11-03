import hashlib, hmac, json, logging, time
from contextlib import asynccontextmanager
from uuid import uuid4
from fastapi import FastAPI, Request
from starlette.exceptions import HTTPException
from pydantic import ValidationError
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError
from app.core.uz import validation_message
from app.core.config import get_settings
from app.core.body_limit import BodySizeLimit
from app.db.session import engine
from app.modules.auth.router import router as auth
from app.modules.content.router import router as content
from app.modules.content.public import router as public
from app.modules.content.certificates_api import router as certificates
from app.modules.leads.router import router as leads, public_router as public_leads
from app.modules.students.router import router as students
from app.modules.students.pending import router as pending_students
from app.modules.students.history import router as student_history
from app.modules.students.workspace import router as student
from app.modules.groups.router import router as groups
from app.modules.lessons.router import router as lessons
from app.modules.billing.router import router as billing
from app.modules.learning.router import router as learning
from app.modules.media.router import router as media
from app.modules.reports.router import router as reports

settings = get_settings()
log = logging.getLogger("sherzod.api")
if not log.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(message)s"))
    log.addHandler(handler)
log.setLevel(logging.INFO)
log.propagate = False


@asynccontextmanager
async def lifespan(app):
    yield
    engine.dispose()


app = FastAPI(title="Sherzod English API", version="1.0.0", lifespan=lifespan)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts.split(","))
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-CSRF-Token", "Idempotency-Key", "X-File-Type"],
)


def error(request, status, code, message, field_errors=None):
    return JSONResponse(
        {
            "code": code,
            "message": message,
            "field_errors": field_errors or {},
            "request_id": getattr(request.state, "request_id", None),
        },
        status_code=status,
        headers={"Cache-Control": "no-store"},
    )


@app.exception_handler(HTTPException)
async def http_error(request, exc):
    detail = (
        exc.detail
        if isinstance(exc.detail, dict)
        else {
            "code": "request_error",
            "message": {
                404: "Sahifa yoki ma’lumot topilmadi",
                405: "Bu amal uchun ruxsat yo‘q",
                401: "Kabinetga kiring",
                403: "Ruxsat yo‘q",
            }.get(exc.status_code, "So‘rov bajarilmadi"),
        }
    )
    return error(
        request,
        exc.status_code,
        detail.get("code", "request_error"),
        detail.get("message", "So‘rov bajarilmadi"),
    )


@app.exception_handler(RequestValidationError)
@app.exception_handler(ValidationError)
async def validation_error(request, exc):
    fields = {
        ".".join(
            str(x)
            for x in (
                e["loc"][1:] if e["loc"] and e["loc"][0] in ("body", "query", "path") else e["loc"]
            )
        ): validation_message(e)
        for e in exc.errors()
    }
    return error(request, 422, "validation_error", "Maydonlarni tekshiring", fields)


@app.exception_handler(IntegrityError)
async def integrity_error(request, exc):
    return error(
        request, 409, "data_conflict", "Ma’lumot takrorlandi yoki bog‘lanish qoidasi buzildi"
    )


@app.exception_handler(OperationalError)
async def db_error(request, exc):
    return error(
        request, 503, "database_unavailable", "Baza vaqtincha mavjud emas. Qayta urinib ko‘ring"
    )


@app.middleware("http")
async def security(request: Request, call_next):
    request.state.request_id = str(uuid4())
    start = time.monotonic()
    length = request.headers.get("content-length", "0")
    if not length.isdecimal():
        return error(request, 400, "invalid_length", "Content-Length noto‘g‘ri")
    if int(length) > 10 * 1024 * 1024:
        return error(request, 413, "file_size", "Eng ko‘pi 10 MB")
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        origin = request.headers.get("origin", "").rstrip("/")
        if origin not in settings.origins:
            return error(request, 403, "invalid_origin", "So‘rov manbasi ruxsat etilmagan")
        cookie = request.cookies.get("se_csrf", "")
        header = request.headers.get("x-csrf-token", "")
        nonce, sep, signature = cookie.partition(".")
        expected = hmac.new(
            settings.csrf_secret.encode(), nonce.encode(), hashlib.sha256
        ).hexdigest()
        if (
            not sep
            or not hmac.compare_digest(cookie.encode(), header.encode())
            or not hmac.compare_digest(signature.encode(), expected.encode())
        ):
            return error(request, 403, "csrf_failed", "Sahifani yangilang va qayta urinib ko‘ring")
    try:
        response = await call_next(request)
    except Exception:
        # No exception repr / request bodies / query parameters in logs.
        log.error(json.dumps({"event": "unhandled_error", "request_id": request.state.request_id}))
        response = error(request, 500, "internal_error", "Server xatosi. Qayta urinib ko‘ring")
    response.headers["X-Request-ID"] = request.state.request_id
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "DENY"
    log.info(
        json.dumps(
            {
                "request_id": request.state.request_id,
                "method": request.method,
                "route": request.scope.get("route").path
                if request.scope.get("route")
                else "unmatched",
                "status": response.status_code,
                "duration_ms": round((time.monotonic() - start) * 1000),
            }
        )
    )
    return response


@app.get("/health/live")
def live():
    return {"status": "live"}


@app.get("/health/ready")
def ready():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        return JSONResponse({"status": "not_ready"}, status_code=503)


app.add_middleware(BodySizeLimit)

for router in [
    auth,
    public,
    public_leads,
    content,
    certificates,
    leads,
    students,
    pending_students,
    student_history,
    student,
    groups,
    lessons,
    billing,
    learning,
    media,
    reports,
]:
    app.include_router(router, prefix="/api/v1")
