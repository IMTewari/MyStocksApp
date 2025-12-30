
"use client";

import * as React from "react";
import { ExitSignalInput } from "@/app/lib/portfolio/types";
import { scoreExit } from "@/app/lib/portfolio/exitEngine";

type Props = {
  inputs: ExitSignalInput[];
  className?: string;
};

export default function ExitAlerts({ inputs, className }: Props) {
  const signals = inputs.map(scoreExit).sort((a, b) => b.score - a.score);

  const badge = (sev: typeof signals[number]["severity"]) =>
    sev === "EXIT_NOW" ? "bg-rose-600 text-white" :
    sev === "WATCH_CLOSELY" ? "bg-amber-500 text-white" :
    "bg-emerald-500 text-white";

  const label = (sev: typeof signals[number]["severity"]) =>
    sev === "EXIT_NOW" ? "Exit now" :
    sev === "WATCH_CLOSELY" ? "Watch closely" :
    "OK";

  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className || ""}`}>
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-slate-800 font-semibold">Exit Alerts</h3>
        <span className="text-xs text-slate-500">Rule-based score (0–100)</span>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {signals.map(sig => (
          <div key={sig.symbol} className="grid grid-cols-[minmax(160px,240px)_1fr_minmax(160px,200px)] items-start gap-4">
            <div className="flex items-center gap-2">
              <div className={`text-xs px-2 py-1 rounded ${badge(sig.severity)}`}>
                {label(sig.severity)}
              </div>
              <div className="text-sm text-slate-700">
                {sig.name} <span className="text-slate-400">({sig.symbol})</span>
              </div>
            </div>

            <div className="h-2 bg-slate-100 rounded overflow-hidden" title={`Score ${sig.score}`}>
              <div
                className="h-full bg-slate-800 transition-all duration-300"
                style={{ width: `${sig.score}%` }}
              />
            </div>

            <div className="text-sm text-slate-700">
              <ul className="list-disc list-inside">
                {sig.rationale.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <p className="text-xs text-slate-500">
          This is a rules-based framework for decision support only. Validate against your own criteria.
        </p>
      </div>
    </div>
  );
}
