from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Kshitiraksha"
    API_V1_STR: str = "/api"
    VERSION: str = "1.0.0"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    DEFAULT_VEGETATION_LOSS_THRESHOLD: float = -0.20
    DEFAULT_MIN_AREA_HA: float = 0.5
    DEFAULT_CLOUD_MAX_PCT: float = 20.0
    
    SECRET_KEY: str = "kshitiraksha-satellite-super-secret-key-2026-development-mode"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./kshitiraksha.db"
    X402_SECRET_KEY: str = "kshitiraksha-x402-micropayment-secret-dev-2026"
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
