from typing import List

class Settings:
    PROJECT_NAME: str = "GeoWatch Earth"
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

settings = Settings()
