import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Jetson Live Sketch Stage"
    VERSION: str = "1.0.0"
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    DB_PATH: str = os.path.join(DATA_DIR, "db", "festival_sketch.db")
    OUTPUT_DIR: str = os.path.join(DATA_DIR, "outputs")
    MODEL_DIR: str = os.path.join(DATA_DIR, "models")
    
    # Token Settings
    TOKEN_EXPIRE_MINUTES: int = 30
    
    # Stage & Queue Settings
    MAX_ON_STAGE_CHARACTERS: int = 15
    MAX_CONCURRENT_AI_TASKS: int = 1  # 1 for Jetson Orin Nano VRAM safety
    
    # Image Resolution
    CANVAS_WIDTH: int = 512
    CANVAS_HEIGHT: int = 512

    class Config:
        env_file = ".env"

settings = Settings()
