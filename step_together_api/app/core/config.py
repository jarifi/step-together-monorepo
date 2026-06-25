# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Step Together API"
    API_V1_STR: str = "/api/v1"
    BASE_MEDIA_PATH: str = "app/media"
    PUBLIC_MEDIA_PATH: str = "https://step-together.at/assets/images"
    
    # --- ADD THIS LINE ---
    ENVIRONMENT: str = "production" 

    # Load from environment (.env)
    SQLALCHEMY_DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 60
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 0  # wenn > 0, überschreibt DAYS (nur für Tests)

    class Config:
        env_file = ".env" 

settings = Settings()