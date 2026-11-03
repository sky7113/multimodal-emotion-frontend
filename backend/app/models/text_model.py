import logging
from typing import Optional
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from app.config import settings
from app.schemas import ModalityPrediction

logger = logging.getLogger(__name__)

TEXT_CANONICAL_MAPPING = {
    "anger": "angry",
    "disgust": "disgust",
    "fear": "fear",
    "joy": "happy",
    "neutral": "neutral",
    "sadness": "sad",
    "surprise": "surprise",
}


class TextEmotionModel:
    """DistilRoBERTa model for textual emotion classification."""

    def __init__(self, model_id: Optional[str] = None, device: Optional[str] = None):
        self.model_id = model_id or settings.TEXT_MODEL_ID
        self.device = device or settings.DEVICE
        self.tokenizer = None
        self.model = None
        self._is_loaded = False

    def load(self):
        """Loads tokenizer and sequence classifier."""
        if self._is_loaded:
            return
        logger.info(f"Loading Text Model: {self.model_id} on {self.device}")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_id)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_id)
        self.model.to(self.device)
        self.model.eval()
        self._is_loaded = True

    def predict(self, text: str) -> ModalityPrediction:
        """Runs emotion classification on an input text string."""
        if not self._is_loaded:
            self.load()

        if not text or not text.strip():
            raise ValueError("Text content cannot be empty.")

        inputs = self.tokenizer(
            text, return_tensors="pt", truncation=True, max_length=512
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)[0].cpu().numpy()

        id2label = self.model.config.id2label
        canonical_scores = {}
        for idx, prob in enumerate(probs):
            raw_label = id2label[idx].lower()
            canonical_label = TEXT_CANONICAL_MAPPING.get(raw_label, raw_label)
            canonical_scores[canonical_label] = round(float(prob), 4)

        top_emotion = max(canonical_scores, key=canonical_scores.get)
        confidence = float(canonical_scores[top_emotion])

        return ModalityPrediction(
            modality="text",
            top_emotion=top_emotion,
            confidence=confidence,
            scores=canonical_scores,
            supported_classes=list(canonical_scores.keys()),
        )


# Singleton instance
text_model = TextEmotionModel()

