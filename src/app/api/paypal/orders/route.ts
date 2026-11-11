import { NextResponse } from "next/server";
import { attachOrderToMilestone, getGig, getMilestone } from "@/lib/db/queries";
import { createOrder } from "@/lib/paypal";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

// POST /api/paypal/orders — creates a PayPal Sandbox order for one milestone.
// Body: { milestoneId }. The amount and currency are read from the database,
// so a tampered browser request can't change what the client is charged.
export async function POST(request: Request) {
  const body = await readJson<{ milestoneId?: unknown }>(request);
  const milestoneId = Number(body?.milestoneId);
  if (!Number.isSafeInteger(milestoneId) || milestoneId <= 0) return jsonError("Unknown milestone.", 400);

  try {
    const milestone = await getMilestone(milestoneId);
    if (!milestone) return jsonError("Unknown milestone.", 404);
    if (milestone.status === "paid") return jsonError("This milestone has already been paid.", 409);
    const gig = await getGig(milestone.gigId);
    if (!gig) return jsonError("Unknown project.", 404);

    const order = await createOrder({
      milestoneId: milestone.id,
      amountCents: milestone.amountCents,
      currency: gig.currency,
      description: `${gig.title} — ${milestone.title}`,
    });
    await attachOrderToMilestone(milestone.id, order.id);
    return NextResponse.json({ id: order.id });
  } catch (err) {
    return handleRouteError(err);
  }
}
