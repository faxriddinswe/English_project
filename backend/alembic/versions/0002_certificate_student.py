"""Link public certificates privately to students and retain deleted content history."""

from alembic import op
import sqlalchemy as sa

revision = "0002_certificate_student"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("content", sa.Column("student_id", sa.UUID(), nullable=True))
    op.create_foreign_key("fk_content_student", "content", "students", ["student_id"], ["id"])
    op.create_index("ix_content_student_id", "content", ["student_id"])
    op.add_column(
        "content", sa.Column("archived", sa.Boolean(), nullable=False, server_default=sa.false())
    )


def downgrade():
    op.drop_index("ix_content_student_id", table_name="content")
    op.drop_constraint("fk_content_student", "content", type_="foreignkey")
    op.drop_column("content", "student_id")
    op.drop_column("content", "archived")
