"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/client-api";
import { DEMO_ANALYSIS, EXAMPLE_BRIEF } from "@/lib/ai/demo";
import { normalisePercents } from "@/lib/format";
import type { GigAnalysis } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { Badge, Button, Card, CardHeader, Field, SourceBadge, inputClass } from "@/components/ui/primitives";
import { EditableList } from "./EditableList";
import { MilestoneEditor, type EditableMilestone } from "./MilestoneEditor";
import { PricingTiers, resolvePrice, type Tier } from "./PricingTiers";

const LOADING_STEPS = ["Reading the client's requirements", "Estimating effort and complexity", "Pricing the work", "Planning payment milestones"];

type Phase = "idle" | "loading" | "result";

/** An opportunity saved earlier, opened in the studio to be analysed. */
export interface StudioOpportunity {
  id: number;
  title: string;
  description: string;
  clientName: string;
}

export function GigStudio({ aiConfigured, opportunity }: { aiConfigured: boolean; opportunity?: StudioOpportunity }) {
  const router = useRouter();
  const toast = useToast();
  const [description, setDescription] = useState(opportunity?.description ?? "");
  const [clientName, setClientName] = useState(opportunity?.clientName ?? "");
  const [savingOpportunity, setSavingOpportunity] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [analysis, setAnalysis] = useState<GigAnalysis | null>(null);
  const [source, setSource] = useState<"ai" | "demo">("ai");
  const [milestones, setMilestones] = useState<EditableMilestone[]>([]);
  const [tier, setTier] = useState<Tier>("recommended");
  const [customPrice, setCustomPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  // Cycle the loading caption while the AI works (purely a progress cue).
  useEffect(() => {
    if (phase !== "loading") return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 4500);
    return () => clearInterval(t);
  }, [phase]);

  function loadResult(a: GigAnalysis, from: "ai" | "demo") {
    setAnalysis(a);
    setSource(from);
    // AI percentages can drift to 99/101; normalise so the plan is saveable as-is.
    const percents = normalisePercents(a.milestones.map((m) => m.percent));
    setMilestones(a.milestones.map((m, i) => ({ title: m.title, description: m.description, percent: percents[i] })));
    setTier("recommended");
    setCustomPrice("");
    setPhase("result");
  }

  async function analyse() {
    setError(null);
    setStep(0);
    setPhase("loading");
    try {
      const res = await api<{ analysis: GigAnalysis }>("/api/ai/analyse", { body: { description } });
      loadResult(res.analysis, "ai");
      toast.success("Opportunity analysed. Review and edit anything before saving.");
    } catch (err) {
      const e = err instanceof ApiError ? err : new ApiError("Analysis failed.", 0);
      setError({ message: e.message, code: e.code });
      setPhase(analysis ? "result" : "idle");
      toast.error(e.message);
    }
  }

  function useDemo() {
    // Demo mode analyses the built-in example brief only, so the sample
    // output always matches the text on screen. A saved opportunity with its
    // own text can't use it, or the sample would masquerade as its analysis.
    if (opportunity && description.trim() !== EXAMPLE_BRIEF) {
      toast.error("Demo mode only covers the built-in example brief. Add ANTHROPIC_API_KEY to analyse this opportunity.");
      return;
    }
    setDescription(EXAMPLE_BRIEF);
    setError(null);
    loadResult(DEMO_ANALYSIS, "demo");
    toast.info("Loaded labelled demo data for the example brief. This is not AI output.");
  }

  const price = analysis ? resolvePrice(analysis.pricing, tier, customPrice) : 0;
  const percentTotal = milestones.reduce((s, m) => s + m.percent, 0);

  async function save() {
    if (!analysis) return;
    if (percentTotal !== 100) return toast.error("Milestone percentages must add up to 100%.");
    if (!(price >= 1)) return toast.error("Choose a price for the project.");
    if (milestones.some((m) => !m.title.trim())) return toast.error("Every milestone needs a title.");
    setSaving(true);
    try {
      const edited: GigAnalysis = {
        ...analysis,
        requirements: analysis.requirements.filter((r) => r.trim()),
        skills: analysis.skills.filter((s) => s.trim()),
        milestones: milestones.map((m, i) => ({
          title: m.title.trim(),
          description: m.description.trim(),
          percent: m.percent,
          deliverables: analysis.milestones[i]?.deliverables ?? [],
        })),
      };
      const { id } = await api<{ id: number }>("/api/gigs", {
        body: { description, clientName, analysis: edited, source, priceDollars: price, gigId: opportunity?.id },
      });
      toast.success(opportunity ? "Opportunity analysed and priced." : "Project created with its payment milestones.");
      router.push(`/app/projects/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the project.");
      setSaving(false);
    }
  }

  // Capture a lead now, analyse it later: it lands in the "Opportunity" stage.
  async function saveOpportunity() {
    setSavingOpportunity(true);
    try {
      const { id } = await api<{ id: number }>("/api/gigs", { body: { kind: "opportunity", description, clientName } });
      toast.success("Saved to your pipeline as an opportunity.");
      router.push(`/app/projects/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the opportunity.");
      setSavingOpportunity(false);
    }
  }

  const set = <K extends keyof GigAnalysis>(key: K, value: GigAnalysis[K]) =>
    setAnalysis((a) => (a ? { ...a, [key]: value } : a));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      {/* Input column */}
      <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        {opportunity && (
          <div className="rounded-lg border border-line bg-surface px-4 py-3 text-[13px]">
            <p className="text-muted">Analysing saved opportunity</p>
            <p className="font-medium">{opportunity.title}</p>
          </div>
        )}
        <Card className="p-5">
          <div className="space-y-4">
            <Field label="Job description" htmlFor="brief" hint="Paste the full post from Upwork, LinkedIn, email or anywhere else.">
              <textarea
                id="brief"
                rows={11}
                className={`${inputClass} resize-y leading-relaxed`}
                placeholder="We need a frontend developer to build a responsive e-commerce website with an admin dashboard…"
                value={description}
                maxLength={8000}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <Field label="Client name (optional)" htmlFor="client">
              <input id="client" className={inputClass} value={clientName} maxLength={120}
                placeholder="e.g. Clayworks Studio" onChange={(e) => setClientName(e.target.value)} />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="lg" className="flex-1" onClick={analyse} loading={phase === "loading"} disabled={description.trim().length < 40}>
                {phase === "loading" ? "Analysing…" : analysis ? "Re-analyse" : "Analyse opportunity"}
              </Button>
              {!description && (
                <Button variant="ghost" onClick={() => setDescription(EXAMPLE_BRIEF)}>Use example</Button>
              )}
            </div>
            {!opportunity && !analysis && (
              <button
                type="button"
                onClick={saveOpportunity}
                disabled={description.trim().length < 40 || savingOpportunity || phase === "loading"}
                className="text-[13px] font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline disabled:opacity-40 disabled:no-underline"
              >
                {savingOpportunity ? "Saving…" : "Not ready yet? Save as an opportunity and analyse later"}
              </button>
            )}
            {!aiConfigured && (
              <p className="rounded-md bg-amber-soft px-3 py-2 text-[12.5px] text-amber">
                AI isn&apos;t configured on this server (ANTHROPIC_API_KEY missing). You can still explore with the labelled demo.
              </p>
            )}
          </div>
        </Card>
        {error && (
          <Card className="border-danger/30 p-4" role="alert">
            <p className="text-sm font-medium text-danger">Analysis failed</p>
            <p className="mt-1 text-[13px] text-ink-soft">{error.message}</p>
            {(error.code === "not_configured" || !aiConfigured) && (
              <Button variant="secondary" size="sm" className="mt-3" onClick={useDemo}>
                Use labelled demo mode instead
              </Button>
            )}
          </Card>
        )}
        {!aiConfigured && !error && phase === "idle" && (
          <Button variant="secondary" className="w-full" onClick={useDemo}>Try demo mode (sample data)</Button>
        )}
      </div>

      {/* Result column */}
      <div className="min-w-0">
        {phase === "loading" && <LoadingState step={step} />}
        {phase === "idle" && !analysis && <IdleState />}
        {phase === "result" && analysis && (
          <div className="space-y-4">
            {source === "demo" && (
              <div className="rounded-lg border border-amber/30 bg-amber-soft px-4 py-3 text-[13px] text-amber">
                <strong>Demo mode.</strong> This is pre-written sample data for the example brief, not AI output. Configure
                ANTHROPIC_API_KEY for real analysis.
              </div>
            )}
            <Card>
              <CardHeader title="Opportunity summary" action={<SourceBadge source={source} />} />
              <div className="space-y-3 p-5">
                <input aria-label="Project title" className={`${inputClass} text-lg font-semibold`} value={analysis.title}
                  onChange={(e) => set("title", e.target.value)} />
                <textarea aria-label="Client summary" rows={3} className={`${inputClass} resize-y`} value={analysis.clientSummary}
                  onChange={(e) => set("clientSummary", e.target.value)} />
                <div className="flex flex-wrap gap-1.5">
                  {analysis.skills.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2 py-0.5 text-[12.5px]">
                      {s}
                      <button type="button" aria-label={`Remove skill ${s}`} className="text-muted hover:text-danger"
                        onClick={() => set("skills", analysis.skills.filter((_, j) => j !== i))}>×</button>
                    </span>
                  ))}
                  <SkillAdder onAdd={(s) => set("skills", [...analysis.skills, s])} />
                </div>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader title="Requirements" description="What the client is asking for" />
                <div className="p-4">
                  <EditableList label="Requirement" items={analysis.requirements} onChange={(v) => set("requirements", v)} addLabel="Add requirement" />
                </div>
              </Card>
              <Card>
                <CardHeader title="Complexity & effort" />
                <div className="space-y-3 p-5">
                  <div className="flex items-center gap-3">
                    <ComplexityMeter level={analysis.complexity.level} />
                    <span className="text-sm font-medium capitalize">{analysis.complexity.level} complexity</span>
                  </div>
                  <p className="text-[13px] text-ink-soft">{analysis.complexity.rationale}</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Metric label="Estimated hours" value={`${analysis.estimatedHours.low}–${analysis.estimatedHours.high} h`} />
                    <Metric label="Timeline" value={`${analysis.timeline.weeks} week${analysis.timeline.weeks === 1 ? "" : "s"}`} />
                  </div>
                  <p className="text-[13px] text-muted">{analysis.timeline.summary}</p>
                </div>
              </Card>
            </div>

            <Card>
              <CardHeader
                title="Smart pricing"
                description={`Assumes ~$${analysis.pricing.hourlyRateAssumed}/hour. Estimates only — review before quoting.`}
              />
              <div className="space-y-3 p-5">
                <PricingTiers prices={analysis.pricing} tier={tier} customPrice={customPrice} onTier={setTier} onCustomPrice={setCustomPrice} />
                <p className="text-[13px] text-ink-soft">{analysis.pricing.rationale}</p>
              </div>
            </Card>

            <Card>
              <CardHeader title="Payment milestones" description={analysis.paymentStructure} />
              <div className="p-5">
                <MilestoneEditor milestones={milestones} onChange={setMilestones} totalCents={Math.round(price * 100)} />
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader title="Risks to manage" />
                <ul className="divide-y divide-line">
                  {analysis.risks.map((r, i) => (
                    <li key={i} className="px-5 py-3">
                      <p className="text-[13.5px] font-medium">{r.risk}</p>
                      <p className="mt-0.5 text-[13px] text-muted">{r.mitigation}</p>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <CardHeader title="Ask the client" description="Clarify these before committing" />
                <div className="p-4">
                  <EditableList label="Question" items={analysis.clarifyingQuestions} onChange={(v) => set("clarifyingQuestions", v)} addLabel="Add question" />
                </div>
              </Card>
            </div>

            <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/95 px-5 py-3 shadow-[0_8px_30px_rgb(23_25_28/0.08)] backdrop-blur">
              <p className="text-sm">
                <span className="text-muted">Project price </span>
                <span className="font-mono font-semibold text-brand">${price.toLocaleString("en-US")}</span>
                <span className="text-muted"> · {milestones.length} milestones</span>
              </p>
              <Button onClick={save} loading={saving} disabled={percentTotal !== 100}>{opportunity ? "Save analysis →" : "Save as project →"}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SkillAdder({ onAdd }: { onAdd: (s: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (value.trim()) { onAdd(value.trim()); setValue(""); } }}>
      <input aria-label="Add skill" placeholder="+ skill" value={value} onChange={(e) => setValue(e.target.value)}
        className="w-24 rounded-md border border-dashed border-line-strong bg-transparent px-2 py-0.5 text-[12.5px] focus:border-brand focus:outline-none" />
    </form>
  );
}

function ComplexityMeter({ level }: { level: "low" | "medium" | "high" }) {
  const n = level === "low" ? 1 : level === "medium" ? 2 : 3;
  return (
    <span className="flex gap-1" aria-hidden>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-4 w-1.5 rounded-sm ${i <= n ? "bg-brand" : "bg-ink/10"}`} />
      ))}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-canvas px-3 py-2">
      <p className="text-[11.5px] text-muted">{label}</p>
      <p className="font-mono text-sm font-medium">{value}</p>
    </div>
  );
}

function LoadingState({ step }: { step: number }) {
  return (
    <Card className="p-6" aria-busy="true">
      <div className="mb-5 flex items-center gap-2">
        <Badge tone="green">AI working</Badge>
        <p className="text-sm text-ink-soft" aria-live="polite">{LOADING_STEPS[step]}…</p>
      </div>
      <div className="space-y-3">
        <div className="skeleton h-6 w-2/3" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="grid grid-cols-3 gap-3 pt-3">
          <div className="skeleton h-20" /><div className="skeleton h-20" /><div className="skeleton h-20" />
        </div>
        <div className="skeleton h-28 w-full" />
      </div>
      <p className="mt-5 text-[12.5px] text-muted">A thorough analysis usually takes 15–40 seconds.</p>
    </Card>
  );
}

function IdleState() {
  const items = [
    ["Requirements & skills", "What the client actually needs, in plain language"],
    ["Complexity & hours", "A realistic effort estimate and timeline"],
    ["Three price points", "Minimum, recommended and premium in USD"],
    ["Payment milestones", "A plan you can collect through PayPal"],
    ["Risks & questions", "What to clarify before you commit"],
  ];
  return (
    <div className="rounded-xl border border-dashed border-line-strong p-6 sm:p-8">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">What you&apos;ll get</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map(([t, d]) => (
          <li key={t} className="rounded-lg border border-line bg-surface p-4">
            <p className="text-sm font-medium">{t}</p>
            <p className="mt-0.5 text-[13px] text-muted">{d}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
