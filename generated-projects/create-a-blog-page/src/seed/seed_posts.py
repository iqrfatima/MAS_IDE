import logging
from typing import List

from ..database import get_session
from ..models import Post

logger = logging.getLogger(__name__)

SEED_POSTS: List[dict] = [
    {
        "title": "Welcome to the Blog",
        "content": "This is the first post on our new blog. Stay tuned for more updates!",
        "excerpt": "This is the first post on our new blog."
    },
    {
        "title": "Understanding FastAPI",
        "content": "FastAPI is a modern, fast web framework for building APIs with Python 3.7+.",
        "excerpt": "FastAPI is a modern, fast web framework."
    },
    {
        "title": "Database Migrations with Alembic",
        "content": "Alembic is a lightweight database migration tool for SQLAlchemy.",
        "excerpt": "Alembic is a lightweight database migration tool."
    }
]

def seed_posts() -> None:
    """Insert seed posts into the database."""
    with get_session() as session:
        existing = session.query(Post).first()
        if existing:
            logger.info("Seed data already exists; skipping.")
            return
        for data in SEED_POSTS:
            post = Post(**data)
            session.add(post)
        logger.info("Seeded %d posts.", len(SEED_POSTS))
