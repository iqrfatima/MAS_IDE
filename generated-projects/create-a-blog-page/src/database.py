import os
import logging
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load database URL from environment variable or use SQLite for local dev
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./blog.db")

# Create engine
engine = create_engine(DATABASE_URL, echo=False, future=True)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

@contextmanager
def get_session() -> Generator[Session, None, None]:
    """Provide a transactional scope around a series of operations."""
    session: Session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as exc:
        session.rollback()
        logger.exception("Session rollback because of exception: %s", exc)
        raise
    finally:
        session.close()
