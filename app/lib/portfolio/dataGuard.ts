// app/lib/portfolio/dataGuard.ts

export type Candle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const MIN_CANDLES = 600; // ≈ 2.5 years trading data

export function enforceDataContract(
  symbol: string,
  candles: Candle[]
): Candle[] {
  if (!Array.isArray(candles) || candles.length < MIN_CANDLES) {
    throw new Error(
      `DATA_CONTRACT_VIOLATION: ${symbol} has only ${candles.length} candles`
    );
  }

  return candles;
}
