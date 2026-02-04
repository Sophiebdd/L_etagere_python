"""add embeddings to books

Revision ID: b2f4a1c9d7e8
Revises: d1b2c3e4f5a6, c0f7a03b2e22
Create Date: 2026-02-01 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2f4a1c9d7e8"
down_revision: Union[str, Sequence[str], None] = ("d1b2c3e4f5a6", "c0f7a03b2e22")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("books", sa.Column("embedding", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("books", "embedding")
