"""Class-Aware Multimodal Fusion Algorithm.

Solves the missing-evidence penalty problem:
Standard naive late fusion averages scores across all active modalities by treating
unsupported classes as 0% (e.g., IEMOCAP audio lacks 'disgust' and 'fear').
Treating absence of detection capability as negative evidence severely penalizes
those classes when multimodal inputs are combined.

This module implements Class-Aware Evidence Fusion:
For each class c, only modalities M_c that are both active and capable of predicting c
contribute to c's evidence:
    E(c) = sum_{m in M_c}(w_m * S_m(c)) / sum_{m in M_c}(w_m)
Followed by global simplex re-normalization:
    P_fused(c) = E(c) / sum_{c' in C}(E(c'))
"""

from typing import Dict, List, Optional, Tuple
import numpy as np

from app.schemas import CANONICAL_EMOTIONS, FusionReport, ModalityPrediction

# Class support definitions for each modality
MODALITY_SUPPORTED_CLASSES: Dict[str, List[str]] = {
    "face": [
        "angry",
        "disgust",
        "fear",
        "happy",
        "neutral",
        "sad",
        "surprise",
    ],
    "text": [
        "angry",
        "disgust",
        "fear",
        "happy",
        "neutral",
        "sad",
        "surprise",
    ],
    "audio": [
        "angry",
        "happy",
        "neutral",
        "sad",
    ],
}

# Polarity clustering for conflict diagnosis
VALENCE_MAP: Dict[str, str] = {
    "happy": "positive",
    "surprise": "neutral_or_positive",
    "neutral": "neutral",
    "sad": "negative",
    "angry": "negative",
    "fear": "negative",
    "disgust": "negative",
}


def calculate_entropy(prob_dict: Dict[str, float]) -> float:
    """Calculates Shannon entropy of a probability distribution."""
    probs = np.array(list(prob_dict.values()), dtype=np.float64)
    probs = np.clip(probs, 1e-12, 1.0)
    probs = probs / np.sum(probs)
    return float(-np.sum(probs * np.log2(probs)))


def detect_conflicts(
    predictions: Dict[str, ModalityPrediction]
) -> Tuple[bool, Optional[str]]:
    """Identifies emotional divergence or conflicting signals among active modalities."""
    if len(predictions) < 2:
        return False, None

    top_emotions = {m: pred.top_emotion for m, pred in predictions.items()}
    valences = {m: VALENCE_MAP.get(emo, "unknown") for m, emo in top_emotions.items()}

    # Check for direct valence conflict (e.g. positive vs negative with strong confidence)
    has_pos = any(v == "positive" for v in valences.values())
    has_neg = any(v == "negative" for v in valences.values())

    distinct_emotions = set(top_emotions.values())

    if has_pos and has_neg:
        details = ", ".join(f"{m.capitalize()}: {emo}" for m, emo in top_emotions.items())
        return True, f"Strong valence divergence detected between modalities ({details})."

    if len(distinct_emotions) == len(predictions) and len(predictions) >= 3:
        details = ", ".join(f"{m.capitalize()}: {emo}" for m, emo in top_emotions.items())
        return True, f"Full disagreement across all three modalities ({details})."

    return False, None


def class_aware_fusion(
    predictions: Dict[str, ModalityPrediction],
    modality_weights: Optional[Dict[str, float]] = None,
    use_entropy_weighting: bool = False,
) -> Tuple[Dict[str, float], FusionReport]:
    """Fuses predictions across active modalities using Class-Aware Evidence Normalization.

    Args:
        predictions: Dictionary of ModalityPrediction objects (e.g. "face", "text", "audio").
        modality_weights: Base weights for each modality (defaults to 1.0 each).
        use_entropy_weighting: If True, dynamically down-weights high-entropy (uncertain) modalities.

    Returns:
        fused_scores: Dict mapping each canonical emotion to fused probability (sums to 1.0).
        report: FusionReport detailing eligibility and conflict status.
    """
    if not predictions:
        # Fallback to uniform distribution if no modalities were provided
        uniform_val = 1.0 / len(CANONICAL_EMOTIONS)
        empty_scores = {e: round(uniform_val, 4) for e in CANONICAL_EMOTIONS}
        return empty_scores, FusionReport(
            eligible_modalities={e: [] for e in CANONICAL_EMOTIONS},
            weights_applied={},
            has_conflict=False,
            conflict_notes="No active modalities provided.",
            active_modalities_count=0,
        )

    # Setup base weights
    weights = {"face": 1.0, "text": 1.0, "audio": 1.0}
    if modality_weights:
        weights.update(modality_weights)

    # Optional dynamic uncertainty weighting via inverse entropy
    applied_weights: Dict[str, float] = {}
    for mod_name, pred in predictions.items():
        base_w = weights.get(mod_name, 1.0)
        if use_entropy_weighting:
            entropy = calculate_entropy(pred.scores)
            # Max entropy for 7 classes is log2(7) ~ 2.807, for 4 classes ~ 2.0
            certainty_factor = 1.0 / (1.0 + entropy)
            applied_weights[mod_name] = round(base_w * certainty_factor, 4)
        else:
            applied_weights[mod_name] = base_w

    unnormalized_evidence: Dict[str, float] = {}
    eligible_modalities: Dict[str, List[str]] = {e: [] for e in CANONICAL_EMOTIONS}

    # For each canonical emotion class, aggregate only over capable & active modalities
    for emotion in CANONICAL_EMOTIONS:
        weighted_sum = 0.0
        total_weight_for_class = 0.0
        participating: List[str] = []

        for mod_name, pred in predictions.items():
            supported = MODALITY_SUPPORTED_CLASSES.get(mod_name, [])
            if emotion in supported and emotion in pred.scores:
                w = applied_weights.get(mod_name, 1.0)
                score = pred.scores[emotion]
                weighted_sum += w * score
                total_weight_for_class += w
                participating.append(mod_name)

        eligible_modalities[emotion] = participating

        if total_weight_for_class > 0.0:
            # Weighted average evidence from modalities that can speak for this class
            unnormalized_evidence[emotion] = weighted_sum / total_weight_for_class
        else:
            unnormalized_evidence[emotion] = 0.0

    # Simplex Re-normalization across the canonical space
    evidence_sum = sum(unnormalized_evidence.values())
    fused_scores: Dict[str, float] = {}

    if evidence_sum > 0:
        for emotion in CANONICAL_EMOTIONS:
            fused_scores[emotion] = round(
                float(unnormalized_evidence[emotion] / evidence_sum), 4
            )
    else:
        uniform_val = 1.0 / len(CANONICAL_EMOTIONS)
        fused_scores = {e: round(uniform_val, 4) for e in CANONICAL_EMOTIONS}

    has_conflict, conflict_notes = detect_conflicts(predictions)

    report = FusionReport(
        eligible_modalities=eligible_modalities,
        weights_applied=applied_weights,
        has_conflict=has_conflict,
        conflict_notes=conflict_notes,
        active_modalities_count=len(predictions),
    )

    return fused_scores, report

