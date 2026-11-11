import { notFound } from "next/navigation";
import { getGig, getMilestone, listMilestones, listPayments, getProfile } from "@/lib/db/queries";
import { getPayPalClientId, isPayPalConfigured } from "@/lib/paypal";
import { formatDateTime, formatMoney } from "@/lib/format";
import { Logo } from "@/components/layout/Logo";
import { Badge, SandboxBadge } from "@/components/ui/primitives";
import { PayPalCheckout } from "@/components/payments/PayPalCheckout";
import { PayPalSetup } from "@/components/payments/PayPalSetup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Milestone payment", robots: { index: false } };

// Client-facing payment page for one milestone. The freelancer shares this
// link; the client pays through PayPal. Only milestone-level details are
// shown — never the freelancer's internal pricing analysis.
export default async function PayPage({ params }: PageProps<"/pay/[milestoneId]">) {
  const milestoneId = Number((await params).milestoneId);
  const milestone = Number.isSafeInteger(milestoneId) ? await getMilestone(milestoneId) : null;
  if (!milestone) notFound();
  const gig = await getGig(milestone.gigId);
  if (!gig) notFound();
  const [milestones, payments, profile] = await Promise.all([listMilestones(gig.id), listPayments(), getProfile()]);
  const payment = payments.find((p) => p.milestoneId === milestone.id);
  const index = milestones.findIndex((m) => m.id === milestone.id);
  const clientId = getPayPalClientId();

  return (
    <div className="min-h-dvh bg-canvas px-4 py-8 sm:py-14">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <SandboxBadge />
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_12px_40px_rgb(23_25_28/0.06)]">
          <div className="border-b border-line p-6">
            <p className="text-[13px] text-muted">
              Payment request{profile.name ? ` from ${profile.name}` : ""}{gig.clientName ? ` to ${gig.clientName}` : ""}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-[-0.01em]">{gig.title}</h1>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
                  Milestone {index + 1} of {milestones.length}
                </p>
                <p className="mt-0.5 font-medium">{milestone.title}</p>
              </div>
              <p className="font-mono text-3xl font-semibold tracking-[-0.02em]">{formatMoney(milestone.amountCents, gig.currency)}</p>
            </div>
            {milestone.description && <p className="mt-3 text-[13.5px] text-ink-soft">{milestone.description}</p>}
          </div>

          <div className="p-6">
            {milestone.status === "paid" && payment ? (
              <div className="rounded-lg border border-mint-strong bg-mint p-5" role="status">
                <div className="flex items-center gap-2">
                  <Badge tone="green">Paid</Badge>
                  <p className="font-semibold text-brand">This milestone has been paid</p>
                </div>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
                  <dt className="text-muted">Amount</dt><dd className="font-mono font-medium">{formatMoney(payment.amountCents, payment.currency)}</dd>
                  <dt className="text-muted">PayPal capture</dt><dd className="font-mono">{payment.paypalCaptureId}</dd>
                  <dt className="text-muted">Paid</dt><dd>{formatDateTime(payment.createdAt)}</dd>
                  {payment.payerName && <><dt className="text-muted">Payer</dt><dd>{payment.payerName}</dd></>}
                </dl>
              </div>
            ) : isPayPalConfigured() && clientId ? (
              <>
                <PayPalCheckout clientId={clientId} milestoneId={milestone.id} amountCents={milestone.amountCents} />
                <p className="mt-4 text-center text-[12px] text-muted">
                  Sandbox test checkout. Sign in with a PayPal Sandbox <strong>personal</strong> account — no real money moves.
                </p>
              </>
            ) : (
              <PayPalSetup />
            )}
          </div>
        </div>

        {/* Overall schedule so the client sees where this payment fits */}
        <ol className="mt-6 space-y-1.5 text-[13px]">
          {milestones.map((m, i) => (
            <li key={m.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${m.id === milestone.id ? "bg-surface ring-1 ring-line" : ""}`}>
              <span className="flex items-center gap-2">
                <span className={`size-1.5 rounded-full ${m.status === "paid" ? "bg-brand" : "bg-line-strong"}`} aria-hidden />
                {i + 1}. {m.title}
              </span>
              <span className="font-mono text-ink-soft">
                {formatMoney(m.amountCents)} {m.status === "paid" && <span className="text-brand">· paid</span>}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center text-[12px] text-muted">Powered by GlobalGig AI · Payments processed by PayPal</p>
      </div>
    </div>
  );
}
