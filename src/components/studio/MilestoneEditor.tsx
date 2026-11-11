"use client";

import { formatMoney, splitByPercent } from "@/lib/format";
import { Badge, inputClass } from "@/components/ui/primitives";

export interface EditableMilestone {
  id?: number;
  title: string;
  description: string;
  percent: number;
  paid?: boolean;
}

// Edits a payment-milestone plan. Amounts are previewed live from the project
// price using the same split the server uses, so what you see is exactly what
// each PayPal payment will charge.
export function MilestoneEditor({
  milestones,
  onChange,
  totalCents,
}: {
  milestones: EditableMilestone[];
  onChange: (m: EditableMilestone[]) => void;
  totalCents: number;
}) {
  const percentTotal = milestones.reduce((s, m) => s + (Number(m.percent) || 0), 0);
  const amounts = percentTotal > 0 ? splitByPercent(totalCents, milestones.map((m) => ((Number(m.percent) || 0) / percentTotal) * 100)) : [];
  const update = (i: number, patch: Partial<EditableMilestone>) =>
    onChange(milestones.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  return (
    <div className="space-y-2">
      {milestones.map((m, i) => (
        <div key={m.id ?? `new-${i}`} className="rounded-lg border border-line bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid size-6 shrink-0 place-items-center rounded bg-ink/5 font-mono text-[11px] text-ink-soft">{i + 1}</span>
            <input
              aria-label={`Milestone ${i + 1} title`}
              className={`${inputClass} min-w-0 flex-1 font-medium`}
              value={m.title}
              disabled={m.paid}
              onChange={(e) => update(i, { title: e.target.value })}
            />
            <div className="flex items-center gap-1">
              <input
                aria-label={`Milestone ${i + 1} percent`}
                inputMode="numeric"
                className={`${inputClass} w-16! text-right font-mono`}
                value={m.percent}
                disabled={m.paid}
                onChange={(e) => update(i, { percent: Number(e.target.value.replace(/\D/g, "")) || 0 })}
              />
              <span className="text-sm text-muted">%</span>
            </div>
            <span className="w-24 text-right font-mono text-sm font-medium text-brand">{formatMoney(amounts[i] ?? 0)}</span>
            {m.paid ? (
              <Badge tone="green">Paid</Badge>
            ) : (
              <button
                type="button"
                onClick={() => onChange(milestones.filter((_, j) => j !== i))}
                disabled={milestones.length <= 1}
                className="px-1 text-lg text-muted hover:text-danger disabled:opacity-30"
                aria-label={`Remove milestone ${i + 1}`}
              >
                ×
              </button>
            )}
          </div>
          <textarea
            aria-label={`Milestone ${i + 1} description`}
            rows={2}
            className={`${inputClass} mt-2 resize-y text-[13px]`}
            value={m.description}
            disabled={m.paid}
            onChange={(e) => update(i, { description: e.target.value })}
          />
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={() => onChange([...milestones, { title: "New milestone", description: "", percent: Math.max(0, 100 - percentTotal) || 10 }])}
          disabled={milestones.length >= 10}
          className="text-[13px] font-medium text-brand hover:underline disabled:opacity-40"
        >
          + Add milestone
        </button>
        <span className={`text-[13px] font-medium ${percentTotal === 100 ? "text-brand" : "text-danger"}`} aria-live="polite">
          Total {percentTotal}% {percentTotal === 100 ? "✓" : "— must equal 100%"}
        </span>
      </div>
      {/* Visual split of the price across milestones */}
      <div className="flex h-2 overflow-hidden rounded-full bg-ink/[0.06]" aria-hidden>
        {milestones.map((m, i) => (
          <div key={i} className={`h-full ${i % 2 ? "bg-brand/60" : "bg-brand"} ${m.paid ? "opacity-100" : ""}`}
            style={{ width: `${percentTotal ? (m.percent / Math.max(100, percentTotal)) * 100 : 0}%` }} />
        ))}
      </div>
    </div>
  );
}
