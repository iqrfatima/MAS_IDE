from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import get_settings
from app.database.base import Base
from app.core.logger import logger

settings = get_settings()

# Configure the database URL and engine
try:
    logger.info(f"Attempting to connect to database: {settings.DATABASE_URL.split('@')[-1]}")
    engine = create_engine(settings.DATABASE_URL)
    # Each `SessionLocal` instance will be a database session.
    # The `autocommit=False` and `autoflush=False` settings ensure that
    # database changes are not committed until explicitly called, and
    # objects are not flushed to the database automatically.
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("Database engine created successfully.")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    raise


def create_db_and_tables() -> None:
    """
    Creates all database tables defined in the Base metadata.
    """
    logger.info("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully.")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise
