"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Upload, CheckCircle2, X, Volume2 } from "lucide-react";

interface AudioRecorderProps {
  onAudioReady: (blob: Blob | null) => void;
  audioBlob: Blob | null;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioReady,
  audioBlob,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl(null);
    }
  }, [audioBlob]);

  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || "audio/wav";
        const combinedBlob = new Blob(audioChunksRef.current, { type: mimeType });
        onAudioReady(combinedBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone error:", err);
      setErrorMsg("Microphone access denied or unsupported. You can upload a WAV file.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAudioReady(file);
    }
  };

  const clearAudio = () => {
    if (isRecording) stopRecording();
    onAudioReady(null);
    setDuration(0);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Speech Modality</h3>
            <p className="text-xs text-slate-400">SpeechBrain Wav2Vec2 (IEMOCAP 4-class)</p>
          </div>
        </div>
        {audioUrl && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Ready
          </span>
        )}
      </div>

      <div className="relative flex-1 min-h-55 bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800/80 p-4 flex flex-col items-center justify-center">
        {audioUrl ? (
          <div className="w-full flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400">
              <Volume2 className="w-8 h-8" />
            </div>
            <audio src={audioUrl} controls className="w-full max-w-xs h-9 mt-2" />
            <button
              onClick={clearAudio}
              className="mt-2 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            >
              <X className="w-3.5 h-3.5" /> Discard Recording
            </button>
          </div>
        ) : isRecording ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 animate-ping absolute" />
              <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center text-white z-10 shadow-lg shadow-rose-600/40">
                <Mic className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <span className="text-xs font-mono text-rose-400 mb-4 font-semibold tracking-wider">
              RECORDING {formatTime(duration)}
            </span>
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg transition"
            >
              <Square className="w-4 h-4 fill-current" /> Stop Recording
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Mic className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-xs text-slate-400 mb-4 max-w-xs">
              Record voice audio or upload a WAV sample for acoustic emotion recognition.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={startRecording}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5" /> Start Recording
              </button>
              <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition flex items-center gap-1.5 border border-slate-700">
                <Upload className="w-3.5 h-3.5" /> Upload Audio
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            {errorMsg && (
              <p className="mt-2 text-xs text-rose-400 max-w-xs">{errorMsg}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

