"use client";

import { formatUsd } from "@/lib/format";
import { inputClass } from "@/components/ui/primitives";

export type Tier = "minimum" | "recommended" | "premium" | "custom";

const TIERS: { key: Exclude<Tier, "custom">; label: string; note: string }[] = [
  { key: "minimum", label: "Minimum", note: "Lean scope, lowest you should accept" },
  { key: "recommended", label: "Recommended", note: "Fair price for the scope as described" },
  { key: "premium", label: "Premium", note: "Faster delivery or extended support" },
];

// Three AI price points plus a custom option. The selected value becomes the
// project price that milestones (and PayPal payments) are calculated from.
export function PricingTiers({
  prices,
  tier,
  customPrice,
  onTier,
  onCustomPrice,
}: {
  prices: { minimum: number; recommended: number; premium: number };
  tier: Tier;
  customPrice: string;
  onTier: (t: Tier) => void;
  onCustomPrice: (v: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Project price" className="grid gap-2 sm:grid-cols-4">
      {TIERS.map((t) => {
        const selected = tier === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onTier(t.key)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              selected ? "border-brand bg-mint/70 ring-1 ring-brand" : "border-line bg-surface hover:border-line-strong"
            }`}
          >
            <span className="flex items-center justify-between text-[12px] font-medium text-muted">
              {t.label}
              {t.key === "recommended" && <span className="text-brand">AI pick</span>}
            </span>
            <span className={`mt-1 block text-xl font-semibold tracking-[-0.02em] ${selected ? "text-brand" : "text-ink"}`}>
              {formatUsd(prices[t.key])}
            </span>
            <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">{t.note}</span>
          </button>
        );
      })}
      <div
        className={`rounded-lg border p-3 transition-colors ${tier === "custom" ? "border-brand bg-mint/70 ring-1 ring-brand" : "border-line bg-surface"}`}
      >
        <label htmlFor="custom-price" className="text-[12px] font-medium text-muted">Custom (USD)</label>
        <input
          id="custom-price"
          inputMode="decimal"
          placeholder={String(prices.recommended)}
          className={`${inputClass} mt-1 font-mono`}
          value={customPrice}
          onFocus={() => onTier("custom")}
          onChange={(e) => {
            onTier("custom");
            onCustomPrice(e.target.value.replace(/[^0-9.]/g, ""));
          }}
        />
      </div>
    </div>
  );
}

export function resolvePrice(prices: { minimum: number; recommended: number; premium: number }, tier: Tier, custom: string): number {
  if (tier === "custom") return Number(custom) || 0;
  return prices[tier];
}
