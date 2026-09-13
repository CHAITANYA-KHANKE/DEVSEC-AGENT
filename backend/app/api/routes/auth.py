from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.models import User
from app.auth.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.auth.security import hash_password, verify_password, create_token, get_current_user
from app.database.supabase_client import sync_user_to_supabase

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == data.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically sync user to Supabase (Auth + Table Editor)
    try:
        sync_user_to_supabase(
            email=user.email,
            password=data.password,
            user_id=str(user.id),
            password_hash=user.password_hash
        )
    except Exception:
        pass

    token = create_token(str(user.id))
    return TokenResponse(access_token=token, user=UserResponse(id=str(user.id), email=user.email))

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(str(user.id))
    return TokenResponse(access_token=token, user=UserResponse(id=str(user.id), email=user.email))

@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return UserResponse(id=str(user.id), email=user.email)

@router.post("/logout")
def logout():
    # Stateless JWT: client just drops token. Endpoint kept for API shape compliance
    return {"message": "Logged out. Please discard token on client."}

