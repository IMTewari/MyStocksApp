
// app/lib/portfolio/types.ts
export type Holding = {
  symbol: string;               // e.g., "RELIANCE"
  name: string;                 // "Reliance Industries Ltd"
  sector: string;               // e.g., "Energy"
  industry: string;             // e.g., "Oil & Gas Integrated"
  quantity?: number;            // shares/units
  avg_cost?: number;            // average acquisition price
  last_price?: number;          // latest price
  market_value: number;         // quantity * last_price OR direct value
};

export type MixSlice = {
  label: string;                // Sector or Industry name
  pct: number;                  // 0-100
  value: number;                // absolute value (INR, or any currency)
  color?: string;               // optional UI color
};

export type SectorIndustryMix = {
  sectors: MixSlice[];
  industries: MixSlice[];
};

export type ExitSignalInput = {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  position_value: number;
  pnl_pct?: number;             // % P&L
  day_change_pct?: number;      // 1D change
  week_change_pct?: number;     // 1W change
  rsi?: number;                 // 14-period RSI
  below_200dma?: boolean;       // true if price < 200 DMA
  volume_ratio?: number;        // today_vol / 30D_avg_vol
  news_sentiment?: number;      // -1..+1 from your news engine
  stop_loss_pct?: number;       // user-defined stop % (e.g. 8-12)
};

export type ExitSignal = {
  symbol: string;
  name: string;
  severity: "EXIT_NOW" | "WATCH_CLOSELY" | "OK";
  score: number;                // 0..100 composite score
  rationale: string[];          // text bullets
};

export type SectorMomentum = {
  sector: string;
  r1m?: number;                 // 1M return %
  r3m?: number;                 // 3M return %
  r6m?: number;                 // 6M return %
  vol?: number;                 // 3M realized volatility %
  sentiment?: number;           // -1..+1
};

export type AllocationIdea = {
  sector: string;
  weight_suggestion_pct: number; // % of freed capital
  rationale: string[];
};
