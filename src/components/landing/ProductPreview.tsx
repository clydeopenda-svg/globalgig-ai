"use client";

import { useEffect, useState } from "react";
import { DEMO_ANALYSIS, EXAMPLE_BRIEF } from "@/lib/ai/demo";
import { formatUsd } from "@/lib/format";

// Interactive preview of the real workflow, built from the same components'
// visual language and the example brief. Steps auto-advance until the
// visitor clicks one. It's labelled as a preview: no numbers here claim to be
// anyone's real results.

const STEPS = ["Analyse", "Price", "Milestones", "Get paid"] as const;

export function ProductPreview() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const a = DEMO_ANALYSIS;

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 3800);
    return () => clearInterval(t);
  }, [auto]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_80px_-20px_rgb(23_25_28/0.18)]">
      {/* window chrome */}
      <div className="flex items-center gap-3 border-b border-line bg-canvas px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-line-strong" /><span className="size-2.5 rounded-full bg-line-strong" /><span className="size-2.5 rounded-full bg-line-strong" />
        </span>
        <span className="text-[12px] text-muted">AI Gig Studio · product preview</span>
      </div>
      <div className="grid md:grid-cols-[220px_1fr]">
        <div className="border-b border-line p-4 md:border-b-0 md:border-r">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Job post</p>
          <p className="mt-2 line-clamp-[8] text-[12.5px] leading-relaxed text-ink-soft">{EXAMPLE_BRIEF}</p>
          <div role="tablist" aria-label="Preview steps" className="mt-4 flex flex-wrap gap-1 md:flex-col">
            {STEPS.map((s, i) => (
              <button key={s} role="tab" type="button" aria-selected={step === i}
                onClick={() => { setAuto(false); setStep(i); }}
                className={`rounded-md px-2.5 py-1.5 text-left text-[12.5px] font-medium transition-colors ${
                  step === i ? "bg-mint text-brand" : "text-ink-soft hover:bg-ink/[0.04]"}`}>
                <span className="mr-1.5 font-mono text-[10.5px] opacity-60">0{i + 1}</span>{s}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-[300px] p-5" role="tabpanel" aria-live="polite">
          <div key={step} className="animate-page-in">
            {step === 0 && (
              <div className="space-y-3">
                <p className="font-semibold">{a.title}</p>
                <p className="text-[13px] text-ink-soft">{a.clientSummary}</p>
                <div className="flex flex-wrap gap-1.5">
                  {a.skills.map((s) => <span key={s} className="rounded-md border border-line bg-canvas px-2 py-0.5 text-[12px]">{s}</span>)}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Mini label="Complexity" value="Medium" />
                  <Mini label="Estimate" value={`${a.estimatedHours.low}–${a.estimatedHours.high} h`} />
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-[13px] text-muted">Recommended price range (USD)</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["minimum", "recommended", "premium"] as const).map((k) => (
                    <div key={k} className={`rounded-lg border p-3 ${k === "recommended" ? "border-brand bg-mint/70" : "border-line"}`}>
                      <p className="text-[11px] capitalize text-muted">{k}</p>
                      <p className={`text-lg font-semibold ${k === "recommended" ? "text-brand" : ""}`}>{formatUsd(a.pricing[k])}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[12.5px] text-ink-soft">{a.pricing.rationale}</p>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-2">
                {a.milestones.map((m, i) => (
                  <div key={m.title} className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
                    <span className="text-[13px]"><span className="mr-2 font-mono text-[11px] text-muted">{i + 1}</span>{m.title}</span>
                    <span className="font-mono text-[12.5px] text-brand">{m.percent}% · {formatUsd((a.pricing.recommended * m.percent) / 100)}</span>
                  </div>
                ))}
                <div className="flex h-2 overflow-hidden rounded-full bg-ink/5">
                  {a.milestones.map((m, i) => <div key={i} className={i % 2 ? "bg-brand/60" : "bg-brand"} style={{ width: `${m.percent}%` }} />)}
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="mx-auto max-w-xs space-y-3 text-center">
                <p className="text-[12px] text-muted">Milestone 1 of 3 · {a.milestones[0].title}</p>
                <p className="font-mono text-3xl font-semibold">{formatUsd((a.pricing.recommended * a.milestones[0].percent) / 100)}</p>
                <div className="rounded-md bg-[#ffc439] py-2.5 text-sm font-semibold text-[#253b80]" aria-hidden>Pay with PayPal</div>
                <p className="text-[12px] text-muted">Your client pays through PayPal. The backend verifies the capture before the milestone is marked paid.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-canvas px-3 py-2">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="font-mono text-[13px] font-medium">{value}</p>
    </div>
  );
}
