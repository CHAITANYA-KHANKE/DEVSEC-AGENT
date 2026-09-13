import os
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

def get_supabase_url() -> str:
    return os.getenv("SUPABASE_URL", "").rstrip("/")

def get_service_key() -> str:
    return os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY") or ""

def get_admin_headers():
    key = get_service_key()
    if not key:
        return None
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

def sync_user_to_supabase(email: str, password: Optional[str] = None, user_id: Optional[str] = None, password_hash: Optional[str] = None):
    """
    Syncs a registered user to:
    1. Supabase Database table (Dashboard -> Table Editor -> users)
    2. Supabase Auth (Dashboard -> Authentication -> Users)
    """
    url = get_supabase_url()
    headers = get_admin_headers()
    if not headers or not url:
        logger.warning("Supabase credentials not configured, skipping sync.")
        return

    # 1. Sync to Supabase Database Table 'users' (Table Editor)
    try:
        table_headers = dict(headers)
        table_headers["Prefer"] = "return=representation,resolution=merge-duplicates"
        
        row_payload = {
            "email": email,
            "password_hash": password_hash or "synced"
        }
        if user_id:
            row_payload["id"] = str(user_id)

        r = httpx.post(
            f"{url}/rest/v1/users",
            headers=table_headers,
            json=row_payload,
            timeout=10.0
        )
        if r.status_code in (200, 201, 204):
            logger.info(f"User {email} successfully synced to Supabase 'users' table.")
        else:
            logger.warning(f"Supabase table sync response ({r.status_code}): {r.text}")
    except Exception as e:
        logger.error(f"Failed to sync user to Supabase 'users' table: {e}")

    # 2. Sync to Supabase Auth (Admin API - auto-confirms email)
    if password:
        try:
            auth_payload = {
                "email": email,
                "password": password,
                "email_confirm": True
            }
            if user_id:
                auth_payload["user_metadata"] = {"local_id": str(user_id)}

            r = httpx.post(
                f"{url}/auth/v1/admin/users",
                headers=headers,
                json=auth_payload,
                timeout=10.0
            )
            if r.status_code in (200, 201):
                logger.info(f"User {email} created in Supabase Auth.")
            elif r.status_code in (400, 422) and "already registered" in r.text.lower():
                logger.info(f"User {email} already exists in Supabase Auth.")
            else:
                logger.warning(f"Supabase Auth sync response ({r.status_code}): {r.text}")
        except Exception as e:
            logger.error(f"Failed to sync user to Supabase Auth: {e}")
