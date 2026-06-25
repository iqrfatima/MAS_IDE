"""Pydantic schemas for request and response models.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator

class PostBase(BaseModel):
    title: str = Field(..., max_length=200)
    content: str
    excerpt: str = Field(..., max_length=500)

    @validator("excerpt")
    def excerpt_length(cls, v: str) -> str:
        if len(v) > 500:
            raise ValueError("Excerpt must be 500 characters or less")
        return v

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = None
    excerpt: Optional[str] = Field(None, max_length=500)

    @validator("excerpt")
    def excerpt_length(cls, v: str) -> str:
        if v is not None and len(v) > 500:
            raise ValueError("Excerpt must be 500 characters or less")
        return v

class PostInDB(PostBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class PostResponse(PostInDB):
    pass

class PostsListResponse(BaseModel):
    total: int
    page: int
    limit: int
    posts: list[PostResponse]
