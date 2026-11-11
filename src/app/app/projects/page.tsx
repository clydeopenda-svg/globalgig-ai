import Link from "next/link";
import { listGigs } from "@/lib/db/queries";
import { formatDate, formatMoney } from "@/lib/format";
import { ButtonLink, EmptyState, PageHeader, ProgressBar, SourceBadge, StatusBadge } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const gigs = await listGigs();
  return (
    <>
      <PageHeader eyebrow="Projects" title="Every gig, from analysis to paid"
        description="Open a project to edit its price, manage milestones, write the proposal and request PayPal payments."
        actions={<ButtonLink href="/app/studio">New opportunity</ButtonLink>} />
      {gigs.length === 0 ? (
        <EmptyState title="No projects yet" description="Projects are created from analysed opportunities in the AI Gig Studio."
          action={<ButtonLink href="/app/studio">Open AI Gig Studio</ButtonLink>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {gigs.map((g) => (
            <Link key={g.id} href={`/app/projects/${g.id}`}
              className="group flex flex-col rounded-xl border border-line bg-surface p-5 transition hover:-translate-y-px hover:border-line-strong hover:shadow-[0_6px_20px_rgb(23_25_28/0.06)]">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={g.status} />
                <SourceBadge source={g.analysisSource === "demo" ? "demo" : null} />
              </div>
              <h2 className="mt-3 font-semibold leading-snug group-hover:text-brand">{g.title}</h2>
              <p className="mt-0.5 text-[13px] text-muted">{g.clientName || "No client name"} · {formatDate(g.createdAt)}</p>
              <div className="mt-auto pt-5">
                <div className="mb-1.5 flex justify-between text-[12.5px]">
                  <span className="font-mono text-brand">{formatMoney(g.paidCents)} paid</span>
                  <span className="font-mono text-ink-soft">{formatMoney(g.priceCents ?? 0)}</span>
                </div>
                <ProgressBar value={g.priceCents ? (g.paidCents / g.priceCents) * 100 : 0} label={`${g.title} payment progress`} />
                <p className="mt-2 text-[12px] text-muted">{g.milestoneCount} milestones · proposal {g.proposalSource ? "ready" : "not written"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
