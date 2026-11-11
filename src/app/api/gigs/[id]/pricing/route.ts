import { NextResponse } from "next/server";
import { recommendPricing } from "@/lib/ai/service";
import { getGig, getProfile, listMilestones } from "@/lib/db/queries";
import { cleanText, handleRouteError, jsonError, parseId, readJson } from "@/lib/api";

// POST /api/gigs/:id/pricing — AI price recommendation for the current scope.
// Body: { note?: string }. Nothing is saved: the freelancer applies a price
// through the plan editor, so AI never changes what a client is charged.
export async function POST(request: Request, ctx: RouteContext<"/api/gigs/[id]/pricing">) {
  const id = parseId((await ctx.params).id);
  if (!id) return jsonError("Unknown project.", 404);
  const body = await readJson<{ note?: unknown }>(request);
  try {
    const gig = await getGig(id);
    if (!gig) return jsonError("Unknown project.", 404);
    if (!gig.analysis) return jsonError("Analyse the opportunity before re-pricing it.", 409);
    const pricing = await recommendPricing({
      description: gig.description,
      analysis: gig.analysis,
      milestones: await listMilestones(id),
      currentPriceCents: gig.priceCents ?? 0,
      note: cleanText(body?.note, 500),
      profile: await getProfile(),
    });
    return NextResponse.json({ pricing });
  } catch (err) {
    return handleRouteError(err);
  }
}
