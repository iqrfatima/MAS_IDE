import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ConversationBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class ConversationCreate(ConversationBase):
    pass


class ConversationInDB(ConversationBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationPublic(ConversationInDB):
    pass
