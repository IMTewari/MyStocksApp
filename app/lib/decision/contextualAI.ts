import { ContextualEvidence } from "./contextualEvidence";

/**
 * AI is allowed to populate ONLY factual context.
 * It must NOT infer price impact or replace evidence.
 */
export async function fetchContextualEvidence(
  symbol: string
): Promise<ContextualEvidence[]> {

  // This will be replaced by real news ingestion / RAG.
  // The examples below show STRUCTURE, not placeholders.

  if (symbol === "SML100CASE") {
    return [
      {
        source: "GEO_POLITICS",
        fact:
          "Escalation of conflict in the Middle East has disrupted shipping routes",
        marketImplication:
          "Increased oil volatility and global risk aversion",
        bias: "RISK_NEGATIVE",
        reference: "Gulf shipping tensions – Dec 2025",
      },
    ];
  }

  if (symbol === "INFY") {
    return [
      {
        source: "MACRO",
        fact:
          "US Federal Reserve signaled rates may remain elevated for longer",
        marketImplication:
          "IT spending visibility weakens due to delayed enterprise capex",
        bias: "RISK_NEGATIVE",
        reference: "FOMC commentary – Dec 2025",
      },
    ];
  }

  return [];
}
