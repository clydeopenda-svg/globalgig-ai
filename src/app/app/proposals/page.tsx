import Link from "next/link";
import { listGigs } from "@/lib/db/queries";
import { formatDate, formatMoney } from "@/lib/format";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, SourceBadge } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";
export const metadata = { title: "Proposals" };

export default async function ProposalsPage() {
  const gigs = await listGigs();
  const written = gigs.filter((g) => g.proposalSource);
  const pending = gigs.filter((g) => !g.proposalSource);

  return (
    <>
      <PageHeader eyebrow="Proposals" title="Client-ready proposals"
        description="Generated from each project's analysis, price and milestones. Edit, save and copy them straight into your email or job platform." />
      {gigs.length === 0 ? (
        <EmptyState title="No proposals yet" description="Analyse an opportunity first; then write its proposal in one click."
          action={<ButtonLink href="/app/studio">Analyse an opportunity</ButtonLink>} />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-[15px] font-semibold">Written <span className="font-mono text-[12px] text-muted">{written.length}</span></h2>
            {written.length === 0 ? (
              <p className="text-sm text-muted">None yet — pick a project below to write its proposal.</p>
            ) : (
              <Card className="divide-y divide-line">
                {written.map((g) => (
                  <Link key={g.id} href={`/app/projects/${g.id}?tab=proposal`} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-canvas">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{g.title}</p>
                      <p className="text-[12.5px] text-muted">{g.clientName || "No client name"} · updated {formatDate(g.updatedAt)}</p>
                    </div>
                    <SourceBadge source={g.proposalSource} />
                    <span className="font-mono text-sm">{formatMoney(g.priceCents ?? 0)}</span>
                    <span className="text-muted" aria-hidden>→</span>
                  </Link>
                ))}
              </Card>
            )}
          </section>
          {pending.length > 0 && (
            <section>
              <h2 className="mb-3 text-[15px] font-semibold">Ready to write <span className="font-mono text-[12px] text-muted">{pending.length}</span></h2>
              <Card className="divide-y divide-line">
                {pending.map((g) => (
                  <Link key={g.id} href={`/app/projects/${g.id}?tab=proposal`} className="flex items-center gap-3 px-5 py-4 hover:bg-canvas">
                    <p className="min-w-0 flex-1 font-medium">{g.title}</p>
                    <Badge tone="amber">No proposal</Badge>
                    <span className="text-[13px] font-medium text-brand">Write →</span>
                  </Link>
                ))}
              </Card>
            </section>
          )}
        </div>
      )}
    </>
  );
}
