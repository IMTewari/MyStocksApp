
"use client";

import * as React from "react";
import type {
  SectorIndustryMix as SectorIndustryMixType,
  MixSlice,
} from "@/app/lib/portfolio/types";

type Props = {
  mix: SectorIndustryMixType;
  concentrationThreshold?: number;
  className?: string;
};

export default function SectorIndustryMix({
  mix,
  concentrationThreshold = 35,
  className,
}: Props) {
  const [tab, setTab] = React.useState<"sector" | "industry">("sector");
  const slices: MixSlice[] = tab === "sector" ? mix.sectors : mix.industries;

  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className || ""}`}>
      <div className="flex items-center justify-between p-4">
        <h3 className="text-slate-800 font-semibold">Mix Overview</h3>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded-md text-sm ${tab === "sector" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"}`}
            onClick={() => setTab("sector")}
          >
            Sector
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm ${tab === "industry" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"}`}
            onClick={() => setTab("industry")}
          >
            Industry
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {slices.map((s) => {
          const risky = s.pct > Number(concentrationThreshold);
          return (
            <div
              key={s.label}
              className="grid grid-cols-[minmax(160px,240px)_1fr_minmax(160px,200px)] items-center gap-4"
            >
              {/* Label + swatch */}
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block w-2.5 h-2.5 rounded"
                  style={{ background: s.color || "#8884d8" }}
                />
                <span className="text-sm text-slate-700">{s.label}</span>
              </div>

              {/* Bar */}
              <div className="h-2 bg-slate-100 rounded overflow-hidden" title={`${s.pct.toFixed(1)}%`}>
                <div
                  className={`h-full transition-all duration-300 ${risky ? "bg-rose-600" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(Math.max(s.pct, 0), 100)}%` }}
                />
              </div>

              {/* Right numbers + risk text */}
              <div className="text-right">
                <div className="text-sm text-slate-800">{s.pct.toFixed(1)}%</div>
                {risky && (
                  <div className="text-xs text-rose-600">
                    {`Concentration risk: ${tab} > ${Number(concentrationThreshold)}%`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
