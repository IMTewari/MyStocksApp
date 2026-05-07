export interface AICommentaryParams {
  symbol: string;
  sector: string;
  context: string;
}

/**
 * AI commentary is EXPLAIN-ONLY.
 * It NEVER decides actions.
 * It only provides narrative context.
 */
export function generateAICommentary(
  params: AICommentaryParams
): string {
  return (
    `${params.symbol} is being influenced by ${params.context}. ` +
    `Sector-level dynamics in ${params.sector} are shaping near-term behavior, ` +
    `while longer-term outcomes depend on execution quality and macro stability.`
  );
}
