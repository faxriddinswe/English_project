from app.main import app
from tests.asgi_client import Client


def test_live_endpoint_and_no_store_headers():
    status, data, headers = Client(app).request("GET", "/health/live")
    assert status == 200 and data == {"status": "live"}
    assert headers["cache-control"] == "no-store" and headers["x-request-id"]


def test_origin_and_csrf_are_independent_controls():
    client = Client(app)
    assert (
        client.request("POST", "/api/v1/auth/login", {"username": "x", "password": "x"})[0] == 403
    )
    assert (
        client.request(
            "POST",
            "/api/v1/auth/login",
            {"username": "x", "password": "x"},
            {"origin": "http://localhost:3000"},
        )[1]["code"]
        == "csrf_failed"
    )
    status, data, _ = client.request("GET", "/api/v1/auth/csrf")
    assert status == 200 and client.cookies["se_csrf"] == data["token"]
    assert (
        client.request(
            "POST",
            "/api/v1/auth/login",
            {},
            {"origin": "https://attacker.invalid", "x-csrf-token": data["token"]},
        )[1]["code"]
        == "invalid_origin"
    )
    assert (
        client.request(
            "POST",
            "/api/v1/auth/login",
            {},
            {"origin": "http://localhost:3000", "x-csrf-token": "forged"},
        )[1]["code"]
        == "csrf_failed"
    )


def test_public_error_does_not_echo_sensitive_body():
    status, data, _ = Client(app).request(
        "POST", "/api/v1/auth/login", {"password": "SENSITIVE_NEVER_ECHO"}
    )
    assert status == 403
    assert "SENSITIVE_NEVER_ECHO" not in str(data)


def test_openapi_has_required_real_routes():
    paths = app.openapi()["paths"]
    for path in [
        "/api/v1/public/leads",
        "/api/v1/teacher/invoices/generate",
        "/api/v1/student/assignments/{oid}/submission",
        "/api/v1/teacher/leads/{oid}/convert",
        "/api/v1/auth/register",
        "/api/v1/teacher/pending-students",
        "/api/v1/teacher/pending-students/approve-all",
        "/health/ready",
    ]:
        assert path in paths


def test_unknown_resource_uses_safe_consistent_error():
    status, data, _ = Client(app).request("GET", "/api/v1/no-such-resource")
    assert status == 404 and data["code"] == "request_error" and data["request_id"]


def test_actual_body_size_limit_cannot_be_bypassed_by_claimed_length():
    status, data, _ = Client(app).request(
        "POST",
        "/api/v1/public/leads",
        b"x" * (10 * 1024 * 1024 + 1),
        {"content-length": "1", "content-type": "application/octet-stream"},
    )
    assert status == 413 and data["code"] == "file_size"
