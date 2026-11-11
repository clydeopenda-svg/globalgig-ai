"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import type { GigAnalysis, Milestone } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { Button, Card, CardHeader, inputClass } from "@/components/ui/primitives";
import { MilestoneEditor, type EditableMilestone } from "@/components/studio/MilestoneEditor";
import { formatUsd } from "@/lib/format";

// Edit the project price and its payment milestones after creation.
// Paid milestones are locked (they're real received money).
export function PlanEditor({
  gigId,
  priceCents,
  milestones,
  pricing,
}: {
  gigId: number;
  priceCents: number;
  milestones: Milestone[];
  pricing: GigAnalysis["pricing"] | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const initial = () => milestones.map((m) => ({ id: m.id, title: m.title, description: m.description, percent: m.percent, paid: m.status === "paid" }));
  const [plan, setPlan] = useState<EditableMilestone[]>(initial);
  const [price, setPrice] = useState(String(priceCents / 100));
  const [saving, setSaving] = useState(false);
  const total = plan.reduce((s, m) => s + m.percent, 0);
  const dirty = price !== String(priceCents / 100) || JSON.stringify(plan) !== JSON.stringify(initial());

  async function save() {
    setSaving(true);
    try {
      await api(`/api/gigs/${gigId}/milestones`, { method: "PUT", body: { priceDollars: Number(price), milestones: plan } });
      toast.success("Price and milestones saved.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Price & milestone plan"
        description="Edit the price or split; each milestone becomes one PayPal payment."
        action={<Button size="sm" onClick={save} loading={saving} disabled={!dirty || total !== 100}>Save plan</Button>}
      />
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="project-price" className="text-[13px] font-medium text-ink-soft">Project price (USD)</label>
            <input id="project-price" inputMode="decimal" className={`${inputClass} mt-1 w-40 font-mono text-base`} value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} />
          </div>
          {pricing && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {(["minimum", "recommended", "premium"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setPrice(String(pricing[k]))}
                  className="rounded-md border border-line px-2 py-1 text-[12px] text-ink-soft hover:border-brand hover:text-brand">
                  <span className="capitalize">{k}</span> {formatUsd(pricing[k])}
                </button>
              ))}
            </div>
          )}
        </div>
        <MilestoneEditor milestones={plan} onChange={setPlan} totalCents={Math.round((Number(price) || 0) * 100)} />
        <p className="text-[12px] text-muted">Prices are estimates. Review them against your own rates before sending a proposal.</p>
      </div>
    </Card>
  );
}
