"""drop chapter user_id

Revision ID: 9c4d6e7f8a91
Revises: f4c5d6e7a8b9
Create Date: 2026-03-17 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9c4d6e7f8a91"
down_revision: Union[str, Sequence[str], None] = "f4c5d6e7a8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    foreign_keys = inspector.get_foreign_keys("chapters")
    user_fk_name = next(
        (
            foreign_key["name"]
            for foreign_key in foreign_keys
            if foreign_key.get("constrained_columns") == ["user_id"]
        ),
        None,
    )
    if user_fk_name:
        op.drop_constraint(user_fk_name, "chapters", type_="foreignkey")
    op.drop_column("chapters", "user_id")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column("chapters", sa.Column("user_id", sa.Integer(), nullable=False))
    op.create_foreign_key(
        "chapters_ibfk_2",
        "chapters",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
