import io
import logging
import os
import tempfile
from typing import Optional
import soundfile as sf
import torch
import torchaudio

from app.config import settings
from app.schemas import ModalityPrediction

logger = logging.getLogger(__name__)

AUDIO_CANONICAL_MAPPING = {
    "ang": "angry",
    "hap": "happy",
    "neu": "neutral",
    "sad": "sad",
}


class AudioEmotionModel:
    """SpeechBrain wav2vec2 classifier for speech emotion recognition (IEMOCAP)."""

    def __init__(self, model_id: Optional[str] = None, device: Optional[str] = None):
        self.model_id = model_id or settings.AUDIO_MODEL_ID
        self.device = device or settings.DEVICE
        self.classifier = None
        self._is_loaded = False

    def load(self):
        """Loads SpeechBrain EncoderClassifier."""
        if self._is_loaded:
            return
        logger.info(f"Loading Audio Model: {self.model_id} on {self.device}")

        # SpeechBrain 1.0 vs legacy import compatibility
        try:
            from speechbrain.inference.classifiers import EncoderClassifier
        except ImportError:
            from speechbrain.pretrained import EncoderClassifier

        run_opts = {"device": self.device} if self.device != "cpu" else None
        self.classifier = EncoderClassifier.from_hparams(
            source=self.model_id,
            run_opts=run_opts,
        )
        self._is_loaded = True

    def predict(self, audio_bytes: bytes) -> ModalityPrediction:
        """Processes WAV audio bytes and returns emotion predictions."""
        if not self._is_loaded:
            self.load()

        # Write to temporary file for robust torchaudio/soundfile ingestion
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
            tmp_path = tmp_file.name
            tmp_file.write(audio_bytes)

        try:
            # Load and resample to 16kHz mono as required by wav2vec2
            signal, fs = torchaudio.load(tmp_path)
            if signal.shape[0] > 1:
                signal = torch.mean(signal, dim=0, keepdim=True)
            if fs != 16000:
                resampler = torchaudio.transforms.Resample(orig_freq=fs, new_freq=16000)
                signal = resampler(signal)

            # SpeechBrain classify_batch expects [batch, time]
            signal = signal.to(self.device)
            out_prob, score, index, text_lab = self.classifier.classify_batch(signal)

            probs = out_prob[0].cpu().numpy()
            hparams_labels = self.classifier.hparams.label_encoder.ind2lab

            canonical_scores = {}
            for idx, prob in enumerate(probs):
                raw_label = str(hparams_labels[idx]).strip().lower()
                canonical_label = AUDIO_CANONICAL_MAPPING.get(raw_label, raw_label)
                canonical_scores[canonical_label] = round(float(prob), 4)

            top_emotion = max(canonical_scores, key=canonical_scores.get)
            confidence = float(canonical_scores[top_emotion])

            return ModalityPrediction(
                modality="audio",
                top_emotion=top_emotion,
                confidence=confidence,
                scores=canonical_scores,
                supported_classes=list(canonical_scores.keys()),
            )
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)


# Singleton instance
audio_model = AudioEmotionModel()

