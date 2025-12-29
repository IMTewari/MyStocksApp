
// app/api/news/route.ts
import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime for server-side fetch & regex
export const runtime = "nodejs";

// ---------------- Bing News ----------------
async function bingNews(q: string) {
  const key = process.env.BING_NEWS_KEY;
  if (!key || key === "NA") return [];
  const url = new URL("https://api.bing.microsoft.com/v7.0/news/search");
  url.searchParams.set("q", q);
  url.searchParams.set("mkt", "en-IN");
  url.searchParams.set("count", "20");
  const r = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": key } });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.value || []).map((v: any) => ({
    title: v.name,
    url: v.url,
    published: v.datePublished,
    source: (v.provider || [{}])[0].name || "Bing",
    sent: 0,
  }));
}

// ---------------- Google RSS ----------------
// NOTE: Use real <tag> tokens; no HTML entities.
async function googleRSS(q: string) {
  const rssURL = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const r = await fetch(rssURL);
  if (!r.ok) return [];

  const xml = await r.text();

  // Robust multi-line regex: item/title/link/pubDate groups
  const re =
    /<item>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<pubDate>([^<]+)<\/pubDate>/g;

  const items: any[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    items.push({
      title: m[1],
      url: m[2],
      published: m[3],
      source: "Google RSS",
      sent: 0,
    });
  }
  return items;
}

// ---------------- BSE via RSS filter ----------------
async function bseAnnouncements(company: string) {
  if (!company) return [];
  const base = await googleRSS(`${company} site:bseindia.com`);
  return base.map((x) => ({ ...x, source: "BSE (via RSS)" }));
}

// ---------------- Quick headline sentiment ----------------
function quickSent(s: string) {
  const pos = ["upgrade", "beat", "growth", "order", "approval", "capex", "acquisition", "guidance", "raise"];
  const neg = ["downgrade", "miss", "warning", "fraud", "penalty", "strike", "fire", "slowdown", "ban", "raid"];
  const t = (s || "").toLowerCase();
  return pos.some((w) => t.includes(w)) ? 1 : neg.some((w) => t.includes(w)) ? -1 : 0;
}

// ---------------- Route handler ----------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const name = searchParams.get("name") || "";

  // Always include BSE + Google; add Bing if key is valid
  const [bse, gr, bing] = await Promise.all([
    bseAnnouncements(name),
    googleRSS(q || name),
    bingNews(q || name),
  ]);

  const combined = [...bse, ...gr, ...bing]
    .filter((x, i, a) => a.findIndex((y) => y.url === x.url) === i)
    .map((x) => ({ ...x, sent: quickSent(x.title) }))
    .slice(0, 25);

  return NextResponse.json(combined);
}
