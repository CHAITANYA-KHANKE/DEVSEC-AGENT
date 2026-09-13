from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
import uuid, time, subprocess, tempfile, shutil, os, json, pathlib
from app.auth.security import get_current_user
from app.auth.models import User
from app.api.routes.repositories import repos_db
from app.scanner.engine import ScannerEngine

router = APIRouter()

# Simple in-memory scan store for MVP (with full state cache)
scans_db = {}
findings_db = {}  # scan_id -> list

SCAN_STATES = ["QUEUED", "FETCHING", "SCANNING", "ANALYZING", "READY", "FAILED"]
IGNORED_TREE_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build", ".next", ".cache"}
MAX_TREE_FILES = 1000

class ScanCreate(BaseModel):
    repository_id: str

def _collect_repo_files_and_contents(repo_path: str) -> tuple[list[str], dict[str, str]]:
    files: list[str] = []
    contents: dict[str, str] = {}
    root = pathlib.Path(repo_path)

    for path in root.rglob("*"):
        if len(files) >= MAX_TREE_FILES:
            break
        if any(part in IGNORED_TREE_DIRS for part in path.parts):
            continue
        if path.is_file():
            rel = path.relative_to(root).as_posix()
            files.append(rel)
            # Cache text file contents up to 60KB
            try:
                if path.stat().st_size <= 60_000:
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        contents[rel] = f.read()
            except Exception:
                pass

    return sorted(files), contents

def _map_semgrep_sev(s: str) -> str:
    m = {"ERROR": "HIGH", "WARNING": "MEDIUM", "INFO": "LOW"}
    return m.get(s.upper(), s.upper())

def _run_scan(scan_id: str, repo_url: str):
    """Background task: isolate workspace, run real multi-tier scanners, normalize findings"""
    scans_db[scan_id]["status"] = "FETCHING"
    workdir = tempfile.mkdtemp(prefix=f"devsec_{scan_id}_")
    try:
        # 1. Clone (shallow clone)
        scans_db[scan_id]["status"] = "SCANNING"
        clone = subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, workdir + "/repo"],
            capture_output=True, text=True, timeout=60
        )
        
        repo_path = workdir + "/repo"
        repo_files = []
        file_contents = {}

        if clone.returncode == 0 and os.path.exists(repo_path):
            repo_files, file_contents = _collect_repo_files_and_contents(repo_path)

        # If repo clone yielded no files or failed clone (e.g. offline or private without auth)
        if not repo_files:
            # If clone failed on an inaccessible repo URL
            if clone.returncode != 0:
                scans_db[scan_id].update({
                    "status": "FAILED",
                    "error": f"Unable to clone repository: {clone.stderr[:400] if clone.stderr else 'Git clone failed'}"
                })
                return

        scans_db[scan_id]["repo_files"] = repo_files
        scans_db[scan_id]["file_contents"] = file_contents
        scans_db[scan_id]["status"] = "ANALYZING"

        # 2. Run Comprehensive Scanner Engine (Native SAST, Secret Leaks, Debugging AST, Gemini AI)
        engine = ScannerEngine(scan_id, repo_path, repo_files, file_contents)
        findings = engine.run_all()
        seen_fingerprints = {f.get("fingerprint") for f in findings if f.get("fingerprint")}

        # 3. Optional Tool Integration: Semgrep (if installed on host)
        try:
            sem = subprocess.run(
                ["semgrep", "--config", "auto", "--json", "--quiet", repo_path],
                capture_output=True, text=True, timeout=120
            )
            if sem.stdout:
                data = json.loads(sem.stdout)
                for r in data.get("results", [])[:50]:
                    fp = f"semgrep:{r.get('check_id')}:{r.get('path')}:{r.get('start', {}).get('line')}"
                    if fp not in seen_fingerprints:
                        seen_fingerprints.add(fp)
                        findings.append({
                            "id": str(uuid.uuid4()),
                            "scan_id": scan_id,
                            "scanner": "semgrep",
                            "rule_id": r.get("check_id", "unknown"),
                            "title": r.get("check_id", "").split(".")[-1].replace("-", " ").title(),
                            "description": r.get("extra", {}).get("message", "Semgrep security check failure."),
                            "severity": _map_semgrep_sev(r.get("extra", {}).get("severity", "MEDIUM")),
                            "confidence": "HIGH",
                            "category": "SECURITY",
                            "file_path": r.get("path", "").replace(repo_path + "/", "").replace("\\", "/"),
                            "start_line": r.get("start", {}).get("line", 1),
                            "end_line": r.get("end", {}).get("line", 1),
                            "code_snippet": r.get("extra", {}).get("lines", "")[:400],
                            "fingerprint": fp,
                            "status": "OPEN"
                        })
        except Exception:
            pass

        # 4. Optional Tool Integration: Bandit (Python SAST if installed)
        try:
            band = subprocess.run(
                ["bandit", "-r", repo_path, "-f", "json", "-q"],
                capture_output=True, text=True, timeout=60
            )
            if band.stdout:
                data = json.loads(band.stdout)
                for r in data.get("results", [])[:30]:
                    rel_file = r.get("filename", "").replace(repo_path + "/", "").replace("\\", "/")
                    fp = f"bandit:{r.get('test_id')}:{rel_file}:{r.get('line_number')}"
                    if fp not in seen_fingerprints:
                        seen_fingerprints.add(fp)
                        findings.append({
                            "id": str(uuid.uuid4()),
                            "scan_id": scan_id,
                            "scanner": "bandit",
                            "rule_id": f"bandit.{r.get('test_id', 'unknown')}",
                            "title": r.get("issue_text", "")[:80],
                            "description": r.get("issue_text", ""),
                            "severity": r.get("issue_severity", "MEDIUM").upper(),
                            "confidence": r.get("issue_confidence", "HIGH").upper(),
                            "category": "SECURITY",
                            "file_path": rel_file,
                            "start_line": r.get("line_number", 1),
                            "end_line": r.get("line_number", 1),
                            "code_snippet": r.get("code", "")[:400],
                            "fingerprint": fp,
                            "status": "OPEN"
                        })
        except Exception:
            pass

        # 5. Optional Tool Integration: Gitleaks (if installed)
        try:
            gl = subprocess.run(
                ["gitleaks", "detect", "--source", repo_path, "--no-git", "--format", "json"],
                capture_output=True, text=True, timeout=60
            )
            if gl.stdout:
                try:
                    data = json.loads(gl.stdout)
                    if isinstance(data, dict):
                        data = [data]
                    for r in data[:20]:
                        rel_file = r.get("File", "").replace(repo_path + "/", "").replace("\\", "/")
                        fp = f"gitleaks:{r.get('RuleID')}:{rel_file}:{r.get('StartLine')}"
                        if fp not in seen_fingerprints:
                            seen_fingerprints.add(fp)
                            findings.append({
                                "id": str(uuid.uuid4()),
                                "scan_id": scan_id,
                                "scanner": "gitleaks",
                                "rule_id": f"gitleaks.{r.get('RuleID', 'secret')}",
                                "title": f"Exposed secret: {r.get('RuleID', 'Secret')}",
                                "description": r.get("Description", "Potential credential/secret detected in source file."),
                                "severity": "CRITICAL",
                                "confidence": "HIGH",
                                "category": "SECRETS",
                                "file_path": rel_file,
                                "start_line": r.get("StartLine", 1),
                                "end_line": r.get("EndLine", 1),
                                "code_snippet": "*** REDACTED SECRET ***",
                                "fingerprint": fp,
                                "status": "OPEN"
                            })
                except Exception:
                    pass
        except Exception:
            pass

        # Sort findings by severity priority: CRITICAL > HIGH > MEDIUM > LOW
        sev_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        findings.sort(key=lambda x: sev_rank.get(x.get("severity", "MEDIUM"), 4))

        findings_db[scan_id] = findings
        scans_db[scan_id].update({
            "status": "READY",
            "findings_count": len(findings),
            "finished_at": time.time()
        })

    except Exception as e:
        scans_db[scan_id].update({"status": "FAILED", "error": str(e)[:500]})
    finally:
        # Clean up isolated clone workspace
        shutil.rmtree(workdir, ignore_errors=True)

@router.post("")
def create_scan(data: ScanCreate, bg: BackgroundTasks, user: User = Depends(get_current_user)):
    repo = repos_db.get(data.repository_id)
    if not repo or repo["owner_id"] != str(user.id):
        raise HTTPException(status_code=404, detail="Repository not found")
    scan_id = str(uuid.uuid4())
    scans_db[scan_id] = {
        "id": scan_id,
        "repository_id": data.repository_id,
        "deployment_target": repo.get("deployment_target", "Vercel"),
        "status": "QUEUED",
        "created_at": time.time(),
        "findings_count": 0,
        "repo_files": [],
        "file_contents": {}
    }
    bg.add_task(_run_scan, scan_id, repo["url"])
    return scans_db[scan_id]

@router.get("/{scan_id}")
def get_scan(scan_id: str, user: User = Depends(get_current_user)):
    scan = scans_db.get(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    repo = repos_db.get(scan["repository_id"])
    if not repo or repo["owner_id"] != str(user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    findings = findings_db.get(scan_id, [])
    
    # Aggregated metrics
    sev = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    cat = {"SECRETS": 0, "SECURITY": 0, "DEBUG_ERROR": 0, "OPTIMIZATION": 0}
    
    for f in findings:
        s = f.get("severity", "MEDIUM")
        if s in sev:
            sev[s] += 1
        elif s == "ERROR":
            sev["HIGH"] += 1

        c = f.get("category", "SECURITY")
        if c in cat:
            cat[c] += 1
        else:
            cat["SECURITY"] += 1

    return {
        **scan,
        "findings": findings,
        "severity_counts": sev,
        "category_counts": cat
    }

@router.get("/by-repo/{repository_id}")
def list_scans(repository_id: str, user: User = Depends(get_current_user)):
    repo = repos_db.get(repository_id)
    if not repo or repo["owner_id"] != str(user.id):
        raise HTTPException(status_code=404, detail="Repository not found")
    return [s for s in scans_db.values() if s["repository_id"] == repository_id]

@router.post("/{scan_id}/rescan")
def rescan(scan_id: str, bg: BackgroundTasks, user: User = Depends(get_current_user)):
    old = scans_db.get(scan_id)
    if not old:
        raise HTTPException(status_code=404, detail="Scan not found")
    repo = repos_db.get(old["repository_id"])
    if not repo or repo["owner_id"] != str(user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    new_id = str(uuid.uuid4())
    scans_db[new_id] = {
        "id": new_id,
        "repository_id": old["repository_id"],
        "deployment_target": old.get("deployment_target", "Vercel"),
        "status": "QUEUED",
        "created_at": time.time(),
        "findings_count": 0,
        "repo_files": [],
        "file_contents": {},
        "parent_scan_id": scan_id
    }
    bg.add_task(_run_scan, new_id, repo["url"])
    return scans_db[new_id]
