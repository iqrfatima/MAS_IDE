"""API router for post endpoints.

Provides CRUD operations and pagination support.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List

from ..database import SessionLocal
from ..schemas import PostCreate, PostUpdate, PostResponse, PostsListResponse
from ..services import PostService
from ..exceptions import PostNotFoundError

router = APIRouter()

# Dependency to get PostService
def get_post_service():
    db = SessionLocal()
    try:
        yield PostService(db)
    finally:
        db.close()

@router.get("/posts", response_model=PostsListResponse)
async def list_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    service: PostService = Depends(get_post_service),
):
    total, posts = service.get_posts(page=page, limit=limit)
    return PostsListResponse(
        total=total,
        page=page,
        limit=limit,
        posts=[PostResponse.from_orm(p) for p in posts],
    )

@router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    service: PostService = Depends(get_post_service),
):
    try:
        post = service.get_post_by_id(post_id)
    except ValueError:
        raise PostNotFoundError(post_id=post_id)
    return PostResponse.from_orm(post)

@router.post("/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_in: PostCreate,
    service: PostService = Depends(get_post_service),
):
    post = service.create_post(post_in)
    return PostResponse.from_orm(post)

@router.put("/posts/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_in: PostUpdate,
    service: PostService = Depends(get_post_service),
):
    try:
        post = service.update_post(post_id, post_in)
    except ValueError:
        raise PostNotFoundError(post_id=post_id)
    return PostResponse.from_orm(post)

@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    service: PostService = Depends(get_post_service),
):
    try:
        service.delete_post(post_id)
    except ValueError:
        raise PostNotFoundError(post_id=post_id)
    return None
