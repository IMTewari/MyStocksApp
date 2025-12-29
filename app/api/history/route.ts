
// app/api/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

// Ensure Node runtime for this route
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    // chart() supports range/interval; historical() expects absolute dates.
    const res = await yahooFinance.chart(symbol, { range: "1y", interval: "1d" });
    const candles = (res?.quotes || []).map((q: any) => ({
      date: q.date,
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume,
    }));
    return NextResponse.json(candles);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "fetch error" }, { status: 500 });
  }
}
