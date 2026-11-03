"use client";

import React from "react";
import { AlertTriangle, CheckCircle, Clock, Cpu, Layers } from "lucide-react";
import { AnalyzeResponse } from "../types/emotion";

interface FusionBreakdownProps {
  data: AnalyzeResponse;
}

export const FusionBreakdown: React.FC<FusionBreakdownProps> = ({ data }) => {
  const { fusion_report, individual_predictions, processing_time_ms, modalities_present } = data;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Class-Aware Fusion Report</h3>
            <p className="text-xs text-slate-400">Multi-source alignment and evidence attribution</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{processing_time_ms} ms</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>{modalities_present.length} Modalities</span>
          </div>
        </div>
      </div>

      {/* Conflict / Alignment Banner */}
      {fusion_report.has_conflict ? (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-amber-200">Modality Conflict Flagged: </span>
            <span className="text-amber-300/90">{fusion_report.conflict_notes}</span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs text-emerald-200 font-medium">
            Active modalities exhibit congruent emotional polarity.
          </div>
        </div>
      )}

      {/* Individual Modality Cards */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Modality-Level Inferences
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {["face", "text", "audio"].map((modalityKey) => {
            const pred = individual_predictions[modalityKey];
            const isPresent = modalities_present.includes(modalityKey);

            if (!isPresent || !pred) {
              return (
                <div
                  key={modalityKey}
                  className="p-4 bg-slate-950/40 border border-slate-800/40 rounded-xl flex flex-col justify-between opacity-50"
                >
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    {modalityKey}
                  </div>
                  <div className="text-xs text-slate-600 mt-2">Not supplied</div>
                </div>
              );
            }

            return (
              <div
                key={modalityKey}
                className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    {modalityKey}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    w = {fusion_report.weights_applied[modalityKey] ?? 1.0}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-white capitalize">
                    {pred.top_emotion}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Confidence: {(pred.confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-slate-500">
                  Classes: {pred.supported_classes.length} supported
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Class Eligibility Proof Table */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Class-Aware Eligibility Matrix
        </h4>
        <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Emotion Class</th>
                <th className="py-2.5 px-3">Contributing Modalities</th>
                <th className="py-2.5 px-3 text-right">Raw Unbiased Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {Object.entries(fusion_report.eligible_modalities).map(
                ([emotion, mods]) => (
                  <tr key={emotion} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-semibold text-slate-300 capitalize">
                      {emotion}
                    </td>
                    <td className="py-2 px-3">
                      {mods.length > 0 ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {mods.map((m) => (
                            <span
                              key={m}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[10px]">None active</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300 font-semibold">
                      {data.fused_scores[emotion as keyof typeof data.fused_scores] !== undefined
                        ? (data.fused_scores[emotion as keyof typeof data.fused_scores] * 100).toFixed(2) + "%"
                        : "0%"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

