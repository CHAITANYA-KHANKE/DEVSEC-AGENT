import os
import bcrypt
import uuid
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.models import User

security = HTTPBearer()

SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me-please-32chars-long")
ALGO = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))

def hash_password(p: str) -> str:
    pwd_bytes = p.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MIN)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET, algorithm=ALGO)

def _coerce_user_id(user_id: str):
    if getattr(User.__table__.c.id.type, "as_uuid", False):
        try:
            return uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid token")
    return str(user_id)

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    token = creds.credentials
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGO])
        uid = payload.get("sub")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == _coerce_user_id(str(uid))).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
