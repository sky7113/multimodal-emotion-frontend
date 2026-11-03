"use client";

import React from "react";
import { MessageSquareText, CheckCircle2, Sparkles } from "lucide-react";

interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
}

const PRESET_PROMPTS = [
  {
    label: "Joyful",
    text: "I am absolutely thrilled and overjoyed with our breakthrough results today!",
  },
  {
    label: "Disgusted",
    text: "This repulsive and foul odor is making me completely sick to my stomach.",
  },
  {
    label: "Angry",
    text: "I am furious that our deadlines were sabotaged without any warning!",
  },
  {
    label: "Fearful",
    text: "A sudden deafening sound shattered the dark silence and I froze in terror.",
  },
];

export const TextInput: React.FC<TextInputProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Text Modality</h3>
            <p className="text-xs text-slate-400">DistilRoBERTa Emotion (7-class)</p>
          </div>
        </div>
        {value.trim().length > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Ready
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-55">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type or paste text utterance to analyze emotional tone, sentiment, and context..."
          className="flex-1 w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition resize-none"
        />

        <div className="mt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Samples:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PROMPTS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => onChange(preset.text)}
                type="button"
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-md text-xs transition border border-slate-700/60"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

