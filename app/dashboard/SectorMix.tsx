
"use client";
import { useEffect, useMemo, useState } from "react";

type Row = { tradingsymbol: string; exchange: string; quantity: number; last_price: number };

type SectorInfo = { sector: string | null; industry: string | null };

export function SectorMix({ rows }: { rows: Row[] }) {
  const [map, setMap] = useState<Record<string, SectorInfo>>({});

  useEffect(() => {
    (async () => {
      const uniq = Array.from(new Set(rows.map(r => `${r.exchange}:${r.tradingsymbol}`)));
      const next: Record<string, SectorInfo> = {};
      for (const key of uniq) {
        const [exchange, symbol] = key.split(":");
        try {
          const res = await fetch(`/api/data/sector?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}`);
          const j = await res.json();
          next[key] = { sector: j.sector || null, industry: j.industry || null };
        } catch {
          next[key] = { sector: null, industry: null };
        }
      }
      setMap(next);
    })();
  }, [rows]);

  const totalValue = useMemo(() => rows.reduce((s, r) => s + r.last_price * r.quantity, 0), [rows]);

  const bySector = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of rows) {
      const key = `${r.exchange}:${r.tradingsymbol}`;
      const sector = map[key]?.sector || "Unknown";
      acc[sector] = (acc[sector] || 0) + r.last_price * r.quantity;
    }
    const list = Object.entries(acc).map(([sector, value]) => ({ sector, value, pct: totalValue ? (value / totalValue) * 100 : 0 }));
    return list.sort((a,b) => b.value - a.value);
  }, [rows, map, totalValue]);

  const concentrationThreshold = 35; // % per sector

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 16 }}>Sector Mix</div>
      <div style={{ fontSize: 12, color: '#666' }}>Computed from holdings valuation (Qty × LTP) and Yahoo sector labels.</div>

      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bySector.map((s) => (
          <div key={s.sector} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{s.sector}</div>
              <div style={{ fontSize: 12, color: '#666' }}>₹{Math.round(s.value).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14 }}>{s.pct.toFixed(1)}%</div>
              {s.pct > concentrationThreshold && (
                <div style={{ fontSize: 12, color: 'crimson' }}>Concentration risk: sector > {concentrationThreshold}%</div>
              )}
            </div>
          </div>
        ))}
        {bySector.length === 0 && (
          <div style={{ fontSize: 13 }}>No sector data yet. It will appear after lookup completes.</div>
        )}
      </div>
    </section>
  );
}
