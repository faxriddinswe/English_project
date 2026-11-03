import hashlib, hmac, re, secrets
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select, update
from app.core.schemas import Login, PasswordChange, RegisterIn
from app.core.config import get_settings
from app.core.errors import fail
from app.core.helpers import audit, local_today
from app.db.base import utcnow
from app.db.models import User, AuthSession, Student, Lead, Course, NotificationOutbox, LeadHistory
from app.db.session import get_db, SessionLocal
from app.modules.auth.service import (
    client_ip,
    current_user,
    hasher,
    verify_password,
    DUMMY_HASH,
    rate_limit,
    create_session,
    public_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/csrf")
def csrf(response: Response):
    nonce = secrets.token_urlsafe(32)
    sig = hmac.new(get_settings().csrf_secret.encode(), nonce.encode(), hashlib.sha256).hexdigest()
    token = nonce + "." + sig
    response.set_cookie(
        "se_csrf",
        token,
        httponly=False,
        secure=get_settings().app_env == "production",
        samesite="strict",
        path="/",
        max_age=3600,
    )
    return {"token": token}


@router.post("/login")
def login(
    payload: Login, request: Request, response: Response, db=Depends(get_db, scope="function")
):
    # Durable limiter counts invalid credentials too, independently of the login transaction.
    with SessionLocal.begin() as limits:
        rate_limit(
            limits,
            "login",
            client_ip(request),
            get_settings().login_limit,
        )

    # Normalize phone variant if entered
    raw_input = payload.username.strip()
    digits = re.sub(r"[\s()+-]", "", raw_input)
    if len(digits) == 9:
        digits = "998" + digits
    phone_normalized = ("+" + digits) if (len(digits) == 12 and digits.startswith("998")) else None

    # Search user by username
    user = db.scalar(select(User).where(User.username == raw_input.lower()))
    if not user and phone_normalized:
        user = db.scalar(select(User).where(User.username == phone_normalized))
    if not user and phone_normalized:
        student = db.scalar(select(Student).where(Student.phone == phone_normalized))
        if student and student.user_id:
            user = db.scalar(select(User).where(User.id == student.user_id))

    valid = verify_password(user.password_hash if user else DUMMY_HASH, payload.password)
    if not user or not valid:
        fail(401, "invalid_credentials", "Login yoki parol noto‘g‘ri")

    student = (
        db.scalar(select(Student).where(Student.user_id == user.id))
        if user.role == "student"
        else None
    )
    if user.registration_pending or (
        student and student.deleted_at is None and student.admission_status == "pending"
    ):
        fail(
            403,
            "pending_approval",
            "Arizangiz ko‘rib chiqilmoqda. Ustoz tasdiqlaganidan keyin kabinetingizga kira olasiz.",
        )
    if student and (student.deleted_at is not None or student.admission_status == "rejected"):
        fail(403, "account_deleted", "Hisobingiz o‘chirilgan yoki arizangiz rad etilgan.")
    if not user.active:
        fail(401, "invalid_credentials", "Login yoki parol noto‘g‘ri")

    create_session(db, user, response)
    return public_user(user)


@router.post("/register", status_code=201)
def register(payload: RegisterIn, request: Request, db=Depends(get_db, scope="function")):
    with SessionLocal.begin() as limits:
        rate_limit(limits, "register_ip", client_ip(request), 20, 3600)
        rate_limit(limits, "register_phone", payload.phone, 5, 3600)

    phone = payload.phone
    existing_user = db.scalar(select(User).where(User.username == phone))
    matches = list(
        db.scalars(
            select(Student)
            .where(Student.phone == phone)
            .order_by(Student.created_at, Student.id)
            .with_for_update()
        )
    )
    existing_student = matches[0] if len(matches) == 1 else None
    if existing_user:
        if existing_user.registration_pending:
            fail(
                409,
                "pending_approval",
                "Arizangiz allaqachon qabul qilingan va ko‘rib chiqilmoqda. Ustoz tasdiqlashini kuting.",
            )
        fail(409, "phone_exists", "Bu telefon raqami bilan hisob mavjud. Kabinetga kiring.")
    if matches and (
        not existing_student
        or existing_student.user_id
        or existing_student.deleted_at is not None
        or existing_student.admission_status != "approved"
    ):
        fail(409, "phone_exists", "Bu telefon raqami ro‘yxatdan o‘tgan. Ustozga murojaat qiling.")

    course_name = ""
    if payload.course_id:
        course = db.scalar(
            select(Course).where(
                Course.id == payload.course_id,
                Course.deleted_at.is_(None),
                Course.published.is_(True),
            )
        )
        if not course:
            fail(422, "invalid_course", "Tanlangan kurs mavjud emas yoki qabul uchun ochiq emas")
        course_name = course.name

    user = User(
        username=phone,
        password_hash=hasher.hash(payload.password),
        role="student",
        active=False,
        registration_pending=True,
        must_change_password=False,
    )
    db.add(user)
    db.flush()

    if existing_student:
        # Access needs explicit teacher approval; existing enrollment/billing remains listed.
        student = existing_student
        student.user_id = user.id
    else:
        student = Student(
            user_id=user.id,
            full_name=payload.full_name.strip(),
            phone=phone,
            joined_on=local_today(),
            admission_status="pending",
            private_note=f"Tanlangan kurs: {course_name}" if course_name else "Yangi ariza",
        )
        db.add(student)
    db.flush()

    lead = Lead(
        full_name=payload.full_name.strip(),
        phone=phone,
        course_id=payload.course_id,
        comment=f"Saytdan o‘zi ro‘yxatdan o‘tdi. Kurs: {course_name}"
        if course_name
        else "Saytdan o‘zi ro‘yxatdan o‘tdi.",
        source="cabinet_signup",
        status="new",
        student_id=student.id,
    )
    if existing_student:
        lead.comment += (
            " Mavjud profil uchun kabinetga kirish so‘raldi; shaxsini tekshirib tasdiqlang."
        )
    db.add(lead)
    db.flush()

    enabled = bool(get_settings().telegram_bot_token and get_settings().telegram_chat_id)
    db.add(
        NotificationOutbox(
            lead_id=lead.id,
            status="pending" if enabled else "disabled",
            next_attempt_at=utcnow(),
        )
    )
    db.add(LeadHistory(lead_id=lead.id, note="O‘quvchi kabinetdan ro‘yxatdan o‘tdi"))
    db.flush()

    return {
        "status": "pending",
        "message": "Arizangiz ko‘rib chiqilmoqda. Ustoz tasdiqlaganidan keyin kabinetingizga kira olasiz.",
    }


@router.get("/me")
def me(user=Depends(current_user)):
    return public_user(user)


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    user=Depends(current_user),
    db=Depends(get_db, scope="function"),
):
    request.state.auth_session.revoked = True
    response.delete_cookie("se_session", path="/")
    response.delete_cookie("se_csrf", path="/")
    return {"message": "Chiqildi"}


@router.post("/change-password")
def change_password(
    payload: PasswordChange,
    request: Request,
    user=Depends(current_user),
    db=Depends(get_db, scope="function"),
):
    if not verify_password(user.password_hash, payload.current_password):
        fail(422, "invalid_password", "Amaldagi parol noto‘g‘ri")
    user.password_hash = hasher.hash(payload.new_password)
    user.must_change_password = False
    db.execute(
        update(AuthSession)
        .where(AuthSession.user_id == user.id, AuthSession.id != request.state.auth_session.id)
        .values(revoked=True)
    )
    audit(db, user, "password_changed", user.id)
    return {"message": "Parol almashtirildi"}
