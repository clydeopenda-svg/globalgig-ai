import Link from "next/link";
import { listPayments } from "@/lib/db/queries";
import { isPayPalConfigured } from "@/lib/paypal";
import { formatDateTime, formatMoney } from "@/lib/format";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, SandboxBadge } from "@/components/ui/primitives";
import { PayPalSetup } from "@/components/payments/PayPalSetup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payments" };

// Financial activity: only verified PayPal captures recorded by the backend.
export default async function PaymentsPage() {
  const payments = await listPayments();
  const total = payments.reduce((s, p) => s + p.amountCents, 0);
  const configured = isPayPalConfigured();

  return (
    <>
      <PageHeader eyebrow="Payments" title="PayPal payment center"
        description="Each row is a PayPal capture verified by the backend (status, amount, currency and milestone) before it was recorded."
        actions={<SandboxBadge />} />

      {!configured && <div className="mb-6"><PayPalSetup /></div>}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[12.5px] text-muted">Total received</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-brand">{formatMoney(total)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12.5px] text-muted">Verified transactions</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{payments.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12.5px] text-muted">Environment</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Sandbox</p>
        </Card>
      </div>

      {payments.length === 0 ? (
        <EmptyState title="No payments yet"
          description="Open a project, choose a milestone and click “Request payment”. When a Sandbox buyer pays, the verified capture appears here."
          action={<ButtonLink href="/app/projects" variant="secondary">Go to projects</ButtonLink>} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-canvas text-[12px] uppercase tracking-[0.06em] text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Project / milestone</th>
                  <th className="px-5 py-3 font-medium">Buyer</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Transaction</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-canvas/60">
                    <td className="px-5 py-3">
                      <Link href={`/app/projects/${p.gigId}`} className="font-medium hover:text-brand">{p.gigTitle}</Link>
                      <p className="text-[12.5px] text-muted">{p.milestoneTitle}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p>{p.payerName || p.clientName || "—"}</p>
                      <p className="text-[12.5px] text-muted">{p.payerEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-medium text-brand">{formatMoney(p.amountCents, p.currency)}</td>
                    <td className="px-5 py-3 font-mono text-[12px]">
                      <p title="PayPal capture id">{p.paypalCaptureId}</p>
                      <p className="text-muted" title="PayPal order id">Order {p.paypalOrderId}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone="green">{p.status === "COMPLETED" ? "Completed" : p.status}</Badge>
                        <Badge tone="amber">{p.environment}</Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-ink-soft">{formatDateTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
