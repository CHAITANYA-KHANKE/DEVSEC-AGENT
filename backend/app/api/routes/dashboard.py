from fastapi import APIRouter, Depends
from app.auth.security import get_current_user
from app.auth.models import User
from app.api.routes.scans import scans_db, findings_db
from app.api.routes.repositories import repos_db

router = APIRouter()

def _score(findings):
    if not findings:
        return {"security": 100, "code_quality": 100, "secrets": 100, "configuration": 90, "dependency": 70}
    # documented 0-100 scoring: deduct per severity
    weights = {"CRITICAL": 25, "HIGH": 10, "MEDIUM": 4, "LOW": 1}
    deduction = sum(weights.get(f.get("severity","MEDIUM"), 4) for f in findings)
    security = max(0, 100 - deduction)
    secrets = 100
    secrets_hits = len([f for f in findings if f.get("scanner")=="gitleaks"])
    if secrets_hits>0:
        secrets = max(0, 100 - secrets_hits*30)
    return {
        "security": security,
        "code_quality": max(0, 100 - len(findings)*3),
        "secrets": secrets,
        "configuration": 80,  # placeholder until deployment analysis
        "dependency": 70
    }

@router.get("/overview")
def overview(user: User = Depends(get_current_user)):
    uid = str(user.id)
    user_repos = [r for r in repos_db.values() if r["owner_id"]==uid]
    user_scans = [s for s in scans_db.values() if repos_db.get(s["repository_id"],{}).get("owner_id")==uid]
    latest = sorted(user_scans, key=lambda x: x.get("created_at",0), reverse=True)[:5]
    all_findings = []
    for s in user_scans:
        all_findings.extend(findings_db.get(s["id"],[]))
    # counts
    counts = {"CRITICAL":0,"HIGH":0,"MEDIUM":0,"LOW":0}
    for f in all_findings:
        sev=f.get("severity","MEDIUM")
        if sev in counts: counts[sev]+=1
    scores = _score(all_findings)
    # before/after if rescan exists
    history=[]
    for s in sorted(user_scans, key=lambda x: x.get("created_at",0))[-10:]:
        history.append({"scan_id":s["id"],"status":s["status"],"findings_count":s.get("findings_count",0),"created_at":s.get("created_at")})
    return {
        "repositories_count": len(user_repos),
        "scans_count": len(user_scans),
        "findings_count": len(all_findings),
        "severity_counts": counts,
        "scores": scores,
        "recent_scans": latest,
        "history": history
    }
