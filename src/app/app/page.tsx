import Link from "next/link";
import { listGigs, listPayments, getProfile } from "@/lib/db/queries";
import { isAiConfigured } from "@/lib/ai/service";
import { isPayPalConfigured } from "@/lib/paypal";
import { formatMoney } from "@/lib/format";
import { GIG_STATUSES, STATUS_LABELS } from "@/lib/types";
import { JourneySteps } from "@/components/JourneySteps";
import { Badge, ButtonLink, Card, EmptyState, SourceBadge } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overview" };

export default async function OverviewPage() {
  const [gigs, payments, profile] = await Promise.all([listGigs(), listPayments(), getProfile()]);
  const received = payments.reduce((s, p) => s + p.amountCents, 0);
  const pipelineValue = gigs.filter((g) => g.status !== "paid").reduce((s, g) => s + (g.priceCents ?? 0) - g.paidCents, 0);
  const firstName = profile.name.split(" ")[0];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted">{firstName ? `Welcome back, ${firstName}` : "Welcome"}</p>
          <h1 className="mt-1 max-w-xl text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[32px]">
            Let&apos;s turn your next opportunity into income.
          </h1>
        </div>
        <SetupStatus ai={isAiConfigured()} paypal={isPayPalConfigured()} />
      </header>

      {/* Primary entry point */}
      <Card className="overflow-hidden">
        <div className="grid gap-6 p-6 sm:p-7 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <Badge tone="green">AI Gig Studio</Badge>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.01em]">Paste a job post. Get a priced, payable plan.</h2>
            <p className="mt-2 text-muted">
              The AI reads the brief, breaks it into milestones, recommends a price range and flags risks. Then you send a
              proposal and collect each milestone through PayPal.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink href="/app/studio" size="lg">Analyse an opportunity</ButtonLink>
              {gigs.length > 0 && <ButtonLink href="/app/projects" variant="secondary" size="lg">View projects</ButtonLink>}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-canvas p-4">
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Your workflow</p>
            <JourneySteps compact current={gigs.length === 0 ? 0 : -1} />
          </div>
        </div>
      </Card>

      {gigs.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Received via PayPal" value={formatMoney(received)} note={`${payments.length} verified payment${payments.length === 1 ? "" : "s"}`} green />
          <Stat label="Open pipeline value" value={formatMoney(pipelineValue)} note="Unpaid milestones on active projects" />
          <Stat label="Projects" value={String(gigs.length)} note={`${gigs.filter((g) => g.status === "paid").length} fully paid`} />
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Project pipeline</h2>
          {gigs.length > 0 && <Link href="/app/projects" className="text-[13px] font-medium text-brand hover:underline">All projects</Link>}
        </div>
        {gigs.length === 0 ? (
          <EmptyState
            title="Your pipeline is empty"
            description="Start by pasting a freelance job description into the AI Gig Studio. Saved opportunities appear here as they move from analysis to payment."
            action={<ButtonLink href="/app/studio">Analyse your first gig</ButtonLink>}
          />
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <div className="grid min-w-[880px] grid-cols-5 gap-3">
              {GIG_STATUSES.map((status) => {
                const column = gigs.filter((g) => g.status === status);
                return (
                  <div key={status} className="rounded-xl border border-line bg-ink/[0.02] p-2">
                    <div className="flex items-center justify-between px-1.5 pb-2 pt-1">
                      <span className="text-[12.5px] font-medium text-ink-soft">{STATUS_LABELS[status]}</span>
                      <span className="font-mono text-[11px] text-muted">{column.length}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {column.length === 0 && <p className="px-1.5 py-3 text-[12px] text-muted">Nothing here yet</p>}
                      {column.map((g) => (
                        <Link
                          key={g.id}
                          href={`/app/projects/${g.id}`}
                          className="block rounded-lg border border-line bg-surface p-3 transition hover:-translate-y-px hover:border-line-strong hover:shadow-[0_4px_14px_rgb(23_25_28/0.06)]"
                        >
                          <p className="line-clamp-2 text-[13.5px] font-medium leading-snug">{g.title}</p>
                          {g.clientName && <p className="mt-0.5 truncate text-[12px] text-muted">{g.clientName}</p>}
                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <span className="font-mono text-[12px] text-ink-soft">{g.priceCents ? formatMoney(g.priceCents) : "—"}</span>
                            {g.analysisSource === "demo" && <SourceBadge source="demo" />}
                          </div>
                          {g.priceCents ? (
                            <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/[0.06]">
                              <div className="h-full bg-brand" style={{ width: `${Math.min(100, (g.paidCents / g.priceCents) * 100)}%` }} />
                            </div>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, note, green }: { label: string; value: string; note: string; green?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-[12.5px] text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-[-0.02em] ${green ? "text-brand" : ""}`}>{value}</p>
      <p className="mt-0.5 text-[12px] text-muted">{note}</p>
    </Card>
  );
}

function SetupStatus({ ai, paypal }: { ai: boolean; paypal: boolean }) {
  return (
    <Link href="/app/settings" className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] hover:border-line-strong">
      <span className="flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full ${ai ? "bg-brand" : "bg-amber"}`} aria-hidden />
        AI {ai ? "connected" : "not configured"}
      </span>
      <span className="h-3 w-px bg-line" aria-hidden />
      <span className="flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full ${paypal ? "bg-brand" : "bg-amber"}`} aria-hidden />
        PayPal Sandbox {paypal ? "connected" : "not configured"}
      </span>
    </Link>
  );
}
