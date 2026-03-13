"""add refresh token fields on users

Revision ID: e8f1c2d3b4a5
Revises: f1a03670831e
Create Date: 2026-03-13 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e8f1c2d3b4a5"
down_revision: Union[str, Sequence[str], None] = "f1a03670831e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("refresh_token_hash", sa.String(length=128), nullable=True))
    op.add_column("users", sa.Column("refresh_token_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(
        op.f("ix_users_refresh_token_hash"),
        "users",
        ["refresh_token_hash"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_users_refresh_token_hash"), table_name="users")
    op.drop_column("users", "refresh_token_expires_at")
    op.drop_column("users", "refresh_token_hash")
