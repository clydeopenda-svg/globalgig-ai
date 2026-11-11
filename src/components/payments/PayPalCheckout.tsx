"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/client-api";
import { formatMoney } from "@/lib/format";
import type { Payment } from "@/lib/types";
import { Spinner } from "@/components/ui/primitives";

// Minimal typing for the parts of the PayPal JS SDK we use.
interface PayPalButtonsActions {
  restart: () => Promise<void>;
}
interface PayPalNamespace {
  Buttons: (options: {
    style?: Record<string, unknown>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }, actions: PayPalButtonsActions) => Promise<void>;
    onCancel?: () => void;
    onError?: (err: unknown) => void;
  }) => { render: (el: HTMLElement) => Promise<void>; close?: () => void };
}
declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

/** Loads the PayPal JS SDK once per page. Only the PUBLIC client id is used here. */
function loadSdk(clientId: string): Promise<PayPalNamespace> {
  if (window.paypal) return Promise.resolve(window.paypal);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`;
    script.async = true;
    script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error("PayPal SDK unavailable")));
    script.onerror = () => reject(new Error("Couldn't load PayPal. Check your connection or ad blocker."));
    document.head.appendChild(script);
  });
}

type State =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "processing" }
  | { kind: "error"; message: string }
  | { kind: "paid"; payment: Payment };

export function PayPalCheckout({ clientId, milestoneId, amountCents }: { clientId: string; milestoneId: number; amountCents: number }) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let buttons: ReturnType<PayPalNamespace["Buttons"]> | undefined;

    loadSdk(clientId)
      .then((paypal) => {
        if (cancelled || !container.current) return;
        buttons = paypal.Buttons({
          style: { layout: "vertical", shape: "rect", label: "pay", height: 45 },
          // 1. Our backend creates the order with the amount from the database.
          createOrder: async () => {
            setNotice(null);
            const { id } = await api<{ id: string }>("/api/paypal/orders", { body: { milestoneId } });
            return id;
          },
          // 2. Buyer approved in PayPal → our backend captures and verifies.
          onApprove: async (data, actions) => {
            setState({ kind: "processing" });
            try {
              const { payment } = await api<{ payment: Payment }>(`/api/paypal/orders/${data.orderID}/capture`, {
                body: { milestoneId },
              });
              setState({ kind: "paid", payment });
              router.refresh();
            } catch (err) {
              // A declined funding source can be retried in the same PayPal window.
              if (err instanceof ApiError && err.code === "INSTRUMENT_DECLINED") {
                setState({ kind: "ready" });
                setNotice(err.message);
                return actions.restart();
              }
              setState({ kind: "error", message: err instanceof Error ? err.message : "Payment could not be completed." });
            }
          },
          onCancel: () => setNotice("Payment cancelled. You haven't been charged."),
          onError: (err) => {
            console.error("PayPal button error", err);
            setNotice(err instanceof ApiError ? err.message : "PayPal couldn't start the payment. Please try again.");
          },
        });
        return buttons.render(container.current).then(() => !cancelled && setState({ kind: "ready" }));
      })
      .catch((err: Error) => !cancelled && setState({ kind: "error", message: err.message }));

    return () => {
      cancelled = true;
      buttons?.close?.();
    };
  }, [clientId, milestoneId, router]);

  if (state.kind === "paid") {
    const p = state.payment;
    return (
      <div className="rounded-lg border border-mint-strong bg-mint p-5" role="status">
        <p className="font-semibold text-brand">Payment received and verified</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
          <dt className="text-muted">Amount</dt><dd className="font-mono font-medium">{formatMoney(p.amountCents, p.currency)}</dd>
          <dt className="text-muted">PayPal capture</dt><dd className="font-mono">{p.paypalCaptureId}</dd>
          <dt className="text-muted">Order</dt><dd className="font-mono">{p.paypalOrderId}</dd>
          <dt className="text-muted">Status</dt><dd>{p.status} · Sandbox</dd>
        </dl>
      </div>
    );
  }

  return (
    <div>
      {state.kind === "error" && (
        <p role="alert" className="mb-3 rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{state.message}</p>
      )}
      {notice && <p role="status" className="mb-3 rounded-md bg-amber-soft px-3 py-2 text-[13px] text-amber">{notice}</p>}
      {(state.kind === "loading" || state.kind === "processing") && (
        <p className="mb-3 flex items-center gap-2 text-[13px] text-muted">
          <Spinner /> {state.kind === "loading" ? "Loading secure PayPal checkout…" : `Confirming your ${formatMoney(amountCents)} payment with PayPal…`}
        </p>
      )}
      <div ref={container} className={state.kind === "processing" ? "pointer-events-none opacity-40" : ""} />
    </div>
  );
}
