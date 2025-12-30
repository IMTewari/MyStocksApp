
export function ema(values: number[], period: number) {
  const k = 2 / (period + 1);
  let emaPrev = values[0];
  return values.map((v, i) => (i === 0 ? v : (v - emaPrev) * k + emaPrev));
}

export function rsi(values: number[], period = 14) {
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const ch = values[i] - values[i - 1];
    if (ch >= 0) gains += ch; else losses -= ch;
  }
  let rs = gains / Math.max(1e-9, losses);
  const out = Array(values.length).fill(NaN);
  out[period] = 100 - 100 / (1 + rs);
  for (let i = period + 1; i < values.length; i++) {
    const ch = values[i] - values[i - 1];
    const gain = Math.max(0, ch), loss = Math.max(0, -ch);
    gains = (gains * (period - 1) + gain) / period;
    losses = (losses * (period - 1) + loss) / period;
    rs = gains / Math.max(1e-9, losses);
    out[i] = 100 - 100 / (1 + rs);
  }
  return out;
}
