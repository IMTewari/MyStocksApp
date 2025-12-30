
import { NextResponse } from "next/server";

export async function GET() {
  const url = `https://kite.zerodha.com/connect/login?api_key=${process.env.KITE_API_KEY}&v=3`;
  return NextResponse.redirect(url);
}
