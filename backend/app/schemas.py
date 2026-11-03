from typing import Dict, List, Optional
from pydantic import BaseModel, Field


CANONICAL_EMOTIONS: List[str] = [
    "angry",
    "disgust",
    "fear",
    "happy",
    "neutral",
    "sad",
    "surprise",
]


class ModalityPrediction(BaseModel):
    modality: str  # "face", "text", "audio"
    top_emotion: str
    confidence: float
    scores: Dict[str, float] = Field(
        ..., description="Probabilities over supported classes for this modality"
    )
    supported_classes: List[str]


class FusionReport(BaseModel):
    eligible_modalities: Dict[str, List[str]] = Field(
        ..., description="Which modalities contributed to each emotion score"
    )
    weights_applied: Dict[str, float]
    has_conflict: bool = Field(
        ..., description="True if top predictions across active modalities disagree significantly"
    )
    conflict_notes: Optional[str] = None
    active_modalities_count: int


class AnalyzeResponse(BaseModel):
    status: str = "success"
    top_emotion: str
    confidence: float
    fused_scores: Dict[str, float] = Field(
        ..., description="Final fused probability distribution over all 7 canonical classes"
    )
    modalities_present: List[str]
    individual_predictions: Dict[str, ModalityPrediction]
    fusion_report: FusionReport
    processing_time_ms: float

