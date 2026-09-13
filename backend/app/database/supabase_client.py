import os
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://sqqnexdbecyqmzjqzemu.supabase.co").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

def get_admin_headers():
    if not SUPABASE_SERVICE_KEY:
        return None
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }

def sync_user_to_supabase(email: str, password: Optional[str] = None, user_id: Optional[str] = None, password_hash: Optional[str] = None):
    """
    Syncs a registered user to:
    1. Supabase Auth (Dashboard -> Authentication -> Users)
    2. Supabase Database table (Dashboard -> Table Editor -> users)
    """
    headers = get_admin_headers()
    if not headers or not SUPABASE_URL:
        logger.warning("Supabase credentials not configured, skipping sync.")
        return

    # 1. Sync to Supabase Auth (Admin API - auto-confirms email)
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
                f"{SUPABASE_URL}/auth/v1/admin/users",
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

    # 2. Sync to Supabase Database Table 'users' (Table Editor)
    try:
        table_headers = dict(headers)
        table_headers["Prefer"] = "resolution=merge-duplicates"
        
        row_payload = {
            "email": email,
            "password_hash": password_hash or "synced"
        }
        if user_id:
            row_payload["id"] = str(user_id)

        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/users",
            headers=table_headers,
            json=row_payload,
            timeout=10.0
        )
        if r.status_code in (200, 201, 204):
            logger.info(f"User {email} synced to Supabase 'users' table.")
        else:
            logger.warning(f"Supabase table sync response ({r.status_code}): {r.text}")
    except Exception as e:
        logger.error(f"Failed to sync user to Supabase 'users' table: {e}")
