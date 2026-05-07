"use client";

import { useEffect, useMemo, useState } from "react";
import { computeSignals } from "@/lib/signals";
import { CoachSummary } from "./Coach";
import { enforceDataContract } from "@/app/lib/portfolio/dataGuard";

type HoldingRow = {
  instrument_token: number;
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  average_price: number;
  last_price: number;
};

export default function Dashboard() {
  const [rows, setRows] = useState<HoldingRow[]>([]);
  const [tips, setTips] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  /* ===============================
     Load portfolio holdings
     =============================== */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/kite/portfolio");
        const p = await res.json();

        if (p.error) {
          setError(
            "Not authenticated. Click 'Login with Zerodha' on home page."
          );
          return;
        }

        const list: HoldingRow[] = (p.holdings || []).map((h: any) => ({
          instrument_token: h.instrument_token,
          tradingsymbol: h.tradingsymbol,
          exchange: h.exchange,
          quantity: h.quantity,
          average_price: h.average_price,
          last_price: Number.isFinite(h.last_price)
            ? Number(h.last_price)
            : 0,
        }));

        setRows(list);
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Failed to load portfolio");
      }
    })();
  }, []);

  /* ===============================
     Stable instrument list
     =============================== */
  const instruments = useMemo(
    () =>
      rows
        .map((r) => `${r.exchange}:${r.tradingsymbol}`)
        .sort(),
    [rows]
  );

  /* ===============================
     LTP polling (prices only)
     =============================== */
  useEffect(() => {
    if (!instruments.length) return;

    const tick = async () => {
      try {
        const params = instruments
          .map((i) => `i=${encodeURIComponent(i)}`)
          .join("&");

        const ltp = await fetch(`/api/kite/ltp?${params}`).then((r) =>
          r.json()
        );

        setRows((prev) =>
          prev.map((r) => {
            const key = `${r.exchange}:${r.tradingsymbol}`;
            const px = ltp[key]?.last_price;
            return {
              ...r,
              last_price: Number.isFinite(px) ? Number(px) : r.last_price,
            };
          })
        );
      } catch {
        // silent
      }
    };

    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [instruments]);

  /* ===============================
     Signal computation (guarded)
     =============================== */
  useEffect(() => {
    (async () => {
      if (!rows.length) return;

      const enriched: any[] = [];

      for (const r of rows) {
        try {
          const url = `/api/data/ohlc?symbol=${encodeURIComponent(
            r.tradingsymbol
          )}&exchange=${encodeURIComponent(r.exchange)}&days=900`;

          const cd = await fetch(url).then((res) => res.json());

          const safeCandles = enforceDataContract(
            r.tradingsymbol,
            cd.candles || []
          );

          enriched.push({
            symbol: r.tradingsymbol,
            qty: r.quantity,
            avg: r.average_price,
            ltp: r.last_price,
            candles: safeCandles,
          });
        } catch (err) {
          console.error(
            "Skipping symbol due to data error:",
            r.tradingsymbol,
            err
          );
        }
      }

      const s = computeSignals(enriched);
      setTips(s.tips);
      setFlags(s.flags);
    })();
  }, [rows.map((r) => r.tradingsymbol).join("|")]);

  /* ===============================
     Derived values
     =============================== */
  const valuation = useMemo(
    () =>
      rows.reduce(
        (acc, r) => acc + r.last_price * r.quantity,
        0
      ),
    [rows]
  );

  return (
    <main>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
        Portfolio Coach
      </h1>

      <CoachSummary rows={rows} flags={flags} tips={tips} />

      <div style={{ marginBottom: 16, color: "#666" }}>
        Valuation: ₹{Math.round(valuation).toLocaleString()}
      </div>

      {error && (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          {error}
        </div>
      )}
    </main>
  );
}
