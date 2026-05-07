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

  /* ========= Load Portfolio ========= */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/kite/portfolio");
        const p = await res.json();

        if (p.error) {
          setError("Not authenticated. Login from home page.");
          return;
        }

        setRows(
          (p.holdings || []).map((h: any) => ({
            instrument_token: h.instrument_token,
            tradingsymbol: h.tradingsymbol,
            exchange: h.exchange,
            quantity: h.quantity,
            average_price: h.average_price,
            last_price: Number(h.last_price) || 0,
          }))
        );
        setError(null);
      } catch {
        setError("Failed to load portfolio.");
      }
    })();
  }, []);

  /* ========= Instruments ========= */
  const instruments = useMemo(
    () => rows.map(r => `${r.exchange}:${r.tradingsymbol}`),
    [rows]
  );

  /* ========= LTP Polling ========= */
  useEffect(() => {
    if (!instruments.length) return;

    const tick = async () => {
      try {
        const params = instruments.map(i => `i=${encodeURIComponent(i)}`).join("&");
        const ltp = await fetch(`/api/kite/ltp?${params}`).then(r => r.json());

