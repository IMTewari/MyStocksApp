
// app/lib/portfolio/mix.ts
import { Holding, SectorIndustryMix, MixSlice } from "./types";

const palette = [
  "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#14b8a6", "#f97316", "#10b981", "#6366f1", "#e11d48"
];

export function computeSectorIndustryMix(holdings: Holding[]): SectorIndustryMix {
  const total = holdings.reduce((sum, h) => sum + (h.market_value || 0), 0) || 1;

  const byKey = (key: "sector" | "industry") => {
    const map = new Map<string, number>();
    holdings.forEach(h => {
      const label = (h[key] || "Unknown").trim();
      const v = h.market_value || 0;
      map.set(label, (map.get(label) || 0) + v);
    });
    const slices: MixSlice[] = Array.from(map.entries())
      .map(([label, value], i) => ({
        label,
        value,
        pct: +((value / total) * 100).toFixed(1),
        color: palette[i % palette.length],
      }))
      .sort((a, b) => b.pct - a.pct);
    return slices;
  };

  return {
    sectors: byKey("sector"),
    industries: byKey("industry"),
  };
}
