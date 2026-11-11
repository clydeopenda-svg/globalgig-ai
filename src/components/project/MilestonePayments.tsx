"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { formatDate, formatMoney } from "@/lib/format";
import type { Milestone, Payment } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { Badge, Button, Card, CardHeader, ProgressBar, SandboxBadge, buttonClass } from "@/components/ui/primitives";

// Milestone tracker + payment collection. "Request payment" gives the
// freelancer a client-facing PayPal checkout link for that milestone.
export function MilestonePayments({
  milestones,
  payments,
  paypalConfigured,
}: {
  milestones: Milestone[];
  payments: Payment[];
  paypalConfigured: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<number | null>(null);
  const total = milestones.reduce((s, m) => s + m.amountCents, 0);
  const paid = milestones.filter((m) => m.status === "paid").reduce((s, m) => s + m.amountCents, 0);
  const paymentFor = (id: number) => payments.find((p) => p.milestoneId === id);

  async function setStatus(m: Milestone, status: "pending" | "in_progress") {
    setBusy(m.id);
    try {
      await api(`/api/milestones/${m.id}`, { method: "PATCH", body: { status } });
      toast.success(status === "in_progress" ? `"${m.title}" is now in progress.` : `"${m.title}" moved back to pending.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the milestone.");
    } finally {
      setBusy(null);
    }
  }

  async function copyLink(m: Milestone) {
    const url = `${window.location.origin}/pay/${m.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Client payment link copied.");
    } catch {
      toast.info(url);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Milestones & payments"
        description={`${formatMoney(paid)} of ${formatMoney(total)} received`}
        action={<SandboxBadge />}
      />
      <div className="px-5 pt-4">
        <ProgressBar value={total ? (paid / total) * 100 : 0} label="Share of project paid" />
      </div>
      {!paypalConfigured && (
        <p className="mx-5 mt-4 rounded-md bg-amber-soft px-3 py-2 text-[12.5px] text-amber">
          PayPal Sandbox isn&apos;t configured yet, so payment links will show setup instructions. See Settings.
        </p>
      )}
      <ol className="mt-2 divide-y divide-line">
        {milestones.map((m, i) => {
          const payment = paymentFor(m.id);
          return (
            <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[11px] ${
                m.status === "paid" ? "border-brand bg-brand text-white" : m.status === "in_progress" ? "border-brand text-brand" : "border-line-strong text-muted"}`}>
                {m.status === "paid" ? "✓" : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {m.title}
                  {m.status === "paid" && <Badge tone="green">Paid</Badge>}
                  {m.status === "in_progress" && <Badge tone="blue">In progress</Badge>}
                </p>
                <p className="text-[12.5px] text-muted">
                  {m.percent}% · <span className="font-mono">{formatMoney(m.amountCents)}</span>
                  {payment && <> · Paid {formatDate(payment.createdAt)} · capture <span className="font-mono">{payment.paypalCaptureId}</span></>}
                </p>
              </div>
              {m.status !== "paid" && (
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="ghost" loading={busy === m.id}
                    onClick={() => setStatus(m, m.status === "in_progress" ? "pending" : "in_progress")}>
                    {m.status === "in_progress" ? "Mark pending" : "Start work"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => copyLink(m)}>Copy pay link</Button>
                  <a href={`/pay/${m.id}`} target="_blank" rel="noopener" className={buttonClass("primary", "sm")}>
                    Request payment ↗
                  </a>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
