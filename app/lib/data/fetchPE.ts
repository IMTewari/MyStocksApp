// app/lib/data/fetchPE.ts

export async function fetchPE(symbol: string): Promise<{
  pe: number | null;
  pe5yMedian: number | null;
}> {
  try {
    // Example: Screener-compatible API proxy you host yourself
    const res = await fetch(`/api/fundamentals/pe?symbol=${symbol}`);
    const data = await res.json();

    return {
      pe: data.pe ?? null,
      pe5yMedian: data.pe5yMedian ?? null,
    };
  } catch {
    return { pe: null, pe5yMedian: null };
  }
}
