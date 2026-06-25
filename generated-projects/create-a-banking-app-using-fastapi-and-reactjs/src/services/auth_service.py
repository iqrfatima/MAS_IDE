import secrets
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from ..config import settings
from ..models import User, RefreshToken
from ..schemas.auth import UserCreate, Token, TokenRefresh, TokenData

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(user_id: int) -> tuple[str, datetime]:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return token, expires_at

def register_user(db: Session, user_in: UserCreate) -> User:
    hashed_password = get_password_hash(user_in.password)
    db_user = User(email=user_in.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def create_user_tokens(db: Session, user: User) -> Token:
    access_token = create_access_token({"sub": user.email})
    refresh_token, expires_at = create_refresh_token(user.id)
    rt = RefreshToken(user_id=user.id, token=refresh_token, expires_at=expires_at)
    db.add(rt)
    db.commit()
    return Token(access_token=access_token, token_type="bearer", refresh_token=refresh_token)

def verify_refresh_token(db: Session, token: str) -> Optional[User]:
    rt = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    if not rt or rt.expires_at < datetime.utcnow():
        return None
    return db.query(User).filter(User.id == rt.user_id).first()

def revoke_refresh_token(db: Session, token: str) -> None:
    rt = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    if rt:
        db.delete(rt)
        db.commit()
