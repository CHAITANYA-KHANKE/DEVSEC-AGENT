import uuid
import os
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base
from datetime import datetime

# Use String for sqlite, UUID for postgres
DB_URL = os.getenv("DATABASE_URL", "")
USE_PG = "postgresql" in DB_URL or "psycopg" in DB_URL

if USE_PG:
    from sqlalchemy.dialects.postgresql import UUID
    IdType = UUID(as_uuid=True)
    IdDefault = uuid.uuid4
else:
    IdType = String(36)
    IdDefault = lambda: str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(IdType, primary_key=True, default=IdDefault)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
