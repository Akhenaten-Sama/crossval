export function dollarsToCents(value: number): number {
  return Math.round(value * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(cents / 100);
}

export function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
