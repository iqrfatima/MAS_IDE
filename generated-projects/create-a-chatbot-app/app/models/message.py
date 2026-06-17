import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    sender_type = Column(String, nullable=False) # 'user' or 'bot'
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self) -> str:
        return f"<Message(id={self.id}, sender_type='{self.sender_type}', content='{self.content[:30]}...')>"
