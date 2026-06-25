from datetime import date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserRead(UserBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True

class HabitBase(BaseModel):
    title: str
    description: Optional[str] = None

class HabitCreate(HabitBase):
    pass

class HabitUpdate(HabitBase):
    pass

class HabitRead(HabitBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

class HabitEntryBase(BaseModel):
    date: date
    completed: bool = False

class HabitEntryCreate(HabitEntryBase):
    pass

class HabitEntryRead(HabitEntryBase):
    id: int
    habit_id: int

    class Config:
        orm_mode = True

class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
