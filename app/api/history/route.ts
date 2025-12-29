
// app/api/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

// Ensure Node runtime for this route
export const runtime = "nodejs";

function iso(d: Date) {
  // yyyy-mm-dd (yahoo-finance2 accepts string | number | Date)
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    // last ~365 days
    const period2 = new Date(); // today
    const period1 = new Date();
    period1.setDate(period2.getDate() - 370);

    // v2 typings expect absolute dates for 'historical'
    const rows = await yahooFinance.historical(symbol, {
      period1: iso(period1),
      period2: iso(period2),
      interval: "1d",
      return: "array", // cleaner output shape
    });

    // Normalize fields for the UI
    const candles = (rows || []).map((q: any) => ({
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
