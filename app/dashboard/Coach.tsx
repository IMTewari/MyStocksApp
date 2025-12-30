
// app/dashboard/Coach.tsx
"use client";
export function CoachSummary({
  rows,
  flags,
  tips
}: {
  rows: Array<{ tradingsymbol:string; quantity:number; average_price:number; last_price:number }>;
  flags: Record<string, any[]>;
  tips: Record<string, { action:string; reason:string; confidence:string }>;
}) {
  const total = rows.reduce((s, r) => s + (r.last_price ?? 0) * r.quantity, 0);
  const alloc = rows
    .map(r => ({ sym: r.tradingsymbol, value: (r.last_price ?? 0) * r.quantity }))
    .sort((a,b) => b.value - a.value);

  const top = alloc.slice(0,3);
  const riskCount = Object.values(flags).flat().filter(f => f.severity === "risk").length;

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontWeight:600, fontSize:16 }}>Portfolio Summary</div>
          <div style={{ fontSize:13, color:'#555' }}>Valuation: ₹{Math.round(total).toLocaleString()}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:13 }}>Risk flags: <b>{riskCount}</b></div>
          {top.length > 0 && (
            <div style={{ fontSize:13, color:'#555' }}>
              Top weights: {top.map(t => `${t.sym} ${(t.value/Math.max(total,1))*100|0}%`).join(' · ')}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop:8 }}>
        <div style={{ fontWeight:600, fontSize:14 }}>Next actions</div>
        <ul style={{ marginTop:6, paddingLeft:18, fontSize:13 }}>
          {Object.entries(tips).map(([sym, t]) => (
            <li key={sym}>
              <b>{sym}</b>: {t.action.toUpperCase()} — {t.reason} ({t.confidence})
            </li>
          ))}
          {Object.keys(tips).length === 0 && <li>No actions yet — awaiting historical data.</li>}
        </ul>
      </div>
    </section>
  );
}
