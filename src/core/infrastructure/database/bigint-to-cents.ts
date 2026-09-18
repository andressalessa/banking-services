export function bigintToCents(value: bigint): number {
  const cents = Number(value);

  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error(`Monetary amount is outside the safe integer range: ${value}`);
  }

  return cents;
}
