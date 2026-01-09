"""add api logs

Revision ID: 8b2e3b2a5d9a
Revises: f1a03670831e
Create Date: 2026-01-09 12:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "8b2e3b2a5d9a"
down_revision = "f1a03670831e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "api_logs",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("endpoint", sa.String(length=255), nullable=False),
        sa.Column("query", sa.Text(), nullable=True),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_api_logs_id"), "api_logs", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_api_logs_id"), table_name="api_logs")
    op.drop_table("api_logs")
