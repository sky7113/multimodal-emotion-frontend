"use client";

import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, Upload, CheckCircle2, X } from "lucide-react";

interface WebcamCaptureProps {
  onCapture: (blob: Blob | null) => void;
  capturedImage: Blob | null;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onCapture,
  capturedImage,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (capturedImage) {
      const url = URL.createObjectURL(capturedImage);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [capturedImage]);
  // Add this new useEffect to bind the stream AFTER the video tag is mounted
  useEffect(() => {
    if (isCameraActive && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraActive, stream]);
  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraActive(true); // Iske true hote hi upar wala useEffect video chalu kar dega
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Camera unavailable or permission denied. You can upload an image file instead.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCapture(blob);
            stopCamera();
          }
        },
        "image/jpeg",
        0.95
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onCapture(file);
      stopCamera();
    }
  };

  const clearSnapshot = () => {
    onCapture(null);
    stopCamera();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Face Modality</h3>
            <p className="text-xs text-slate-400">ViT Face Expression (7-class)</p>
          </div>
        </div>
        {previewUrl && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Ready
          </span>
        )}
      </div>

      <div className="relative flex-1 min-h-55 bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center">
        {previewUrl ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Face Snapshot"
              className="max-h-56 max-w-full object-contain rounded-lg"
            />
            <button
              onClick={clearSnapshot}
              className="absolute top-2 right-2 p-1.5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-full transition shadow-md"
              title="Remove snapshot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : isCameraActive ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={takeSnapshot}
              className="absolute bottom-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg transition"
            >
              <Camera className="w-4 h-4" /> Capture Frame
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Camera className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-xs text-slate-400 mb-4 max-w-xs">
              Take a webcam photo or upload an image to analyze facial cues.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={startCamera}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" /> Start Webcam
              </button>
              <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition flex items-center gap-1.5 border border-slate-700">
                <Upload className="w-3.5 h-3.5" /> Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            {cameraError && (
              <p className="mt-2 text-xs text-rose-400 max-w-xs">{cameraError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

