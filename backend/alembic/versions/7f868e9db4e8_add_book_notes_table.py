"""add book notes table

Revision ID: 7f868e9db4e8
Revises: 69f78b91cf72
Create Date: 2025-11-05 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7f868e9db4e8'
down_revision: Union[str, Sequence[str], None] = '69f78b91cf72'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'book_notes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('book_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_book_notes_id'), 'book_notes', ['id'], unique=False)
    op.create_index('ix_book_notes_book_id', 'book_notes', ['book_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_book_notes_book_id', table_name='book_notes')
    op.drop_index(op.f('ix_book_notes_id'), table_name='book_notes')
    op.drop_table('book_notes')
