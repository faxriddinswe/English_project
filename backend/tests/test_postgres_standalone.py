"""Actual PostgreSQL constraint tests using standalone mode where sockets are forbidden.

These validate the frozen SQL schema, not Alembic's runner or HTTP/SQLAlchemy transactions.
"""

import json, subprocess
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from uuid import uuid4
import pytest
from app.db.models import (
    User,
    Student,
    Course,
    Group,
    Membership,
    Lesson,
    Attendance,
    Invoice,
    Adjustment,
    Payment,
    Allocation,
)
from app.modules.billing.service import invoice_query
from sqlalchemy.dialects import postgresql


def insert_sql(model, **values):
    for c in model.__table__.columns:
        if c.name not in values and c.default is not None:
            values[c.name] = c.default.arg(None) if c.default.is_callable else c.default.arg
    values.setdefault("id", uuid4())
    now = datetime.now(timezone.utc)
    values.setdefault("created_at", now)
    values.setdefault("updated_at", now)

    def quote(v):
        if v is None:
            return "NULL"
        if isinstance(v, bool):
            return "TRUE" if v else "FALSE"
        if isinstance(v, (int, Decimal)):
            return str(v)
        if isinstance(v, (dict, list)):
            v = json.dumps(v)
        return "'" + str(v).replace("'", "''") + "'"

    return (
        f"INSERT INTO {model.__tablename__} ("
        + ",".join(values)
        + ") VALUES ("
        + ",".join(quote(v) for v in values.values())
        + ");"
    )


@pytest.fixture(scope="module")
def standalone(tmp_path_factory):
    root = Path("/usr/lib/postgresql/15/bin")
    if not (root / "postgres").exists():
        pytest.skip("PostgreSQL binaries unavailable")
    data = tmp_path_factory.mktemp("sherzod-pg") / "data"
    proc = subprocess.run(
        [str(root / "initdb"), "-D", str(data), "-A", "trust", "--no-locale", "-E", "UTF8"],
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0, proc.stderr

    def run(sql, expect_error=False):
        proc = subprocess.run(
            [str(root / "postgres"), "--single", "-D", str(data), "postgres"],
            input=sql + "\n",
            capture_output=True,
            text=True,
            timeout=20,
        )
        output = proc.stdout + proc.stderr
        if not expect_error:
            assert proc.returncode == 0 and "ERROR:" not in output and "FATAL:" not in output, (
                output[-4000:]
            )
        return output

    migration = (
        (Path(__file__).parents[1] / "alembic/versions/0001_initial.sql").read_text()
        + (Path(__file__).parents[1] / "alembic/versions/0003_entity_deletion.sql").read_text()
        + (Path(__file__).parents[1] / "alembic/versions/0004_self_registration.sql").read_text()
    )
    run("\n".join(" ".join(s.split()) + ";" for s in migration.split(";") if s.strip()))
    ids = {
        k: uuid4()
        for k in [
            "teacher",
            "student",
            "course",
            "group",
            "membership",
            "lesson",
            "invoice",
            "payment",
        ]
    }
    day = date(2026, 11, 1)
    seed = [
        insert_sql(
            User,
            id=ids["teacher"],
            username="teacher-test",
            password_hash="not-a-login-hash",
            role="teacher",
        ),
        insert_sql(
            Student, id=ids["student"], full_name="NAMUNA", phone="+998901234567", joined_on=day
        ),
        insert_sql(
            Course, id=ids["course"], name="NAMUNA", slug="sample", short_description="NAMUNA"
        ),
        insert_sql(
            Group,
            id=ids["group"],
            course_id=ids["course"],
            name="NAMUNA",
            capacity=2,
            start_date=day,
            monthly_price=Decimal("600000"),
        ),
        insert_sql(
            Membership,
            id=ids["membership"],
            group_id=ids["group"],
            student_id=ids["student"],
            start_date=day,
        ),
        insert_sql(
            Lesson,
            id=ids["lesson"],
            group_id=ids["group"],
            starts_at=datetime(2026, 11, 1, 10, tzinfo=timezone.utc),
            ends_at=datetime(2026, 11, 1, 11, tzinfo=timezone.utc),
            original_starts_at=datetime(2026, 11, 1, 10, tzinfo=timezone.utc),
        ),
        insert_sql(
            Invoice,
            id=ids["invoice"],
            student_id=ids["student"],
            membership_id=ids["membership"],
            period_start=day,
            period_end=date(2026, 12, 1),
            due_date=day,
            amount=Decimal("600000"),
            status="issued",
        ),
        insert_sql(
            Adjustment,
            invoice_id=ids["invoice"],
            amount=Decimal("-100000"),
            reason="NAMUNA discount",
            actor_id=ids["teacher"],
        ),
        insert_sql(
            Payment,
            id=ids["payment"],
            student_id=ids["student"],
            amount=Decimal("300000"),
            received_at=datetime.now(timezone.utc),
            method="cash",
            actor_id=ids["teacher"],
            idempotency_key="test-key",
            payload_hash="test",
        ),
        insert_sql(
            Allocation,
            payment_id=ids["payment"],
            invoice_id=ids["invoice"],
            amount=Decimal("300000"),
        ),
    ]
    run(" ".join(seed))
    return run, ids


def rejected(run, sql, constraint_text):
    output = run("BEGIN; " + sql + " ROLLBACK;", expect_error=True)
    assert "ERROR:" in output and constraint_text in output, output[-3000:]


def test_frozen_migration_and_sql_finance_aggregate(standalone):
    run, ids = standalone
    stmt = str(
        invoice_query()
        .where(Invoice.id == ids["invoice"])
        .compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True})
    )
    sql = f"DO $$ DECLARE debt numeric; BEGIN SELECT amount+adjustment-paid INTO debt FROM ({stmt}) AS q; IF debt <> 200000 THEN RAISE EXCEPTION 'Incorrect debt: %',debt; END IF; END $$;"
    run(" ".join(sql.split()))


def test_postgres_membership_overlap_is_enforced(standalone):
    run, ids = standalone
    rejected(
        run,
        insert_sql(
            Membership,
            student_id=ids["student"],
            group_id=ids["group"],
            start_date=date(2026, 11, 5),
        ),
        "membership_no_overlap",
    )


def test_postgres_teacher_lesson_overlap_is_enforced(standalone):
    run, ids = standalone
    rejected(
        run,
        insert_sql(
            Lesson,
            group_id=ids["group"],
            starts_at=datetime(2026, 11, 1, 10, 30, tzinfo=timezone.utc),
            ends_at=datetime(2026, 11, 1, 12, tzinfo=timezone.utc),
            original_starts_at=datetime(2026, 11, 1, 10, 30, tzinfo=timezone.utc),
        ),
        "teacher_lesson_no_overlap",
    )


def test_postgres_attendance_unique_and_status(standalone):
    run, ids = standalone
    first = insert_sql(
        Attendance,
        lesson_id=ids["lesson"],
        student_id=ids["student"],
        status="present",
        actor_id=ids["teacher"],
    )
    second = insert_sql(
        Attendance,
        lesson_id=ids["lesson"],
        student_id=ids["student"],
        status="late",
        actor_id=ids["teacher"],
    )
    rejected(run, first + second, "unique constraint")
    rejected(
        run,
        insert_sql(
            Attendance,
            lesson_id=ids["lesson"],
            student_id=ids["student"],
            status="unknown",
            actor_id=ids["teacher"],
        ),
        "check constraint",
    )


def test_postgres_invoice_generation_unique_and_decimal(standalone):
    run, ids = standalone
    rejected(
        run,
        insert_sql(
            Invoice,
            student_id=ids["student"],
            membership_id=ids["membership"],
            period_start=date(2026, 11, 1),
            period_end=date(2026, 12, 1),
            due_date=date(2026, 11, 10),
            amount=Decimal("600000"),
        ),
        "unique constraint",
    )
    run(
        "DO $$ DECLARE t text; BEGIN SELECT data_type INTO t FROM information_schema.columns WHERE table_name='payments' AND column_name='amount'; IF t <> 'numeric' THEN RAISE EXCEPTION 'money must be numeric'; END IF; END $$;"
    )


def test_postgres_idempotency_and_single_teacher(standalone):
    run, ids = standalone
    rejected(
        run,
        insert_sql(
            Payment,
            student_id=ids["student"],
            amount=Decimal("300000"),
            received_at=datetime.now(timezone.utc),
            method="cash",
            actor_id=ids["teacher"],
            idempotency_key="test-key",
            payload_hash="different",
        ),
        "unique constraint",
    )
    rejected(
        run,
        insert_sql(User, username="second-teacher", password_hash="not-login", role="teacher"),
        "one_teacher_only",
    )
