from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, conversations

api_router = APIRouter()

# Include authentication routes
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Include user routes
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# Include conversation and messages routes
api_router.include_router(conversations.router, tags=["Conversations", "Messages"])
