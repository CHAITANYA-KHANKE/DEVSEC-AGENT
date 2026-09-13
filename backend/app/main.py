from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

from app.database.base import Base
from app.database.session import engine
from app.auth.models import User
from app.database.models import Repository, Scan, Finding, FixSuggestion
from app.api.routes import auth, repositories, scans, findings, deployment, dashboard

# Initialize database tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[Warning] DB initialization error: {e}")

app = FastAPI(
    title="DEVSecAgent API",
    version="0.1.0",
    description="AI-assisted security analysis for GitHub repositories"
)

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(repositories.router, prefix="/repositories", tags=["repositories"])
app.include_router(scans.router, prefix="/scans", tags=["scans"])
app.include_router(findings.router, prefix="/findings", tags=["findings"])
app.include_router(deployment.router, prefix="/deployment", tags=["deployment"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "DEVSecAgent API"}

@app.get("/")
def root():
    return {"message": "DEVSecAgent API running. See /docs for API docs"}
