
"use client";

import * as React from "react";
import { SectorMomentum } from "@/app/lib/portfolio/types";
import { rankSectors } from "@/app/lib/portfolio/allocator";

type Props = {
  momentum: SectorMomentum[];
  freedCapital?: number; // optional INR amount; we’ll show proportional
  className?: string;
};

export default function TrendAllocator({ momentum, freedCapital, className }: Props) {
  const ideas = rankSectors(momentum);

  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className || ""}`}>
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-slate-800 font-semibold">Trend Allocator</h3>
        <span className="text-xs text-slate-500">Momentum & sentiment ranking (not advice)</span>
      </div>

      <div className="px-4 pb-4 space-y-4">
        {ideas.map(idea => {
          const amount = freedCapital ? Math.round((idea.weight_suggestion_pct / 100) * freedCapital) : null;
          return (
            <div key={idea.sector} className="grid grid-cols-[minmax(160px,240px)_1fr_minmax(160px,200px)] items-start gap-4">
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-800">{idea.sector}</div>
              </div>

              <div className="h-2 bg-slate-100 rounded overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${idea.weight_suggestion_pct}%` }}
                />
              </div>

              <div className="text-sm text-slate-700">
                <div className="font-medium">{idea.weight_suggestion_pct}% {amount ? `(~₹${amount.toLocaleString("en-IN")})` : ""}</div>
                <ul className="list-disc list-inside">
                  {idea.rationale.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 pb-4">
        <p className="text-xs text-slate-500">
          Use this as a starting point; confirm instruments (stocks/ETFs) and risk limits before reallocating.
        </p>
      </div>
    </div>
  );
}
