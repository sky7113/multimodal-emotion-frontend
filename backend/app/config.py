import os
from pydantic import BaseModel
import torch


class Settings(BaseModel):
    APP_NAME: str = "Multimodal Emotion Recognition API"
    VERSION: str = "2.0.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Model checkpoints
    FACE_MODEL_ID: str = os.getenv("FACE_MODEL_ID", "trpakov/vit-face-expression")
    TEXT_MODEL_ID: str = os.getenv("TEXT_MODEL_ID", "j-hartmann/emotion-english-distilroberta-base")
    AUDIO_MODEL_ID: str = os.getenv("AUDIO_MODEL_ID", "speechbrain/emotion-recognition-wav2vec2-IEMOCAP")
    
    # Compute device
    DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"
    
    # Dev/Mock mode for rapid offline testing
    MOCK_INFERENCE: bool = os.getenv("MOCK_INFERENCE", "false").lower() in ("true", "1", "yes")
    
    # Default modality fusion weights
    DEFAULT_WEIGHT_FACE: float = 1.0
    DEFAULT_WEIGHT_TEXT: float = 1.0
    DEFAULT_WEIGHT_AUDIO: float = 1.0
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "*"
    ]


settings = Settings()
