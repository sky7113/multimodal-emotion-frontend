import time
import logging
from typing import Dict, List, Optional
import random

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.fusion import class_aware_fusion, MODALITY_SUPPORTED_CLASSES
from app.schemas import AnalyzeResponse, ModalityPrediction
from app.models.face_model import face_model
from app.models.text_model import text_model
from app.models.audio_model import audio_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("emotion-recognition-api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    logger.info(f"Device: {settings.DEVICE} | Mock Mode: {settings.MOCK_INFERENCE}")
    yield
    logger.info("Shutting down API server...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Multimodal Emotion Recognition with Class-Aware Evidence Fusion",
    lifespan=lifespan,
)

# CORS Middleware - explicitly allow all origins for Vercel and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _generate_mock_prediction(modality: str, seed_hint: str = "") -> ModalityPrediction:
    """Generates realistic mock scores for development/testing when heavy models are not preloaded."""
    supported = MODALITY_SUPPORTED_CLASSES[modality]
    raw_weights = [random.uniform(0.1, 0.9) for _ in supported]
    
    # Slight bias towards happy/neutral for realistic mock
    total = sum(raw_weights)
    scores = {cls: round(w / total, 4) for cls, w in zip(supported, raw_weights)}
    top_emotion = max(scores, key=scores.get)
    return ModalityPrediction(
        modality=modality,
        top_emotion=top_emotion,
        confidence=scores[top_emotion],
        scores=scores,
        supported_classes=supported,
    )


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "healthy",
        "mock_mode": settings.MOCK_INFERENCE,
        "device": settings.DEVICE,
        "models": {
            "face": settings.FACE_MODEL_ID,
            "text": settings.TEXT_MODEL_ID,
            "audio": settings.AUDIO_MODEL_ID,
        },
    }


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_multimodal_emotion(
    image: Optional[UploadFile] = File(None, description="Optional face photo/snapshot"),
    text: Optional[str] = Form(None, description="Optional text transcript or user utterance"),
    audio: Optional[UploadFile] = File(None, description="Optional WAV audio recording"),
    weight_face: float = Form(1.0),
    weight_text: float = Form(1.0),
    weight_audio: float = Form(1.0),
    use_entropy_weighting: bool = Form(False),
):
    """Processes multimodal inputs (Face Image, Text, Speech Audio) and returns

    class-aware fused emotion probabilities across 7 canonical Ekman emotions.
    """
    start_time = time.perf_counter()

    # Validate that at least one modality is present
    has_image = image is not None and image.filename != ""
    has_text = text is not None and text.strip() != ""
    has_audio = audio is not None and audio.filename != ""

    if not (has_image or has_text or has_audio):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one modality (image, text, or audio) must be provided for analysis.",
        )

    predictions: Dict[str, ModalityPrediction] = {}
    modalities_present: List[str] = []

    # 1. Process Face Image
    if has_image:
        modalities_present.append("face")
        img_bytes = await image.read()
        if settings.MOCK_INFERENCE:
            predictions["face"] = _generate_mock_prediction("face")
        else:
            try:
                predictions["face"] = face_model.predict(img_bytes)
            except Exception as e:
                logger.error(f"Face inference error: {e}")
                raise HTTPException(
                    status_code=500, detail=f"Face inference failed: {str(e)}"
                )

    # 2. Process Text
    if has_text:
        modalities_present.append("text")
        if settings.MOCK_INFERENCE:
            predictions["text"] = _generate_mock_prediction("text")
        else:
            try:
                predictions["text"] = text_model.predict(text.strip())
            except Exception as e:
                logger.error(f"Text inference error: {e}")
                raise HTTPException(
                    status_code=500, detail=f"Text inference failed: {str(e)}"
                )

    # 3. Process Speech Audio
    if has_audio:
        modalities_present.append("audio")
        audio_bytes = await audio.read()
        if settings.MOCK_INFERENCE:
            predictions["audio"] = _generate_mock_prediction("audio")
        else:
            try:
                audio_res = audio_model.predict(audio_bytes)
                if isinstance(audio_res, dict):
                    canon_scores = {}
                    for k, v in audio_res.items():
                        k_clean = k.lower().strip()
                        if k_clean == "fearful":
                            k_clean = "fear"
                        elif k_clean == "surprised":
                            k_clean = "surprise"
                        elif k_clean == "calm":
                            k_clean = "neutral"
                        canon_scores[k_clean] = round(float(v), 4)
                    top_emo = max(canon_scores, key=canon_scores.get)
                    predictions["audio"] = ModalityPrediction(
                        modality="audio",
                        top_emotion=top_emo,
                        confidence=canon_scores[top_emo],
                        scores=canon_scores,
                        supported_classes=list(canon_scores.keys()),
                    )
                else:
                    predictions["audio"] = audio_res
            except Exception as e:
                logger.error(f"Audio inference error: {e}")
                raise HTTPException(
                    status_code=500, detail=f"Audio inference failed: {str(e)}"
                )

    # 4. Class-Aware Fusion
    custom_weights = {
        "face": weight_face,
        "text": weight_text,
        "audio": weight_audio,
    }

    fused_scores, fusion_report = class_aware_fusion(
        predictions=predictions,
        modality_weights=custom_weights,
        use_entropy_weighting=use_entropy_weighting,
    )

    top_emotion = max(fused_scores, key=fused_scores.get)
    confidence = float(fused_scores[top_emotion])

    processing_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return AnalyzeResponse(
        status="success",
        top_emotion=top_emotion,
        confidence=confidence,
        fused_scores=fused_scores,
        modalities_present=modalities_present,
        individual_predictions=predictions,
        fusion_report=fusion_report,
        processing_time_ms=processing_time_ms,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)

