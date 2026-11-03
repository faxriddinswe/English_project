"""Durable at-least-once delivery; timeout may cause a duplicate with the same lead ID."""

import secrets, time, logging, json
from datetime import timedelta
from pathlib import Path
from ipaddress import ip_address
from urllib.parse import urlsplit
from sqlalchemy import select, or_, and_
from sqlalchemy.exc import SQLAlchemyError
from app.db.session import SessionLocal
from app.db.base import utcnow
from app.db.models import NotificationOutbox, Lead, Course
from app.core.config import get_settings
from app.core.helpers import TZ

log = logging.getLogger("sherzod.worker")


def lead_message(lead, course):
    created = lead.created_at.astimezone(TZ)
    return (
        "Yangi ariza kelib tushdi.\n\n"
        f"Ism: {lead.full_name}\n"
        f"Telefon: {lead.phone}\n"
        f"Kurs: {course.name if course else 'Aniqlanmagan'}\n"
        f"Sana: {created:%Y-%m-%d}\n"
        f"Soat: {created:%H:%M}\n"
        f"Izoh: {lead.comment}"
    )


def retry_decision(status: int | None, attempt: int, retry_after: int | None = None):
    if status in (400, 401, 403, 404):
        return "failed", 0, "telegram_configuration"
    if attempt >= 8:
        return "failed", 0, "attempt_limit"
    if status == 429:
        return "retry", min(max(retry_after or 60, 1), 86400), "telegram_rate_limit"
    return "retry", min(30 * 2 ** max(attempt - 1, 0), 3600), "temporary_delivery_error"


def claim():
    with SessionLocal.begin() as db:
        now = utcnow()
        job = db.scalar(
            select(NotificationOutbox)
            .where(
                or_(
                    and_(
                        NotificationOutbox.status.in_(["pending", "retry"]),
                        NotificationOutbox.next_attempt_at <= now,
                    ),
                    and_(
                        NotificationOutbox.status == "processing",
                        NotificationOutbox.lease_until < now,
                    ),
                )
            )
            .order_by(NotificationOutbox.next_attempt_at)
            .with_for_update(skip_locked=True)
            .limit(1)
        )
        if not job:
            return None
        settings = get_settings()
        if not settings.telegram_bot_token or not settings.telegram_chat_id:
            job.status = "disabled"
            job.last_safe_error = "telegram_unconfigured"
            return None
        job.status = "processing"
        job.lease_until = now + timedelta(seconds=90)
        job.lease_token = secrets.token_hex(16)
        job.attempts += 1
        lead = db.get(Lead, job.lead_id)
        course = db.get(Course, lead.course_id) if lead.course_id else None
        text = lead_message(lead, course)
        return {
            "id": job.id,
            "token": job.lease_token,
            "attempt": job.attempts,
            "text": text,
            "lead_id": lead.id,
        }


def message_payload(job, settings):
    payload = {
        "chat_id": settings.telegram_chat_id,
        "text": job["text"] + "\n\nMurojaatni ustoz kabinetidagi «Murojaatlar» bo‘limida ko‘ring.",
    }
    base = settings.public_app_url.rstrip("/")
    url = urlsplit(base)
    host = (url.hostname or "").lower().rstrip(".")
    public = (
        url.scheme in ("http", "https")
        and "." in host
        and not host.endswith((".localhost", ".local"))
    )
    try:
        public = public and ip_address(host).is_global
    except ValueError:
        pass  # A DNS hostname, not an IP address.
    # Telegram rejects localhost in inline buttons. Local development must still
    # deliver the lead; the real public URL restores the authenticated deep link.
    if public:
        payload["reply_markup"] = {
            "inline_keyboard": [
                [
                    {
                        "text": "Platformada ochish",
                        "url": f"{base}/teacher/leads/{job['lead_id']}",
                    }
                ]
            ]
        }
    return payload


def tick(client):
    job = claim()
    if not job:
        return False
    settings = get_settings()
    status = None
    retry_after = None
    ok = False
    try:
        response = client.post(
            f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage",
            json=message_payload(job, settings),
        )
        status = response.status_code
        try:
            data = response.json()
            ok = status == 200 and data.get("ok") is True
            retry_after = data.get("parameters", {}).get("retry_after")
        except ValueError:
            pass
    except Exception:
        # Never log HTTP exception repr: it can contain the bot URL/token.
        status = None
    with SessionLocal.begin() as db:
        row = db.scalar(
            select(NotificationOutbox).where(NotificationOutbox.id == job["id"]).with_for_update()
        )
        if row is None or row.lease_token != job["token"]:
            return True
        if ok:
            row.status = "sent"
            row.last_safe_error = None
        else:
            row.status, delay, row.last_safe_error = retry_decision(
                status, job["attempt"], retry_after
            )
            row.next_attempt_at = utcnow() + timedelta(seconds=delay)
        row.lease_until = None
        row.lease_token = None
        log.info(
            json.dumps(
                {"event": "notification_result", "job_id": str(row.id), "status": row.status}
            )
        )
    return True


def main():
    import httpx

    logging.basicConfig(level=logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    with httpx.Client(timeout=httpx.Timeout(15, connect=5)) as client:
        while True:
            try:
                processed = tick(client)
            except SQLAlchemyError:
                # Database failures can include connection credentials in their repr.
                # Keep the worker alive; a committed claim is retried after its lease.
                log.warning(json.dumps({"event": "worker_database_unavailable"}))
                time.sleep(5)
                continue
            Path("/tmp/sherzod-worker.heartbeat").touch()
            if not processed:
                time.sleep(2)


if __name__ == "__main__":
    main()
