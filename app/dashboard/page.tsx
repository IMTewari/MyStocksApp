
// app/dashboard/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { computeSignals } from "@/lib/signals";
import { CoachSummary } from "./Coach"; // <-- if you added the Coach.tsx component

type HoldingRow = {
  instrument_token: number;
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  average_price: number;
  last_price: number; // ✅ Fix A: make required number (no undefined)
};

export default function Dashboard() {
  const [rows, setRows] = useState<HoldingRow[]>([]);
  const [tips, setTips] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  // Load portfolio & normalize last_price
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/kite/portfolio");
        const p = await res.json();
        if (p.error) {
          setError("Not authenticated. Click 'Login with Zerodha' on home page.");
          return;
        }

        const list: HoldingRow[] = (p.holdings || []).map((h: any) => ({
          instrument_token: h.instrument_token,
          tradingsymbol: h.tradingsymbol,
          exchange: h.exchange,
          quantity: h.quantity,
          average_price: h.average_price,
          // ✅ Fix A: coerce undefined/NaN to 0
          last_price: Number.isFinite(h.last_price) ? Number(h.last_price) : 0,
        }));
        setRows(list);
      } catch (e: any) {
        setError(e?.message || "Failed to load portfolio");
      }
    })();
  }, []);

  // Snapshot LTP polling (simple & robust) — normalize to number
  useEffect(() => {
    if (!rows.length) return;

    const instruments = rows.map(r => `${r.exchange}:${r.tradingsymbol}`);
    const tick = async () => {
      try {
        const params = instruments.map(i => `i=${encodeURIComponent(i)}`).join("&");
        const ltp = await fetch(`/api/kite/ltp?${params}`).then(r => r.json());

        setRows(prev => prev.map(r => {
          const key = `${r.exchange}:${r.tradingsymbol}`;
          // ✅ Fix A: keep last_price numeric
          const priceCandidate = ltp[key]?.last_price;
          const price = Number.isFinite(priceCandidate) ? Number(priceCandidate) : r.last_price ?? 0;
          return { ...r, last_price: price };
        }));
      } catch (e) {
        // ignore one-off polling failures
      }
    };

    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [rows]);

  // Compute signals after loading candles
  useEffect(() => {
    (async () => {
      if (rows.length === 0) return;

      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 365);
      const fmt = (d: Date) => d.toISOString().split("T")[0];

      const enriched: any[] = [];
      for (const r of rows) {
        try {
          const url = `/api/kite/candles?token=${r.instrument_token}&interval=day&from=${fmt(from)}&to=${fmt(to)}`;
          const cd = await fetch(url).then(res => res.json());
          enriched.push({
            symbol: r.tradingsymbol,
            qty: r.quantity,
            avg: r.average_price,
            // ✅ Fix A: last_price is already guaranteed number
            ltp: r.last_price,
            candles: cd.candles || [],
          });
        } catch (e) {
          enriched.push({
            symbol: r.tradingsymbol,
            qty: r.quantity,
            avg: r.average_price,
            ltp: r.last_price,
            candles: [],
          });
        }
      }

      const s = computeSignals(enriched);
      setTips(s.tips);
      setFlags(s.flags);
    })();
  }, [rows]);

  const valuation = useMemo(
    () => rows.reduce((acc, r) => acc + r.last_price * r.quantity, 0),
    [rows]
  );

  const total = valuation; // for per-card allocation calculation

  return (
    <main>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Portfolio Coach</h1>

      {/* Optional: Portfolio summary coach panel */}
      <CoachSummary rows={rows} flags={flags} tips={tips} />

      <div style={{ marginBottom: 16, color: "#666" }}>
        Valuation: ₹{Math.round(valuation).toLocaleString()}
      </div>
      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r) => {
          const pnl = (r.last_price - r.average_price) * r.quantity;
          const value = r.last_price * r.quantity;
          const allocationPct = total ? Math.round((value / total) * 100) : 0;
          const f = flags[r.tradingsymbol] || [];
          const t = tips[r.tradingsymbol];

          return (
            <div key={r.tradingsymbol} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.tradingsymbol}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Qty {r.quantity} · Avg ₹{r.average_price} · Alloc {allocationPct}%
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 600 }}>LTP ₹{r.last_price.toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: pnl >= 0 ? "green" : "crimson" }}>
                    P&L ₹{pnl.toFixed(2)}
                  </div>
                </div>
              </div>

              {f.length > 0 && (
                <ul style={{ marginTop: 6, paddingLeft: 16, fontSize: 12 }}>
                  {f.map((x: any, i: number) => (
                    <li
                      key={i}
                      style={{
                        color: x.severity === "risk" ? "crimson" :
                               x.severity === "warn" ? "#b45309" : "#555"
                      }}
                    >
                      • {x.message}
                    </li>
                  ))}
                </ul>
              )}

              {t && (
                <div style={{ marginTop: 6, fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>Coach:</span> {t.action.toUpperCase()} — {t.reason} ({t.confidence})
                </div>
              )}

              {t && (
                <div style={{ marginTop: 4, fontSize: 12, color: "#555" }}>
                  Idea: Set GTT {t.action === "trim" || t.action === "exit" ? "stop" : "add"} near{" "}
                  <i>last swing {t.action === "trim" || t.action === "exit" ? "low" : "pullback to 5EMA"}</i>.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
