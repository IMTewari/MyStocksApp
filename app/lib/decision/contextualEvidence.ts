export type ContextSource =
  | "GEO_POLITICS"
  | "MACRO"
  | "COMMODITY"
  | "POLICY"
  | "NEWS";

export type RiskBias =
  | "RISK_NEGATIVE"
  | "RISK_POSITIVE"
  | "NEUTRAL";

export interface ContextualEvidence {
  source: ContextSource;

  /** What happened (verifiable fact) */
  fact: string;

  /** Why this matters for markets */
  marketImplication: string;

  /** Directional bias on risk appetite */
  bias: RiskBias;

  /** Optional reference (URL, headline, or date tag) */
  reference?: string;
}
