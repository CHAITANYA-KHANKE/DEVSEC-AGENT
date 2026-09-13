from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import subprocess, tempfile, shutil, json, os, pathlib, re
from app.auth.security import get_current_user
from app.auth.models import User

router = APIRouter()

class DeployAnalyzeRequest(BaseModel):
    repository_url: str
    target: str  # vercel | netlify | render

@router.post("/analyze")
def analyze_deployment(data: DeployAnalyzeRequest, user: User = Depends(get_current_user)):
    if data.target not in ["vercel","netlify","render"]:
        raise HTTPException(status_code=400, detail="Target must be vercel, netlify, or render")
    workdir = tempfile.mkdtemp(prefix="deploy_")
    try:
        subprocess.run(["git","clone","--depth","1",data.repository_url,workdir+"/repo"], capture_output=True,timeout=30)
        repo = pathlib.Path(workdir+"/repo")
        # detection heuristics (evidence-based, not invented)
        findings = []
        has_next = (repo/"next.config.js").exists() or (repo/"next.config.mjs").exists() or (repo/"package.json").exists() and "next" in (repo/"package.json").read_text(errors="ignore")
        has_vite = (repo/"vite.config.ts").exists() or (repo/"vite.config.js").exists()
        has_vercel_json = (repo/"vercel.json").exists()
        has_netlify_toml = (repo/"netlify.toml").exists()
        has_render_yaml = (repo/"render.yaml").exists()
        has_env_example = list(repo.glob("*.env*"))
        pkg = {}
        if (repo/"package.json").exists():
            try: pkg=json.loads((repo/"package.json").read_text())
            except: pass

        detected = "Unknown"
        if has_next: detected="Next.js"
        elif pkg.get("dependencies",{}).get("react"): detected="React (Vite/CRA)"
        elif (repo/"requirements.txt").exists() or (repo/"pyproject.toml").exists(): detected="Python (FastAPI/Flask)"
        
        recs=[]
        if data.target=="vercel":
            if not has_vercel_json: recs.append("No vercel.json found — Vercel will auto-detect Next.js/Vite. Add vercel.json only if you need custom builds.")
            if has_next: recs.append("Detected Next.js — Vercel recommended build: `next build`, output: `.next`")
            recs.append("Set environment variables in Vercel dashboard, never commit .env")
        elif data.target=="netlify":
            if not has_netlify_toml: recs.append("No netlify.toml — add one for redirects and build config if needed.")
            recs.append("Ensure build command (e.g., `npm run build`) and publish directory (dist/build) are set correctly")
        elif data.target=="render":
            if not has_render_yaml: recs.append("No render.yaml — configure service via Render dashboard or add render.yaml")
            recs.append("Set start command (e.g., `uvicorn app.main:app --host 0.0.0.0 --port 10000`) and health check")

        # env var refs
        env_refs=[]
        for p in repo.rglob("*"):
            if p.is_file() and p.suffix in [".js",".ts",".tsx",".py",".json"]:
                try:
                    t=p.read_text(errors="ignore")
                    if "process.env" in t or "os.getenv" in t or "os.environ" in t:
                        env_refs.append(str(p.relative_to(repo)) )
                        if len(env_refs)>10: break
                except: pass

        return {
            "target": data.target,
            "detected_framework": detected,
            "evidence": {
                "has_vercel_json": has_vercel_json,
                "has_netlify_toml": has_netlify_toml,
                "has_render_yaml": has_render_yaml,
                "has_env_files": [str(x.relative_to(repo)) for x in has_env_example[:5]],
                "env_references_in_code": env_refs[:10],
                "package_manager": "npm" if (repo/"package-lock.json").exists() else "yarn" if (repo/"yarn.lock").exists() else "pip" if (repo/"requirements.txt").exists() else "unknown"
            },
            "recommendations": recs,
            "note": "Recommendations are heuristic and based on repository evidence, not invented platform requirements."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)[:500])
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
