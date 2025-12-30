import { NextRequest } from "next/server";
export const runtime = 'nodejs';
export async function GET(req: NextRequest) { const auth = req.headers.get("authorization"); if (auth !== `Bearer ${process.env.CRON_SECRET}`) return new Response("Unauthorized", { status: 401 }); return Response.json({ ok: true }); }