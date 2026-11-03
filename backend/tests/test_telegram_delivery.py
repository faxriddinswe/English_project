"""Local URLs must never prevent leads from reaching Telegram."""

from types import SimpleNamespace
from uuid import uuid4
from datetime import datetime
import pytest
from app.workers.telegram import lead_message, message_payload


@pytest.mark.parametrize(
    "base",
    [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://127.0.0.2:3000",
        "http://[::1]:3000",
        "http://192.168.1.2:3000",
        "http://0.0.0.0:3000",
        "http://app.localhost:3000",
        "http://teacher.local:3000",
    ],
)
def test_local_lead_still_delivers_without_rejected_inline_button(base):
    job = {"text": "SINOV — lead contents", "lead_id": uuid4()}
    result = message_payload(job, SimpleNamespace(public_app_url=base, telegram_chat_id="-100123"))
    assert result["chat_id"] == "-100123"
    assert result["text"].startswith(job["text"])
    assert "Murojaatlar" in result["text"]
    assert "reply_markup" not in result


def test_public_lead_keeps_authenticated_detail_link_and_contents():
    job = {"text": "SINOV — lead contents", "lead_id": uuid4()}
    result = message_payload(
        job, SimpleNamespace(public_app_url="https://school.example/", telegram_chat_id="-100123")
    )
    button = result["reply_markup"]["inline_keyboard"][0][0]
    assert button["url"] == f"https://school.example/teacher/leads/{job['lead_id']}"
    assert (
        result["text"]
        == job["text"] + "\n\nMurojaatni ustoz kabinetidagi «Murojaatlar» bo‘limida ko‘ring."
    )


@pytest.mark.parametrize(
    "created_at", ["2026-11-03T06:30:59.123456+00:00", "2026-11-03T11:30:59.123456+05:00"]
)
def test_lead_message_matches_requested_format_in_tashkent(created_at):
    lead = SimpleNamespace(
        id=uuid4(),
        full_name="NAMUNA Ariza",
        phone="+998930001122",
        created_at=datetime.fromisoformat(created_at),
        comment="Saytdan o‘zi ro‘yxatdan o‘tdi.",
    )
    job = {"text": lead_message(lead, None), "lead_id": lead.id}
    payload = message_payload(
        job, SimpleNamespace(public_app_url="http://localhost:3000", telegram_chat_id="fixture")
    )
    assert payload["text"] == (
        "Yangi ariza kelib tushdi.\n\n"
        "Ism: NAMUNA Ariza\n"
        "Telefon: +998930001122\n"
        "Kurs: Aniqlanmagan\n"
        "Sana: 2026-11-03\n"
        "Soat: 11:30\n"
        "Izoh: Saytdan o‘zi ro‘yxatdan o‘tdi.\n\n"
        "Murojaatni ustoz kabinetidagi «Murojaatlar» bo‘limida ko‘ring."
    )
    assert str(lead.id) not in payload["text"]


def test_selected_course_and_tashkent_date_rollover_are_preserved():
    lead = SimpleNamespace(
        full_name="NAMUNA Murojaat",
        phone="+998930001122",
        created_at=datetime.fromisoformat("2026-11-02T20:05:00+00:00"),
        comment="Kurs haqida savol.",
    )
    text = lead_message(lead, SimpleNamespace(name="NAMUNA kurs"))
    assert "Kurs: NAMUNA kurs\nSana: 2026-11-03\nSoat: 01:05\nIzoh: Kurs haqida savol." in text


def test_worker_recovers_database_failure_without_leaking_connection_details(
    monkeypatch, tmp_path, caplog
):
    from sqlalchemy.exc import OperationalError
    from app.workers import telegram

    class StopLoop(BaseException):
        pass

    calls = []
    sleeps = []
    heartbeat = tmp_path / "heartbeat"

    def tick(_client):
        calls.append(True)
        if len(calls) == 1:
            raise OperationalError("SECRET_CONNECTION", None, Exception("SECRET_CONNECTION"))
        return False

    def sleep(seconds):
        sleeps.append(seconds)
        if len(sleeps) == 2:
            raise StopLoop()

    monkeypatch.setattr(telegram, "tick", tick)
    monkeypatch.setattr(telegram.time, "sleep", sleep)
    monkeypatch.setattr(telegram, "Path", lambda _path: heartbeat)
    with pytest.raises(StopLoop):
        telegram.main()
    assert sleeps == [5, 2]
    assert len(calls) == 2 and heartbeat.exists()
    assert "worker_database_unavailable" in caplog.text
    assert "SECRET_CONNECTION" not in caplog.text
