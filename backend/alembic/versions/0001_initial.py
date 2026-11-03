"""Frozen initial schema; migrations do not import live model definitions."""

from pathlib import Path
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    sql = (Path(__file__).parent / "0001_initial.sql").read_text()
    for statement in sql.split(";"):
        if statement.strip():
            op.execute(statement)


def downgrade():
    raise RuntimeError(
        "Financial history is not destructively downgraded. Restore a verified backup."
    )
