"""Replace user-facing activity states with deletion and explicit admission."""

from pathlib import Path
from alembic import op
import sqlalchemy as sa

revision = "0003_entity_deletion"
down_revision = "0002_certificate_student"
branch_labels = None
depends_on = None


def upgrade():
    for statement in Path(__file__).with_suffix(".sql").read_text().split(";"):
        if statement.strip():
            op.execute(sa.text(statement))


def downgrade():
    # Restore legacy visibility for records deleted under the new policy.
    op.execute("UPDATE students SET status='archived' WHERE deleted_at IS NOT NULL")
    op.execute("UPDATE students SET status='paused' WHERE admission_status='pending'")
    op.execute("UPDATE groups SET status='archived' WHERE deleted_at IS NOT NULL")
    op.execute("UPDATE courses SET active=false WHERE deleted_at IS NOT NULL")
    op.drop_constraint("student_admission_status", "students", type_="check")
    op.drop_column("students", "admission_status")
    for table in ("students", "groups", "courses"):
        op.drop_index(f"ix_{table}_deleted_at", table_name=table)
        op.drop_column(table, "deleted_at")
