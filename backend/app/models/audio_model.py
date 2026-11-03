import os
import tempfile
import subprocess
import numpy as np
import torch
import librosa
import imageio_ffmpeg
from transformers import AutoModelForAudioClassification, AutoFeatureExtractor


class AudioEmotionModel:
    def __init__(self):
        # Wav2Vec2 Speech Emotion Recognition Model
        self.model_name = "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
        self.feature_extractor = AutoFeatureExtractor.from_pretrained(self.model_name)
        self.model = AutoModelForAudioClassification.from_pretrained(self.model_name)
        self.model.eval()
        self.ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    def predict(self, audio_path):
        temp_in = None
        wav_path = None
        try:
            # 1. Resolve input: handle either raw bytes or existing filepath
            if isinstance(audio_path, bytes):
                with tempfile.NamedTemporaryFile(suffix=".input", delete=False) as f:
                    f.write(audio_path)
                    temp_in = f.name
                input_file = temp_in
            else:
                input_file = str(audio_path)

            wav_path = input_file + "_converted.wav"

            # 2. Convert browser input (webm/ogg/wav) to standard 16kHz mono WAV using bundled FFmpeg
            cmd = [
                self.ffmpeg_exe, "-y", "-i", input_file,
                "-ar", "16000", "-ac", "1", wav_path
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

            # 3. Load converted WAV file safely using librosa
            speech, sr = librosa.load(wav_path, sr=16000)

            if len(speech) == 0:
                raise ValueError("Audio waveform is empty")

            # 4. Normalize audio volume
            max_val = np.max(np.abs(speech))
            if max_val > 0:
                speech = speech / max_val

            # 5. Feature Extraction & Model Inference
            inputs = self.feature_extractor(
                speech, 
                sampling_rate=16000, 
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
            print(f"[Audio Pipeline Error]: {str(e)}")
            return {
                "happy": 0.20,
                "sad": 0.20,
                "angry": 0.20,
                "fearful": 0.20,
                "neutral": 0.20
            }
        finally:
            # Ensure all temporary files are cleaned up
            if temp_in and os.path.exists(temp_in):
                try:
                    os.remove(temp_in)
                except OSError:
                    pass
            if wav_path and os.path.exists(wav_path):
                try:
                    os.remove(wav_path)
                except OSError:
                    pass


audio_model = AudioEmotionModel()
