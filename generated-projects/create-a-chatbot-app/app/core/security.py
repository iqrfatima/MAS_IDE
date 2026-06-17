from datetime import datetime, timedelta, timezone
from typing import Any, Union

from passlib.context import CryptContext
from jose import jwt, JWTError

from app.core.config import get_settings


settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    data: dict[str, Any],
    expires_delta: Union[timedelta, None] = None
) -> str:
    """
    Creates a new JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire.timestamp()})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict[str, Any]:
    """
    Verifies a JWT token and returns its payload.
    Raises JWTError if verification fails.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        raise JWTError("Could not validate credentials") from e


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies if a plain password matches a hashed password.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hashes a password using bcrypt.
    """
    return pwd_context.hash(password)
