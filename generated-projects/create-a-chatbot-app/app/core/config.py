from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Core Application Settings
    PROJECT_NAME: str = "Chatbot API"
    PROJECT_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database Settings
    DATABASE_URL: str

    # JWT Authentication Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API V1 Prefix
    API_V1_STR: str = "/api/v1"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    """
    Loads settings for the application. Uses lru_cache to ensure settings are loaded only once.
    """
    return Settings()
