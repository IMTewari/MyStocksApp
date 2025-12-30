
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

// Map exchange + symbol to Yahoo format
function toYahooTicker(symbol: string, exchange?: string): string {
  const sym = symbol.trim();
  const ex = (exchange || '').toUpperCase();
  if (ex === 'NSE') return `${sym}.NS`;
  if (ex === 'BSE') return `${sym}.BO`;
  // fallback: assume NSE
  return `${sym}.NS`;
}

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const symbol = u.searchParams.get("symbol");
  const exchange = u.searchParams.get("exchange");
  const daysStr = u.searchParams.get("days");
  const days = daysStr ? Math.max(30, Math.min(3650, parseInt(daysStr))) : 365; // default 1y

  if (!symbol) return NextResponse.json({ error: "missing_symbol" }, { status: 400 });

  try {
    const yf = (await import("yahoo-finance2")).default;
    const to = new Date();
    const from = new Date(); from.setDate(to.getDate() - days);
    const yahooSymbol = toYahooTicker(symbol, exchange || undefined);
    const res = await yf.historical(yahooSymbol, { period1: from, period2: to, interval: "1d" });
    const candles = (res || []).map((d: any) => ({
      o: Number(d.open), h: Number(d.high), l: Number(d.low), c: Number(d.close), t: new Date(d.date)
    })).filter(x => Number.isFinite(x.c));
    return NextResponse.json({ candles });
  } catch (e: any) {
    return NextResponse.json({ candles: [], error: e?.message || 'fetch_failed' }, { status: 200 });
  }
}
