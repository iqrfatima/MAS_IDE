from pydantic import BaseModel, PositiveFloat
from typing import Optional

class TransactionCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: PositiveFloat

class Transaction(TransactionCreate):
    id: int
    created_at: str

    class Config:
        orm_mode = True
