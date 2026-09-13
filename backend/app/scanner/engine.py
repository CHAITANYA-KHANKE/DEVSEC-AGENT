import os
import re
import ast
import json
import uuid
import pathlib
from typing import List, Dict, Any, Optional

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except Exception:
    HAS_GEMINI = False

# Sensitive files that should NEVER be committed to a repository
SENSITIVE_FILE_PATTERNS = [
    (r"^\.env(\..+)?$", "Committed Environment Configuration File (.env)", "CRITICAL", "A .env file was found committed to the repository. It often contains private secrets, database connection strings, and production API tokens."),
    (r"^id_rsa(\.pub)?$", "Committed SSH Private/Public Key", "CRITICAL", "SSH key files committed directly to source control risk complete server compromise."),
    (r"^id_ed25519(\.pub)?$", "Committed SSH Private/Public Key", "CRITICAL", "SSH key files committed directly to source control risk complete server compromise."),
    (r".*\.(pem|key|pfx|p12)$", "Private Certificate or Key File", "CRITICAL", "Private certificate/key files should be kept in secure secret managers, not in version control."),
    (r".*service_account.*\.json$", "GCP Service Account Credentials File", "CRITICAL", "Google Cloud Service Account JSON file with private credentials committed to repository."),
    (r"^credentials\.json$", "Committed Credentials JSON File", "HIGH", "Generic credentials file committed to source control."),
    (r"^\.npmrc$", "Committed NPM Configuration (.npmrc)", "MEDIUM", "Check that this .npmrc file does not include plaintext _authToken credentials."),
]

# Regex patterns for detecting hardcoded secrets and leaked API keys in file contents
SECRET_PATTERNS = [
    {
        "id": "sec.secret.openai-key",
        "name": "OpenAI API Key",
        "pattern": r"(?:sk-[a-zA-Z0-9_-]{20,}|sk-proj-[a-zA-Z0-9_-]{20,})",
        "severity": "CRITICAL",
        "description": "Leaked OpenAI API Key found hardcoded in source code.",
        "category": "SECRETS"
    },
    {
        "id": "sec.secret.google-api-key",
        "name": "Google / Gemini API Key",
        "pattern": r"(?:AIza[0-9A-Za-z\-_]{35}|AQ\.[A-Za-z0-9\-_]{40,})",
        "severity": "CRITICAL",
        "description": "Exposed Google Cloud / Gemini API key found in source code.",
        "category": "SECRETS"
    },
    {
        "id": "sec.secret.aws-access-key",
        "name": "AWS Access Key ID",
        "pattern": r"(?:AKIA[0-9A-Z]{16})",
        "severity": "CRITICAL",
        "description": "AWS Access Key ID found in source code. Could allow unauthorized AWS infrastructure access.",
        "category": "SECRETS"
    },
    {
        "id": "sec.secret.github-token",
        "name": "GitHub Personal Access Token",
        "pattern": r"(?:ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82}|gho_[0-9a-zA-Z]{36})",
        "severity": "CRITICAL",
        "description": "Leaked GitHub Personal Access Token or OAuth token detected.",
        "category": "SECRETS"
    },
    {
        "id": "sec.secret.stripe-key",
        "name": "Stripe Live Secret Key",
        "pattern": r"(?:sk_live_[0-9a-zA-Z]{24}|rk_live_[0-9a-zA-Z]{24})",
        "severity": "CRITICAL",
        "description": "Stripe Live Secret Key exposed in source code. Can lead to unauthorized payment actions.",
        "category": "SECRETS"
    },
    {
        "id": "sec.secret.slack-token",
        "name": "Slack API / Bot Token",
        "pattern": r"(?:xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}|xoxp-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24})",
        "severity": "HIGH",
        "description": "Hardcoded Slack Token detected in codebase.",
        "category": "SECRETS"
    },
    {
        "id": "sec.secret.db-uri",
        "name": "Database URI with Hardcoded Password",
        "pattern": r"(?:postgres|mysql|mongodb|mongodb\+srv|redis):\/\/[a-zA-Z0-9_\-\.]+:[a-zA-Z0-9_\-\.!@#\$%\^&\*\(\)]+@[a-zA-Z0-9_\-\.]+",
        "severity": "CRITICAL",
        "description": "Database connection string containing embedded plaintext credentials.",
        "category": "SECRETS"
    },
    {
        "id": "sec.secret.jwt-token",
        "name": "Hardcoded JWT Token",
        "pattern": r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}",
        "severity": "HIGH",
        "description": "Hardcoded JSON Web Token detected in source code.",
        "category": "SECRETS"
    },
    {
        "id": "sec.secret.private-key",
        "name": "Hardcoded Private Key Block",
        "pattern": r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----",
        "severity": "CRITICAL",
        "description": "Private cryptographic key block embedded in source file.",
        "category": "SECRETS"
    }
]

# Security Glitches & SAST Heuristics
SECURITY_PATTERNS = [
    {
        "id": "sec.sast.sql-injection-fstring",
        "name": "SQL Injection (Unparameterized String Construction)",
        "pattern": r"""(?i)(?:query|sql|stmt|command)\s*=\s*(?:f['\"].*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE).*\{|\`.*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE).*\$\{)""",
        "severity": "CRITICAL",
        "description": "SQL query dynamically constructed via string interpolation. Vulnerable to severe SQL Injection.",
        "category": "SECURITY"
    },
    {
        "id": "sec.sast.sql-injection-exec",
        "name": "SQL Injection via Direct Format Execution",
        "pattern": r"""(?i)(?:cursor\.execute|conn\.execute|session\.execute|db\.query)\s*\(\s*(?:f['\"].*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER).*\{|\".*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER).*%s|\'.*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER).*%s|\`.*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER).*\$\{|\".*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER).*\"\s*\+\s*)""",
        "severity": "CRITICAL",
        "description": "Unparameterized SQL query passed directly into database execution method.",
        "category": "SECURITY"
    },
    {
        "id": "sec.sast.command-injection",
        "name": "Command Injection Risk (shell=True / os.system)",
        "pattern": r"""(?:subprocess\.(?:Popen|run|call|check_output)\([^)]*shell\s*=\s*True|os\.system\([^)]+\)|os\.popen\([^)]+\)|eval\([^)]+\)|child_process\.exec\([^)]+\))""",
        "severity": "CRITICAL",
        "description": "Execution of system command with shell=True or dynamic eval enables arbitrary command injection if input is untrusted.",
        "category": "SECURITY"
    },
    {
        "id": "sec.sast.path-traversal",
        "name": "Potential Path Traversal",
        "pattern": r"""(?:open\(\s*(?:request\.|req\.|params|query|userInput|filename|path)\b|fs\.readFile\(\s*(?:req\.|params|query|path)\b|res\.sendFile\(\s*(?:req\.|params|query)\b)""",
        "severity": "HIGH",
        "description": "Directly passing user-controlled parameters into file system open/read without path normalization or boundary check.",
        "category": "SECURITY"
    },
    {
        "id": "sec.sast.xss-dangerously-set",
        "name": "Cross-Site Scripting (dangerouslySetInnerHTML)",
        "pattern": r"""dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:""",
        "severity": "HIGH",
        "description": "Direct DOM HTML injection via dangerouslySetInnerHTML without sanitization allows Cross-Site Scripting (XSS).",
        "category": "SECURITY"
    },
    {
        "id": "sec.sast.insecure-cors",
        "name": "Insecure Permissive CORS Configuration",
        "pattern": r"""allow_origins\s*=\s*\[\s*['\"]\*['\"]\s*\]\s*,\s*allow_credentials\s*=\s*True""",
        "severity": "HIGH",
        "description": "CORS configured with wildcard origin ('*') while allow_credentials is True allows cross-origin credential theft.",
        "category": "SECURITY"
    },
    {
        "id": "sec.sast.insecure-crypto-hash",
        "name": "Weak Cryptographic Hash (MD5 / SHA1)",
        "pattern": r"""(?:hashlib\.md5\(|hashlib\.sha1\(|crypto\.createHash\(['\"](?:md5|sha1)['\"]\))""",
        "severity": "MEDIUM",
        "description": "MD5 and SHA1 are cryptographically broken and should not be used for security-critical functions or password hashing.",
        "category": "SECURITY"
    },
    {
        "id": "sec.sast.ssrf-unvalidated-fetch",
        "name": "Potential Server-Side Request Forgery (SSRF)",
        "pattern": r"""(?:requests\.(?:get|post)\(\s*(?:request\.|req\.|params|url|target_url)|httpx\.(?:get|post)\(\s*(?:request\.|req\.|url)|fetch\(\s*(?:req\.query|req\.body|targetUrl))""",
        "severity": "HIGH",
        "description": "Making HTTP requests to arbitrary user-supplied URLs without an IP/domain allowlist enables SSRF attacks.",
        "category": "SECURITY"
    }
]

# Debugging, Syntax & Runtime Defects
DEBUG_PATTERNS = [
    {
        "id": "sec.debug.bare-except-pass",
        "name": "Bare Exception Masking Errors (except: pass)",
        "pattern": r"""except(?:\s+Exception)?\s*:\s*(?:\n\s*)?pass""",
        "severity": "MEDIUM",
        "description": "Catching all exceptions with 'except: pass' silently suppresses runtime crashes and hides critical bugs.",
        "category": "DEBUG_ERROR"
    },
    {
        "id": "sec.debug.react-direct-state-mutation",
        "name": "Direct State Mutation in React",
        "pattern": r"""(?:this\.state\.[a-zA-Z0-9_]+\s*=|state\.[a-zA-Z0-9_]+\s*=\s*(?!set))""",
        "severity": "MEDIUM",
        "description": "Modifying state object directly instead of using setState/dispatcher leads to stale UI renders and race conditions.",
        "category": "DEBUG_ERROR"
    }
]

# Architecture & Optimization Rules
ARCHITECTURE_PATTERNS = [
    {
        "id": "sec.arch.client-leaked-private-env",
        "name": "Exposed Private Secret in Client Environment Config",
        "pattern": r"""(?:NEXT_PUBLIC_|VITE_)(?:.*(?:SECRET|PRIVATE_KEY|DATABASE_URL|ADMIN_KEY|SERVICE_KEY))\s*=""",
        "severity": "CRITICAL",
        "description": "Client-side prefix (NEXT_PUBLIC_ / VITE_) used on a private secret key. These variables will be baked into public client JS bundles!",
        "category": "OPTIMIZATION"
    },
    {
        "id": "sec.arch.unbounded-db-query",
        "name": "Unbounded Database Query (Missing LIMIT/Pagination)",
        "pattern": r"""(?i)SELECT\s+\*\s+FROM\s+[a-zA-Z0-9_]+(?:\s+WHERE\s+[^;]+)?\s*;(?!\s*(?:LIMIT|TOP))""",
        "severity": "LOW",
        "description": "Unbounded database SELECT query without pagination or LIMIT clause can cause memory spikes and performance degradation under load.",
        "category": "OPTIMIZATION"
    }
]

class ScannerEngine:
    """Multi-tiered real static code analysis and security scanner engine."""

    def __init__(self, scan_id: str, repo_path: str, repo_files: List[str], file_contents: Dict[str, str]):
        self.scan_id = scan_id
        self.repo_path = repo_path
        self.repo_files = repo_files
        self.file_contents = file_contents
        self.findings: List[Dict[str, Any]] = []
        self._seen_fingerprints = set()

    def run_all(self) -> List[Dict[str, Any]]:
        # 1. Detect sensitive / leaked files in repository tree (.env, keys, credentials)
        self._scan_sensitive_committed_files()

        # 2. Native regex & heuristic SAST analysis across file contents
        self._scan_content_heuristics()

        # 3. Python AST structural, syntax & async blocking analysis
        self._scan_python_ast()

        # 4. Gemini AI Deep SAST & Architecture Analysis (if API key available)
        self._run_gemini_deep_analysis()

        return self.findings

    def _add_finding(self, finding: Dict[str, Any]):
        fp = finding.get("fingerprint") or f"{finding.get('file_path')}:{finding.get('start_line')}:{finding.get('rule_id')}"
        finding["fingerprint"] = fp
        if fp not in self._seen_fingerprints:
            self._seen_fingerprints.add(fp)
            finding["id"] = str(uuid.uuid4())
            finding["scan_id"] = self.scan_id
            finding["status"] = "OPEN"
            self.findings.append(finding)

    def _scan_sensitive_committed_files(self):
        """Scans indexed repository file names to catch accidentally committed .env, keys, certs, etc."""
        for file_path in self.repo_files:
            file_name = pathlib.Path(file_path).name
            for pattern, title, severity, desc in SENSITIVE_FILE_PATTERNS:
                if re.search(pattern, file_name, re.IGNORECASE):
                    snippet = self.file_contents.get(file_path, "// Sensitive file committed directly to version control")[:400]
                    masked_snippet = re.sub(r"=(.+)", "= ******* [REDACTED]", snippet)
                    
                    self._add_finding({
                        "scanner": "secret-leak-engine",
                        "rule_id": f"sec.leak.{file_name.lower().replace('.', '-')}",
                        "title": f"Committed Secret File: {file_name}",
                        "description": desc,
                        "severity": severity,
                        "confidence": "HIGH",
                        "category": "SECRETS",
                        "file_path": file_path,
                        "start_line": 1,
                        "end_line": 1,
                        "code_snippet": masked_snippet,
                    })

    def _scan_content_heuristics(self):
        """Analyzes text contents of repository files against compiled SAST & secrets patterns."""
        all_rules = SECRET_PATTERNS + SECURITY_PATTERNS + DEBUG_PATTERNS + ARCHITECTURE_PATTERNS

        for file_path, content in self.file_contents.items():
            if not content:
                continue

            lines = content.splitlines()
            for rule in all_rules:
                try:
                    compiled = re.compile(rule["pattern"], re.MULTILINE)
                    for idx, line in enumerate(lines, start=1):
                        if compiled.search(line):
                            snippet = line.strip()
                            if rule["category"] == "SECRETS":
                                snippet = re.sub(r"(['\"][a-zA-Z0-9_\-\.\/+=@#$%^&*!]{8,}['\"])", "'*******[REDACTED]'", snippet)

                            self._add_finding({
                                "scanner": "sast-engine",
                                "rule_id": rule["id"],
                                "title": rule["name"],
                                "description": rule["description"],
                                "severity": rule["severity"],
                                "confidence": "HIGH",
                                "category": rule["category"],
                                "file_path": file_path,
                                "start_line": idx,
                                "end_line": idx,
                                "code_snippet": snippet[:400],
                            })
                except Exception:
                    pass

    def _scan_python_ast(self):
        """Validates Python syntax and checks AST nodes for syntax errors, blocking I/O in async, and bare excepts."""
        for file_path, content in self.file_contents.items():
            if not file_path.endswith(".py") or not content:
                continue

            try:
                tree = ast.parse(content, filename=file_path)
            except SyntaxError as e:
                lines = content.splitlines()
                err_line = e.lineno or 1
                snippet = lines[err_line - 1] if 0 < err_line <= len(lines) else "// Syntax Error"
                self._add_finding({
                    "scanner": "ast-debugger",
                    "rule_id": "sec.debug.python-syntax-error",
                    "title": f"Python Syntax Error: {e.msg}",
                    "description": f"File failed Python AST compilation at line {err_line}: {e.msg}. Will cause fatal runtime crash on execution.",
                    "severity": "CRITICAL",
                    "confidence": "HIGH",
                    "category": "DEBUG_ERROR",
                    "file_path": file_path,
                    "start_line": err_line,
                    "end_line": err_line,
                    "code_snippet": snippet,
                })
                continue

            # AST visitor for blocking calls in async def
            for node in ast.walk(tree):
                # Check for bare excepts
                if isinstance(node, ast.ExceptHandler):
                    if node.type is None:
                        line_no = getattr(node, "lineno", 1)
                        self._add_finding({
                            "scanner": "ast-debugger",
                            "rule_id": "sec.debug.bare-except-clause",
                            "title": "Unspecified Bare Except Clause",
                            "description": "Using bare 'except:' catches all exceptions, including SystemExit and KeyboardInterrupt, obscuring root-cause crashes.",
                            "severity": "MEDIUM",
                            "confidence": "HIGH",
                            "category": "DEBUG_ERROR",
                            "file_path": file_path,
                            "start_line": line_no,
                            "end_line": line_no,
                            "code_snippet": f"except:  # line {line_no}",
                        })

                # Check for blocking calls inside async function definitions
                if isinstance(node, ast.AsyncFunctionDef):
                    for subnode in ast.walk(node):
                        if isinstance(subnode, ast.Call):
                            # Check time.sleep()
                            if isinstance(subnode.func, ast.Attribute) and subnode.func.attr == "sleep":
                                if isinstance(subnode.func.value, ast.Name) and subnode.func.value.id == "time":
                                    call_line = getattr(subnode, "lineno", node.lineno)
                                    self._add_finding({
                                        "scanner": "ast-debugger",
                                        "rule_id": "sec.arch.sync-sleep-in-async",
                                        "title": "Blocking time.sleep() Inside Async Function",
                                        "description": f"Calling synchronous 'time.sleep()' inside async function '{node.name}' blocks the event loop. Use 'await asyncio.sleep()' instead.",
                                        "severity": "HIGH",
                                        "confidence": "HIGH",
                                        "category": "OPTIMIZATION",
                                        "file_path": file_path,
                                        "start_line": call_line,
                                        "end_line": call_line,
                                        "code_snippet": f"time.sleep(...) in async def {node.name}()",
                                    })
                            # Check requests.get / requests.post inside async
                            if isinstance(subnode.func, ast.Attribute) and subnode.func.attr in ("get", "post", "put", "delete"):
                                if isinstance(subnode.func.value, ast.Name) and subnode.func.value.id == "requests":
                                    call_line = getattr(subnode, "lineno", node.lineno)
                                    self._add_finding({
                                        "scanner": "ast-debugger",
                                        "rule_id": "sec.arch.blocking-requests-in-async",
                                        "title": "Synchronous requests.get/post in Async Handler",
                                        "description": f"Using synchronous 'requests.{subnode.func.attr}()' inside async function '{node.name}' halts concurrent requests. Use 'httpx.AsyncClient' or 'aiohttp'.",
                                        "severity": "HIGH",
                                        "confidence": "HIGH",
                                        "category": "OPTIMIZATION",
                                        "file_path": file_path,
                                        "start_line": call_line,
                                        "end_line": call_line,
                                        "code_snippet": f"requests.{subnode.func.attr}(...) in async def {node.name}()",
                                    })

    def _run_gemini_deep_analysis(self):
        """Runs Gemini Generative AI for deep semantic security and architecture analysis."""
        api_key = os.getenv("GEMINI_API_KEY")
        if not HAS_GEMINI or not api_key or api_key == "your_gemini_api_key_here":
            return

        sample_files = {}
        total_bytes = 0
        priority_extensions = {".py", ".ts", ".tsx", ".js", ".jsx", ".env", ".json", ".sql", ".go", ".rs"}
        
        for f, text in self.file_contents.items():
            ext = pathlib.Path(f).suffix.lower()
            if ext in priority_extensions and len(text) < 15000:
                sample_files[f] = text[:2500]
                total_bytes += len(sample_files[f])
                if total_bytes > 20000:
                    break

        if not sample_files:
            return

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""You are DEVSecAgent's senior security architect and SAST engine.
Analyze the following code files from a scanned repository.
Identify real security glitches, secret leaks, critical debugging/runtime errors, and architecture/optimization flaws.

Files provided:
{json.dumps(sample_files, indent=1)}

Instructions:
1. Return ONLY high-confidence, actionable findings.
2. DO NOT return vague advice or filler text.
3. Every finding must point to a specific existing file and line number.
4. Categories must be one of: "SECRETS", "SECURITY", "DEBUG_ERROR", "OPTIMIZATION".
5. Severities must be one of: "CRITICAL", "HIGH", "MEDIUM", "LOW".

Return ONLY a valid JSON array of objects with keys:
- "title": concise title
- "rule_id": string (e.g. "gemini.sec.auth-bypass")
- "description": 1-2 sentence concise explanation
- "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
- "category": "SECRETS" | "SECURITY" | "DEBUG_ERROR" | "OPTIMIZATION"
- "file_path": exact relative file path
- "start_line": integer line number
- "end_line": integer line number
- "code_snippet": relevant code snippet
"""
            resp = model.generate_content(prompt)
            text = resp.text.strip()
            if "```" in text:
                parts = text.split("```")
                text = parts[1]
                if text.startswith("json"):
                    text = text[4:].strip()

            gemini_results = json.loads(text)
            if isinstance(gemini_results, list):
                for r in gemini_results[:10]:
                    if isinstance(r, dict) and "title" in r and "file_path" in r:
                        self._add_finding({
                            "scanner": "gemini-ai",
                            "rule_id": r.get("rule_id", "gemini.analysis.finding"),
                            "title": r.get("title", "AI Code Defect"),
                            "description": r.get("description", "Potential code or security issue identified by Gemini AI."),
                            "severity": r.get("severity", "MEDIUM").upper(),
                            "confidence": "HIGH",
                            "category": r.get("category", "SECURITY"),
                            "file_path": r.get("file_path", ""),
                            "start_line": int(r.get("start_line", 1)),
                            "end_line": int(r.get("end_line", 1)),
                            "code_snippet": r.get("code_snippet", "")[:400],
                        })
        except Exception as e:
            print(f"[ScannerEngine] Gemini analysis pass note: {e}")
