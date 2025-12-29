
"use client";

import React, { useMemo, useState } from "react";

/** ----------------------------- Types ----------------------------- */
type Candle = { date: string; open: number; high: number; low: number; close: number; volume: number };

type PositionRow = {
  symbol: string;
  price: number;
  currency?: string;
  s50: number;
  s200: number;
  rsi: number;
  atr: number;
  recStop: number;
  stopHit: boolean;
  news: { title: string; url: string; source?: string; sent?: number }[];
};

/** ----------------------------- Helpers ----------------------------- */

function parseTickers(input: string): string[] {
  const raw = (input || "").trim();
  if (!raw) return [];
  const lines = raw.includes(",") || raw.includes("\n") ? raw.split(/\n+/) : [raw];
  const syms = new Set<string>();
  for (const ln of lines) {
    const tokens = ln.split(/[,\s]+/).filter(Boolean);
    for (const t of tokens) {
      const sym = t.trim();
      if (/^[A-Za-z0-9._-]+$/.test(sym)) syms.add(sym.toUpperCase());
    }
  }
  return Array.from(syms);
}

function sma(vals: number[], p: number) {
  if (!vals || vals.length < p) return Number.NaN;
  let sum = 0;
  for (let i = vals.length - p; i < vals.length; i++) sum += vals[i];
  return sum / p;
}

function rsi14(closes: number[]) {
  if (!closes || closes.length < 15) return Number.NaN;
  const del = closes.map((c, i) => (i ? c - closes[i - 1] : 0));
  let up = 0,
    dn = 0,
    n = 14;
  for (let i = 1; i <= n; i++) {
    const d = del[i];
    if (d > 0) up += d;
    else dn -= d;
  }
  let rs = (up / n) / ((dn || 1) / n);
  let rsi = 100 - 100 / (1 + rs);
  for (let i = n + 1; i < closes.length; i++) {
    const d = del[i];
    const u = d > 0 ? d : 0;
    const v = d < 0 ? -d : 0;
    up = (up * (n - 1) + u) / n;
    dn = (dn * (n - 1) + v) / n;
    rs = up / (dn || 1);
    rsi = 100 - 100 / (1 + rs);
  }
  return rsi;
}

function atr14(c: Candle[]) {
  if (!c || c.length < 15) return Number.NaN;
  const tr: number[] = [];
  for (let i = 1; i < c.length; i++) {
    const prev = c[i - 1],
      cur = c[i];
    const ranges = [cur.high - cur.low, Math.abs(cur.high - prev.close), Math.abs(cur.low - prev.close)];
    tr.push(Math.max(...ranges));
  }
  const n = 14;
  let s = tr.slice(0, n).reduce((a, b) => a + b, 0) / n;
  for (let i = n; i < tr.length; i++) s = (s * (n - 1) + tr[i]) / n;
  return s;
}

function recStop(px: number, s50: number, s200: number, atr: number, cfg: { trailPct: number; atrMult: number }) {
  const trailing = px * (1 - cfg.trailPct / 100);
  const atrStop = isFinite(atr) ? px - cfg.atrMult * atr : trailing;
  const maStop = isFinite(s50) && px > s50 ? s50 * 0.98 : isFinite(s200) ? s200 * 0.98 : trailing;
  const uptrend = isFinite(s200) && px > s50 && s50 > s200;
  let rec = Math.max(trailing, atrStop, maStop);
  if (!uptrend) rec = Math.max(px * (1 - (cfg.trailPct * 1.5) / 100), atrStop);
  return rec;
}

async function fetchJSON<T = any>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status}: ${err || "request failed"}`);
  }
  return r.json() as Promise<T>;
}

/** ----------------------------- Page ----------------------------- */

export default function Home() {
  const [portfolioText, setPortfolioText] = useState<string>("RELAXO.NS\nTCS.NS\nHDFCBANK.NS");
  const [trailPct, setTrailPct] = useState<number>(12);
  const [atrMult, setAtrMult] = useState<number>(2.5);
  const [rows, setRows] = useState<PositionRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function buildRow(symbol: string): Promise<PositionRow | null> {
    // Fetch quote + history concurrently, then news
    try {
      const [q, h] = await Promise.all([
        fetchJSON<any>(`/api/quote?symbol=${encodeURIComponent(symbol)}`),
        fetchJSON<Candle[]>(`/api/history?symbol=${encodeURIComponent(symbol)}`),
      ]);

      if (!q || q.error) {
        console.warn("quote failed", symbol, q?.error);
        return null;
      }
      if (!h || !Array.isArray(h) || h.length === 0) {
        console.warn("history empty", symbol);
        return null;
      }

      const closes = h.map((x) => x.close);
      const s50 = sma(closes, 50);
      const s200 = sma(closes, 200);
      const rsi = rsi14(closes);
      const atr = atr14(h);
      const rec = recStop(q.regularMarketPrice, s50, s200, atr, { trailPct, atrMult });
      const stopHit = q.regularMarketPrice <= rec;

      const name = q?.longName || symbol.replace(/\.NS|\.BO/i, "");
      let news: any[] = [];
      try {
        news = await fetchJSON<any[]>(`/api/news?q=${encodeURIComponent(symbol)}&name=${encodeURIComponent(name)}`);
      } catch (e) {
        console.warn("news failed", symbol, e);
      }

      return {
        symbol,
        price: q.regularMarketPrice,
        currency: q.currency,
        s50,
        s200,
        rsi,
        atr,
        recStop: rec,
        stopHit,
        news,
      };
    } catch (err) {
      console.warn("buildRow error", symbol, err);
      return null;
    }
  }

  async function run() {
    setLoading(true);
    setErrorMsg("");
    setRows([]);
    try {
      const symbols = parseTickers(portfolioText);
      if (symbols.length === 0) {
        setErrorMsg("Please paste at least one ticker (e.g., RELAXO.NS, TCS.NS).");
        return;
      }

      const results = await Promise.allSettled(symbols.map((sym) => buildRow(sym)));
      const ok = results
        .map((r) => (r.status === "fulfilled" ? r.value : null))
        .filter((x): x is PositionRow => !!x);

      if (ok.length === 0) {
        setErrorMsg("No data fetched. Check tickers or try again in a minute.");
      } else {
        setRows(ok);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const rowsUI = useMemo(
    () =>
      rows.map((d) => (
        <div key={d.symbol} className="card">
          <div style={{ color: d.stopHit ? "#c00" : "inherit", fontWeight: d.stopHit ? 700 : 500 }}>
            {d.symbol} — Px {isFinite(d.price) ? d.price.toFixed(2) : "—"} {d.currency || ""}
            {" · "}RSI {isFinite(d.rsi) ? d.rsi.toFixed(1) : "—"}
            {" · "}ATR {isFinite(d.atr) ? d.atr.toFixed(2) : "—"}
            {" · "}RecStop <b>{isFinite(d.recStop) ? d.recStop.toFixed(2) : "—"}</b> {d.stopHit && <span>⚠ Stop loss triggered</span>}
          </div>
          {!!d.news?.length && (
            <div className="mt-2">
              <b>Headlines:</b>
              <ul>
                {d.news.slice(0, 5).map((n) => (
                  <li key={n.url}>
                    [{n.sent > 0 ? "+" : n.sent < 0 ? "−" : "0"}]{" "}
                    <a href={n.url} target="_blank" rel="noreferrer">
                      {n.title}
                    </a>{" "}
                    <i>({n.source || "News"})</i>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )),
    [rows]
  );

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <h1>India Portfolio Coach — Web</h1>
      <p>
        Paste tickers (e.g., <code>RELAXO.NS</code>, <code>TCS.NS</code>) then <b>Run</b>. Use <code>.NS</code> for NSE and{" "}
        <code>.BO</code> for BSE tickers.
      </p>

      <textarea
        value={portfolioText}
        onChange={(e) => setPortfolioText(e.target.value)}
        rows={6}
        style={{ width: "100%", fontFamily: "monospace" }}
        placeholder={"RELAXO.NS\nTCS.NS\nHDFCBANK.NS"}
      />

      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        <label>
          Trailing %{" "}
          <input
            type="number"
            value={trailPct}
            onChange={(e) => setTrailPct(parseFloat(e.target.value))}
            style={{ width: 80 }}
            min={1}
            step={0.5}
          />
        </label>
        <label>
          ATR ×{" "}
          <input
            type="number"
            step={0.1}
            value={atrMult}
            onChange={(e) => setAtrMult(parseFloat(e.target.value))}
            style={{ width: 80 }}
            min={0.5}
          />
        </label>
      </div>

      <button onClick={run} disabled={loading} className="btn">
        {loading ? "Running…" : "Run"}
      </button>

      {errorMsg && <div className="err">{errorMsg}</div>}

      <div className="mt-6">{rowsUI}</div>

      <style jsx>{`
        .btn {
          margin-top: 12px;
          padding: 8px 14px;
          border: 1px solid #d0d0d0;
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
        }
        .btn:disabled {
          cursor: default;
          opacity: 0.6;
        }
        .card {
          background: #fff;
          border: 1px solid #e7e7e7;
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
        }
        ul {
          margin: 6px 0 0 18px;
        }
        .err {
          margin-top: 12px;
          padding: 8px 12px;
          border: 1px solid #eaa;
          background: #ffecec;
          color: #a00;
          border-radius: 6px;
        }
      `}</style>
    </main>
  );
}
