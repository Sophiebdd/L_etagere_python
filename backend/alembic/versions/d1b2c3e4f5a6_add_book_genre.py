"""add genre to books

Revision ID: d1b2c3e4f5a6
Revises: 8b2e3b2a5d9a
Create Date: 2026-01-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d1b2c3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "8b2e3b2a5d9a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("books", sa.Column("genre", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("books", "genre")
