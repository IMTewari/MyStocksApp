export function generateAICommentary(params: {
  symbol: string in ${params.sector} are driving near-term behaviour,   symbol: string;
while longer-term outcomes depend on execution and macro stability.`;
}
  sector: string;
  context: string;
}) {
  return `${params.symbol} is influenced by ${params.context}. 
