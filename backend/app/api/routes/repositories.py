from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
import re, uuid, os, tempfile, subprocess, shutil
from urllib.parse import urlparse
from app.database.session import get_db
from app.auth.security import get_current_user
from app.auth.models import User

router = APIRouter()

GITHUB_URL_RE = re.compile(r"^https://github\.com/[\w.-]+/[\w.-]+/?$")

class RepoCreate(BaseModel):
    url: str
    deployment_target: str | None = None  # vercel | netlify | render

    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        v = v.strip().rstrip('/')
        if not GITHUB_URL_RE.match(v):
            raise ValueError('Invalid GitHub URL. Expected https://github.com/owner/repo')
        # prevent path traversal / injection
        parsed = urlparse(v)
        if parsed.hostname != "github.com":
            raise ValueError('Only github.com allowed')
        return v

# In-memory demo store (replace with DB model Repository in Phase 2)
repos_db = {}

@router.post("")
def create_repo(data: RepoCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    repo_id = str(uuid.uuid4())
    # Validate repo is fetchable (public check) without storing code
    # Use git ls-remote with timeout (allowlisted command)
    try:
        result = subprocess.run(
            ["git", "ls-remote", data.url, "HEAD"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode != 0:
            raise HTTPException(status_code=400, detail="Repository not accessible. For private repos, GitHub App authorization required.")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=400, detail="Repository check timed out")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="git not installed on server")

    entry = {
        "id": repo_id,
        "url": data.url,
        "owner_id": str(user.id),
        "deployment_target": data.deployment_target,
        "status": "READY"
    }
    repos_db[repo_id] = entry
    return entry

@router.get("")
def list_repos(user: User = Depends(get_current_user)):
    return [r for r in repos_db.values() if r["owner_id"] == str(user.id)]

@router.get("/{repo_id}")
def get_repo(repo_id: str, user: User = Depends(get_current_user)):
    repo = repos_db.get(repo_id)
    if not repo or repo["owner_id"] != str(user.id):
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo
