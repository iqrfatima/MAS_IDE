"""Business logic for post operations.

Functions interact with the database session and perform CRUD operations.
"""

from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from .models import Post
from .schemas import PostCreate, PostUpdate, PostInDB

class PostService:
    def __init__(self, db: Session):
        self.db = db

    def get_posts(self, page: int = 1, limit: int = 10) -> Tuple[int, List[Post]]:
        if page < 1 or limit < 1:
            raise ValueError("Page and limit must be positive integers")
        offset = (page - 1) * limit
        total = self.db.query(func.count(Post.id)).scalar() or 0
        posts = (
            self.db.query(Post)
            .order_by(Post.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return total, posts

    def get_post_by_id(self, post_id: int) -> Post:
        post = self.db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise ValueError("Post not found")
        return post

    def create_post(self, post_in: PostCreate) -> Post:
        post = Post(**post_in.dict())
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        return post

    def update_post(self, post_id: int, post_in: PostUpdate) -> Post:
        post = self.get_post_by_id(post_id)
        for field, value in post_in.dict(exclude_unset=True).items():
            setattr(post, field, value)
        self.db.commit()
        self.db.refresh(post)
        return post

    def delete_post(self, post_id: int) -> None:
        post = self.get_post_by_id(post_id)
        self.db.delete(post)
        self.db.commit()
