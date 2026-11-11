"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { formatMoney, formatUsd } from "@/lib/format";
import type { Milestone, PricingRecommendation } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { Badge, Button, Card, CardHeader, inputClass } from "@/components/ui/primitives";

const EFFECT_TONE = { raises: "amber", lowers: "blue", neutral: "neutral" } as const;

// Ask the AI to re-price the project for its current scope. The result is a
// recommendation only: applying a tier re-saves the plan with the same
// milestone split, so the freelancer explicitly chooses the new price.
export function SmartPricing({
  gigId,
  priceCents,
  milestones,
  aiConfigured,
}: {
  gigId: number;
  priceCents: number;
  milestones: Milestone[];
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<number | null>(null);
  const [result, setResult] = useState<PricingRecommendation | null>(null);
  const hasPaid = milestones.some((m) => m.status === "paid");

  async function reprice() {
    setLoading(true);
    try {
      const { pricing } = await api<{ pricing: PricingRecommendation }>(`/api/gigs/${gigId}/pricing`, { body: { note } });
      setResult(pricing);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't get a price recommendation.");
    } finally {
      setLoading(false);
    }
  }

  async function apply(dollars: number) {
    setApplying(dollars);
    try {
      await api(`/api/gigs/${gigId}/milestones`, {
        method: "PUT",
        body: {
          priceDollars: dollars,
          milestones: milestones.map((m) => ({ id: m.id, title: m.title, description: m.description, percent: m.percent })),
        },
      });
      toast.success(`Project price set to ${formatUsd(dollars)}. Milestone amounts updated.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't apply the price.");
    } finally {
      setApplying(null);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Smart pricing"
        description={`Currently quoted at ${formatMoney(priceCents)}. Re-price after scope or deadline changes.`}
        action={result && <Badge tone="green">AI generated</Badge>}
      />
      <div className="space-y-4 p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            aria-label="What changed? (optional)"
            className={inputClass}
            placeholder="What changed? e.g. client now needs it in 3 weeks"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && aiConfigured && reprice()}
          />
          <Button onClick={reprice} loading={loading} disabled={!aiConfigured}>
            {result ? "Re-price again" : "Re-price with AI"}
          </Button>
        </div>
        {!aiConfigured && (
          <p className="text-[12.5px] text-amber">Needs ANTHROPIC_API_KEY. Pricing recommendations are never simulated.</p>
        )}
        {loading && (
          <div className="grid grid-cols-3 gap-2" aria-busy="true">
            <div className="skeleton h-20" /><div className="skeleton h-20" /><div className="skeleton h-20" />
          </div>
        )}
        {result && !loading && (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {(["minimum", "recommended", "premium"] as const).map((k) => (
                <div key={k} className={`rounded-lg border p-3 ${k === "recommended" ? "border-brand bg-mint/60" : "border-line"}`}>
                  <p className="text-[12px] capitalize text-muted">{k}</p>
                  <p className={`text-xl font-semibold tracking-[-0.02em] ${k === "recommended" ? "text-brand" : ""}`}>{formatUsd(result[k])}</p>
                  <Button size="sm" variant={k === "recommended" ? "primary" : "secondary"} className="mt-2 w-full"
                    loading={applying === result[k]} disabled={applying !== null || result[k] * 100 === priceCents}
                    onClick={() => apply(result[k])}>
                    {result[k] * 100 === priceCents ? "Current price" : "Apply"}
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-ink-soft">
              {result.estimatedHours.low}–{result.estimatedHours.high} hours at ~${result.hourlyRateAssumed}/h. {result.rationale}
            </p>
            <ul className="space-y-1.5">
              {result.factors.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px]">
                  <Badge tone={EFFECT_TONE[f.effect]} className="mt-0.5 shrink-0 capitalize">{f.effect}</Badge>
                  <span><strong className="font-medium">{f.factor}.</strong> <span className="text-ink-soft">{f.detail}</span></span>
                </li>
              ))}
            </ul>
            <p className="text-[12px] text-muted">
              Estimates only. Review before quoting.{hasPaid && " Amounts already paid stay fixed; the remainder is re-split across unpaid milestones."}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
