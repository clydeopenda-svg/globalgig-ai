"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/client-api";
import type { ContentSource, Proposal } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { Button, Card, CardHeader, EmptyState, SourceBadge, inputClass } from "@/components/ui/primitives";

const SECTIONS: { key: Exclude<keyof Proposal, "deliverables" | "subject">; label: string; rows: number }[] = [
  { key: "overview", label: "Project overview", rows: 3 },
  { key: "understanding", label: "Understanding of your requirements", rows: 4 },
  { key: "solution", label: "Proposed solution", rows: 5 },
  { key: "timeline", label: "Timeline", rows: 3 },
  { key: "pricing", label: "Pricing", rows: 2 },
  { key: "paymentTerms", label: "Payment milestones", rows: 3 },
  { key: "closing", label: "Next steps", rows: 2 },
];

/** Plain-text version for pasting into email, Upwork or LinkedIn. */
function toPlainText(p: Proposal): string {
  const parts = [p.subject, "", p.overview, ""];
  for (const s of SECTIONS.slice(1)) {
    parts.push(s.label.toUpperCase(), p[s.key], "");
    if (s.key === "solution") parts.push("DELIVERABLES", ...p.deliverables.map((d) => `• ${d}`), "");
  }
  return parts.join("\n").trim();
}

export function ProposalEditor({
  gigId,
  initial,
  initialSource,
  aiConfigured,
}: {
  gigId: number;
  initial: Proposal | null;
  initialSource: ContentSource | null;
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [proposal, setProposal] = useState<Proposal | null>(initial);
  const [source, setSource] = useState<ContentSource | null>(initialSource);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [canDemo, setCanDemo] = useState(!aiConfigured);

  async function generate(mode: "ai" | "demo") {
    if (dirty && !window.confirm("Replace your edited proposal with a newly generated one?")) return;
    setGenerating(true);
    try {
      const res = await api<{ proposal: Proposal; source: ContentSource }>(`/api/gigs/${gigId}/proposal`, { body: { mode } });
      setProposal(res.proposal);
      setSource(res.source);
      setDirty(false);
      toast.success(mode === "ai" ? "Proposal written and saved." : "Demo template created (not AI).");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === "not_configured") setCanDemo(true);
      toast.error(err instanceof Error ? err.message : "Couldn't generate the proposal.");
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!proposal) return;
    setSaving(true);
    try {
      await api(`/api/gigs/${gigId}/proposal`, { method: "PUT", body: { proposal } });
      setDirty(false);
      toast.success("Proposal saved.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the proposal.");
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    if (!proposal) return;
    try {
      await navigator.clipboard.writeText(toPlainText(proposal));
      toast.success("Proposal copied — paste it into your email or job platform.");
    } catch {
      toast.error("Your browser blocked clipboard access.");
    }
  }

  const edit = (patch: Partial<Proposal>) => {
    setProposal((p) => (p ? { ...p, ...patch } : p));
    setDirty(true);
  };

  if (!proposal) {
    return (
      <EmptyState
        title="No proposal yet"
        description="Generate a client-ready proposal from this project's analysis, price and milestones. You can edit every word before sending."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => generate("ai")} loading={generating}>Write proposal with AI</Button>
            {canDemo && <Button variant="secondary" onClick={() => generate("demo")} disabled={generating}>Use demo template</Button>}
          </div>
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader
        title="Proposal"
        description={dirty ? "Unsaved changes" : "Saved"}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={source} />
            <Button size="sm" variant="ghost" onClick={() => generate(aiConfigured ? "ai" : "demo")} loading={generating}>
              {aiConfigured ? "Regenerate with AI" : "Rebuild demo template"}
            </Button>
            <Button size="sm" variant="secondary" onClick={copy}>Copy proposal</Button>
            <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>Save</Button>
          </div>
        }
      />
      {/* Document-style editor: reads like the proposal the client will receive */}
      <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-10">
        <input aria-label="Subject" className="w-full border-0 bg-transparent text-2xl font-semibold tracking-[-0.02em] focus:outline-none"
          value={proposal.subject} onChange={(e) => edit({ subject: e.target.value })} />
        {SECTIONS.map((s) => (
          <div key={s.key}>
            {s.key !== "overview" && <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">{s.label}</h3>}
            <textarea aria-label={s.label} rows={s.rows} className={`${inputClass} resize-y border-transparent px-0 text-[15px] leading-relaxed hover:border-line focus:px-3`}
              value={proposal[s.key]} onChange={(e) => edit({ [s.key]: e.target.value } as Partial<Proposal>)} />
            {s.key === "solution" && (
              <div className="mt-5">
                <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">Deliverables</h3>
                <textarea aria-label="Deliverables (one per line)" rows={Math.max(3, proposal.deliverables.length)}
                  className={`${inputClass} resize-y border-transparent px-0 text-[15px] leading-relaxed hover:border-line focus:px-3`}
                  value={proposal.deliverables.map((d) => `• ${d}`).join("\n")}
                  onChange={(e) => edit({ deliverables: e.target.value.split("\n").map((l) => l.replace(/^•\s?/, "")).filter((l) => l.trim()) })} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
