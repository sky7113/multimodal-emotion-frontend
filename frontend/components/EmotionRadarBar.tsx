"use client";

import React from "react";
import { motion } from "framer-motion";
import { CanonicalEmotion } from "../types/emotion";

interface EmotionRadarBarProps {
  scores: Record<CanonicalEmotion, number>;
  topEmotion: CanonicalEmotion;
  confidence: number;
}

const EMOTION_CONFIG: Record<
  CanonicalEmotion,
  { label: string; emoji: string; color: string; bgLight: string }
> = {
  happy: { label: "Happy", emoji: "😄", color: "bg-emerald-500", bgLight: "bg-emerald-500/20" },
  surprise: { label: "Surprise", emoji: "😲", color: "bg-cyan-500", bgLight: "bg-cyan-500/20" },
  neutral: { label: "Neutral", emoji: "😐", color: "bg-slate-400", bgLight: "bg-slate-400/20" },
  sad: { label: "Sad", emoji: "😢", color: "bg-blue-500", bgLight: "bg-blue-500/20" },
  fear: { label: "Fear", emoji: "😨", color: "bg-purple-500", bgLight: "bg-purple-500/20" },
  disgust: { label: "Disgust", emoji: "🤢", color: "bg-amber-600", bgLight: "bg-amber-600/20" },
  angry: { label: "Angry", emoji: "😡", color: "bg-rose-500", bgLight: "bg-rose-500/20" },
};

export const EmotionRadarBar: React.FC<EmotionRadarBarProps> = ({
  scores,
  topEmotion,
  confidence,
}) => {
  // Sort canonical emotions by highest score descending
  const sortedEmotions = (Object.keys(scores) as CanonicalEmotion[]).sort(
    (a, b) => (scores[b] || 0) - (scores[a] || 0)
  );

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Fused Emotion Distribution</h2>
          <p className="text-xs text-slate-400">Class-aware multi-modal synthesis (Ekman 7-Class)</p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-2xl">{EMOTION_CONFIG[topEmotion]?.emoji || "✨"}</span>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Top Prediction</div>
            <div className="text-sm font-bold text-white capitalize">
              {topEmotion} <span className="text-indigo-400">({(confidence * 100).toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {sortedEmotions.map((emotion) => {
          const config = EMOTION_CONFIG[emotion] || {
            label: emotion,
            emoji: "•",
            color: "bg-indigo-500",
            bgLight: "bg-indigo-500/20",
          };
          const score = scores[emotion] || 0;
          const percentage = Math.round(score * 100);
          const isTop = emotion === topEmotion;

          return (
            <div key={emotion} className="group">
              <div className="flex items-center justify-between mb-1 text-xs">
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-base">{config.emoji}</span>
                  <span className={isTop ? "text-white font-semibold" : "text-slate-300"}>
                    {config.label}
                  </span>
                  {isTop && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      LEADER
                    </span>
                  )}
                </div>
                <div className="font-mono text-slate-300 font-medium">
                  {percentage}% <span className="text-slate-500 text-[11px]">({score.toFixed(4)})</span>
                </div>
              </div>

              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(percentage, 2)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${config.color} ${isTop ? "shadow-lg shadow-indigo-500/50" : ""}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

