// app/lib/decision/technicalIndicators.ts

export function ema(values: number[], period: number): number[] {
  if (values.length < period) return [];

  const k = 2 / (period + 1);
  let emaPrev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const result: number[] = [emaPrev];

  for (let i = period; i < values.length; i++) {
    const emaCurr = values[i] * k + emaPrev * (1 - k);
    result.push(emaCurr);
    emaPrev = emaCurr;
  }

  return result;
}

export function rsi(values: number[], period = 14): number[] {
  if (values.length <= period) return [];

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let rs = gains / (losses || 1);
  let rsiVal = 100 - 100 / (1 + rs);

  const out = [rsiVal];

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    gains = diff > 0 ? diff : 0;
    losses = diff < 0 ? -diff : 0;

    rs = ((out[out.length - 1] / 100) * gains) /
         ((1 - out[out.length - 1] / 100) * losses || 1);

    rsiVal = 100 - 100 / (1 + rs);
    out.push(rsiVal);
  }

  return out;
}
