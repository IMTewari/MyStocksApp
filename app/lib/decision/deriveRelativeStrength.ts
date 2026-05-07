export function relativeStrength(
  stockCloses: number[],
  indexCloses: number[]
): number {
  if (stockCloses.length < 200 || indexCloses.length < 200) return 0;

  const stockRet =
    stockCloses[stockCloses.length - 1] /
    stockCloses[stockCloses.length - 200];

  const indexRet =
    indexCloses[indexCloses.length - 1] /
    indexCloses[indexCloses.length - 200];

  return stockRet - indexRet;
}
