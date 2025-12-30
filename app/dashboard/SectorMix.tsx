
"use client";

import * as React from "react";

export type SectorSlice = {
  sector: string;
  pct: number | string; // allows string input; we coerce safely
  color?: string;       // optional bar color
};

type SectorMixProps = {
  data: SectorSlice[];
  concentrationThreshold?: number; // percent threshold, default 35
  className?: string;
  title?: string;
};

/**
 * SectorMix
 * Renders a simple sector weight list with bars and highlights positions
 * above the concentration threshold.
 *
 * - Avoids HTML entity escapes; uses proper JSX.
 * - Coerces inputs to numbers to prevent string comparison bugs.
 * - Emits accessible "meter" semantics for the bar.
 */
export default function SectorMix({
  data,
  concentrationThreshold = 35,
  className,
  title = "Sector mix",
}: SectorMixProps) {
  const safeThreshold = Number(concentrationThreshold);

  return (
    <div className={className}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>

      <div style={{ display: "grid", gap: 8 }}>
        {data.map((s) => {
          const pct = Number(s.pct);
          const pctClamped = Number.isFinite(pct)
            ? Math.min(Math.max(pct, 0), 100)
            : 0;
          const risky = pctClamped > safeThreshold;

          return (
            <div
              key={s.sector}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(140px, 220px) 1fr 120px",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Left: sector label + color swatch */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  aria-hidden
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: s.color ?? "#8884d8",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: 14 }}>{s.sector}</span>
              </div>

              {/* Middle: bar meter */}
              <div
                role="meter"
                aria-valuenow={pctClamped}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${s.sector} weight`}
                title={`${pctClamped.toFixed(1)}%`}
                style={{
                  height: 8,
                  background: "#eee",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pctClamped}%`,
                    height: "100%",
                    background: risky ? "crimson" : "#4caf50",
                    transition: "width 300ms ease",
                  }}
                />
              </div>

              {/* Right: percentage and risk note */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14 }}>{pctClamped.toFixed(1)}%</div>
                {risky && (
                  <div style={{ fontSize: 12, color: "crimson" }}>
                    {`Concentration risk: sector > ${safeThreshold}%`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
