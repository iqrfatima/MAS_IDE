from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..services.auth_service import register_user, authenticate_user, create_user_tokens, verify_refresh_token, revoke_refresh_token
from ..schemas.auth import UserCreate, Token, TokenRefresh
from ..dependencies import get_db
from ..models import User

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = register_user(db, user_in)
    token = create_user_tokens(db, user)
    return token

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    token = create_user_tokens(db, user)
    return token

@router.post("/refresh", response_model=Token)
def refresh(token_in: TokenRefresh, db: Session = Depends(get_db)):
    user = verify_refresh_token(db, token_in.refresh_token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    token = create_user_tokens(db, user)
    return token

@router.post("/logout")
def logout(token_in: TokenRefresh, db: Session = Depends(get_db)):
    revoke_refresh_token(db, token_in.refresh_token)
    return {"detail": "Logged out"}
