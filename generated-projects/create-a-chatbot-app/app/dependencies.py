from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from app.database.connection import SessionLocal
from app.core.security import verify_token
from app.services.user_service import UserService
from app.schemas.auth import TokenData
from app.models.user import User
from app.core.logger import logger

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session to the routes.
    It ensures the session is closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    user_service: UserService = Depends()
) -> User:
    """
    Dependency that retrieves the current authenticated user from the JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            logger.warning("JWT token payload missing 'sub' (user_id).")
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError as e:
        logger.warning(f"JWT validation error: {e}")
        raise credentials_exception from e

    user = user_service.get_user_by_id(db, user_id=token_data.user_id)
    if user is None:
        logger.warning(f"User with ID {token_data.user_id} not found for token.")
        raise credentials_exception
    logger.debug(f"Authenticated user: {user.email}")
    return user
