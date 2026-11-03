import hashlib, hmac, secrets, time
from datetime import timedelta
from fastapi import Depends, Request
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from app.db.base import utcnow
from app.db.session import get_db
from app.db.models import User, AuthSession, Student, RateLimit
from app.core.config import get_settings
from app.core.errors import fail

hasher = PasswordHasher()
DUMMY_HASH = hasher.hash(secrets.token_urlsafe(24))


def client_ip(request):
    import ipaddress

    peer = request.client.host if request.client else "unknown"
    trusted = [v.strip() for v in get_settings().trusted_proxy_ips.split(",") if v.strip()]
    if peer in trusted:
        try:
            return str(ipaddress.ip_address(request.headers.get("x-real-ip", "")))
        except ValueError:
            pass
    return peer


def digest(token):
    return hmac.new(
        get_settings().session_secret.encode(), token.encode(), hashlib.sha256
    ).hexdigest()


def verify_password(hashed, password):
    try:
        return hasher.verify(hashed, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def rate_limit(db, scope, identity, limit, seconds=900):
    key = hmac.new(
        get_settings().csrf_secret.encode(), f"{scope}:{identity}".encode(), hashlib.sha256
    ).hexdigest()
    window = int(time.time()) // seconds
    stmt = insert(RateLimit).values(key=key, window=window, count=1)
    stmt = stmt.on_conflict_do_update(
        index_elements=[RateLimit.key],
        set_={
            "count": __import__("sqlalchemy").case(
                (RateLimit.window == window, RateLimit.count + 1), else_=1
            ),
            "window": window,
        },
    ).returning(RateLimit.count)
    count = db.scalar(stmt)
    # Persist even rejected login attempts; separate short transaction at call sites.
    if count > limit:
        fail(429, "rate_limit", "Urinishlar ko‘p. Keyinroq qayta urinib ko‘ring")


def current_user(request: Request, db=Depends(get_db, scope="function")):
    token = request.cookies.get("se_session", "")
    sess = (
        db.scalar(
            select(AuthSession).where(
                AuthSession.token_hash == digest(token),
                AuthSession.revoked.is_(False),
                AuthSession.expires_at > utcnow(),
            )
        )
        if token
        else None
    )
    if not sess:
        fail(401, "authentication_required", "Kabinetga kiring")
    user = db.get(User, sess.user_id)
    if not user or not user.active or user.registration_pending:
        fail(401, "authentication_required", "Kabinetga kiring")
    if user.role == "student":
        profile = db.scalar(select(Student).where(Student.user_id == user.id))
        if profile and (profile.deleted_at is not None or profile.admission_status != "approved"):
            fail(401, "authentication_required", "Kabinetga kiring")
    request.state.auth_session = sess
    if user.must_change_password and request.url.path not in (
        "/api/v1/auth/me",
        "/api/v1/auth/change-password",
        "/api/v1/auth/logout",
    ):
        fail(403, "password_change_required", "Avval vaqtinchalik parolni almashtiring")
    return user


def teacher(user=Depends(current_user)):
    if user.role != "teacher":
        fail(403, "forbidden", "Ustoz ruxsati kerak")
    return user


def student_profile(user=Depends(current_user), db=Depends(get_db, scope="function")):
    if user.role != "student":
        fail(403, "forbidden", "O‘quvchi kabineti")
    student = db.scalar(
        select(Student).where(
            Student.user_id == user.id,
            Student.deleted_at.is_(None),
            Student.admission_status == "approved",
        )
    )
    if not student:
        fail(404, "not_found", "O‘quvchi topilmadi")
    return student


def create_session(db, user, response):
    token = secrets.token_urlsafe(48)
    db.add(
        AuthSession(
            user_id=user.id,
            token_hash=digest(token),
            expires_at=utcnow() + timedelta(hours=get_settings().session_hours),
        )
    )
    response.set_cookie(
        "se_session",
        token,
        httponly=True,
        secure=get_settings().app_env == "production",
        samesite="lax",
        path="/",
        max_age=get_settings().session_hours * 3600,
    )


def public_user(user):
    return {
        "id": str(user.id),
        "username": user.username,
        "role": user.role,
        "must_change_password": user.must_change_password,
    }
