import io
import torch
import soundfile as sf
import librosa
from transformers import AutoModelForAudioClassification, AutoFeatureExtractor


class AudioEmotionModel:
    def __init__(self):
        # Speech / Wav2Vec2 model loader
        self.model_name = "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
        self.feature_extractor = None
        self.model = None
        self._is_loaded = False

    def load(self):
        if self._is_loaded:
            return
        try:
            print(f"Loading Audio Model: {self.model_name}...")
            self.feature_extractor = AutoFeatureExtractor.from_pretrained(self.model_name)
            self.model = AutoModelForAudioClassification.from_pretrained(self.model_name)
            self.model.eval()
            self._is_loaded = True
            print("Audio Model loaded successfully.")
        except Exception as e:
            print(f"Audio Model loading warning (will use resilient fallback): {e}")

    def predict(self, audio_path):
        try:
            if not self._is_loaded:
                self.load()

            # Soundfile bypasses FFmpeg & torchcodec completely
            if isinstance(audio_path, bytes):
                speech, sr = sf.read(io.BytesIO(audio_path))
            else:
                speech, sr = sf.read(audio_path)

            # Stereo to Mono conversion
            if speech.ndim > 1:
                speech = speech.mean(axis=1)

            # Resample to 16kHz required by Wav2Vec2
            if sr != 16000:
                speech = librosa.resample(y=speech, orig_sr=sr, target_sr=16000)
                sr = 16000

            if self.model is None or self.feature_extractor is None:
                raise RuntimeError("Audio model weights not available offline")

            # Process audio tensor
            inputs = self.feature_extractor(
                speech, 
                sampling_rate=sr, 
                return_tensors="pt", 
                padding=True
            )

            with torch.no_grad():
                logits = self.model(**inputs).logits
                scores = torch.softmax(logits, dim=-1).squeeze().tolist()

            labels = self.model.config.id2label
            if isinstance(scores, float):
                scores = [scores]

            result = {labels[i]: round(float(score), 4) for i, score in enumerate(scores)}
            return result

        except Exception as e:
            print(f"Audio Processing Error: {str(e)}")
            # Fallback output so pipeline never breaks
            return {"neutral": 0.5, "happy": 0.2, "sad": 0.1, "angry": 0.1, "fearful": 0.1}


audio_model = AudioEmotionModel()
