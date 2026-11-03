import argparse, getpass, os, sys
from datetime import timedelta, datetime, time, timezone
from decimal import Decimal
from sqlalchemy import select
from app.db.session import SessionLocal
from app.db.models import (
    User,
    Student,
    Course,
    Group,
    Membership,
    ScheduleRule,
    Lesson,
    Content,
    Invoice,
    InvoiceLine,
    Adjustment,
    Payment,
    Allocation,
    Assignment,
    AssessmentResult,
    Attendance,
    Submission,
    SubmissionRevision,
)
from app.core.config import get_settings
from app.core.helpers import local_today, TZ
from app.modules.auth.service import hasher
from app.modules.billing.service import month_bounds


def create_teacher(username, password):
    if not password:
        raise SystemExit("Parolni kiriting")
    with SessionLocal.begin() as db:
        if db.scalar(select(User.id).where(User.role == "teacher")):
            raise SystemExit("Teacher mavjud. Ikkinchi teacher MVP doirasida emas.")
        db.add(User(username=username.lower(), password_hash=hasher.hash(password), role="teacher"))
    print("Teacher yaratildi. Parol logga yozilmadi.")


def seed_dev():
    if get_settings().app_env != "development":
        raise SystemExit("Seed faqat development muhitida")
    tp = os.environ.get("DEMO_TEACHER_PASSWORD", "")
    sp = os.environ.get("DEMO_STUDENT_PASSWORD", "")
    if not tp or not sp:
        raise SystemExit("DEMO_TEACHER_PASSWORD va DEMO_STUDENT_PASSWORD kerak")
    with SessionLocal.begin() as db:
        if db.scalar(select(User.id).where(User.username == "demo-student")):
            raise SystemExit("Demo seed avval yaratilgan; qayta yaratilmaydi")
        if db.scalar(select(User.id).where(User.role == "teacher")):
            raise SystemExit("Demo seed uchun alohida bo‘sh development baza ishlating")
        teacher = User(username="demo-teacher", password_hash=hasher.hash(tp), role="teacher")
        user = User(username="demo-student", password_hash=hasher.hash(sp), role="student")
        db.add_all([teacher, user])
        db.flush()
        today = local_today()
        start, end = month_bounds(today)
        student = Student(
            user_id=user.id,
            full_name="NAMUNA — O‘quvchi",
            phone="+998900000000",
            joined_on=start,
            private_note="Faqat development fixture",
        )
        db.add(student)
        db.flush()
        courses = []
        for i, (name, slug) in enumerate(
            [
                ("Grammatika / General English", "general-english"),
                ("IELTS", "ielts"),
                ("CEFR", "cefr"),
            ]
        ):
            course = Course(
                name=name,
                slug=slug,
                short_description="NAMUNA — haqiqiy biznes kontenti bilan almashtiring",
                description="NAMUNA dastur. Ustoz tekshirishi va nashr qilishi kerak.",
                features=[
                    "NAMUNA — grammatika mashqlari",
                    "NAMUNA — amaliy muloqot",
                    "NAMUNA — o‘qish va yozish",
                ],
                sort_order=i,
                published=False,
            )
            db.add(course)
            courses.append(course)
        db.flush()
        group = Group(
            course_id=courses[0].id,
            name="NAMUNA — GE guruhi",
            level="NAMUNA A2",
            capacity=12,
            start_date=start,
            monthly_price=Decimal("600000"),
        )
        db.add(group)
        db.flush()
        history_start = start - timedelta(days=14)
        group.start_date = history_start
        student.joined_on = history_start
        member = Membership(student_id=student.id, group_id=group.id, start_date=history_start)
        db.add(member)
        db.add(ScheduleRule(group_id=group.id, weekday=0, local_time=time(17), duration_minutes=90))
        db.flush()
        begins = datetime.combine(today, time(17), TZ).astimezone(timezone.utc)
        db.add(
            Lesson(
                group_id=group.id,
                starts_at=begins,
                ends_at=begins + timedelta(minutes=90),
                original_starts_at=begins,
            )
        )
        for offset, status in [(-4, "present"), (-2, "absent")]:
            past = begins + timedelta(days=offset)
            lesson = Lesson(
                group_id=group.id,
                starts_at=past,
                ends_at=past + timedelta(minutes=90),
                original_starts_at=past,
                status="completed",
            )
            db.add(lesson)
            db.flush()
            db.add(
                Attendance(
                    lesson_id=lesson.id, student_id=student.id, status=status, actor_id=teacher.id
                )
            )
        second_group = Group(
            course_id=courses[1].id,
            name="NAMUNA — IELTS guruhi",
            level="NAMUNA B1",
            capacity=10,
            start_date=start,
            monthly_price=Decimal("700000"),
        )
        db.add(second_group)
        db.flush()
        db.add(Membership(student_id=student.id, group_id=second_group.id, start_date=start))
        db.add(
            ScheduleRule(
                group_id=second_group.id, weekday=2, local_time=time(14), duration_minutes=90
            )
        )
        inv = Invoice(
            student_id=student.id,
            membership_id=member.id,
            period_start=start,
            period_end=end,
            due_date=today - timedelta(days=1),
            amount=Decimal("600000"),
            status="issued",
        )
        db.add(inv)
        db.flush()
        db.add(InvoiceLine(invoice_id=inv.id, description="NAMUNA — oylik", amount=inv.amount))
        db.add(
            Adjustment(
                invoice_id=inv.id,
                amount=Decimal("-100000"),
                reason="NAMUNA chegirma",
                actor_id=teacher.id,
            )
        )
        p = Payment(
            student_id=student.id,
            amount=Decimal("300000"),
            received_at=begins,
            method="cash",
            reference="NAMUNA",
            actor_id=teacher.id,
            idempotency_key="seed-partial",
            payload_hash="seed",
        )
        db.add(p)
        db.flush()
        db.add(Allocation(payment_id=p.id, invoice_id=inv.id, amount=Decimal("300000")))
        db.add(
            Payment(
                student_id=student.id,
                amount=Decimal("100000"),
                received_at=begins,
                method="bank_transfer",
                reference="NAMUNA oldindan to‘lov",
                actor_id=teacher.id,
                idempotency_key="seed-credit",
                payload_hash="seed",
            )
        )
        assignment = Assignment(
            group_id=group.id,
            title="NAMUNA — grammatika mashqi",
            description="Quyidagi mavzuda beshta gap yozing.",
            deadline=begins + timedelta(days=2),
            published=True,
        )
        db.add(assignment)
        db.flush()
        submission = Submission(assignment_id=assignment.id, student_id=student.id)
        db.add(submission)
        db.flush()
        db.add(
            SubmissionRevision(
                submission_id=submission.id,
                revision=1,
                text="NAMUNA — javob matni",
                late=False,
                feedback="NAMUNA — yaxshi urinish, qayta ko‘rib chiqing.",
                score=Decimal(8),
                max_score=Decimal(10),
            )
        )
        db.add(
            AssessmentResult(
                student_id=student.id,
                group_id=group.id,
                title="NAMUNA — ichki baholash",
                score=Decimal(8),
                max_score=Decimal(10),
                feedback="NAMUNA feedback",
            )
        )
        samples = [
            (
                "hero",
                "NAMUNA — Yuqori natijalar Sherzod ustoz bilan boshlanadi.",
                {"subheading": "NAMUNA — haqiqiy ma’lumot bilan almashtiring."},
            ),
            ("stat", "NAMUNA — statistika", {"value": "NAMUNA", "label": "Tasdiqlanmagan fixture"}),
            (
                "benefit",
                "NAMUNA — Mustahkam bilim poydevori",
                {
                    "body": "NAMUNA — grammatika va amaliy mashqlar.",
                    "tags": ["Grammatika", "Muloqot"],
                },
            ),
            (
                "faq",
                "NAMUNA — Kursga qanday yozilaman?",
                {"body": "Ariza qoldiring. Ustoz siz bilan bog‘lanadi."},
            ),
        ]
        samples.extend(
            [
                (
                    "result",
                    "NAMUNA — IELTS natijasi",
                    {
                        "type": "ielts",
                        "student_name": "NAMUNA O‘quvchi",
                        "exam_date": today.isoformat(),
                        "listening": "8",
                        "reading": "7.5",
                        "writing": "7",
                        "speaking": "7.5",
                        "overall": "7.5",
                    },
                ),
                (
                    "result",
                    "NAMUNA — CEFR natijasi",
                    {
                        "type": "cefr",
                        "student_name": "NAMUNA Boshqa o‘quvchi",
                        "exam_date": today.isoformat(),
                        "level": "B2",
                    },
                ),
                (
                    "benefit",
                    "NAMUNA — Sherzod ustoz bilan tayyorgarlik",
                    {"body": "NAMUNA — individual yondashuv."},
                ),
                (
                    "benefit",
                    "NAMUNA — IELTS va CEFR sari",
                    {"body": "NAMUNA — imtihon ko‘nikmalari."},
                ),
                (
                    "benefit",
                    "NAMUNA — Bilimingizni amalda qo‘llang",
                    {"body": "NAMUNA — amaliy mashqlar."},
                ),
            ]
        )
        for kind, title, data in samples:
            db.add(Content(kind=kind, title=title, data=data, published=False))
    print(
        "Development seed yaratildi. Loginlar: demo-teacher / demo-student. Parollar siz bergan environment qiymatlari. Public kontent draft holatida."
    )


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("create-teacher")
    p.add_argument("--username", required=True)
    p.add_argument("--password-stdin", action="store_true")
    sub.add_parser("seed-dev")
    args = parser.parse_args()
    if args.command == "create-teacher":
        create_teacher(
            args.username,
            sys.stdin.readline().rstrip("\n")
            if args.password_stdin
            else getpass.getpass("Teacher paroli: "),
        )
    else:
        seed_dev()


if __name__ == "__main__":
    main()
