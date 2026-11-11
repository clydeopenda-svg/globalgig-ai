// Formatting helpers shared by server and client code.

export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatUsd(dollars: number): string {
  return formatMoney(Math.round(dollars * 100));
}

/** SQLite datetime('now') is UTC without a zone marker; tell Date that explicitly. */
export function parseDbDate(value: string): Date {
  return new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
}

export function formatDate(value: string): string {
  return parseDbDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string): string {
  return parseDbDate(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Splits a total into milestone amounts by percentage. Rounding errors are
 * absorbed by the last milestone so the parts always add up to the total
 * exactly — important because each part becomes a real PayPal charge.
 */
export function splitByPercent(totalCents: number, percents: number[]): number[] {
  const parts = percents.map((p) => Math.floor((totalCents * p) / 100));
  const used = parts.reduce((a, b) => a + b, 0);
  if (parts.length > 0) parts[parts.length - 1] += totalCents - used;
  return parts;
}

/** Scales percentages so they total exactly 100 (AI output can drift to 99 or 101). */
export function normalisePercents(percents: number[]): number[] {
  if (percents.length === 0) return [];
  const safe = percents.map((p) => Math.max(1, Math.round(p)));
  const sum = safe.reduce((a, b) => a + b, 0);
  const scaled = safe.map((p) => Math.max(1, Math.round((p / sum) * 100)));
  const drift = 100 - scaled.reduce((a, b) => a + b, 0);
  // Put any leftover on the largest milestone, where it matters least.
  const largest = scaled.indexOf(Math.max(...scaled));
  scaled[largest] += drift;
  return scaled;
}
