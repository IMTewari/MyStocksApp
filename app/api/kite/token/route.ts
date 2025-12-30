import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs';
export async function GET(req: NextRequest) { const token = req.cookies.get("kite_access_token")?.value; if (!token) return NextResponse.json({ error: "not_authenticated" }, { status: 401 }); return NextResponse.json({ access_token: token }); }