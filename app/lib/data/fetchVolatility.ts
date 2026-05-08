// app/lib/data/fetchVolatility.ts

export async function fetchVix(): Promise<number | null> {
  try {
    const res = await fetch(`/api/market/vix`);
    const data = await res.json();
    return typeof data.vix === "number" ? data.vix : null;
  } catch {
    return null;
  }
}
