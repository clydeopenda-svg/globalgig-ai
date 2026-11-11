import { NextResponse } from "next/server";
import { getGig, replaceMilestonePlan, type MilestoneInput } from "@/lib/db/queries";
import { cleanText, handleRouteError, jsonError, parseId, readJson } from "@/lib/api";

// PUT /api/gigs/:id/milestones — saves the edited price and milestone plan.
// Body: { priceDollars: number, milestones: [{ id?, title, description, percent }] }
export async function PUT(request: Request, ctx: RouteContext<"/api/gigs/[id]/milestones">) {
  const id = parseId((await ctx.params).id);
  if (!id) return jsonError("Unknown project.", 404);
  const body = await readJson<{ priceDollars?: unknown; milestones?: unknown }>(request);
  if (!body || !Array.isArray(body.milestones)) return jsonError("Invalid request body.", 400);

  const priceDollars = Number(body.priceDollars);
  if (!Number.isFinite(priceDollars) || priceDollars < 1 || priceDollars > 1_000_000) {
    return jsonError("Choose a price between $1 and $1,000,000.", 400);
  }
  if (body.milestones.length === 0 || body.milestones.length > 10) {
    return jsonError("Use between 1 and 10 milestones.", 400);
  }

  const plan: MilestoneInput[] = [];
  for (const raw of body.milestones as Record<string, unknown>[]) {
    const title = cleanText(raw?.title, 120);
    const percent = Math.round(Number(raw?.percent));
    if (!title) return jsonError("Every milestone needs a title.", 400);
    if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
      return jsonError("Milestone percentages must be between 1 and 100.", 400);
    }
    plan.push({
      id: typeof raw.id === "number" ? raw.id : undefined,
      title,
      description: cleanText(raw.description, 600),
      percent,
    });
  }
  if (plan.reduce((s, m) => s + m.percent, 0) !== 100) {
    return jsonError("Milestone percentages must add up to 100%.", 400);
  }

  try {
    if (!(await getGig(id))) return jsonError("Unknown project.", 404);
    await replaceMilestonePlan(id, Math.round(priceDollars * 100), plan);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
