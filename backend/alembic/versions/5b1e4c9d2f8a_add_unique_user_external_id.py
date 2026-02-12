"""add unique user/external id constraint

Revision ID: 5b1e4c9d2f8a
Revises: aa4c2d1b7f6e
Create Date: 2026-02-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5b1e4c9d2f8a"
down_revision: Union[str, Sequence[str], None] = "aa4c2d1b7f6e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint(
        "uq_books_user_external_id",
        "books",
        ["user_id", "external_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "uq_books_user_external_id",
        "books",
        type_="unique",
    )
