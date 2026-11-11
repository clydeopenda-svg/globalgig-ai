import { NextResponse } from "next/server";
import { getGig, getMilestone, getPaymentByOrder, recordVerifiedPayment } from "@/lib/db/queries";
import { captureOrder, getOrder, PAYPAL_ENVIRONMENT, PayPalError, verifyCapture, type PayPalOrder } from "@/lib/paypal";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

// POST /api/paypal/orders/:orderId/capture — called after the buyer approves.
// Body: { milestoneId }. Captures on PayPal's side, verifies the result
// against the milestone in our database, and only then records it as paid.
export async function POST(request: Request, ctx: RouteContext<"/api/paypal/orders/[orderId]/capture">) {
  const { orderId } = await ctx.params;
  if (!/^[A-Z0-9]{5,40}$/.test(orderId)) return jsonError("Invalid PayPal order id.", 400);
  const body = await readJson<{ milestoneId?: unknown }>(request);
  const milestoneId = Number(body?.milestoneId);

  try {
    // A retried callback for an order we already recorded is answered from the
    // database rather than captured twice.
    const existing = await getPaymentByOrder(orderId);
    if (existing) return NextResponse.json({ payment: existing });

    const milestone = await getMilestone(milestoneId);
    if (!milestone) return jsonError("Unknown milestone.", 404);
    // The order must be the one our backend created for this milestone.
    if (milestone.paypalOrderId !== orderId) return jsonError("This order doesn't belong to this milestone.", 400);
    if (milestone.status === "paid") return jsonError("This milestone has already been paid.", 409);
    const gig = await getGig(milestone.gigId);
    if (!gig) return jsonError("Unknown project.", 404);

    let order: PayPalOrder;
    try {
      order = await captureOrder(orderId);
    } catch (err) {
      // If an earlier attempt captured it but we never heard back, read the
      // order instead and verify that.
      if (err instanceof PayPalError && err.issue === "ORDER_ALREADY_CAPTURED") order = await getOrder(orderId);
      else throw err;
    }

    const verified = verifyCapture(order, {
      milestoneId: milestone.id,
      amountCents: milestone.amountCents,
      currency: gig.currency,
    });
    if (!verified.ok) {
      console.error("PayPal capture failed verification", orderId, verified.reason);
      return jsonError(`Payment not confirmed: ${verified.reason}`, 402, "verification_failed");
    }

    await recordVerifiedPayment({
      gigId: gig.id,
      milestoneId: milestone.id,
      orderId,
      captureId: verified.captureId,
      status: "COMPLETED",
      amountCents: verified.amountCents,
      currency: verified.currency,
      payerName: verified.payerName,
      payerEmail: verified.payerEmail,
      environment: PAYPAL_ENVIRONMENT,
    });
    return NextResponse.json({ payment: await getPaymentByOrder(orderId) });
  } catch (err) {
    return handleRouteError(err);
  }
}
