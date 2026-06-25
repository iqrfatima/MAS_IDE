from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import logging

from ..database import get_session
from ..models import Post

logger = logging.getLogger(__name__)

class PostRepository:
    """Repository for Post model."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, post_id: int) -> Optional[Post]:
        try:
            return self.session.query(Post).filter(Post.id == post_id).one_or_none()
        except SQLAlchemyError as exc:
            logger.exception("Error fetching post by id %s: %s", post_id, exc)
            raise

    def get_paginated(self, page: int = 1, limit: int = 10) -> Tuple[List[Post], int]:
        try:
            offset = (page - 1) * limit
            query = self.session.query(Post).order_by(Post.created_at.desc())
            total = query.count()
            posts = query.offset(offset).limit(limit).all()
            return posts, total
        except SQLAlchemyError as exc:
            logger.exception("Error fetching paginated posts: %s", exc)
            raise

    def create(self, title: str, content: str, excerpt: str) -> Post:
        try:
            new_post = Post(title=title, content=content, excerpt=excerpt)
            self.session.add(new_post)
            self.session.flush()  # assign id
            return new_post
        except SQLAlchemyError as exc:
            logger.exception("Error creating post: %s", exc)
            raise

    def update(self, post_id: int, title: Optional[str] = None,
               content: Optional[str] = None, excerpt: Optional[str] = None) -> Optional[Post]:
        try:
            post = self.get_by_id(post_id)
            if not post:
                return None
            if title is not None:
                post.title = title
            if content is not None:
                post.content = content
            if excerpt is not None:
                post.excerpt = excerpt
            self.session.add(post)
            return post
        except SQLAlchemyError as exc:
            logger.exception("Error updating post %s: %s", post_id, exc)
            raise

    def delete(self, post_id: int) -> bool:
        try:
            post = self.get_by_id(post_id)
            if not post:
                return False
            self.session.delete(post)
            return True
        except SQLAlchemyError as exc:
            logger.exception("Error deleting post %s: %s", post_id, exc)
            raise
