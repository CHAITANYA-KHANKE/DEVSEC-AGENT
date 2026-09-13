import uuid
import os
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

DB_URL = os.getenv("DATABASE_URL", "")
USE_PG = "postgresql" in DB_URL or "psycopg" in DB_URL

if USE_PG:
    from sqlalchemy.dialects.postgresql import UUID
    IdType = UUID(as_uuid=True)
    IdDefault = uuid.uuid4
else:
    IdType = String(36)
    IdDefault = lambda: str(uuid.uuid4())

class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[str] = mapped_column(IdType, primary_key=True, default=IdDefault)
    url: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    owner: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    default_branch: Mapped[str] = mapped_column(String(100), default="main")
    user_id: Mapped[Optional[str]] = mapped_column(IdType, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    scans: Mapped[List["Scan"]] = relationship("Scan", back_populates="repository", cascade="all, delete-orphan")

class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[str] = mapped_column(IdType, primary_key=True, default=IdDefault)
    repository_id: Mapped[str] = mapped_column(IdType, ForeignKey("repositories.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="QUEUED")  # QUEUED, SCANNING, ANALYZING, READY, FAILED
    deployment_target: Mapped[Optional[str]] = mapped_column(String(50), default="Vercel")
    security_score: Mapped[int] = mapped_column(Integer, default=100)
    critical_count: Mapped[int] = mapped_column(Integer, default=0)
    high_count: Mapped[int] = mapped_column(Integer, default=0)
    medium_count: Mapped[int] = mapped_column(Integer, default=0)
    low_count: Mapped[int] = mapped_column(Integer, default=0)
    total_findings: Mapped[int] = mapped_column(Integer, default=0)
    scan_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    repository: Mapped["Repository"] = relationship("Repository", back_populates="scans")
    findings: Mapped[List["Finding"]] = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")

class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(IdType, primary_key=True, default=IdDefault)
    scan_id: Mapped[str] = mapped_column(IdType, ForeignKey("scans.id"), nullable=False)
    scanner: Mapped[str] = mapped_column(String(100), default="semgrep")
    rule_id: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    confidence: Mapped[str] = mapped_column(String(50), default="HIGH")
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    start_line: Mapped[int] = mapped_column(Integer, default=1)
    end_line: Mapped[int] = mapped_column(Integer, default=1)
    code_snippet: Mapped[str] = mapped_column(Text, nullable=False)
    fingerprint: Mapped[str] = mapped_column(String(255), index=True)
    status: Mapped[str] = mapped_column(String(50), default="OPEN")  # OPEN, RESOLVED, REGRESSED
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    scan: Mapped["Scan"] = relationship("Scan", back_populates="findings")
    fix_suggestions: Mapped[List["FixSuggestion"]] = relationship("FixSuggestion", back_populates="finding", cascade="all, delete-orphan")

class FixSuggestion(Base):
    __tablename__ = "fix_suggestions"

    id: Mapped[str] = mapped_column(IdType, primary_key=True, default=IdDefault)
    finding_id: Mapped[str] = mapped_column(IdType, ForeignKey("findings.id"), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    impact: Mapped[str] = mapped_column(Text, nullable=False)
    recommended_action: Mapped[str] = mapped_column(Text, nullable=False)
    fixed_code: Mapped[str] = mapped_column(Text, nullable=False)
    unified_diff: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[str] = mapped_column(String(50), default="HIGH")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    finding: Mapped["Finding"] = relationship("Finding", back_populates="fix_suggestions")
