from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.conversation import ConversationCreate, ConversationPublic
from app.schemas.message import MessageCreate, MessagePublic, ChatResponse
from app.dependencies import get_db, get_current_user
from app.services.conversation_service import ConversationService
from app.services.chatbot_service import ChatbotService
from app.models.user import User
from app.core.logger import logger

router = APIRouter()


@router.post("/conversations", response_model=ConversationPublic, status_code=status.HTTP_201_CREATED,
             summary="Create a new conversation", tags=["Conversations"])
async def create_conversation(
    conversation_create: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    conversation_service: ConversationService = Depends()
) -> ConversationPublic:
    """
    Creates a new conversation for the authenticated user.
    """
    logger.info(f"User {current_user.id} is creating a new conversation.")
    conversation = conversation_service.create_conversation(db, conversation_create, current_user.id)
    return ConversationPublic.model_validate(conversation)


@router.get("/conversations", response_model=List[ConversationPublic], status_code=status.HTTP_200_OK,
            summary="List all conversations for the authenticated user", tags=["Conversations"])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    conversation_service: ConversationService = Depends()
) -> List[ConversationPublic]:
    """
    Retrieves a list of all conversations belonging to the authenticated user.
    """
    logger.debug(f"User {current_user.id} is requesting their conversations list.")
    conversations = conversation_service.get_user_conversations(db, current_user.id)
    return [ConversationPublic.model_validate(c) for c in conversations]


@router.get("/conversations/{conversation_id}", response_model=ConversationPublic, status_code=status.HTTP_200_OK,
            summary="Retrieve a specific conversation by ID", tags=["Conversations"])
async def get_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    conversation_service: ConversationService = Depends()
) -> ConversationPublic:
    """
    Retrieves a specific conversation by its ID, ensuring it belongs to the authenticated user.
    """
    logger.debug(f"User {current_user.id} is requesting conversation {conversation_id}.")
    conversation = conversation_service.get_conversation_by_id(db, conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found or access denied")
    return ConversationPublic.model_validate(conversation)


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessagePublic], status_code=status.HTTP_200_OK,
            summary="Retrieve messages for a specific conversation", tags=["Messages"])
async def get_messages(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    conversation_service: ConversationService = Depends()
) -> List[MessagePublic]:
    """
    Retrieves all messages within a specific conversation, ensuring the conversation belongs to the authenticated user.
    """
    logger.debug(f"User {current_user.id} is requesting messages for conversation {conversation_id}.")
    messages = conversation_service.get_messages_for_conversation(db, conversation_id, current_user.id)
    return [MessagePublic.model_validate(m) for m in messages]


@router.post("/conversations/{conversation_id}/messages", response_model=ChatResponse, status_code=status.HTTP_200_OK,
             summary="Send a message to a conversation and get chatbot response", tags=["Messages"])
async def send_message_to_conversation(
    conversation_id: UUID,
    message_create: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    conversation_service: ConversationService = Depends(),
    chatbot_service: ChatbotService = Depends()
) -> ChatResponse:
    """
    Sends a new message from the user to a specific conversation.
    The chatbot will process the message and return an immediate response.
    """
    logger.info(f"User {current_user.id} sending message to conversation {conversation_id}.")

    # 1. Ensure the conversation exists and belongs to the user
    conversation = conversation_service.get_conversation_by_id(db, conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found or access denied")

    # 2. Add user's message to the conversation
    user_message = conversation_service.add_message_to_conversation(
        db, conversation_id, sender_type="user", content=message_create.content
    )

    # 3. Get chatbot response
    bot_response_content = chatbot_service.get_chatbot_response(message_create.content)

    # 4. Add bot's response to the conversation
    bot_message = conversation_service.add_message_to_conversation(
        db, conversation_id, sender_type="bot", content=bot_response_content
    )

    logger.info(f"Conversation {conversation_id}: User message {user_message.id}, Bot message {bot_message.id} processed.")
    return ChatResponse(
        user_message=MessagePublic.model_validate(user_message),
        bot_message=MessagePublic.model_validate(bot_message)
    )
