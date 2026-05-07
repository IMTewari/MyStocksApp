"use client";

import { useState } from "react";
import { ScriptInsight } from "@/app/lib/decision/decisionEngine";

interface Props {
  insight: ScriptInsight;
}

export default function ScriptDecisionCard({ insight }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
      }}
    >
      {/* One-word summary */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        <span>{insight.symbol}</span>
        <span>{insight.finalAction}</span>
      </div>

      {open && (
        <div style={{ marginTop: 10, fontSize: 14 }}>
          <Section
            title="Technical Analysis"
            decision={insight.technical.decision}
            reason={insight.technical.reason}
          />

          <Section
            title="Fundamental Analysis"
            decision={insight.fundamental.decision}
            reason={insight.fundamental.reason}
          />

          <Section
            title="Market / Geopolitics"
            decision={insight.market.decision}
            reason={insight.market.reason}
          />

          <div style={{ marginTop: 8 }}>
            <strong>AI Commentary:</strong>
            <div>{insight.aiCommentary}</div>
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Overall Rationale:</strong>
            <div>{insight.finalRationale}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  decision,
  reason,
}: {
  title: string;
  decision: string;
  reason: string;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <strong>
        {title} → {decision}
      </strong>
      <div>{reason}</div>
    </div>
  );
}
