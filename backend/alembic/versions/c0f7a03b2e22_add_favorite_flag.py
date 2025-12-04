"""add favorite flag to books

Revision ID: c0f7a03b2e22
Revises: 7f868e9db4e8
Create Date: 2025-11-05 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c0f7a03b2e22'
down_revision: Union[str, Sequence[str], None] = '7f868e9db4e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('books', sa.Column('is_favorite', sa.Boolean(), nullable=False, server_default=sa.text("0")))
    # remove server default after backfilling existing rows
    op.alter_column('books', 'is_favorite', server_default=None)


def downgrade() -> None:
    op.drop_column('books', 'is_favorite')
