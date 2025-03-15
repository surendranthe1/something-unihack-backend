# app/core/config.py
import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API Configuration
    API_PREFIX: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", False)
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React frontend
        "http://localhost:8080",  # TypeScript backend
        "http://ts-backend:8080"  # Docker container name
    ]
    # MongoDB Configuration
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")

    # OpenAI Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "gpt-4")
    
    class Config:
        env_file = ".env"

settings = Settings()