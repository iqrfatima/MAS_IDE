from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash
from app.core.logger import logger


class UserService:
    def get_user_by_email(self, db: Session, email: str) -> User | None:
        logger.debug(f"Attempting to retrieve user with email: {email}")
        return db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, db: Session, user_id: UUID) -> User | None:
        logger.debug(f"Attempting to retrieve user with ID: {user_id}")
        return db.query(User).filter(User.id == user_id).first()

    def create_user(self, db: Session, user_create: UserCreate) -> User:
        logger.info(f"Creating new user with email: {user_create.email}")
        hashed_password = get_password_hash(user_create.password)
        db_user = User(email=user_create.email, hashed_password=hashed_password)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"User created successfully with ID: {db_user.id}")
        return db_user
