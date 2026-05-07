// app/components/ScriptDecisionCard.tsx

"use client";

import { useState } from "react";
import { ScriptInsight } from "@/app/lib/decision/decisionEngine";

interface Props {
  insight: ScriptInsight;
}

/**
 * Displays one script with:
 * - one-word final action
 * - expandable detailed reasoning
 * - separate External Risk Factors section
 */
export default function ScriptDecisionCard({ insight }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        background: "#fff",
      }}
    >
      {/* Collapsed header */}
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
        <span>
          {insight.finalAction} ({insight.finalConfidence}%)
        </span>
      </div>

      {/* Expanded view */}
      {open && (
        <div style={{ marginTop: 12, fontSize: 14 }}>
          <Section title="Technical Analysis" outcome={insight.technical} />
          <Section title="Fundamental Analysis" outcome={insight.fundamental} />
          <Section title="Market Context" outcome={insight.market} />

          {insight.contextualEvidence.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <strong>External Risk Factors</strong>
              <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                {insight.contextualEvidence.map((e, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    <div>
                      <b>{e.source}</b>: {e.fact}
                    </div>
                    <div style={{ color: "#555", fontSize: 13 }}>
                      Impact: {e.marketImplication}
                    </div>
                    {e.reference && (
                      <div style={{ fontSize: 12, color: "#777" }}>
                        Ref: {e.reference}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <strong>AI Commentary</strong>
            <div>{insight.aiCommentary}</div>
          </div>

          <div style={{ marginTop: 10 }}>
            <strong>Overall Rationale</strong>
            <div>{insight.finalRationale}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  outcome,
}: {
  title: string;
  outcome: { decision: string; reason: string; confidence: number };
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <strong>
        {title} → {outcome.decision} ({outcome.confidence}%)
      </strong>
      <div>{outcome.reason}</div>
    </div>
  );
}
``
