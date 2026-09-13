import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

raw_url = os.getenv("DATABASE_URL", "sqlite:///./devsecagent.db").strip().strip('"').strip("'")

if raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql://", 1)

engine = None
try:
    connect_args = {}
    if raw_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    engine = create_engine(raw_url, connect_args=connect_args, pool_pre_ping=True)
except Exception as e:
    print(f"[Database Warning] Could not parse or connect with DATABASE_URL: {e}. Falling back to SQLite.")
    fallback_url = "sqlite:///./devsecagent.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
