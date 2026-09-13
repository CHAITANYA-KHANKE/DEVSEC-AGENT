from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import os, json, re
from app.auth.security import get_current_user
from app.auth.models import User
from app.api.routes.scans import findings_db, scans_db
from app.api.routes.repositories import repos_db

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except Exception:
    HAS_GEMINI = False

router = APIRouter()

class FixResponse(BaseModel):
    explanation: str
    impact: str
    recommended_action: str
    fixed_code: str
    unified_diff: str
    confidence: str
    limitations: str

def _generate_contextual_fallback_fix(finding: dict) -> dict:
    cat = finding.get("category", "SECURITY")
    rule_id = finding.get("rule_id", "")
    title = finding.get("title", "")
    file_path = finding.get("file_path", "source_file")
    line = finding.get("start_line", 1)
    snippet = finding.get("code_snippet", "")

    if cat == "SECRETS" or "leak" in rule_id or "secret" in rule_id:
        return {
            "explanation": f"Exposed sensitive secret or credential identified in '{file_path}' at line {line}. Hardcoding keys directly into source control compromises infrastructure and accounts.",
            "impact": "Attackers can scrape the credential and gain full unauthorized access to cloud services, databases, or third-party APIs.",
            "recommended_action": "Remove the secret from version control, rotate the compromised key immediately, and inject secrets via environment variables (os.environ / process.env).",
            "fixed_code": "# Use environment variables instead of hardcoded secrets\nimport os\napi_key = os.getenv('SERVICE_API_KEY')\nif not api_key:\n    raise ValueError('SERVICE_API_KEY environment variable is missing.')",
            "unified_diff": f"--- a/{file_path}\n+++ b/{file_path}\n@@ -{line},1 +{line},3 @@\n- {snippet[:80] if snippet else 'SECRET_KEY = \"sk-12345...\"'}\n+ import os\n+ api_key = os.getenv('SERVICE_API_KEY')",
            "confidence": "HIGH",
            "limitations": "Remember to revoke and rotate the exposed secret in your provider dashboard immediately."
        }
    elif "sql" in rule_id.lower() or "injection" in title.lower():
        return {
            "explanation": f"Unparameterized SQL query detected in '{file_path}' at line {line}. Dynamic query construction using string interpolation is vulnerable to SQL injection.",
            "impact": "An attacker can manipulate user input to bypass authentication, dump sensitive database tables, or execute destructive commands.",
            "recommended_action": "Always use parameterized queries or ORM query builders with bind parameters instead of formatting strings directly.",
            "fixed_code": "# Secure parameterized query\nquery = 'SELECT * FROM users WHERE id = :user_id'\ncursor.execute(query, {'user_id': user_id})\nresult = cursor.fetchone()",
            "unified_diff": f"--- a/{file_path}\n+++ b/{file_path}\n@@ -{line},1 +{line},3 @@\n- {snippet[:80] if snippet else 'cursor.execute(f\"SELECT * FROM users WHERE id = {user_id}\")'}\n+ query = 'SELECT * FROM users WHERE id = :user_id'\n+ cursor.execute(query, {'user_id': user_id})",
            "confidence": "HIGH",
            "limitations": "Ensure your database driver parameter placeholder format matches (:param, %s, or $1)."
        }
    elif "command" in rule_id or "shell" in title.lower():
        return {
            "explanation": f"System command execution with shell=True or dynamic exec detected in '{file_path}' at line {line}.",
            "impact": "Untrusted input passed into shell commands allows remote command execution (RCE) on the host machine.",
            "recommended_action": "Pass arguments as a list of strings and set shell=False to prevent shell command concatenation.",
            "fixed_code": "import subprocess\n# Safe argument list without shell=True\nresult = subprocess.run(['ls', '-la', target_dir], capture_output=True, text=True, check=True)",
            "unified_diff": f"--- a/{file_path}\n+++ b/{file_path}\n@@ -{line},1 +{line},2 @@\n- {snippet[:80] if snippet else 'subprocess.run(cmd, shell=True)'}\n+ subprocess.run(['cmd', arg], shell=False, check=True)",
            "confidence": "HIGH",
            "limitations": "Validate all command arguments against an allowlist before execution."
        }
    elif cat == "DEBUG_ERROR" or "syntax" in rule_id or "except" in rule_id:
        return {
            "explanation": f"Code defect or error handling flaw flagged in '{file_path}' at line {line}: {title}.",
            "impact": "Can lead to runtime crashes, swallowed exceptions, unhandled race conditions, or application instability in production.",
            "recommended_action": "Specify explicit exception types, handle error edge cases, and add structured logging.",
            "fixed_code": "try:\n    perform_operation()\nexcept SpecificException as err:\n    logger.error(f'Operation failed: {err}')\n    raise HTTPException(status_code=500, detail='Internal operation error')",
            "unified_diff": f"--- a/{file_path}\n+++ b/{file_path}\n@@ -{line},1 +{line},4 @@\n- {snippet[:80] if snippet else 'except: pass'}\n+ except SpecificException as err:\n+     logger.error(f'Operation failed: {err}')\n+     raise",
            "confidence": "HIGH",
            "limitations": "Test edge cases to verify that error handling propagates properly to callers."
        }
    elif cat == "OPTIMIZATION" or "blocking" in rule_id:
        return {
            "explanation": f"Performance / Architecture flaw detected in '{file_path}' at line {line}: {title}.",
            "impact": "Synchronous blocking calls in async handlers freeze the event loop, causing severe latency spikes for all concurrent requests.",
            "recommended_action": "Replace synchronous blocking calls with non-blocking async equivalents (e.g. asyncio.sleep, httpx.AsyncClient).",
            "fixed_code": "import asyncio\nimport httpx\n\n# Non-blocking asynchronous implementation\nawait asyncio.sleep(1)\nasync with httpx.AsyncClient() as client:\n    response = await client.get('https://api.example.com/data')",
            "unified_diff": f"--- a/{file_path}\n+++ b/{file_path}\n@@ -{line},1 +{line},4 @@\n- {snippet[:80] if snippet else 'time.sleep(1)'}\n+ await asyncio.sleep(1)",
            "confidence": "HIGH",
            "limitations": "Ensure calling functions are declared with async def and properly awaited."
        }
    else:
        return {
            "explanation": f"Security finding '{title}' detected in '{file_path}' at line {line}.",
            "impact": "Potential security vulnerability or improper validation pattern.",
            "recommended_action": "Apply strict input validation, sanitize dynamic data, and follow secure coding guidelines.",
            "fixed_code": "# Remediation\nvalidate_input(data)\nsafe_execute(data)",
            "unified_diff": f"--- a/{file_path}\n+++ b/{file_path}\n@@ -{line},1 +{line},2 @@\n- {snippet[:80] if snippet else '// vulnerable code'}\n+ safe_execute(sanitized_input)",
            "confidence": "MEDIUM",
            "limitations": "Review changes with your team and re-scan the repository."
        }

@router.get("/{finding_id}")
def get_finding(finding_id: str, user: User = Depends(get_current_user)):
    for findings in findings_db.values():
        for f in findings:
            if f["id"] == finding_id:
                scan = scans_db.get(f["scan_id"])
                repo = repos_db.get(scan["repository_id"]) if scan else None
                if not repo or repo["owner_id"] != str(user.id):
                    raise HTTPException(status_code=403, detail="Forbidden")
                return f
    raise HTTPException(status_code=404, detail="Finding not found")

@router.post("/{finding_id}/suggest-fix", response_model=FixResponse)
def suggest_fix(finding_id: str, user: User = Depends(get_current_user)):
    finding = None
    for findings in findings_db.values():
        for f in findings:
            if f["id"] == finding_id:
                finding = f
                break
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    scan = scans_db.get(finding["scan_id"])
    repo = repos_db.get(scan["repository_id"]) if scan else None
    if not repo or repo["owner_id"] != str(user.id):
        raise HTTPException(status_code=403, detail="Forbidden")

    api_key = os.getenv("GEMINI_API_KEY")
    if HAS_GEMINI and api_key and api_key != "your_gemini_api_key_here":
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""You are DEVSecAgent, an advanced AI security remediation engineer.
Analyze this code finding and produce a precise, developer-ready remediation:

Finding Details:
{json.dumps(finding, indent=2)}

Instructions:
1. Provide a concise explanation of the root cause.
2. State the real-world security or reliability impact.
3. Provide a clear, actionable recommendation.
4. Provide the exact corrected code replacement snippet.
5. Provide a valid unified diff (e.g. --- a/path +++ b/path @@ -line,count +line,count @@).
6. Set confidence to "HIGH" or "MEDIUM".
7. State practical limitations or reminder to re-scan.

Return ONLY a valid JSON object with keys:
- "explanation": string
- "impact": string
- "recommended_action": string
- "fixed_code": string
- "unified_diff": string
- "confidence": string
- "limitations": string"""

            resp = model.generate_content(prompt)
            text = resp.text.strip()
            if "```" in text:
                parts = text.split("```")
                text = parts[1]
                if text.startswith("json"):
                    text = text[4:].strip()

            data = json.loads(text)
            for k in ["explanation", "impact", "recommended_action", "fixed_code", "unified_diff", "confidence", "limitations"]:
                if k not in data:
                    raise ValueError(f"Missing {k}")
            return data
        except Exception as e:
            print(f"[suggest_fix] Gemini call fallback: {e}")
            return _generate_contextual_fallback_fix(finding)
    else:
        return _generate_contextual_fallback_fix(finding)
