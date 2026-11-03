import io
import logging
from typing import Optional
from PIL import Image
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification

from app.config import settings
from app.schemas import ModalityPrediction

logger = logging.getLogger(__name__)


class FaceEmotionModel:
    """Vision Transformer for facial emotion classification."""

    def __init__(self, model_id: Optional[str] = None, device: Optional[str] = None):
        self.model_id = model_id or settings.FACE_MODEL_ID
        self.device = device or settings.DEVICE
        self.processor = None
        self.model = None
        self._is_loaded = False

    def load(self):
        """Loads model and processor into memory/device."""
        if self._is_loaded:
            return
        logger.info(f"Loading Face Model: {self.model_id} on {self.device}")
        self.processor = AutoImageProcessor.from_pretrained(self.model_id)
        self.model = AutoModelForImageClassification.from_pretrained(self.model_id)
        self.model.to(self.device)
        self.model.eval()
        self._is_loaded = True

    def predict(self, image_bytes: bytes) -> ModalityPrediction:
        """Runs facial emotion inference on an uploaded image file."""
        if not self._is_loaded:
            self.load()

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        inputs = self.processor(images=image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)[0].cpu().numpy()

        id2label = self.model.config.id2label
        raw_scores = {id2label[i].lower(): float(probs[i]) for i in range(len(probs))}

        # Normalize keys to canonical format (e.g., 'sad' instead of 'sadness' if applicable)
        canonical_scores = {}
        for k, v in raw_scores.items():
            key = k.strip().lower()
            if key == "anger":
                key = "angry"
            elif key == "joy":
                key = "happy"
            elif key == "sadness":
                key = "sad"
            canonical_scores[key] = round(float(v), 4)

        top_emotion = max(canonical_scores, key=canonical_scores.get)
        confidence = float(canonical_scores[top_emotion])

        return ModalityPrediction(
            modality="face",
            top_emotion=top_emotion,
            confidence=confidence,
            scores=canonical_scores,
            supported_classes=list(canonical_scores.keys()),
        )


# Singleton instance
face_model = FaceEmotionModel()

