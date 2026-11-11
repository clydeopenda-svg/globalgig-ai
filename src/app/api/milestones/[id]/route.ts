import { NextResponse } from "next/server";
import { getMilestone, setMilestoneStatus } from "@/lib/db/queries";
import { handleRouteError, jsonError, parseId, readJson } from "@/lib/api";

// PATCH /api/milestones/:id — move a milestone between "pending" and
// "in_progress". "paid" is deliberately not accepted: only a verified PayPal
// capture can mark a milestone paid.
export async function PATCH(request: Request, ctx: RouteContext<"/api/milestones/[id]">) {
  const id = parseId((await ctx.params).id);
  if (!id) return jsonError("Unknown milestone.", 404);
  const body = await readJson<{ status?: unknown }>(request);
  if (body?.status !== "pending" && body?.status !== "in_progress") {
    return jsonError("Status must be pending or in_progress.", 400);
  }
  try {
    const milestone = await getMilestone(id);
    if (!milestone) return jsonError("Unknown milestone.", 404);
    if (milestone.status === "paid") return jsonError("Paid milestones can't be changed.", 409);
    await setMilestoneStatus(id, body.status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
