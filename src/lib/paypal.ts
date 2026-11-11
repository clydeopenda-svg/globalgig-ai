import "server-only";

// PayPal Orders API v2 client (Sandbox only).
//
// Flow: the browser's PayPal button asks OUR backend to create an order. The
// amount comes from the milestone in our database, never from the browser.
// After the buyer approves in the PayPal window, the browser asks OUR backend
// to capture; we verify the capture (status, amount, currency, milestone
// reference) before anything is marked paid.
//
// The client secret is read here and never sent to the browser. Only the
// public client id is exposed (the JS SDK needs it).

import { centsToValue, type PayPalOrder } from "./paypal-verify";
export { verifyCapture, type PayPalOrder } from "./paypal-verify";

// Hard-coded to Sandbox on purpose: this project must never move real money.
const PAYPAL_API = "https://api-m.sandbox.paypal.com";
export const PAYPAL_ENVIRONMENT = "sandbox";

export class PayPalError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly issue?: string,
  ) {
    super(message);
  }
}

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export function getPayPalClientId(): string | null {
  return process.env.PAYPAL_CLIENT_ID || null;
}

// Access tokens last ~9 hours; cache one per server instance and refresh a
// minute early so a token never expires mid-request.
let cachedToken: { value: string; expiresAt: number } | undefined;

async function getAccessToken(): Promise<string> {
  if (!isPayPalConfigured()) {
    throw new PayPalError("PayPal isn't configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.", 503);
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("PayPal auth failed", res.status, await res.text());
    throw new PayPalError(
      res.status === 401
        ? "PayPal rejected the Sandbox credentials. Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET."
        : "Couldn't reach PayPal. Please try again.",
      502,
    );
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

async function paypalFetch<T>(path: string, init: RequestInit & { requestId?: string } = {}): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Idempotency key: PayPal returns the original result instead of
      // repeating the operation if the same request is retried.
      ...(init.requestId ? { "PayPal-Request-Id": init.requestId } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const issue: string | undefined = body?.details?.[0]?.issue;
    console.error("PayPal API error", path, res.status, issue ?? body?.name);
    throw new PayPalError(paypalMessage(issue) ?? `PayPal returned an error (${res.status}).`, res.status, issue);
  }
  return body as T;
}

/** Friendly messages for the issues a buyer can realistically hit. */
function paypalMessage(issue?: string): string | undefined {
  switch (issue) {
    case "INSTRUMENT_DECLINED":
      return "The payment method was declined. Please choose another funding source in PayPal.";
    case "ORDER_NOT_APPROVED":
      return "The order hasn't been approved by the buyer yet.";
    case "ORDER_ALREADY_CAPTURED":
      return "This order has already been captured.";
    case "PAYER_ACTION_REQUIRED":
      return "PayPal needs the buyer to complete an extra step.";
    default:
      return undefined;
  }
}

export async function createOrder(input: {
  milestoneId: number;
  amountCents: number;
  currency: string;
  description: string;
}): Promise<PayPalOrder> {
  return paypalFetch<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `milestone-${input.milestoneId}`,
          // custom_id travels with the capture, so we can prove which
          // milestone a payment belongs to when verifying it.
          custom_id: String(input.milestoneId),
          description: input.description.slice(0, 127),
          amount: { currency_code: input.currency, value: centsToValue(input.amountCents) },
        },
      ],
    }),
  });
}

export async function captureOrder(orderId: string): Promise<PayPalOrder> {
  return paypalFetch<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    requestId: `capture-${orderId}`,
  });
}

export async function getOrder(orderId: string): Promise<PayPalOrder> {
  return paypalFetch<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
}
