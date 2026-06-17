from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate, UserPublic
from app.schemas.auth import LoginRequest, Token
from app.dependencies import get_db
from app.services.user_service import UserService
from app.core.security import verify_password, create_access_token
from app.core.logger import logger

router = APIRouter()


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED,
             summary="Register a new user", tags=["Authentication"])
async def register_user(
    user_create: UserCreate,
    db: Session = Depends(get_db),
    user_service: UserService = Depends()
) -> UserPublic:
    """
    Registers a new user in the system. The email must be unique.
    """
    logger.info(f"Attempting to register new user with email: {user_create.email}")
    db_user = user_service.get_user_by_email(db, email=user_create.email)
    if db_user:
        logger.warning(f"Registration failed: Email {user_create.email} already registered.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = user_service.create_user(db, user_create)
    logger.info(f"User {user.id} successfully registered.")
    return UserPublic.model_validate(user)


@router.post("/login", response_model=Token,
             summary="Authenticate user and get JWT token", tags=["Authentication"])
async def login_for_access_token(
    login_request: LoginRequest,
    db: Session = Depends(get_db),
    user_service: UserService = Depends()
) -> Token:
    """
    Authenticates a user with email and password, and returns an access token.
    """
    logger.info(f"Attempting to log in user: {login_request.email}")
    user = user_service.get_user_by_email(db, email=login_request.email)
    if not user or not verify_password(login_request.password, user.hashed_password):
        logger.warning(f"Login failed: Invalid credentials for user {login_request.email}.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": str(user.id)})
    logger.info(f"User {user.id} successfully logged in.")
    return {"access_token": access_token, "token_type": "bearer"}
