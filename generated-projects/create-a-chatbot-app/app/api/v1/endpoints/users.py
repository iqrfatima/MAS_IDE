from fastapi import APIRouter, Depends, status
from app.schemas.user import UserPublic
from app.dependencies import get_current_user
from app.models.user import User
from app.core.logger import logger

router = APIRouter()


@router.get("/me", response_model=UserPublic, status_code=status.HTTP_200_OK,
            summary="Retrieve current authenticated user's profile", tags=["Users"])
async def read_current_user(
    current_user: User = Depends(get_current_user)
) -> UserPublic:
    """
    Retrieves the profile information of the currently authenticated user.
    Requires a valid JWT token.
    """
    logger.debug(f"Retrieving profile for current user: {current_user.id}")
    return UserPublic.model_validate(current_user)
