"use client";

import React, { useState } from "react";
import { WebcamCapture } from "../components/WebcamCapture";
import { AudioRecorder } from "../components/AudioRecorder";
import { TextInput } from "../components/TextInput";
import { EmotionRadarBar } from "../components/EmotionRadarBar";
import { FusionBreakdown } from "../components/FusionBreakdown";
import { SettingsPanel } from "../components/SettingsPanel";
import { analyzeEmotion } from "../services/api";
import { AnalyzeResponse } from "../types/emotion";
import { Play, Loader2, AlertCircle, Sparkles, Layers } from "lucide-react";

export default function DashboardPage() {
  // Input states
  const [faceImage, setFaceImage] = useState<Blob | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [inputText, setInputText] = useState<string>("");

  // Weight and parameter states
  const [weightFace, setWeightFace] = useState<number>(1.0);
  const [weightText, setWeightText] = useState<number>(1.0);
  const [weightAudio, setWeightAudio] = useState<number>(1.0);
  const [useEntropy, setUseEntropy] = useState<boolean>(false);

  // Analysis state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasAnyInput = Boolean(
    faceImage || audioBlob || (inputText && inputText.trim().length > 0)
  );

  const handleRunInference = async () => {
    if (!hasAnyInput) {
      setErrorMessage("Please capture a photo, record audio, or enter text before analyzing.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await analyzeEmotion({
        imageFile: faceImage,
        text: inputText,
        audioFile: audioBlob,
        weightFace,
        weightText,
        weightAudio,
        useEntropyWeighting: useEntropy,
      });
      setResult(response);
    } catch (err: any) {
      console.error("Analysis request error:", err);
      setErrorMessage(
        err.message ||
          "Failed to connect to the backend at http://127.0.0.1:8000. Is FastAPI running?"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetParameters = () => {
    setWeightFace(1.0);
    setWeightText(1.0);
    setWeightAudio(1.0);
    setUseEntropy(false);
  };

  const handleLoadDemoMock = () => {
    setInputText(
      "I am astonished and utterly ecstatic! Everything we hoped for came true."
    );
    // Create an empty dummy blob for immediate preview
    const dummyBlob = new Blob(["dummy audio data"], { type: "audio/wav" });
    setAudioBlob(dummyBlob);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Emotion Recognition Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Asynchronous multi-modal late fusion with class-aware negative evidence mitigation.
            Supply any combination of Face (Vision), Speech (Acoustic), or Text (Semantic) inputs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadDemoMock}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-2 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Demo Input</span>
          </button>
        </div>
      </div>

      {/* Settings Tuning Bar */}
      <SettingsPanel
        weightFace={weightFace}
        weightText={weightText}
        weightAudio={weightAudio}
        useEntropy={useEntropy}
        onFaceChange={setWeightFace}
        onTextChange={setWeightText}
        onAudioChange={setWeightAudio}
        onEntropyToggle={setUseEntropy}
        onReset={handleResetParameters}
      />

      {/* Input Modalities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WebcamCapture onCapture={setFaceImage} capturedImage={faceImage} />
        <TextInput value={inputText} onChange={setInputText} />
        <AudioRecorder onAudioReady={setAudioBlob} audioBlob={audioBlob} />
      </div>

      {/* Action CTA Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>
            {faceImage ? "Face [✓] " : "Face [ ] "}
            {inputText.trim() ? "Text [✓] " : "Text [ ] "}
            {audioBlob ? "Audio [✓] " : "Audio [ ] "}
          </span>
        </div>

        <button
          onClick={handleRunInference}
          disabled={isLoading || !hasAnyInput}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition shadow-xl ${
            !hasAnyInput
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
              : isLoading
              ? "bg-indigo-700 text-white cursor-wait"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synthesizing Modalities...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Multimodal Inference</span>
            </>
          )}
        </button>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-300">
            <span className="font-semibold">Analysis Notice: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Inference Results Section */}
      {result && (
        <div className="space-y-6 pt-4 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmotionRadarBar
              scores={result.fused_scores}
              topEmotion={result.top_emotion}
              confidence={result.confidence}
            />
            <FusionBreakdown data={result} />
          </div>
        </div>
      )}
    </div>
  );
}

