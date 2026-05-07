// app/lib/portfolio/allocator.ts

import { SectorMomentum, AllocationIdea } from "./types";

export function rankSectors(
  momentum: SectorMomentum[],
  maxSectors = 3
): AllocationIdea[] {
  const scored = momentum.map((s) => {
    const score =
      0.4 * (s.r3m ?? 0) +
      0.4 * (s.r6m ?? 0) +
      0.2 * (s.sentiment ?? 0) * 10 -
      0.1 * (s.vol ?? 0);

    return { ...s, score };
  });

  const top = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSectors);

  const total = top.reduce((sum, s) => sum + s.score, 0) || 1;

  return top.map((s) => ({
    sector: s.sector,
    weight_suggestion_pct: +((s.score / total) * 100).toFixed(1),
    rationale: [
      `3M return: ${(s.r3m ?? 0).toFixed(1)}%`,
      `6M return: ${(s.r6m ?? 0).toFixed(1)}%`,
      `Volatility: ${(s.vol ?? 0).toFixed(1)}`,
    ],
  }));
}
