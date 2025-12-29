"use client";
import React, { useMemo, useState } from "react";

type Candle = { date: string; open:number; high:number; low:number; close:number; volume:number };

function parseSimple(input: string): string[] {
  const raw = input.trim();
  if (!raw) return [];
  const lines = raw.includes(",") || raw.includes("\n") ? raw.split(/\n+/) : [raw];
  const syms = new Set<string>();
  for (const ln of lines) {
    const tokens = ln.split(/[\,\s]+/).filter(Boolean);
    for (const t of tokens) if (/^[A-Z0-9_.-]+$/i.test(t)) syms.add(t.toUpperCase());
  }
  return Array.from(syms);
}

function sma(vals:number[], p:number){ if(vals.length<p) return Number.NaN; return vals.slice(-p).reduce((a,b)=>a+b,0)/p; }
function rsi14(closes:number[]){
  if (closes.length<15) return Number.NaN;
  const del = closes.map((c,i)=> i? c - closes[i-1] : 0);
  let up=0, dn=0, n=14;
  for (let i=1;i<=n;i++){ const d=del[i]; if(d>0) up+=d; else dn-=d; }
  let rs = (up/n) / ((dn||1)/n);
  let rsi = 100 - (100/(1+rs));
  for (let i=n+1;i<closes.length;i++){
    const d = del[i]; const u = d>0? d:0; const v = d<0? -d:0;
    up = (up*(n-1)+u)/n; dn = (dn*(n-1)+v)/n; rs = up/(dn||1); rsi = 100 - 100/(1+rs);
  }
  return rsi;
}
function atr14(c: Candle[]) {
  if (c.length<15) return Number.NaN;
  const tr:number[]=[];
  for (let i=1;i<c.length;i++){
    const prev=c[i-1], cur=c[i];
    const ranges=[cur.high-cur.low, Math.abs(cur.high-prev.close), Math.abs(cur.low-prev.close)];
    tr.push(Math.max(...ranges));
  }
  const n=14; let s=tr.slice(0,n).reduce((a,b)=>a+b,0)/n;
  for(let i=n;i<tr.length;i++){ s=(s*(n-1)+tr[i])/n; }
  return s;
}
function recStop(px:number, s50:number, s200:number, atr:number, cfg:{trailPct:number, atrMult:number}) {
  const trailing = px*(1-cfg.trailPct/100);
  const atrStop = isFinite(atr)? px - cfg.atrMult*atr : trailing;
  const maStop = isFinite(s50)&&px>s50? s50*0.98 : isFinite(s200)? s200*0.98 : trailing;
  const uptrend = isFinite(s200) && px>s50 && s50>s200;
  let rec = Math.max(trailing, atrStop, maStop);
  if(!uptrend) rec = Math.max(px*(1-(cfg.trailPct*1.5)/100), atrStop);
  return rec;
}

export default function Home(){
  const [portfolioText,setPortfolioText]=useState<string>("RELAXO.NS\nTCS.NS\nHDFCBANK.NS");
  const [trailPct,setTrailPct]=useState(12);
  const [atrMult,setAtrMult]=useState(2.5);
  const [data,setData]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);

  
async function run() {
  setLoading(true);
  setData([]);
  try {
    const symbols = parseSimple(portfolioText);
    // Fetch each symbol sequentially but safely (or use Promise.allSettled for speed)
    const out: any[] = [];
    for (const sym of symbols) {
      try {
        const q = await fetch(`/api/quote?symbol=${encodeURIComponent(sym)}`).then(r => r.json());
        // If quote failed, skip this symbol gracefully
        if (!q || q.error) { console.warn("quote failed", sym, q?.error); continue; }

        const h = await fetch(`/api/history?symbol=${encodeURIComponent(sym)}`).then(r => r.json());
        if (!h || !Array.isArray(h) || h.length === 0) { console.warn("history empty", sym); continue; }

        const closes = h.map((x: any) => x.close);
        const s50 = sma(closes, 50), s200 = sma(closes, 200), rsi = rsi14(closes);
        const atr = (function(c: any[]) {
          // compute ATR from history output
          if (c.length < 15) return Number.NaN;
          const tr: number[] = [];
          for (let i = 1; i < c.length; i++) {
            const prev = c[i - 1], cur = c[i];
            const ranges = [cur.high - cur.low, Math.abs(cur.high - prev.close), Math.abs(cur.low - prev.close)];
            tr.push(Math.max(...ranges));
          }
          const n = 14; let s = tr.slice(0, n).reduce((a, b) => a + b, 0) / n;
          for (let i = n; i < tr.length; i++) s = (s * (n - 1) + tr[i]) / n;
          return s;
        })(h);

        const rec = recStop(q.regularMarketPrice, s50, s200, atr, { trailPct, atrMult });
        const stopHit = q.regularMarketPrice <= rec;
        const name = q?.longName || sym.replace(/\.NS|\.BO/, "");
        let news: any[] = [];
        try {
          news = await fetch(`/api/news?q=${encodeURIComponent(sym)}&name=${encodeURIComponent(name)}`).then(r => r.json());
        } catch (e) {
          console.warn("news failed", sym, e);
        }
        out.push({ symbol: sym, price: q.regularMarketPrice, currency: q.currency, s50, s200, rsi, atr, recStop: rec, stopHit, news });
      } catch (err) {
        console.warn("symbol failed", sym, err);
        // continue processing other symbols
      }
    }
    setData(out);
  } catch (err) {
    console.error("run() failed", err);
  } finally {
    setLoading(false);
  }
}


  const rowsUI = useMemo(()=>data.map(d=>(
    <div key={d.symbol} className="card">
      <div style={{color: d.stopHit? "#c00":"inherit", fontWeight: d.stopHit? 700:500}}>
        {d.symbol} — Px {d.price} {d.currency} · RSI {isFinite(d.rsi)? d.rsi.toFixed(1):"—"} · ATR {isFinite(d.atr)? d.atr.toFixed(2): "—"} ·
        RecStop <b>{isFinite(d.recStop)? d.recStop.toFixed(2):"—"}</b> {d.stopHit && <span>⚠ Stop loss triggered</span>}
      </div>
      <div className="mt-2">
        <b>Headlines:</b>
        <ul>
          {d.news?.slice(0,5).map((n:any)=> (
            <li key={n.url}>[{n.sent>0?"+":n.sent<0?"−":"0"}] <a href={n.url} target="_blank">{n.title}</a> <i>({n.source})</i></li>
          ))}
        </ul>
      </div>
    </div>
  )),[data]);

  return (
    <main style={{maxWidth:900, margin:"40px auto", padding:"0 16px"}}>
      <h1>India Portfolio Coach — Web</h1>
      <p>Paste tickers (e.g., RELAXO.NS, TCS.NS) then “Run”. Use <code>.NS</code> for NSE and <code>.BO</code> for BSE tickers.</p>
      <textarea value={portfolioText} onChange={e=>setPortfolioText(e.target.value)} rows={6} style={{width:"100%"}} />
      <div style={{display:'flex', gap:16, marginTop:8}}>
        <label>Trailing % <input type="number" value={trailPct} onChange={e=>setTrailPct(parseFloat(e.target.value))} style={{width:80}}/></label>
        <label>ATR × <input type="number" step="0.1" value={atrMult} onChange={e=>setAtrMult(parseFloat(e.target.value))} style={{width:80}}/></label>
      </div>
      <button onClick={run} disabled={loading} style={{marginTop:12, padding:"8px 14px"}}>{loading?"Running…":"Run"}</button>
      <div className="mt-6">{rowsUI}</div>
      <style jsx>{`
        .card{background:#fff;border:1px solid #e7e7e7;border-radius:8px;padding:12px;margin-top:12px}
        ul{margin:6px 0 0 18px}
      `}</style>
    </main>
  );
}
