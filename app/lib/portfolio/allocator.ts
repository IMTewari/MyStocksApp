
import { SectorMomentum, AllocationIdea } from "./types";

export function rankSectors(momentum: SectorMomentum[], topN = 4): AllocationIdea[] {
  // Composite score: 40% r3m, 30% r6m, 20% r1m, 10% sentiment, penalize high vol
  const scored = momentum.map(s => {
    const r1m = s.r1m ?? 0, r3m = s.r3m ?? 0, r6m = s.r6m ?? 0, sent = s.sentiment ?? 0, vol = s.vol ?? 0;
    const score = (0.2 * r1m) + (0.4 * r3m) + (0.3 * r6m) + (10 * sent) - (0.1 * vol);
    return { ...s, score };
  }).sort((a, b) => b.score - a.score);

  const top = scored.slice(0, topN);
  const totalScore = top.reduce((sum, t) => sum + Math.max(0, t.score), 0) || 1;

  return top.map(t => ({
    sector: t.sector,
    weight_suggestion_pct: +((Math.max(0, t.score) / totalScore) * 100).toFixed(1),
    rationale: [
      `Momentum: r1m=${(t.r1m ?? 0).toFixed(1)}%, r3m=${(t.r3m ?? 0).toFixed(1)}%, r6m=${(t.r6m ?? 0).toFixed(1)}%`,
      `Volatility: ${t.vol ?? 0}%`,
      `Sentiment: ${(t.sentiment ?? 0).toFixed(2)}`,
    ],
  }));
}
