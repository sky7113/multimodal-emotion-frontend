export type CanonicalEmotion =
  | "angry"
  | "disgust"
  | "fear"
  | "happy"
  | "neutral"
  | "sad"
  | "surprise";

export interface ModalityPrediction {
  modality: "face" | "text" | "audio";
  top_emotion: CanonicalEmotion;
  confidence: number;
  scores: Record<string, number>;
  supported_classes: string[];
}

export interface FusionReport {
  eligible_modalities: Record<string, string[]>;
  weights_applied: Record<string, number>;
  has_conflict: boolean;
  conflict_notes?: string | null;
  active_modalities_count: number;
}

export interface AnalyzeResponse {
  status: string;
  top_emotion: CanonicalEmotion;
  confidence: number;
  fused_scores: Record<CanonicalEmotion, number>;
  modalities_present: string[];
  individual_predictions: Record<string, ModalityPrediction>;
  fusion_report: FusionReport;
  processing_time_ms: number;
}

export interface AnalyzePayload {
  imageFile?: File | Blob | null;
  text?: string | null;
  audioFile?: File | Blob | null;
  weightFace?: number;
  weightText?: number;
  weightAudio?: number;
  useEntropyWeighting?: boolean;
}

