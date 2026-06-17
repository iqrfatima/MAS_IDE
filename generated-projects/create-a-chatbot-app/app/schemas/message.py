import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    content: str = Field(min_length=1)


class MessageCreate(MessageBase):
    pass


class MessageInDB(MessageBase):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_type: str # 'user' or 'bot'
    created_at: datetime

    class Config:
        from_attributes = True


class MessagePublic(MessageInDB):
    pass


class ChatResponse(BaseModel):
    user_message: MessagePublic
    bot_message: MessagePublic
