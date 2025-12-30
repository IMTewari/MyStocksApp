
import { NextRequest, NextResponse } from "next/server";
import { KiteConnect } from "kiteconnect";

export async function GET(req: NextRequest) {
  const access = req.cookies.get("kite_access_token")?.value;
  if (!access) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const u = new URL(req.url);
  const token = u.searchParams.get("token");
  const interval = u.searchParams.get("interval") || "day";
  const from = u.searchParams.get("from")!;
  const to = u.searchParams.get("to")!;

  const kc = new KiteConnect({ api_key: process.env.KITE_API_KEY! });
  kc.setAccessToken(access);

  const data = await kc.getHistoricalData(Number(token), from, to, interval);
  const candles = data.map((d: any) => ({ c: d.close, h: d.high, l: d.low, o: d.open, t: d.date }));
  return NextResponse.json({ candles });
}
