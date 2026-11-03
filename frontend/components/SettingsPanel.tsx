"use client";

import React from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

interface SettingsPanelProps {
  weightFace: number;
  weightText: number;
  weightAudio: number;
  useEntropy: boolean;
  onFaceChange: (val: number) => void;
  onTextChange: (val: number) => void;
  onAudioChange: (val: number) => void;
  onEntropyToggle: (val: boolean) => void;
  onReset: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  weightFace,
  weightText,
  weightAudio,
  useEntropy,
  onFaceChange,
  onTextChange,
  onAudioChange,
  onEntropyToggle,
  onReset,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Fusion Tuning & Parameters
          </h3>
        </div>
        <button
          onClick={onReset}
          className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition"
          title="Reset weights"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Face Weight</span>
            <span className="font-mono text-indigo-400 font-semibold">{weightFace.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={weightFace}
            onChange={(e) => onFaceChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
        </div>

        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Text Weight</span>
            <span className="font-mono text-indigo-400 font-semibold">{weightText.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={weightText}
            onChange={(e) => onTextChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
        </div>

        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Audio Weight</span>
            <span className="font-mono text-indigo-400 font-semibold">{weightAudio.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={weightAudio}
            onChange={(e) => onAudioChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
        </div>

        <div className="flex items-center justify-between md:justify-center gap-3 pt-2 md:pt-0">
          <label className="text-slate-300 flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useEntropy}
              onChange={(e) => onEntropyToggle(e.target.checked)}
              className="accent-indigo-500 rounded cursor-pointer w-4 h-4"
            />
            <span>Dynamic Entropy Down-weighting</span>
          </label>
        </div>
      </div>
    </div>
  );
};

