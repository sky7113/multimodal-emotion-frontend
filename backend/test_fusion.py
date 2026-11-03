"""Test script verifying the Class-Aware Fusion algorithm."""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.schemas import ModalityPrediction
from app.fusion import class_aware_fusion


def test_missing_evidence_not_penalized():
    """Verifies that if Face detects Disgust with high confidence, and Audio is also present

    (which only supports angry/happy/neutral/sad), Disgust is NOT penalized by zero-evidence from Audio.
    """
    face_pred = ModalityPrediction(
        modality="face",
        top_emotion="disgust",
        confidence=0.85,
        scores={
            "angry": 0.02,
            "disgust": 0.85,
            "fear": 0.03,
            "happy": 0.01,
            "neutral": 0.04,
            "sad": 0.03,
            "surprise": 0.02,
        },
        supported_classes=[
            "angry",
            "disgust",
            "fear",
            "happy",
            "neutral",
            "sad",
            "surprise",
        ],
    )

    audio_pred = ModalityPrediction(
        modality="audio",
        top_emotion="neutral",
        confidence=0.60,
        scores={
            "angry": 0.10,
            "happy": 0.10,
            "neutral": 0.60,
            "sad": 0.20,
        },
        supported_classes=["angry", "happy", "neutral", "sad"],
    )

    predictions = {"face": face_pred, "audio": audio_pred}
    fused_scores, report = class_aware_fusion(predictions)

    print("=== Fusion Test Results ===")
    print(f"Eligible modalities for 'disgust': {report.eligible_modalities['disgust']}")
    print(f"Eligible modalities for 'neutral': {report.eligible_modalities['neutral']}")
    print(f"Fused disgust score: {fused_scores['disgust']}")
    print(f"Fused neutral score: {fused_scores['neutral']}")
    print(f"Top emotion: {max(fused_scores, key=fused_scores.get)}")

    # Audio does NOT participate in disgust:
    assert report.eligible_modalities["disgust"] == ["face"]
    # Both participate in neutral:
    assert set(report.eligible_modalities["neutral"]) == {"face", "audio"}
    # Disgust remains strong and is not crushed to near-zero:
    assert fused_scores["disgust"] > 0.40

    print("\nSUCCESS: Class-aware fusion correctly preserved unsupported class evidence!")


if __name__ == "__main__":
    test_missing_evidence_not_penalized()

