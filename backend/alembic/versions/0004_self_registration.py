"""Explicit registration approval, including existing accountless student profiles."""

from pathlib import Path
from alembic import op
import sqlalchemy as sa

revision = "0004_self_registration"
down_revision = "0003_entity_deletion"
branch_labels = None
depends_on = None


def upgrade():
    for statement in Path(__file__).with_suffix(".sql").read_text().split(";"):
        if statement.strip():
            op.execute(sa.text(statement))


def downgrade():
    op.drop_column("users", "registration_pending")
