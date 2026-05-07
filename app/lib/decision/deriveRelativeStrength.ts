// app/lib/decision/deriveRelativeStrength.ts

/**
 * Relative performance of stock vs index over same window.
 * Positive → outperformance
 * Negative → underperformance
 */
export function deriveRelativeStrength(
  stockCloses: number[],
  indexCloses: number[],
  lookback = 200
): number | null {
  if (
    stockCloses.length < lookback ||
    indexCloses.length < lookback
  ) {
    return null;
  }

  const stockReturn =
    stockCloses[stockCloses.length - 1] /
    stockCloses[stockCloses.length - lookback];

  const indexReturn =
    indexCloses[indexCloses.length - 1] /
    indexCloses[indexCloses.length - lookback];

  return stockReturn - indexReturn;
}
