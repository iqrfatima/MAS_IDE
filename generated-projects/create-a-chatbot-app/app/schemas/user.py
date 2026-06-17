import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserInDB(UserBase):
    id: uuid.UUID
    hashed_password: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True # Allow ORM models to be converted to Pydantic models


class UserPublic(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
