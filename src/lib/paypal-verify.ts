// Pure PayPal helpers (no secrets, no network) so they can be unit-tested.
// The verification here is what stands between a PayPal response and a
// milestone being marked paid, so it is deliberately strict.

export function centsToValue(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function valueToCents(value: string): number {
  return Math.round(Number.parseFloat(value) * 100);
}

export interface PayPalOrder {
  id: string;
  status: string;
  payer?: { name?: { given_name?: string; surname?: string }; email_address?: string };
  purchase_units: Array<{
    reference_id?: string;
    custom_id?: string;
    amount?: { currency_code: string; value: string };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        custom_id?: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
}

/**
 * Checks a captured order against what we expected to charge. Returns the
 * verified capture details, or a reason it must NOT be treated as paid.
 */
export function verifyCapture(
  order: PayPalOrder,
  expected: { milestoneId: number; amountCents: number; currency: string },
):
  | { ok: true; captureId: string; amountCents: number; currency: string; payerName: string; payerEmail: string }
  | { ok: false; reason: string } {
  if (order.status !== "COMPLETED") return { ok: false, reason: `Order status is ${order.status}, not COMPLETED.` };
  const unit = order.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  if (!capture) return { ok: false, reason: "PayPal returned no capture for this order." };
  if (capture.status !== "COMPLETED") {
    return { ok: false, reason: `Capture status is ${capture.status} (e.g. pending review), not COMPLETED.` };
  }
  const reference = capture.custom_id ?? unit.custom_id;
  if (reference !== String(expected.milestoneId)) {
    return { ok: false, reason: "The payment doesn't reference this milestone." };
  }
  if (capture.amount.currency_code !== expected.currency) {
    return { ok: false, reason: `Currency mismatch: got ${capture.amount.currency_code}.` };
  }
  const amountCents = valueToCents(capture.amount.value);
  if (amountCents !== expected.amountCents) {
    return { ok: false, reason: `Amount mismatch: captured ${capture.amount.value}.` };
  }
  const name = [order.payer?.name?.given_name, order.payer?.name?.surname].filter(Boolean).join(" ");
  return {
    ok: true,
    captureId: capture.id,
    amountCents,
    currency: capture.amount.currency_code,
    payerName: name,
    payerEmail: order.payer?.email_address ?? "",
  };
}
