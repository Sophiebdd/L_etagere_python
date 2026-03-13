"""merge refresh token migration head

Revision ID: f4c5d6e7a8b9
Revises: 5b1e4c9d2f8a, e8f1c2d3b4a5
Create Date: 2026-03-13 14:00:00.000000

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "f4c5d6e7a8b9"
down_revision: Union[str, Sequence[str], None] = ("5b1e4c9d2f8a", "e8f1c2d3b4a5")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
