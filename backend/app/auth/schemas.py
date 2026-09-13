from pydantic import BaseModel, field_validator
import re

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")

class RegisterRequest(BaseModel):
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError('Please enter a valid email address')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        return v.strip().lower()

class UserResponse(BaseModel):
    id: str
    email: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
