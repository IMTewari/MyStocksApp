
// app/api/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

// Ensure Node runtime for this route (Node libs don't like Edge)
export const runtime = "nodejs";

// Helper: yyyy-mm-dd
function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    // Last ~370 days
    const period2 = new Date();
    const period1 = new Date();
    period1.setDate(period2.getDate() - 370);

    // v2.x: pass absolute dates; DO NOT pass `return`
    const res = await yahooFinance.historical(symbol, {
      period1: iso(period1),
      period2: iso(period2),
      interval: "1d",
      // events: "history",            // default; leave out unless you need dividends/splits
      // includeAdjustedClose: true,   // optional
    });

    // Normalize to a simple array of candles
    const rows = Array.isArray(res) ? res : (res as any)?.quotes || [];
    const candles = rows.map((q: any) => ({
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
