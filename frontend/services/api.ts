import { AnalyzePayload, AnalyzeResponse } from "../types/emotion";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function analyzeEmotion(
  payload: AnalyzePayload
): Promise<AnalyzeResponse> {
  const formData = new FormData();

  if (payload.imageFile) {
    formData.append("image", payload.imageFile, "snapshot.jpg");
  }

  if (payload.text && payload.text.trim()) {
    formData.append("text", payload.text.trim());
  }

  if (payload.audioFile) {
    formData.append("audio", payload.audioFile, "recording.wav");
  }

  if (payload.weightFace !== undefined) {
    formData.append("weight_face", payload.weightFace.toString());
  }
  if (payload.weightText !== undefined) {
    formData.append("weight_text", payload.weightText.toString());
  }
  if (payload.weightAudio !== undefined) {
    formData.append("weight_audio", payload.weightAudio.toString());
  }
  if (payload.useEntropyWeighting !== undefined) {
    formData.append(
      "use_entropy_weighting",
      payload.useEntropyWeighting ? "true" : "false"
    );
  }

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Analysis failed with HTTP status ${response.status}`
    );
  }

  return response.json();
}

