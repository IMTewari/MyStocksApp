
import { NextRequest, NextResponse } from "next/server";
import { KiteConnect } from "kiteconnect";

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const requestToken = u.searchParams.get("request_token");
  const status = u.searchParams.get("status");
  if (!requestToken || status !== "success") {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?auth=failed`);
  }
  try {
    const kc = new KiteConnect({ api_key: process.env.KITE_API_KEY! });
    const data = await kc.generateSession(requestToken, process.env.KITE_API_SECRET!);
    const accessToken = data.access_token;

    const res = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
    res.cookies.set("kite_access_token", accessToken, {
      httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 8
    });
    return res;
  } catch {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?auth=error`);
  }
}
