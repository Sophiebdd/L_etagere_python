"""add user_book_stats view

Revision ID: a7c1e9f4b2d3
Revises: 9c4d6e7f8a91
Create Date: 2026-03-22 11:40:49.000000
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a7c1e9f4b2d3"
down_revision: Union[str, Sequence[str], None] = "9c4d6e7f8a91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP VIEW IF EXISTS user_book_stats")
    op.execute(
        """
        CREATE VIEW user_book_stats AS
        SELECT
            u.id AS user_id,
            u.username AS username,
            COUNT(b.id) AS total_books,
            COALESCE(SUM(CASE WHEN b.status = 'À lire' THEN 1 ELSE 0 END), 0) AS to_read_count,
            COALESCE(SUM(CASE WHEN b.status = 'En cours' THEN 1 ELSE 0 END), 0) AS in_progress_count,
            COALESCE(SUM(CASE WHEN b.status = 'Lu' THEN 1 ELSE 0 END), 0) AS read_count,
            COALESCE(SUM(CASE WHEN b.is_favorite = 1 THEN 1 ELSE 0 END), 0) AS favorite_count,
            MAX(b.created_at) AS last_book_added_at
        FROM users u
        LEFT JOIN books b ON b.user_id = u.id
        GROUP BY u.id, u.username
        """
    )


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS user_book_stats")
