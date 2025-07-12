"""Added is_verified column to Users table

Revision ID: 35f661e3715f
Revises: 
Create Date: 2025-07-12 17:22:54.337237

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '35f661e3715f'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('Users', sa.Column('is_verified', sa.Boolean))


def downgrade() -> None:
    """Downgrade schema."""
    pass
