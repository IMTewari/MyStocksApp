
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

function toYahooTicker(symbol: string, exchange?: string): string {
  const sym = symbol.trim();
  const ex = (exchange || '').toUpperCase();
  if (ex === 'NSE') return `${sym}.NS`;
  if (ex === 'BSE') return `${sym}.BO`;
  return `${sym}.NS`;
}

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const symbol = u.searchParams.get("symbol");
  const exchange = u.searchParams.get("exchange");
  if (!symbol) return NextResponse.json({ error: "missing_symbol" }, { status: 400 });

  try {
    const yf = (await import("yahoo-finance2")).default;
    const ticker = toYahooTicker(symbol, exchange || undefined);
    const data = await yf.quoteSummary(ticker, { modules: ["assetProfile"] });
    const sector = data?.assetProfile?.sector || null;
    const industry = data?.assetProfile?.industry || null;
    return NextResponse.json({ symbol, exchange, sector, industry });
  } catch (e: any) {
    return NextResponse.json({ symbol, exchange, sector: null, industry: null, error: e?.message || 'fetch_failed' }, { status: 200 });
  }
}
