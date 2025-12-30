
import { NextRequest, NextResponse } from "next/server";
import { KiteConnect } from "kiteconnect";

export const runtime = 'nodejs';

type Interval =
  | "day"
  | "minute"
  | "3minute"
  | "5minute"
  | "10minute"
  | "15minute"
  | "30minute"
  | "60minute";

const ALLOWED_INTERVALS: Interval[] = [
  "day",
  "minute",
  "3minute",
  "5minute",
  "10minute",
  "15minute",
  "30minute",
  "60minute",
];

export async function GET(req: NextRequest) {
  const access = req.cookies.get("kite_access_token")?.value;
  if (!access) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const u = new URL(req.url);
  const tokenParam = u.searchParams.get("token");
  if (!tokenParam) return NextResponse.json({ error: "missing_token" }, { status: 400 });

  const rawInterval = u.searchParams.get("interval") || "day";
  const interval: Interval = (ALLOWED_INTERVALS.includes(rawInterval as Interval)
    ? (rawInterval as Interval)
    : "day");

  const from = u.searchParams.get("from");
  const to = u.searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "missing_from_or_to" }, { status: 400 });

  const instrumentToken = Number(tokenParam);
  if (!Number.isFinite(instrumentToken)) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const kc = new KiteConnect({ api_key: process.env.KITE_API_KEY! });
  kc.setAccessToken(access);

  // Correct order expected by kiteconnectjs: token, interval, from, to
  const data = await kc.getHistoricalData(instrumentToken, interval, from, to);
  const candles = data.map((d: any) => ({
    c: d.close,
    h: d.high,
    l: d.low,
    o: d.open,
    t: d.date,
  }));
  return NextResponse.json({ candles });
}
