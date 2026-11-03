"""Real PostgreSQL API/transaction tests. Never use SQLite or an in-memory business store."""

import os, subprocess, sys
from datetime import timedelta, datetime, timezone
from decimal import Decimal
from pathlib import Path
import pytest
from sqlalchemy import create_engine, select, text
from app.db.session import SessionLocal
from app.db.models import User, Student, Course, Group, NotificationOutbox, Lead
from app.modules.auth.service import hasher
from app.core.helpers import local_today
from app.main import app
from tests.asgi_client import Client

pytestmark = pytest.mark.postgres


@pytest.fixture(scope="module")
def pg_engine():
    url = os.environ.get("TEST_DATABASE_URL", "")
    if not url:
        pytest.skip("TEST_DATABASE_URL not supplied; real PostgreSQL integration not run")
    from sqlalchemy.engine import make_url

    assert make_url(url).database.endswith("_test"), "Dedicated *_test database is required"
    assert os.environ.get("TEST_DATABASE_RESET") == "1", (
        "Set TEST_DATABASE_RESET=1 for disposable test database"
    )
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=Path(__file__).parents[1],
        env={**os.environ, "DATABASE_URL": url},
        check=True,
    )
    engine = create_engine(url)
    SessionLocal.configure(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture
def scenario(pg_engine):
    with pg_engine.begin() as con:
        names = (
            con.execute(
                text(
                    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'alembic_version'"
                )
            )
            .scalars()
            .all()
        )
        if names:
            con.execute(
                text(
                    "TRUNCATE "
                    + ", ".join('"' + n.replace('"', '""') + '"' for n in names)
                    + " CASCADE"
                )
            )
    with SessionLocal.begin() as db:
        teacher = User(
            username="test-teacher",
            password_hash=hasher.hash("Test-only-Teacher-Password!"),
            role="teacher",
        )
        user = User(
            username="test-student",
            password_hash=hasher.hash("Test-only-Student-Password!"),
            role="student",
        )
        other = User(
            username="test-other",
            password_hash=hasher.hash("Test-only-Other-Password!"),
            role="student",
        )
        db.add_all([teacher, user, other])
        db.flush()
        s = Student(
            user_id=user.id,
            full_name="NAMUNA Student",
            phone="+998901234567",
            joined_on=local_today(),
            private_note="PRIVATE_NOTE_NEVER_STUDENT",
        )
        s2 = Student(
            user_id=other.id,
            full_name="NAMUNA Other",
            phone="+998901234568",
            joined_on=local_today(),
        )
        c = Course(
            name="NAMUNA Course", slug="sample", short_description="NAMUNA course", published=True
        )
        db.add_all([s, s2, c])
        db.flush()
        ids = {"teacher": teacher.id, "student": s.id, "other": s2.id, "course": c.id}
    tc = Client(app)
    assert (
        tc.mutate(
            "POST",
            "/api/v1/auth/login",
            {"username": "test-teacher", "password": "Test-only-Teacher-Password!"},
        )[0]
        == 200
    )
    sc = Client(app)
    assert (
        sc.mutate(
            "POST",
            "/api/v1/auth/login",
            {"username": "test-student", "password": "Test-only-Student-Password!"},
        )[0]
        == 200
    )
    return tc, sc, ids


def call(client, method, path, payload=None, expected=200, headers=None):
    status, data, _ = (
        client.mutate(method, "/api/v1" + path, payload, headers)
        if method != "GET"
        else client.request(method, "/api/v1" + path)
    )
    assert status == expected, data
    return data


def group_and_member(tc, ids):
    today = local_today()
    g = call(
        tc,
        "POST",
        "/teacher/groups",
        {
            "course_id": str(ids["course"]),
            "name": "NAMUNA Group",
            "capacity": 2,
            "start_date": str(today),
            "monthly_price": "600000",
            "rules": [{"weekday": today.weekday(), "local_time": "16:00", "duration_minutes": 90}],
        },
        201,
    )
    m = call(
        tc,
        "POST",
        f"/teacher/groups/{g['id']}/memberships",
        {"student_id": str(ids["student"]), "start_date": str(today)},
        201,
    )
    return g, m


def invoice(tc, ids):
    today = local_today()
    return call(
        tc,
        "POST",
        "/teacher/invoices",
        {
            "student_id": str(ids["student"]),
            "period_start": str(today.replace(day=1)),
            "period_end": str(today + timedelta(days=32)),
            "due_date": str(today - timedelta(days=1)),
            "amount": "600000",
        },
        201,
    )


def test_finance_partial_idempotency_overpayment_refund(scenario):
    tc, sc, ids = scenario
    inv = invoice(tc, ids)
    oid = inv["id"]
    call(
        tc,
        "POST",
        f"/teacher/invoices/{oid}/adjustments",
        {"amount": "-100000", "reason": "NAMUNA discount"},
    )
    call(tc, "POST", f"/teacher/invoices/{oid}/issue")
    payload = {
        "student_id": str(ids["student"]),
        "amount": "300000",
        "received_at": datetime.now(timezone.utc).isoformat(),
        "method": "cash",
        "allocations": [{"invoice_id": oid, "amount": "300000"}],
    }
    payment = call(
        tc, "POST", "/teacher/payments", payload, 201, {"idempotency-key": "unique-test-key"}
    )
    assert (
        call(tc, "POST", "/teacher/payments", payload, 201, {"idempotency-key": "unique-test-key"})[
            "id"
        ]
        == payment["id"]
    )
    call(
        tc,
        "POST",
        "/teacher/payments",
        {**payload, "amount": "400000"},
        409,
        {"idempotency-key": "unique-test-key"},
    )
    assert call(sc, "GET", "/student/billing")["debt"] == "200000.00"
    credit = call(
        tc,
        "POST",
        "/teacher/payments",
        {**payload, "amount": "700000", "allocations": [{"invoice_id": oid, "amount": "200000"}]},
        201,
        {"idempotency-key": "overpayment"},
    )
    assert credit["unallocated_credit"] == "500000.00"
    call(
        tc,
        "POST",
        f"/teacher/payments/{payment['id']}/refunds",
        {"amount": "300001", "reason": "over limit"},
        409,
    )
    call(
        tc,
        "POST",
        f"/teacher/payments/{payment['id']}/refunds",
        {"amount": "100000", "reason": "NAMUNA refund"},
    )
    assert call(sc, "GET", "/student/billing")["debt"] == "100000.00"


def test_lead_outbox_conversion_is_atomic_and_repeatable(scenario):
    tc, sc, ids = scenario
    visitor = Client(app)
    lead = call(
        visitor,
        "POST",
        "/public/leads",
        {
            "full_name": "NAMUNA Lead",
            "phone": "909876543",
            "privacy_accepted": True,
            "source": "/courses/sample",
        },
        201,
    )
    with SessionLocal() as db:
        assert (
            db.scalar(
                select(NotificationOutbox).where(NotificationOutbox.lead_id == lead["id"])
            ).status
            == "disabled"
        )
    first = call(tc, "POST", f"/teacher/leads/{lead['id']}/convert", {})
    second = call(tc, "POST", f"/teacher/leads/{lead['id']}/convert", {})
    assert first["student_id"] == second["student_id"] and second["already_converted"]


def test_membership_generation_attendance_and_object_scope(scenario):
    tc, sc, ids = scenario
    g, m = group_and_member(tc, ids)
    today = local_today()
    call(
        tc,
        "POST",
        f"/teacher/groups/{g['id']}/memberships",
        {"student_id": str(ids["student"]), "start_date": str(today)},
        409,
    )
    assert (
        call(
            tc,
            "POST",
            f"/teacher/groups/{g['id']}/generate-lessons",
            {"start_date": str(today), "end_date": str(today)},
        )["created"]
        == 1
    )
    assert (
        call(
            tc,
            "POST",
            f"/teacher/groups/{g['id']}/generate-lessons",
            {"start_date": str(today), "end_date": str(today)},
        )["created"]
        == 0
    )
    lesson = call(tc, "GET", "/teacher/lessons")["items"][0]
    values = {"items": [{"student_id": str(ids["student"]), "status": "present"}]}
    call(tc, "PUT", f"/teacher/lessons/{lesson['id']}/attendance", values)
    call(tc, "PUT", f"/teacher/lessons/{lesson['id']}/attendance", values)
    assert call(sc, "GET", "/student/attendance")["total"] == 1
    call(
        tc,
        "PUT",
        f"/teacher/lessons/{lesson['id']}/attendance",
        {"items": [{"student_id": str(ids["other"]), "status": "present"}]},
        422,
    )
    assert call(sc, "GET", f"/teacher/students/{ids['other']}", expected=403)["code"] == "forbidden"
    assert "PRIVATE_NOTE_NEVER_STUDENT" not in str(call(sc, "GET", "/student/profile"))


def test_assignment_submission_revision_feedback_and_idor(scenario):
    tc, sc, ids = scenario
    g, _ = group_and_member(tc, ids)
    a = call(
        tc,
        "POST",
        "/teacher/assignments",
        {
            "group_id": g["id"],
            "title": "NAMUNA assignment",
            "description": "Write five sentences",
            "deadline": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "published": True,
        },
        201,
    )
    first = call(
        sc, "POST", f"/student/assignments/{a['id']}/submission", {"text": "My first answer"}, 201
    )
    second = call(
        sc, "POST", f"/student/assignments/{a['id']}/submission", {"text": "Revised answer"}, 201
    )
    assert first["revision"] == 1 and second["revision"] == 2
    call(
        tc,
        "POST",
        f"/teacher/submission-revisions/{second['id']}/feedback",
        {
            "feedback": "Good work",
            "private_note": "PRIVATE_TEACHER_NOTE",
            "score": "8",
            "max_score": "10",
        },
    )
    detail = call(sc, "GET", f"/student/assignments/{a['id']}")
    assert detail["submission"]["feedback"] == "Good work" and "PRIVATE_TEACHER_NOTE" not in str(
        detail
    )
    outsider = Client(app)
    call(
        outsider,
        "POST",
        "/auth/login",
        {"username": "test-other", "password": "Test-only-Other-Password!"},
    )
    call(outsider, "GET", f"/student/assignments/{a['id']}", expected=404)
    call(outsider, "POST", f"/student/assignments/{a['id']}/submission", {"text": "intrusion"}, 404)


def test_logout_password_change_revokes_sessions(scenario):
    tc, sc, ids = scenario
    second = Client(app)
    call(
        second,
        "POST",
        "/auth/login",
        {"username": "test-student", "password": "Test-only-Student-Password!"},
    )
    call(
        sc,
        "POST",
        "/auth/change-password",
        {
            "current_password": "Test-only-Student-Password!",
            "new_password": "Replacement-Student-Password!",
        },
    )
    call(second, "GET", "/auth/me", expected=401)
    call(sc, "POST", "/auth/logout")
    call(sc, "GET", "/auth/me", expected=401)


def test_monthly_generation_price_snapshot_and_archived_exclusion(scenario):
    tc, sc, ids = scenario
    g, m = group_and_member(tc, ids)
    month = str(local_today())
    first = call(tc, "POST", "/teacher/invoices/generate", {"month": month})
    second = call(tc, "POST", "/teacher/invoices/generate", {"month": month})
    assert len(first["created"]) == 1 and not second["created"]
    with SessionLocal.begin() as db:
        db.get(Group, g["id"]).monthly_price = Decimal("900000")
    assert call(tc, "GET", f"/teacher/invoices/{first['created'][0]}")["amount"] == "600000.00"


def test_parallel_allocations_do_not_overpay_invoice(scenario):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier

    tc, sc, ids = scenario
    inv = invoice(tc, ids)
    call(tc, "POST", f"/teacher/invoices/{inv['id']}/issue")
    payments = []
    for key in ["parallel-one", "parallel-two"]:
        payments.append(
            call(
                tc,
                "POST",
                "/teacher/payments",
                {
                    "student_id": str(ids["student"]),
                    "amount": "600000",
                    "received_at": datetime.now(timezone.utc).isoformat(),
                    "method": "cash",
                },
                201,
                {"idempotency-key": key},
            )
        )
    second = Client(app)
    call(
        second,
        "POST",
        "/auth/login",
        {"username": "test-teacher", "password": "Test-only-Teacher-Password!"},
    )
    barrier = Barrier(2)

    def action(args):
        client, payment = args
        barrier.wait()
        return client.mutate(
            "POST",
            f"/api/v1/teacher/payments/{payment['id']}/allocations",
            [{"invoice_id": inv["id"], "amount": "600000"}],
        )[0]

    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = list(pool.map(action, [(tc, payments[0]), (second, payments[1])]))
    assert sorted(statuses) == [200, 409]
    assert call(sc, "GET", "/student/billing")["debt"] == "0.00"


def test_private_media_and_public_result_consent(scenario, tmp_path, monkeypatch):
    from PIL import Image
    from io import BytesIO
    from app.core.config import get_settings

    tc, sc, ids = scenario
    monkeypatch.setattr(get_settings(), "media_root", tmp_path)
    out = BytesIO()
    Image.new("RGB", (30, 40), "white").save(out, format="PNG")
    data = out.getvalue()
    headers = {"content-type": "application/octet-stream", "x-file-type": "image/png"}
    private = call(tc, "POST", "/teacher/media/uploads", data, 201, headers)
    call(sc, "GET", f"/media/{private['id']}", expected=404)
    public = call(
        tc,
        "POST",
        "/teacher/media/uploads?visibility=public&public_prepared=true&alt=NAMUNA",
        data,
        201,
        headers,
    )
    payload = {
        "kind": "result",
        "title": "NAMUNA result",
        "data": {
            "type": "cefr",
            "student_name": "NAMUNA",
            "exam_date": "2026-01-01",
            "level": "B2",
        },
        "media_id": public["id"],
        "approved": True,
        "consent": False,
    }
    item = call(tc, "POST", "/teacher/content", payload, 201)
    call(tc, "POST", f"/teacher/content/{item['id']}/publish", expected=422)
    call(tc, "PUT", f"/teacher/content/{item['id']}", {**payload, "consent": True})
    call(tc, "POST", f"/teacher/content/{item['id']}/publish")
    assert call(Client(app), "GET", "/public/results")["total"] == 1
    call(tc, "POST", f"/teacher/content/{item['id']}/unpublish")
    assert call(Client(app), "GET", "/public/results")["total"] == 0


def test_session_expiry_and_removed_teacher_password_assignment(scenario):
    from app.db.models import AuthSession

    tc, sc, ids = scenario
    with SessionLocal.begin() as db:
        student = db.get(Student, ids["student"])
        uid = student.user_id
        original_hash = db.get(User, uid).password_hash
        for session in db.scalars(select(AuthSession).where(AuthSession.user_id == uid)):
            session.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    call(sc, "GET", "/auth/me", expected=401)
    call(
        tc,
        "POST",
        f"/teacher/students/{ids['student']}/account",
        {"username": "test-student", "temporary_password": "not-assigned"},
        404,
    )
    with SessionLocal() as db:
        assert db.get(User, uid).password_hash == original_hash
    session = Client(app)
    assert (
        call(
            session,
            "POST",
            "/auth/login",
            {"username": "test-student", "password": "Test-only-Student-Password!"},
        )["must_change_password"]
        is False
    )
    call(session, "GET", "/student/dashboard")


@pytest.mark.parametrize("password", ["1", "  short  ", "🔐" * 300])
def test_self_selected_password_change_and_login(scenario, password):
    teacher_client, _, ids = scenario
    student_client = Client(app)
    phone = "+998930009988"
    call(
        student_client,
        "POST",
        "/auth/register",
        {"full_name": "NAMUNA own password", "phone": phone, "password": password},
        201,
    )
    pending = call(teacher_client, "GET", "/teacher/pending-students")["items"][0]
    call(teacher_client, "POST", f"/teacher/pending-students/{pending['id']}/approve")
    first_login = call(
        student_client, "POST", "/auth/login", {"username": phone, "password": password}
    )
    assert first_login["must_change_password"] is False
    call(
        student_client,
        "POST",
        "/auth/change-password",
        {"current_password": password, "new_password": password},
    )
    call(student_client, "POST", "/auth/logout")
    login = call(student_client, "POST", "/auth/login", {"username": phone, "password": password})
    assert login["role"] == "student" and login["must_change_password"] is False


def test_public_preview_is_repeatable_and_never_real_production_results(
    scenario, tmp_path, monkeypatch
):
    from types import SimpleNamespace
    from app.core.config import get_settings
    from app.db.models import Content, MediaAsset
    from app.modules.content import service
    from app.modules.content.demo import seed_public_preview
    from PIL import Image

    settings = get_settings()
    monkeypatch.setattr(settings, "app_env", "development")
    monkeypatch.setattr(settings, "media_root", tmp_path)
    seed_public_preview()
    seed_public_preview()
    public = Client(app)
    all_results = call(public, "GET", "/public/results?page_size=50")
    assert all_results["total"] == 40
    assert len(all_results["items"]) == 40
    assert all(x["data"]["is_sample"] for x in all_results["items"])
    for kind in ("ielts", "cefr"):
        assert call(public, "GET", f"/public/results?type={kind}&page_size=50")["total"] == 20
    assert (
        len([x for x in call(public, "GET", "/public/site")["content"] if x["kind"] == "result"])
        == 40
    )
    with SessionLocal() as db:
        samples = db.scalars(select(Content).where(Content.kind == "result")).all()
        assert len(samples) == 40
        assert all(not x.consent and not x.approved for x in samples)
        assets = db.scalars(select(MediaAsset)).all()
        assert len(assets) == 40
        for media in assets:
            with Image.open(tmp_path / media.object_key) as image:
                assert image.size == (600, 800)
        monkeypatch.setattr(service, "get_settings", lambda: SimpleNamespace(app_env="production"))
        assert call(public, "GET", "/public/results?page_size=50")["total"] == 0
        assert not [
            x for x in call(public, "GET", "/public/site")["content"] if x["kind"] == "result"
        ]
        with pytest.raises(__import__("fastapi").HTTPException) as error:
            service.publish(db, samples[0])
        assert error.value.status_code == 422


def test_supplied_certificates_replace_samples_idempotently_and_keep_originals_private(
    scenario, tmp_path, monkeypatch
):
    from io import BytesIO
    from PIL import Image
    from types import SimpleNamespace
    from app.core.config import get_settings
    from app.db.models import Content, MediaAsset
    from app.modules.content import service
    from app.modules.content.demo import seed_public_preview
    from pathlib import Path
    from app.modules.content.certificates import load_certificate_specs, import_certificates
    from app.modules.media.service import storage

    _, student_client, _ = scenario
    monkeypatch.setattr(get_settings(), "app_env", "development")
    monkeypatch.setattr(get_settings(), "media_root", tmp_path / "media")
    source = tmp_path / "source"
    source.mkdir()
    manifest = Path("app/modules/content/certificate-import.example.json")
    for index, spec in enumerate(load_certificate_specs(manifest)):
        Image.new("RGB", (600, 800), (20 + index * 30, 52, 86)).save(
            source / spec["filename"], "JPEG"
        )
    seed_public_preview()
    with SessionLocal() as db:
        original_ids = set(db.scalars(select(Content.id).where(Content.kind == "result")))
    import_certificates(source, manifest)
    with SessionLocal() as db:
        first_asset_ids = set(db.scalars(select(MediaAsset.id)))
    import_certificates(source, manifest)
    public = Client(app)
    results = call(public, "GET", "/public/results?page_size=60")
    assert len(results["items"]) == results["total"] == 60
    assert original_ids.issubset({__import__("uuid").UUID(item["id"]) for item in results["items"]})
    for kind in ("ielts", "cefr"):
        page = call(public, "GET", f"/public/results?type={kind}&page_size=60")
        assert page["total"] == len(page["items"]) == 30
        assert all(item["data"]["type"] == kind for item in page["items"])
    assert (
        len([x for x in call(public, "GET", "/public/site")["content"] if x["kind"] == "result"])
        == 60
    )
    call(public, "GET", "/public/results?page_size=100", expected=422)
    with SessionLocal() as db:
        assert set(db.scalars(select(MediaAsset.id))) == first_asset_ids
        samples = db.scalars(select(Content).where(Content.kind == "result")).all()
        assert all(not item.consent and not item.approved for item in samples)
        assert {
            item.published_data["overall"]
            for item in samples
            if item.published_data["type"] == "ielts"
        } == {"5.5"}
        assert {
            item.published_data["cefr_score"]
            for item in samples
            if item.published_data["type"] == "cefr"
        } == {"55", "57"}
        private = db.scalars(select(MediaAsset).where(MediaAsset.visibility == "private")).all()
        assert len(private) == 5
        for asset in private:
            call(public, "GET", f"/media/{asset.id}", expected=401)
            call(student_client, "GET", f"/media/{asset.id}", expected=404)
        public_assets = db.scalars(
            select(MediaAsset).where(
                MediaAsset.visibility == "public", MediaAsset.alt.like("Shaxsiy raqamlari%")
            )
        ).all()
        assert len(public_assets) == 5
        for asset in public_assets:
            with Image.open(BytesIO(storage().read(asset.object_key))) as image:
                assert not image.getexif()
                # Candidate/reference number area is an opaque mask, not CSS hiding.
                pixel = (
                    image.convert("RGB").getpixel(
                        (int(image.width * 0.85), int(image.height * 0.185))
                    )
                    if "IELTS_1" in asset.alt
                    else None
                )
                if pixel:
                    assert all(abs(a - b) < 8 for a, b in zip(pixel, (236, 233, 226)))
        monkeypatch.setattr(service, "get_settings", lambda: SimpleNamespace(app_env="production"))
        assert call(public, "GET", "/public/results?page_size=60")["total"] == 0


def test_owner_confirmed_teacher_facts_publish_and_invalid_draft_stays_private(scenario):
    teacher_client, student_client, _ = scenario
    payload = {
        "kind": "bio",
        "title": "Ustoz haqida",
        "data": {
            "body": "Owner approved teacher biography",
            "experience": "18+ yil",
            "students_taught": "5000+",
        },
    }
    call(student_client, "POST", "/teacher/content", payload, expected=403)
    item = call(teacher_client, "POST", "/teacher/content", payload, expected=201)
    call(teacher_client, "POST", f"/teacher/content/{item['id']}/publish")
    public = Client(app)
    bio = next(x for x in call(public, "GET", "/public/site")["content"] if x["kind"] == "bio")
    assert bio["data"]["experience"] == "18+ yil"
    assert bio["data"]["students_taught"] == "5000+"
    call(
        teacher_client,
        "PUT",
        f"/teacher/content/{item['id']}",
        {**payload, "data": {**payload["data"], "experience": "x" * 41}},
    )
    error = call(teacher_client, "POST", f"/teacher/content/{item['id']}/publish", expected=422)
    assert error["code"] == "invalid_content"
    still_published = next(
        x for x in call(public, "GET", "/public/site")["content"] if x["kind"] == "bio"
    )
    assert still_published["data"]["experience"] == "18+ yil"


def test_payment_correction_delete_preserves_history_and_reopens_debt(scenario):
    tc, sc, ids = scenario
    inv = invoice(tc, ids)
    call(tc, "POST", f"/teacher/invoices/{inv['id']}/issue")
    payload = {
        "student_id": str(ids["student"]),
        "amount": "300000.00",
        "received_at": datetime.now(timezone.utc).isoformat(),
        "method": "cash",
        "allocations": [{"invoice_id": inv["id"], "amount": "300000.00"}],
    }
    payment = call(
        tc, "POST", "/teacher/payments", payload, 201, {"idempotency-key": "correct-receipt"}
    )
    correction = {
        "amount": "200000.00",
        "received_at": payload["received_at"],
        "method": "bank_transfer",
        "reference": "Corrected receipt",
        "reason": "Original amount was mistyped",
    }
    call(sc, "PUT", f"/teacher/payments/{payment['id']}", correction, 403)
    updated = call(tc, "PUT", f"/teacher/payments/{payment['id']}", correction)
    assert updated["amount"] == "200000.00" and updated["unallocated_credit"] == "0.00"
    assert sum(Decimal(a["amount"]) for a in updated["allocations"]) == Decimal("200000")
    assert call(sc, "GET", "/student/billing")["debt"] == "400000.00"
    updated = call(
        tc, "PUT", f"/teacher/payments/{payment['id']}", {**correction, "amount": "700000.00"}
    )
    assert updated["unallocated_credit"] == "500000.00"
    call(tc, "PUT", f"/teacher/payments/{payment['id']}", {**correction, "amount": 123.4}, 422)
    call(tc, "PUT", f"/teacher/payments/{payment['id']}", {**correction, "reason": ""}, 422)
    call(sc, "DELETE", f"/teacher/payments/{payment['id']}", {"reason": "Not allowed"}, 403)
    removed = call(
        tc,
        "DELETE",
        f"/teacher/payments/{payment['id']}",
        {"reason": "Duplicate receipt cancelled"},
    )
    assert removed["void_reason"] == "Duplicate receipt cancelled"
    assert all(Decimal(a["amount"]) == 0 for a in removed["allocations"])
    assert call(sc, "GET", "/student/billing")["debt"] == "600000.00"
    history = call(sc, "GET", "/student/payments")["items"]
    assert len(history) == 1 and history[0]["id"] == payment["id"] and history[0]["void_reason"]
    again = call(
        tc, "DELETE", f"/teacher/payments/{payment['id']}", {"reason": "Repeated deletion"}
    )
    assert again["void_reason"] == removed["void_reason"]
    call(tc, "PUT", f"/teacher/payments/{payment['id']}", correction, 409)
    from app.db.models import AuditLog

    with SessionLocal() as db:
        assert db.scalar(select(AuditLog).where(AuditLog.action == "payment_corrected"))
        assert (
            len(list(db.scalars(select(AuditLog).where(AuditLog.action == "payment_voided")))) == 1
        )


def test_refunded_payment_cannot_be_edited_or_deleted(scenario):
    tc, sc, ids = scenario
    now = datetime.now(timezone.utc).isoformat()
    payment = call(
        tc,
        "POST",
        "/teacher/payments",
        {
            "student_id": str(ids["student"]),
            "amount": "300000.00",
            "received_at": now,
            "method": "cash",
        },
        201,
        {"idempotency-key": "refund-lock"},
    )
    call(
        tc,
        "POST",
        f"/teacher/payments/{payment['id']}/refunds",
        {"amount": "100000.00", "reason": "Partial cash returned"},
    )
    call(
        tc,
        "PUT",
        f"/teacher/payments/{payment['id']}",
        {
            "amount": "500000.00",
            "received_at": now,
            "method": "cash",
            "reason": "Cannot rewrite a refunded receipt",
        },
        409,
    )
    call(
        tc,
        "DELETE",
        f"/teacher/payments/{payment['id']}",
        {"reason": "Cannot delete a refunded receipt"},
        409,
    )
    assert call(tc, "GET", f"/teacher/payments/{payment['id']}")["amount"] == "300000.00"


def test_concurrent_payment_correction_and_allocation_cannot_over_allocate(scenario):
    from concurrent.futures import ThreadPoolExecutor

    tc, _, ids = scenario
    inv = invoice(tc, ids)
    call(tc, "POST", f"/teacher/invoices/{inv['id']}/issue")
    now = datetime.now(timezone.utc).isoformat()
    payment = call(
        tc,
        "POST",
        "/teacher/payments",
        {
            "student_id": str(ids["student"]),
            "amount": "300000.00",
            "received_at": now,
            "method": "cash",
            "allocations": [{"invoice_id": inv["id"], "amount": "100000.00"}],
        },
        201,
        {"idempotency-key": "concurrent-correction"},
    )

    def run(change):
        client = Client(app)
        client.cookies = dict(tc.cookies)
        if change:
            return client.mutate(
                "PUT",
                f"/api/v1/teacher/payments/{payment['id']}",
                {
                    "amount": "150000.00",
                    "received_at": now,
                    "method": "cash",
                    "reason": "Correct concurrent receipt",
                },
            )[0]
        return client.mutate(
            "POST",
            f"/api/v1/teacher/payments/{payment['id']}/allocations",
            [{"invoice_id": inv["id"], "amount": "200000.00"}],
        )[0]

    with ThreadPoolExecutor(max_workers=2) as executor:
        statuses = list(executor.map(run, [True, False]))
    assert statuses[0] == 200 and statuses[1] in (200, 409)
    result = call(tc, "GET", f"/teacher/payments/{payment['id']}")
    assert result["amount"] == "150000.00"
    assert sum(Decimal(a["amount"]) for a in result["allocations"]) <= Decimal("150000")
    assert Decimal(result["unallocated_credit"]) >= 0


def test_group_counts_schedule_update_archive_and_history(scenario):
    from app.db.models import Lesson, Membership

    tc, sc, ids = scenario
    group, member = group_and_member(tc, ids)
    row = call(tc, "GET", "/teacher/groups")["items"][0]
    assert row["student_count"] == 1 and row["course_name"] == "NAMUNA Course"
    assert row["rules"][0]["end_time"] == "17:30"
    call(
        tc,
        "POST",
        f"/teacher/groups/{group['id']}/memberships",
        {"student_id": str(ids["other"]), "start_date": str(local_today() + timedelta(days=1))},
        201,
    )
    assert call(tc, "GET", f"/teacher/groups/{group['id']}")["student_count"] == 1
    new_data = {
        k: group[k] for k in ["course_id", "name", "capacity", "start_date", "monthly_price"]
    }
    new_data.update(
        name="NAMUNA Updated",
        level="B1",
        rules=[{"weekday": local_today().weekday(), "local_time": "18:00", "duration_minutes": 90}],
    )
    call(sc, "PUT", f"/teacher/groups/{group['id']}", new_data, 403)
    edited = call(tc, "PUT", f"/teacher/groups/{group['id']}", new_data)
    assert edited["rules"][0]["end_time"] == "19:30"
    assert (
        call(tc, "GET", f"/teacher/groups/{group['id']}")["memberships"][1]["student_name"]
        == "NAMUNA Student"
    )
    day = str(local_today() + timedelta(days=7))
    call(
        tc,
        "POST",
        f"/teacher/groups/{group['id']}/generate-lessons",
        {"start_date": day, "end_date": day},
    )
    from uuid import UUID

    with SessionLocal.begin() as db:
        past = datetime.now(timezone.utc) - timedelta(days=1)
        lesson = Lesson(
            group_id=UUID(group["id"]),
            starts_at=past,
            ends_at=past + timedelta(minutes=90),
            original_starts_at=past,
            status="completed",
        )
        db.add(lesson)
        db.flush()
        past_id = lesson.id
    call(sc, "DELETE", f"/teacher/groups/{group['id']}", {"reason": "Not permitted"}, 403)
    removed = call(
        tc, "DELETE", f"/teacher/groups/{group['id']}", {"reason": "Course group closed"}
    )
    assert removed["deleted_at"] is not None and removed["student_count"] == 0
    assert call(tc, "GET", "/teacher/groups")["total"] == 0
    assert call(tc, "GET", f"/teacher/groups/{group['id']}")["deleted_at"] is not None
    with SessionLocal() as db:
        assert db.get(Lesson, past_id).status == "completed"
        assert len(list(db.scalars(select(Membership)))) == 2
        assert all(
            x.status == "cancelled"
            for x in db.scalars(select(Lesson).where(Lesson.starts_at > datetime.now(timezone.utc)))
        )
    call(
        tc,
        "POST",
        f"/teacher/groups/{group['id']}/memberships",
        {"student_id": str(ids["student"]), "start_date": str(local_today())},
        409,
    )


def test_certificate_atomic_publish_edit_delete_student_scope_and_revision(
    scenario, tmp_path, monkeypatch
):
    from PIL import Image
    from io import BytesIO
    from app.core.config import get_settings

    tc, sc, ids = scenario
    monkeypatch.setattr(get_settings(), "media_root", tmp_path)
    out = BytesIO()
    Image.new("RGB", (30, 40), "white").save(out, format="PNG")
    asset = call(
        tc,
        "POST",
        "/teacher/media/uploads?visibility=public&public_prepared=true&alt=Prepared%20certificate",
        out.getvalue(),
        201,
        {"content-type": "application/octet-stream", "x-file-type": "image/png"},
    )
    public = Client(app)
    revision = call(public, "GET", "/public/revision")["revision"]
    payload = {
        "title": "NAMUNA real workflow certificate",
        "student_id": str(ids["student"]),
        "data": {
            "type": "cefr",
            "student_name": "Consented display name",
            "exam_date": "2026-11-01",
            "level": "B2",
        },
        "media_id": asset["id"],
        "approved": True,
        "consent": True,
        "published": True,
    }
    call(sc, "POST", "/teacher/certificates", payload, 403)
    call(tc, "POST", "/teacher/certificates", {**payload, "consent": False}, 422)
    assert call(tc, "GET", "/teacher/certificates")["total"] == 0
    created = call(tc, "POST", "/teacher/certificates", payload, 201)
    assert created["published"] and created["student_id"] == str(ids["student"])
    assert call(tc, "GET", "/teacher/certificates?q=Consented")["total"] == 1
    assert call(public, "GET", "/public/revision")["revision"] != revision
    rows = call(public, "GET", "/public/results")["items"]
    assert rows[0]["id"] == created["id"] and "student_id" not in __import__("json").dumps(rows[0])
    assert call(sc, "GET", "/student/certificates")["items"][0]["id"] == created["id"]
    other = Client(app)
    call(
        other,
        "POST",
        "/auth/login",
        {"username": "test-other", "password": "Test-only-Other-Password!"},
    )
    assert call(other, "GET", "/student/certificates")["total"] == 0
    call(other, "GET", f"/student/certificates/{created['id']}", expected=404)
    call(sc, "PUT", f"/teacher/certificates/{created['id']}", payload, 403)
    updated_payload = {**payload, "data": {**payload["data"], "level": "C1"}}
    call(tc, "PUT", f"/teacher/certificates/{created['id']}", updated_payload)
    assert call(public, "GET", "/public/results")["items"][0]["data"]["level"] == "C1"
    assert call(sc, "GET", "/student/certificates")["items"][0]["data"]["level"] == "C1"
    call(
        tc,
        "PUT",
        f"/teacher/certificates/{created['id']}",
        {**updated_payload, "consent": False},
        422,
    )
    assert call(public, "GET", "/public/results")["total"] == 1
    call(sc, "DELETE", f"/teacher/certificates/{created['id']}", expected=403)
    call(tc, "DELETE", f"/teacher/certificates/{created['id']}")
    call(tc, "DELETE", f"/teacher/certificates/{created['id']}")
    assert call(public, "GET", "/public/results")["total"] == 0
    assert call(sc, "GET", "/student/certificates")["total"] == 0
    assert call(tc, "GET", "/teacher/certificates")["total"] == 0
    call(tc, "POST", f"/teacher/content/{created['id']}/publish", expected=409)


def test_validation_and_export_ui_text_is_uzbek(scenario):
    tc, _, ids = scenario
    status, data, _ = tc.mutate("POST", "/api/v1/teacher/students", {"full_name": "A"})
    assert status == 422
    assert data["field_errors"]["phone"] == "Bu maydonni to‘ldiring"
    assert "Kamida" in data["field_errors"]["full_name"]
    assert all(
        "Field required" not in msg and "String should" not in msg
        for msg in data["field_errors"].values()
    )
    from io import BytesIO
    from openpyxl import load_workbook

    status, content, headers = tc.request(
        "GET", "/api/v1/teacher/reports/export.xlsx?resource=students"
    )
    assert status == 200 and "spreadsheetml" in headers["content-type"]
    book = load_workbook(BytesIO(content))
    assert book["O‘quvchilar"]["B6"].value == "Ism va familiya"
    assert "Faol" not in [c.value for row in book["O‘quvchilar"] for c in row]


def test_quick_membership_defaults_dates_and_keeps_guards(scenario, monkeypatch):
    tc, sc, ids = scenario
    day = local_today()
    monkeypatch.setattr("app.modules.groups.service.local_today", lambda: day)
    group = call(
        tc,
        "POST",
        "/teacher/groups",
        {
            "course_id": str(ids["course"]),
            "name": "NAMUNA Quick enrollment",
            "capacity": 1,
            "start_date": str(day - timedelta(days=10)),
            "monthly_price": "600000",
            "rules": [],
        },
        201,
    )
    path = f"/teacher/groups/{group['id']}/memberships"
    member = call(tc, "POST", path, {"student_id": str(ids["student"])}, 201)
    assert member["start_date"] == str(day) and member["end_date"] is None
    call(tc, "POST", path, {"student_id": str(ids["student"])}, 409)
    call(tc, "POST", path, {"student_id": str(ids["other"])}, 409)
    call(sc, "POST", path, {"student_id": str(ids["other"])}, 403)
    future = call(
        tc,
        "POST",
        "/teacher/groups",
        {
            "course_id": str(ids["course"]),
            "name": "NAMUNA Future bounded group",
            "capacity": 5,
            "start_date": str(day + timedelta(days=5)),
            "end_date": str(day + timedelta(days=20)),
            "monthly_price": "600000",
            "rules": [],
        },
        201,
    )
    member = call(
        tc,
        "POST",
        f"/teacher/groups/{future['id']}/memberships",
        {"student_id": str(ids["student"])},
        201,
    )
    assert member["start_date"] == future["start_date"]
    assert member["end_date"] == str(day + timedelta(days=21))
    explicit = call(
        tc,
        "POST",
        path,
        {
            "student_id": str(ids["student"]),
            "start_date": str(day - timedelta(days=4)),
            "end_date": str(day - timedelta(days=1)),
        },
        201,
    )
    assert explicit["start_date"] == str(day - timedelta(days=4))


def test_invoice_lookup_search_respects_student_and_status_filters(scenario):
    tc, sc, ids = scenario
    inv = invoice(tc, ids)
    for term in ["NAMUNA Student", "600000", inv["period_start"]]:
        result = call(tc, "GET", f"/teacher/invoices?status=draft&q={term}")
        assert [row["id"] for row in result["items"]] == [inv["id"]]
        assert result["total"] == 1
    assert call(tc, "GET", "/teacher/invoices?q=no-such-invoice")["total"] == 0
    assert call(tc, "GET", f"/teacher/invoices?q=600000&student_id={ids['other']}")["total"] == 0
    assert call(tc, "GET", "/teacher/invoices?q=600000&status=issued")["total"] == 0


def test_student_registration_approval_and_bulk_flow(scenario):
    tc, _, ids = scenario
    anon = Client(app)

    # 1. Student self-registers
    reg_data = {
        "full_name": "Azizbek Rahimov",
        "phone": "+998939998877",
        "password": "AzizPassword123!",
        "course_id": str(ids["course"]),
    }
    status, res, _ = anon.mutate("POST", "/api/v1/auth/register", reg_data)
    assert status == 201, res
    assert res["status"] == "pending"
    assert "Arizangiz ko‘rib chiqilmoqda" in res["message"]

    # 2. Duplicate registration attempt with same phone
    status_dup, res_dup, _ = anon.mutate("POST", "/api/v1/auth/register", reg_data)
    assert status_dup == 409
    assert res_dup["code"] == "pending_approval"

    # 3. Student tries to login before approval -> 403 pending_approval
    status_login, res_login, _ = anon.mutate(
        "POST", "/api/v1/auth/login", {"username": "+998939998877", "password": "AzizPassword123!"}
    )
    assert status_login == 403
    assert res_login["code"] == "pending_approval"
    assert "Arizangiz ko‘rib chiqilmoqda" in res_login["message"]

    # 4. Teacher checks pending students
    pending = call(tc, "GET", "/teacher/pending-students")
    assert pending["total"] >= 1
    found = [p for p in pending["items"] if p["phone"] == "+998939998877"]
    assert len(found) == 1
    student_record = found[0]
    assert student_record["full_name"] == "Azizbek Rahimov"
    assert student_record["course_name"] == "NAMUNA Course"

    # 5. Teacher approves student
    approve_res = call(tc, "POST", f"/teacher/pending-students/{student_record['id']}/approve")
    assert "tasdiqlandi" in approve_res["message"]

    # 6. Student can now log in successfully with normalized phone or 9 digits
    student_client = Client(app)
    s_status, s_data, _ = student_client.mutate(
        "POST", "/api/v1/auth/login", {"username": "939998877", "password": "AzizPassword123!"}
    )
    assert s_status == 200, s_data
    assert s_data["role"] == "student"

    # 7. Test bulk approve
    anon2 = Client(app)
    anon3 = Client(app)
    call(
        anon2,
        "POST",
        "/auth/register",
        {"full_name": "Student Bulk One", "phone": "+998931112233", "password": "BulkPassword1!"},
        201,
    )
    call(
        anon3,
        "POST",
        "/auth/register",
        {"full_name": "Student Bulk Two", "phone": "+998934445566", "password": "BulkPassword2!"},
        201,
    )

    pending_before = call(tc, "GET", "/teacher/pending-students")
    assert pending_before["total"] == 2

    # Bulk approve all
    bulk_res = call(tc, "POST", "/teacher/pending-students/approve-all")
    assert bulk_res["approved_count"] == 2

    # Verify no more pending
    pending_after = call(tc, "GET", "/teacher/pending-students")
    assert pending_after["total"] == 0

    # Both students can now log in
    for ph, pw in [("+998931112233", "BulkPassword1!"), ("+998934445566", "BulkPassword2!")]:
        c = Client(app)
        st, dt, _ = c.mutate("POST", "/api/v1/auth/login", {"username": ph, "password": pw})
        assert st == 200 and dt["role"] == "student"


@pytest.mark.parametrize("course_state", ["missing", "deleted", "unpublished"])
def test_registration_rejects_unavailable_course_without_creating_accounts(scenario, course_state):
    from uuid import uuid4
    from sqlalchemy import func

    _, _, ids = scenario
    course_id = ids["course"]
    with SessionLocal.begin() as db:
        if course_state == "missing":
            course_id = uuid4()
        else:
            course = db.get(Course, course_id)
            setattr(
                course,
                "deleted_at" if course_state == "deleted" else "published",
                datetime.now(timezone.utc) if course_state == "deleted" else False,
            )
        before = db.scalar(select(func.count(User.id)))
    status, result, _ = Client(app).mutate(
        "POST",
        "/api/v1/auth/register",
        {
            "full_name": "NAMUNA Invalid Course",
            "phone": "+998930001100",
            "password": "x",
            "course_id": str(course_id),
        },
    )
    assert status == 422 and result["code"] == "invalid_course"
    with SessionLocal() as db:
        assert db.scalar(select(func.count(User.id))) == before
        assert db.scalar(select(Student).where(Student.phone == "+998930001100")) is None


@pytest.mark.parametrize("password", ["x", " ", "  x  "])
def test_registration_preserves_unrestricted_password_through_approval(scenario, password):
    tc, _, _ = scenario
    call(
        Client(app),
        "POST",
        "/auth/register",
        {
            "full_name": "NAMUNA Password",
            "phone": "+998930001122",
            "password": password,
        },
        201,
    )
    pending = call(tc, "GET", "/teacher/pending-students")
    student_id = pending["items"][0]["id"]
    call(tc, "POST", f"/teacher/pending-students/{student_id}/approve")
    call(Client(app), "POST", "/auth/login", {"username": "930001122", "password": password})


def test_approval_excludes_existing_paused_accounts_and_unrelated_leads(scenario):
    from app.db.models import LeadHistory

    tc, sc, ids = scenario
    with SessionLocal.begin() as db:
        existing = db.get(Student, ids["student"])
        existing.legacy_status = "paused"
        db.get(User, existing.user_id).active = False
        db.add(
            Lead(
                full_name=existing.full_name,
                phone=existing.phone,
                student_id=existing.id,
                source="/contact",
                status="new",
            )
        )
    # An intentionally disabled existing account must not become a signup request.
    assert call(tc, "GET", "/teacher/pending-students")["total"] == 0
    assert call(tc, "GET", "/teacher/dashboard")["pending_students"] == 0
    for action in ("approve", "reject"):
        call(tc, "POST", f"/teacher/pending-students/{ids['student']}/{action}", expected=409)
    result = Client(app).mutate(
        "POST",
        "/api/v1/auth/login",
        {
            "username": "test-student",
            "password": "Test-only-Student-Password!",
        },
    )
    assert result[0] == 401 and result[1]["code"] == "invalid_credentials"

    call(
        Client(app),
        "POST",
        "/auth/register",
        {
            "full_name": "NAMUNA Pending",
            "phone": "+998930001133",
            "password": "x",
        },
        201,
    )
    with SessionLocal.begin() as db:
        pending = db.scalar(select(Student).where(Student.phone == "+998930001133"))
        new_id = pending.id
        db.add(
            Lead(
                full_name=pending.full_name,
                phone=pending.phone,
                student_id=pending.id,
                source="/contact",
                status="new",
            )
        )
    assert call(tc, "GET", "/teacher/pending-students")["total"] == 1
    assert call(tc, "GET", "/teacher/dashboard")["pending_students"] == 1
    assert call(tc, "POST", "/teacher/pending-students/approve-all")["approved_count"] == 1
    with SessionLocal() as db:
        assert db.get(Student, ids["student"]).legacy_status == "paused"
        assert not db.get(User, existing.user_id).active
        leads = db.scalars(select(Lead).where(Lead.student_id == new_id)).all()
        assert {lead.source: lead.status for lead in leads} == {
            "cabinet_signup": "converted",
            "/contact": "new",
        }
        signup = next(lead for lead in leads if lead.source == "cabinet_signup")
        assert db.scalar(select(LeadHistory).where(LeadHistory.lead_id == signup.id)) is not None


def test_rejected_registration_cannot_login_or_be_approved_again(scenario):
    tc, sc, _ = scenario
    call(
        Client(app),
        "POST",
        "/auth/register",
        {
            "full_name": "NAMUNA Rejected",
            "phone": "+998930001144",
            "password": "x",
        },
        201,
    )
    student_id = call(tc, "GET", "/teacher/pending-students")["items"][0]["id"]
    call(sc, "GET", "/teacher/pending-students", expected=403)
    call(sc, "POST", f"/teacher/pending-students/{student_id}/approve", expected=403)
    call(sc, "POST", "/teacher/pending-students/approve-all", expected=403)
    call(tc, "POST", f"/teacher/pending-students/{student_id}/reject")
    rejected = call(
        Client(app),
        "POST",
        "/auth/login",
        {
            "username": "+998930001144",
            "password": "x",
        },
        403,
    )
    assert rejected["code"] == "account_deleted"
    call(tc, "POST", f"/teacher/pending-students/{student_id}/approve", expected=409)
    assert call(tc, "POST", "/teacher/pending-students/approve-all")["approved_count"] == 0


def test_dashboard_series_use_tashkent_dates_exact_money_and_current_memberships(scenario):
    from datetime import date
    from uuid import UUID
    from app.db.models import Attendance, Lesson, Membership, Refund

    tc, _, ids = scenario
    for key, amount, instant, method in (
        ("first", "100000.01", "2026-10-31T20:00:00Z", "cash"),
        ("second", "200000.02", "2026-11-02T20:00:00Z", "bank_transfer"),
        ("previous", "50000.03", "2026-10-31T18:59:00Z", "other"),
    ):
        result = call(
            tc,
            "POST",
            "/teacher/payments",
            {
                "student_id": str(ids["student"]),
                "amount": amount,
                "received_at": instant,
                "method": method,
                "reference": "NAMUNA dashboard",
            },
            201,
            headers={"idempotency-key": f"dashboard-{key}"},
        )
        if key == "previous":
            call(
                tc,
                "POST",
                f"/teacher/payments/{result['id']}/refunds",
                {"amount": "10000.01", "reason": "NAMUNA refund"},
            )
            with SessionLocal.begin() as db:
                db.scalar(
                    select(Refund).where(Refund.payment_id == UUID(result["id"]))
                ).created_at = datetime.fromisoformat("2026-11-01T20:00:00+00:00")
    void = call(
        tc,
        "POST",
        "/teacher/payments",
        {
            "student_id": str(ids["student"]),
            "amount": "999999.99",
            "received_at": "2026-11-02T10:00:00Z",
            "method": "cash",
        },
        201,
        headers={"idempotency-key": "dashboard-void"},
    )
    call(tc, "DELETE", f"/teacher/payments/{void['id']}", {"reason": "NAMUNA wrong payment"})
    call(
        Client(app),
        "POST",
        "/auth/register",
        {"full_name": "NAMUNA Pending Chart", "phone": "+998930001155", "password": "x"},
        201,
    )
    today = local_today()
    with SessionLocal.begin() as db:
        db.get(Student, ids["other"]).legacy_status = "paused"
        db.get(Student, ids["other"]).created_at = datetime.fromisoformat(
            "2026-10-31T18:59:00+00:00"
        )
        db.get(Student, ids["student"]).created_at = datetime.fromisoformat(
            "2026-10-31T20:00:00+00:00"
        )
        db.add_all(
            [
                Student(
                    full_name="NAMUNA Left",
                    phone="+998930001166",
                    joined_on=today,
                    legacy_status="left",
                ),
                Student(
                    full_name="NAMUNA Archive",
                    phone="+998930001177",
                    joined_on=today,
                    deleted_at=datetime.now(timezone.utc),
                ),
            ]
        )
        group = Group(
            course_id=ids["course"],
            name="NAMUNA Chart",
            capacity=1,
            start_date=date(2026, 10, 1),
            monthly_price=Decimal("100000"),
        )
        empty = Group(
            course_id=ids["course"],
            name="NAMUNA Empty",
            capacity=3,
            start_date=today,
            monthly_price=Decimal("100000"),
        )
        archived = Group(
            course_id=ids["course"],
            name="NAMUNA Hidden",
            capacity=5,
            start_date=today,
            monthly_price=Decimal("100000"),
            deleted_at=datetime.now(timezone.utc),
        )
        db.add_all([group, empty, archived])
        db.flush()
        db.add_all(
            [
                Membership(
                    student_id=ids["student"], group_id=group.id, start_date=date(2026, 10, 30)
                ),
                Membership(
                    student_id=ids["other"],
                    group_id=group.id,
                    start_date=date(2026, 10, 30),
                    end_date=today,
                ),
                Membership(
                    student_id=ids["other"], group_id=empty.id, start_date=today + timedelta(days=1)
                ),
                Membership(student_id=ids["student"], group_id=archived.id, start_date=today),
            ]
        )
        for day, state in (
            ("2026-10-31", "completed"),
            ("2026-11-01", "completed"),
            ("2026-11-02", "cancelled"),
        ):
            begins = datetime.fromisoformat(day + "T08:00:00+00:00")
            lesson = Lesson(
                group_id=group.id,
                starts_at=begins,
                original_starts_at=begins,
                ends_at=begins + timedelta(hours=1),
                status=state,
            )
            db.add(lesson)
            db.flush()
            if day == "2026-11-01":
                db.add_all(
                    [
                        Attendance(
                            student_id=ids["student"],
                            lesson_id=lesson.id,
                            status="present",
                            actor_id=ids["teacher"],
                        ),
                        Attendance(
                            student_id=ids["other"],
                            lesson_id=lesson.id,
                            status="excused",
                            actor_id=ids["teacher"],
                        ),
                    ]
                )
            if state == "cancelled":
                db.add(
                    Attendance(
                        student_id=ids["student"],
                        lesson_id=lesson.id,
                        status="absent",
                        actor_id=ids["teacher"],
                    )
                )
    result = call(tc, "GET", "/teacher/dashboard?month=2026-11-01")
    charts = result["analytics"]
    assert result["received"] == "300000.03"
    assert result["refunded"] == "10000.01"
    assert result["net_receipts"] == "290000.02"
    assert sum(Decimal(p["received"]) for p in charts["daily_finance"]) == Decimal(
        result["received"]
    )
    assert len(charts["daily_finance"]) == 30 and len(charts["monthly"]) == 6
    by_day = {p["date"]: p for p in charts["daily_finance"]}
    assert by_day["2026-11-01"]["received"] == "100000.01"
    assert by_day["2026-11-02"]["refunded"] == "10000.01"
    assert charts["monthly"][-2]["received"] == "50000.03"
    assert charts["monthly"][-1]["net"] == result["net_receipts"]
    assert sum(Decimal(p["amount"]) for p in charts["payment_methods"]) == Decimal(
        result["received"]
    )
    assert charts["student_total"] == result["student_count"] == 3
    assert {p["kind"]: p["count"] for p in charts["student_groups"]} == {
        "assigned": 1,
        "unassigned": 2,
    }
    assert "student_status" not in charts and "active_students" not in result
    assert charts["group_totals"] == {"groups": 2, "capacity": 4, "occupied": 1}
    assert {g["name"]: g["students"] for g in charts["groups"]} == {
        "NAMUNA Chart": 1,
        "NAMUNA Empty": 0,
    }
    assert {p["status"]: p["count"] for p in charts["attendance"]} == {
        "present": 1,
        "late": 0,
        "absent": 0,
        "excused": 1,
    }
    assert result["attendance_percent"] == 50.0 and result["unmarked_attendance"] == 0
    assert "private_note" not in str(charts) and "password" not in str(charts)


def test_dashboard_handles_empty_month_and_denies_non_teacher(scenario):
    from sqlalchemy import delete

    tc, sc, _ = scenario
    with SessionLocal.begin() as db:
        db.execute(delete(Student))
    result = call(tc, "GET", "/teacher/dashboard?month=2026-02-01")
    analytics = result["analytics"]
    assert analytics["student_total"] == 0
    assert analytics["groups"] == [] and analytics["group_totals"] == {
        "groups": 0,
        "capacity": 0,
        "occupied": 0,
    }
    assert len(analytics["daily_finance"]) == 28
    assert all(
        p["received"] == p["refunded"] == p["net"] == "0.00" for p in analytics["daily_finance"]
    )
    assert result["attendance_percent"] is None
    call(sc, "GET", "/teacher/dashboard", expected=403)
    call(Client(app), "GET", "/teacher/dashboard", expected=401)
    call(tc, "GET", "/teacher/dashboard?month=9999-12-01", expected=422)
    future = call(tc, "GET", "/teacher/dashboard?month=2027-02-01")
    assert all(not p["observed"] for p in future["analytics"]["daily_finance"])
    assert not future["analytics"]["monthly"][-1]["observed"]


def test_removed_activity_fields_and_legacy_states_have_no_business_effect(scenario):
    tc, sc, ids = scenario
    with SessionLocal.begin() as db:
        db.get(Student, ids["student"]).legacy_status = "paused"
        db.get(Student, ids["other"]).legacy_status = "left"
    g, m = group_and_member(tc, ids)
    from uuid import UUID

    with SessionLocal.begin() as db:
        db.get(Group, UUID(g["id"])).legacy_status = "ended"
    assert call(tc, "GET", "/teacher/students")["total"] == 2
    assert "status" not in call(tc, "GET", f"/teacher/students/{ids['student']}")
    call(tc, "PATCH", f"/teacher/students/{ids['student']}", {"status": "active"}, 422)
    group_payload = {
        "course_id": str(ids["course"]),
        "name": "NAMUNA",
        "start_date": str(local_today()),
        "monthly_price": "100",
        "status": "paused",
    }
    call(tc, "POST", "/teacher/groups", group_payload, 422)
    call(
        tc,
        "POST",
        "/teacher/courses",
        {"name": "NAMUNA", "slug": "removed-field", "short_description": "Test", "active": False},
        422,
    )
    inv = invoice(tc, ids)
    assert inv["amount"] == "600000.00"
    call(
        tc, "POST", f"/teacher/groups/{g['id']}/memberships", {"student_id": str(ids["other"])}, 201
    )
    dashboard = call(tc, "GET", "/teacher/dashboard")
    assert dashboard["student_count"] == 2 and dashboard["group_count"] == 1
    assert "active_students" not in dashboard and "active_groups" not in dashboard
    assert dashboard["analytics"]["student_groups"] == [
        {"kind": "assigned", "count": 2},
        {"kind": "unassigned", "count": 0},
    ]


def test_deletion_frees_places_revokes_access_and_preserves_financial_history(scenario):
    from uuid import UUID
    from app.db.models import Membership, Lesson

    tc, sc, ids = scenario
    g, m = group_and_member(tc, ids)
    with SessionLocal.begin() as db:
        db.get(Group, UUID(g["id"])).capacity = 1
    inv = invoice(tc, ids)
    call(tc, "POST", f"/teacher/invoices/{inv['id']}/issue")
    call(
        tc, "POST", f"/teacher/groups/{g['id']}/memberships", {"student_id": str(ids["other"])}, 409
    )
    call(tc, "DELETE", f"/teacher/students/{ids['student']}", {"reason": "NAMUNA test deletion"})
    assert call(tc, "GET", "/teacher/students")["total"] == 1
    call(sc, "GET", "/student/dashboard", expected=401)
    call(
        tc,
        "POST",
        f"/teacher/students/{ids['student']}/account",
        {"username": "deleted", "temporary_password": "x"},
        404,
    )
    call(
        tc,
        "POST",
        f"/teacher/groups/{g['id']}/memberships",
        {"student_id": str(ids["student"])},
        409,
    )
    today = local_today()
    call(
        tc,
        "POST",
        "/teacher/invoices",
        {
            "student_id": str(ids["student"]),
            "period_start": str(today),
            "period_end": str(today + timedelta(days=30)),
            "due_date": str(today),
            "amount": "100",
        },
        409,
    )
    call(
        tc, "POST", f"/teacher/groups/{g['id']}/memberships", {"student_id": str(ids["other"])}, 201
    )
    # An old debt can still be paid after deletion; no historical invoice is erased.
    payment = call(
        tc,
        "POST",
        "/teacher/payments",
        {
            "student_id": str(ids["student"]),
            "amount": "100",
            "received_at": datetime.now(timezone.utc).isoformat(),
            "method": "cash",
            "allocations": [{"invoice_id": inv["id"], "amount": "100"}],
        },
        201,
        {"idempotency-key": "deleted-student-payment"},
    )
    assert payment["amount"] == "100.00"
    assert call(tc, "GET", f"/teacher/invoices/{inv['id']}")["paid"] == "100.00"
    members = call(tc, "GET", f"/teacher/groups/{g['id']}")["memberships"]
    assert (
        next(row for row in members if row["student_id"] == str(ids["student"]))["is_current"]
        is False
    )
    call(tc, "DELETE", f"/teacher/courses/{ids['course']}", {"reason": "NAMUNA"}, 409)
    future = datetime.now(timezone.utc) + timedelta(days=1)
    with SessionLocal.begin() as db:
        lesson = Lesson(
            group_id=UUID(g["id"]),
            starts_at=future,
            ends_at=future + timedelta(hours=1),
            original_starts_at=future,
        )
        db.add(lesson)
        db.flush()
        lesson_id = lesson.id
    call(tc, "DELETE", f"/teacher/groups/{g['id']}", {"reason": "NAMUNA"})
    assert call(tc, "GET", "/teacher/groups")["total"] == 0
    call(
        tc,
        "POST",
        "/teacher/assignments",
        {
            "group_id": g["id"],
            "title": "NAMUNA",
            "description": "NAMUNA test task",
            "deadline": future.isoformat(),
        },
        409,
    )
    call(
        tc,
        "POST",
        "/teacher/materials",
        {"group_id": g["id"], "title": "NAMUNA", "link": "https://example.test/material"},
        409,
    )
    call(
        tc,
        "POST",
        "/teacher/assessments",
        {
            "group_id": g["id"],
            "student_id": str(ids["other"]),
            "title": "NAMUNA",
            "score": "1",
            "max_score": "10",
        },
        409,
    )
    call(
        tc,
        "POST",
        f"/teacher/groups/{g['id']}/generate-lessons",
        {"start_date": str(today), "end_date": str(today + timedelta(days=1))},
        409,
    )
    call(tc, "DELETE", f"/teacher/courses/{ids['course']}", {"reason": "NAMUNA"})
    assert call(tc, "GET", "/teacher/courses")["total"] == 0
    assert call(Client(app), "GET", "/public/courses")["items"] == []
    with SessionLocal() as db:
        assert db.get(Membership, UUID(m["id"])) is not None
        assert db.get(Lesson, lesson_id).status == "cancelled"
        assert db.get(Student, ids["student"]).deleted_at is not None


def read_excel(client, resource="all", month=None):
    from io import BytesIO
    from openpyxl import load_workbook

    suffix = "&month=" + str(month) if month else ""
    status, content, headers = client.request(
        "GET", "/api/v1/teacher/reports/export.xlsx?resource=" + resource + suffix
    )
    assert status == 200, content
    assert content[:4] == b"PK\x03\x04"
    assert "spreadsheetml" in headers["content-type"]
    assert ".xlsx" in headers["content-disposition"]
    assert "no-store" in headers["cache-control"]
    return load_workbook(BytesIO(content)), content


def test_excel_reports_are_teacher_only_and_real_workbooks(scenario):
    tc, sc, ids = scenario
    call(Client(app), "GET", "/teacher/reports/export.xlsx", expected=401)
    call(sc, "GET", "/teacher/reports/export.xlsx", expected=403)
    call(tc, "GET", "/teacher/reports/export.xlsx?resource=passwords", expected=422)
    call(tc, "GET", "/teacher/reports/export.xlsx?month=0001-01-01", expected=422)
    call(tc, "GET", "/teacher/reports/export.csv?resource=students", expected=404)
    group_and_member(tc, ids)
    book, data = read_excel(tc)
    assert book.sheetnames == [
        "Umumiy",
        "O‘quvchilar",
        "Guruhlar",
        "Yangi arizalar",
        "Qarzdorlik",
        "Hisoblar",
        "To‘lovlar",
        "Qaytarishlar",
        "Taqsimotlar",
        "Murojaatlar",
        "Davomat",
        "Baholar",
        "Oylik moliya",
    ]
    assert book["Umumiy"]["C9"].value == 2
    assert book["Umumiy"]["C10"].value == 1
    assert len(book["Umumiy"]._charts) == 1
    assert book["O‘quvchilar"].freeze_panes == "C7"
    assert book["O‘quvchilar"].auto_filter.ref == "A6:I8"
    assert book["O‘quvchilar"]["C7"].value.startswith("+998")
    assert book["O‘quvchilar"]["C7"].data_type == "s"
    assert book["O‘quvchilar"]["E7"].is_date
    from zipfile import ZipFile
    from io import BytesIO

    with ZipFile(BytesIO(data)) as z:
        body = "".join(z.read(n).decode() for n in z.namelist() if n.endswith(".xml"))
    assert "PRIVATE_NOTE_NEVER_STUDENT" not in body
    assert "password_hash" not in body and "token_hash" not in body


def test_excel_finance_reconciles_adjustments_refunds_voids_and_deleted_students(
    scenario, tmp_path
):
    tc, sc, ids = scenario
    group_and_member(tc, ids)
    inv = invoice(tc, ids)
    call(
        tc,
        "POST",
        f"/teacher/invoices/{inv['id']}/adjustments",
        {"amount": "-100000", "reason": "NAMUNA discount"},
    )
    call(tc, "POST", f"/teacher/invoices/{inv['id']}/issue")
    payment = call(
        tc,
        "POST",
        "/teacher/payments",
        {
            "student_id": str(ids["student"]),
            "amount": "400000.01",
            "received_at": datetime.now(timezone.utc).isoformat(),
            "method": "cash",
            "reference": '=HYPERLINK("https://example.test", "test")',
            "allocations": [{"invoice_id": inv["id"], "amount": "300000"}],
        },
        201,
        {"idempotency-key": "excel-pay"},
    )
    call(
        tc,
        "POST",
        f"/teacher/payments/{payment['id']}/refunds",
        {"amount": "50000.01", "reason": "NAMUNA refund"},
    )
    void = call(
        tc,
        "POST",
        "/teacher/payments",
        {
            "student_id": str(ids["student"]),
            "amount": "99000",
            "received_at": datetime.now(timezone.utc).isoformat(),
            "method": "cash",
        },
        201,
        {"idempotency-key": "excel-void"},
    )
    call(tc, "DELETE", f"/teacher/payments/{void['id']}", {"reason": "NAMUNA erroneous"})
    call(tc, "DELETE", f"/teacher/students/{ids['student']}", {"reason": "NAMUNA removed"})
    book, content = read_excel(tc)
    sheet = book["Umumiy"]
    assert sheet["C9"].value == 1
    assert sheet["C12"].value == 400000.01
    assert sheet["C13"].value == 50000.01
    assert sheet["C14"].value == 350000
    assert sheet["C15"].value == 200000
    assert sheet["C16"].value == 200000
    assert sheet["C17"].value == 50000
    assert book["Hisoblar"]["J7"].value == -100000
    assert book["Hisoblar"]["K7"].value == 500000
    assert book["Hisoblar"]["M7"].value == 200000
    assert book["Qarzdorlik"]["G7"].is_date
    reference = book["To‘lovlar"]["K7"]
    assert reference.value.startswith("=HYPERLINK") and reference.data_type == "s"
    assert reference.hyperlink is None
    for worksheet in book:
        assert all(c.data_type != "f" for row in worksheet for c in row)
    from datetime import date

    previous, _ = read_excel(tc, "finance", date(2026, 10, 1))
    assert previous["Umumiy"]["C5"].value.date() == date(2026, 10, 1)
    assert previous["Umumiy"]["C12"].value == 0
    assert previous["Umumiy"]["C15"].value == 200000
    assert previous["Oylik moliya"]["B7"].value.date() == date(2026, 10, 1)
    assert previous["Oylik moliya"]["B37"].value.date() == date(2026, 10, 31)
    # Only disposable fixture output is retained for visual QA, never owner data.
    artifact = Path(__file__).parents[2] / ".local/excel-fixture.xlsx"
    artifact.write_bytes(content)


def test_excel_exports_more_than_ten_thousand_rows_without_truncation(scenario):
    from sqlalchemy import insert

    tc, _, ids = scenario
    with SessionLocal.begin() as db:
        db.execute(
            insert(Student),
            [
                {
                    "full_name": f"NAMUNA {i:05}",
                    "phone": "+998930001199",
                    "joined_on": local_today(),
                }
                for i in range(10001)
            ],
        )
    book, _ = read_excel(tc, "students")
    rows = [
        row for row in book["O‘quvchilar"].iter_rows(min_row=7) if isinstance(row[0].value, int)
    ]
    assert len(rows) == 10003
    assert rows[-1][0].value == 10003
    assert book["Umumiy"]["C9"].value == 10003


def test_excel_keeps_large_money_exact_and_splits_full_sheets(scenario, monkeypatch):
    tc, _, ids = scenario
    with SessionLocal.begin() as db:
        from app.db.models import Invoice

        db.add(
            Invoice(
                student_id=ids["student"],
                period_start=local_today(),
                period_end=local_today() + timedelta(days=1),
                due_date=local_today(),
                amount=Decimal("9999999999999999.99"),
                status="issued",
            )
        )
    book, _ = read_excel(tc, "finance")
    assert book["Umumiy"]["C15"].value == "9999999999999999.99"
    assert book["Hisoblar"]["I7"].value == "9999999999999999.99"
    monkeypatch.setattr("app.modules.reports.excel.ROWS_PER_SHEET", 1)
    book, _ = read_excel(tc, "students")
    assert "O‘quvchilar 2" in book.sheetnames
    assert book["O‘quvchilar"]["A7"].value == 1
    assert book["O‘quvchilar 2"]["A7"].value == 2


def test_excel_uses_one_consistent_snapshot_while_records_change(scenario, monkeypatch):
    from app.modules.reports import excel

    tc, _, ids = scenario
    original = excel.build_workbook

    def write_during_export(db, resource, month, metrics):
        with SessionLocal.begin() as writer:
            writer.add(
                Student(
                    full_name="NAMUNA concurrent", phone="+998930001199", joined_on=local_today()
                )
            )
        return original(db, resource, month, metrics)

    monkeypatch.setattr(excel, "build_workbook", write_during_export)
    book, _ = read_excel(tc, "students")
    assert book["Umumiy"]["C9"].value == 2
    names = [
        row[1].value
        for row in book["O‘quvchilar"].iter_rows(min_row=7)
        if isinstance(row[0].value, int)
    ]
    assert len(names) == 2 and "NAMUNA concurrent" not in names
    assert call(tc, "GET", "/teacher/students")["total"] == 3


@pytest.mark.parametrize("decision", ["approve", "reject"])
def test_existing_accountless_student_registers_without_changing_business_records(
    scenario, decision
):
    tc, sc, ids = scenario
    from app.db.models import Membership

    with SessionLocal.begin() as db:
        old = Student(
            full_name="NAMUNA existing record",
            phone="+998930008877",
            joined_on=local_today() - timedelta(days=10),
            private_note="KEEP EXISTING NOTE",
        )
        db.add(old)
        db.flush()
        sid = old.id
    group, _ = group_and_member(tc, ids)
    call(tc, "POST", f"/teacher/groups/{group['id']}/memberships", {"student_id": str(sid)}, 201)
    historical_invoice = invoice(tc, {"student": sid})
    call(tc, "POST", f"/teacher/invoices/{historical_invoice['id']}/issue")
    before = call(tc, "GET", "/teacher/dashboard")
    personal = Client(app)
    call(
        personal,
        "POST",
        "/auth/register",
        {"full_name": "NAMUNA requested name", "phone": "+998930008877", "password": "Own-choice"},
        201,
    )
    request = call(tc, "GET", "/teacher/pending-students")["items"][0]
    assert request["id"] == str(sid) and request["existing_profile"] is True
    assert request["requested_name"] == "NAMUNA requested name"
    assert call(tc, "GET", f"/teacher/students/{sid}/billing")["debt"] == "600000.00"
    assert call(tc, "GET", "/teacher/dashboard")["student_count"] == before["student_count"]
    assert call(tc, "GET", f"/teacher/groups/{group['id']}")["student_count"] == 2
    call(
        personal,
        "POST",
        "/auth/login",
        {"username": "+998930008877", "password": "Own-choice"},
        403,
    )
    call(tc, "POST", f"/teacher/pending-students/{sid}/{decision}")
    with SessionLocal() as db:
        existing = db.get(Student, sid)
        assert existing.full_name == "NAMUNA existing record"
        assert existing.private_note == "KEEP EXISTING NOTE"
        assert existing.admission_status == "approved" and existing.deleted_at is None
        assert db.scalar(select(Membership.id).where(Membership.student_id == sid)) is not None
        assert not db.get(User, existing.user_id).registration_pending
    if decision == "approve":
        assert (
            call(
                personal,
                "POST",
                "/auth/login",
                {"username": "+998930008877", "password": "Own-choice"},
            )["must_change_password"]
            is False
        )
        call(personal, "GET", "/student/dashboard")
    else:
        call(
            personal,
            "POST",
            "/auth/login",
            {"username": "+998930008877", "password": "Own-choice"},
            401,
        )
    assert call(tc, "GET", f"/teacher/invoices/{historical_invoice['id']}")["debt"] == "600000.00"
    assert call(tc, "GET", "/teacher/pending-students")["total"] == 0
