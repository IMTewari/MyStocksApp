
import { NextRequest, NextResponse } from "next/server";
import { KiteConnect } from "kiteconnect";

export async function GET(req: NextRequest) {
  const access = req.cookies.get("kite_access_token")?.value;
  if (!access) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const kc = new KiteConnect({ api_key: process.env.KITE_API_KEY! });
  kc.setAccessToken(access);

  const [holdings, positions, margins] = await Promise.all([
    kc.getHoldings(), kc.getPositions(), kc.getMargins()
  ]);

  return NextResponse.json({ holdings, positions, margins });
}
