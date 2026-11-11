import Link from "next/link";
import { notFound } from "next/navigation";
import { getGig, listMilestones, listPayments } from "@/lib/db/queries";
import { isAiConfigured } from "@/lib/ai/service";
import { isPayPalConfigured } from "@/lib/paypal";
import { formatDate, formatMoney } from "@/lib/format";
import { JourneySteps } from "@/components/JourneySteps";
import { ButtonLink, Card, CardHeader, SourceBadge, StatusBadge } from "@/components/ui/primitives";
import { PlanEditor } from "@/components/project/PlanEditor";
import { MilestonePayments } from "@/components/project/MilestonePayments";
import { ProposalEditor } from "@/components/project/ProposalEditor";
import { ProjectActions } from "@/components/project/ProjectActions";
import { SmartPricing } from "@/components/project/SmartPricing";
import type { GigStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "plan", label: "Plan & payments" },
  { key: "proposal", label: "Proposal" },
  { key: "brief", label: "Brief & analysis" },
] as const;

// Where this project sits on the six-step journey (for the progress strip).
// Analysed projects already have a price, so their next step is the proposal.
const JOURNEY_POSITION: Record<GigStatus, number> = { opportunity: 1, analysed: 3, proposal: 4, in_progress: 4, paid: 6 };

export async function generateMetadata({ params }: PageProps<"/app/projects/[id]">) {
  const gig = await getGig(Number((await params).id));
  return { title: gig?.title ?? "Project" };
}

export default async function ProjectPage({ params, searchParams }: PageProps<"/app/projects/[id]">) {
  const id = Number((await params).id);
  const gig = Number.isSafeInteger(id) ? await getGig(id) : null;
  if (!gig) notFound();
  const tabParam = (await searchParams).tab;
  const tab = TABS.find((t) => t.key === tabParam)?.key ?? "plan";

  const [milestones, allPayments] = await Promise.all([listMilestones(id), listPayments()]);
  const payments = allPayments.filter((p) => p.gigId === id);
  const paid = payments.reduce((s, p) => s + p.amountCents, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/projects" className="text-[13px] text-muted hover:text-ink">← Projects</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={gig.status} />
              <SourceBadge source={gig.analysisSource} />
            </div>
            <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.02em] sm:text-[30px]">{gig.title}</h1>
            <p className="mt-1 text-sm text-muted">
              {gig.clientName || "No client name"} · Created {formatDate(gig.createdAt)}
              {gig.priceCents ? <> · <span className="font-mono text-ink">{formatMoney(gig.priceCents)}</span></> : " · Not priced yet"}
              {paid > 0 && <> · <span className="font-mono text-brand">{formatMoney(paid)} received</span></>}
            </p>
          </div>
          <div className="flex gap-2">
            <ProjectActions gigId={gig.id} title={gig.title} clientName={gig.clientName} canDelete={payments.length === 0} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface px-4 py-3">
        <JourneySteps compact current={gig.status === "paid" ? 6 : JOURNEY_POSITION[gig.status]} />
      </div>

      {gig.status === "opportunity" ? (
        <OpportunityPanel id={gig.id} description={gig.description} />
      ) : (
      <>
      <nav aria-label="Project sections" className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link key={t.key} href={`?tab=${t.key}`} scroll={false} aria-current={tab === t.key ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-[13.5px] font-medium transition-colors ${
              tab === t.key ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"}`}>
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "plan" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <MilestonePayments milestones={milestones} payments={payments} paypalConfigured={isPayPalConfigured()} />
            <SmartPricing gigId={gig.id} priceCents={gig.priceCents ?? 0} milestones={milestones} aiConfigured={isAiConfigured()} />
          </div>
          <PlanEditor
            key={`${gig.updatedAt}-${milestones.map((m) => `${m.id}${m.status}`).join()}`}
            gigId={gig.id}
            priceCents={gig.priceCents ?? 0}
            milestones={milestones}
            pricing={gig.analysis?.pricing ?? null}
          />
        </div>
      )}

      {tab === "proposal" && (
        <ProposalEditor gigId={gig.id} initial={gig.proposal} initialSource={gig.proposalSource} aiConfigured={isAiConfigured()} />
      )}

      {tab === "brief" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Original job description" />
            <p className="whitespace-pre-wrap px-5 py-4 text-sm text-ink-soft">{gig.description}</p>
          </Card>
          {gig.analysis && (
            <Card>
              <CardHeader title="Analysis" action={<SourceBadge source={gig.analysisSource} />} />
              <div className="space-y-4 px-5 py-4 text-sm">
                <p>{gig.analysis.clientSummary}</p>
                <Detail label="Skills">{gig.analysis.skills.join(" · ")}</Detail>
                <Detail label="Complexity"><span className="capitalize">{gig.analysis.complexity.level}</span> — {gig.analysis.complexity.rationale}</Detail>
                <Detail label="Effort">{gig.analysis.estimatedHours.low}–{gig.analysis.estimatedHours.high} hours over {gig.analysis.timeline.weeks} weeks</Detail>
                <Detail label="Recommended payment structure">{gig.analysis.paymentStructure}</Detail>
                <Detail label="Risks">
                  <ul className="list-disc space-y-1 pl-4">
                    {gig.analysis.risks.map((r, i) => <li key={i}><strong className="font-medium">{r.risk}.</strong> {r.mitigation}</li>)}
                  </ul>
                </Detail>
                {gig.analysis.clarifyingQuestions.length > 0 && (
                  <Detail label="Questions for the client">
                    <ul className="list-disc space-y-1 pl-4">{gig.analysis.clarifyingQuestions.map((q, i) => <li key={i}>{q}</li>)}</ul>
                  </Detail>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}

/** A saved lead that hasn't been analysed: show the brief and the next step. */
function OpportunityPanel({ id, description }: { id: number; description: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader title="Job description" description="Saved to your pipeline, not analysed yet" />
        <p className="whitespace-pre-wrap px-5 py-4 text-sm text-ink-soft">{description}</p>
      </Card>
      <Card className="h-fit p-5">
        <p className="font-semibold">Next: analyse this opportunity</p>
        <p className="mt-1 text-[13px] text-muted">
          Get requirements, a price range and a milestone plan you can review before it becomes a payable project.
        </p>
        <ButtonLink href={`/app/studio?gig=${id}`} className="mt-4 w-full">Analyse in AI Gig Studio</ButtonLink>
      </Card>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-[12px] font-medium uppercase tracking-[0.06em] text-muted">{label}</p>
      <div className="text-ink-soft">{children}</div>
    </div>
  );
}
