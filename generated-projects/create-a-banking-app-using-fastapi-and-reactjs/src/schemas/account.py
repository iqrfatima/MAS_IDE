from pydantic import BaseModel, constr
from typing import Optional

class AccountBase(BaseModel):
    currency: constr(min_length=3, max_length=3)

class AccountCreate(AccountBase):
    initial_balance: float = 0.0

class Account(AccountBase):
    id: int
    owner_id: int
    balance: float
    created_at: str

    class Config:
        orm_mode = True

class AccountUpdate(BaseModel):
    currency: Optional[constr(min_length=3, max_length=3)] = None
