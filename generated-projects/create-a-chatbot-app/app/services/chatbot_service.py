from app.core.logger import logger


class ChatbotService:
    def get_chatbot_response(self, user_message_content: str) -> str:
        """
        Provides basic, predefined, or echo responses based on user input.
        This is a placeholder for more advanced AI/ML models.
        """
        logger.info(f"Generating chatbot response for message: '{user_message_content}'")
        user_message_lower = user_message_content.lower()

        if "hello" in user_message_lower or "hi" in user_message_lower:
            response = "Hello there! How can I assist you today?"
        elif "how are you" in user_message_lower:
            response = "I am a chatbot, so I don't have feelings, but I'm ready to help!"
        elif "help" in user_message_lower:
            response = "I can help you create conversations, send messages, and retrieve your chat history. What do you need assistance with?"
        elif "what is your name" in user_message_lower:
            response = "I am a simple chatbot created to assist you."
        elif "bye" in user_message_lower or "goodbye" in user_message_lower:
            response = "Goodbye! Have a great day!"
        elif "time" in user_message_lower:
            from datetime import datetime
            response = f"The current time is {datetime.now().strftime('%H:%M:%S')}."
        else:
            # Echo response for anything else
            response = f"I received your message: '{user_message_content}'. I'm still learning, so for now, I can mostly echo!"

        logger.info(f"Chatbot responded with: '{response}'")
        return response
