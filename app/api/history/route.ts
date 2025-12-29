import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });
  try {
    const hist = await yahooFinance.historical(symbol, { period1: '1y', interval: '1d' });
    return NextResponse.json(hist);
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'fetch error' }, { status: 500 });
  }
}
