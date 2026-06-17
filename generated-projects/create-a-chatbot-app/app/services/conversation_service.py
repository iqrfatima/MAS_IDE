from uuid import UUID
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.conversation import ConversationCreate
from app.schemas.message import MessageCreate
from app.core.logger import logger


class ConversationService:
    def create_conversation(self, db: Session, conversation_create: ConversationCreate, user_id: UUID) -> Conversation:
        logger.info(f"User {user_id} attempting to create a new conversation with title '{conversation_create.title}'")
        db_conversation = Conversation(title=conversation_create.title, owner_id=user_id)
        db.add(db_conversation)
        db.commit()
        db.refresh(db_conversation)
        logger.info(f"Conversation {db_conversation.id} created successfully by user {user_id}")
        return db_conversation

    def get_user_conversations(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Conversation]:
        logger.debug(f"Retrieving conversations for user {user_id} (skip={skip}, limit={limit})")
        return db.query(Conversation).filter(Conversation.owner_id == user_id).offset(skip).limit(limit).all()

    def get_conversation_by_id(self, db: Session, conversation_id: UUID, user_id: UUID) -> Conversation:
        logger.debug(f"Retrieving conversation {conversation_id} for user {user_id}")
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.owner_id == user_id).first()
        if not conversation:
            logger.warning(f"Conversation {conversation_id} not found or not owned by user {user_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found or access denied")
        return conversation

    def get_messages_for_conversation(self, db: Session, conversation_id: UUID, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Message]:
        logger.debug(f"Retrieving messages for conversation {conversation_id} for user {user_id} (skip={skip}, limit={limit})")
        conversation = self.get_conversation_by_id(db, conversation_id, user_id) # Ensure user owns conversation
        return db.query(Message).filter(Message.conversation_id == conversation.id).offset(skip).limit(limit).all()

    def add_message_to_conversation(self, db: Session, conversation_id: UUID, sender_type: str, content: str) -> Message:
        logger.debug(f"Adding message to conversation {conversation_id} from {sender_type}")
        db_message = Message(conversation_id=conversation_id, sender_type=sender_type, content=content)
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        logger.debug(f"Message {db_message.id} added to conversation {conversation_id}")
        return db_message
