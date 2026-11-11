import { NextResponse } from "next/server";
import { ProposalSchema } from "@/lib/ai/schemas";
import { writeProposal } from "@/lib/ai/service";
import { buildTemplateProposal } from "@/lib/ai/demo";
import { getGig, getProfile, listMilestones, saveProposal } from "@/lib/db/queries";
import { handleRouteError, jsonError, parseId, readJson } from "@/lib/api";

// POST /api/gigs/:id/proposal — generate a proposal from the saved plan.
// Body: { mode: "ai" | "demo" }. "demo" builds a labelled template instead
// of calling the AI, for when no API key is configured.
export async function POST(request: Request, ctx: RouteContext<"/api/gigs/[id]/proposal">) {
  const id = parseId((await ctx.params).id);
  if (!id) return jsonError("Unknown project.", 404);
  const body = await readJson<{ mode?: unknown }>(request);
  const mode = body?.mode === "demo" ? "demo" : "ai";

  try {
    const gig = await getGig(id);
    if (!gig) return jsonError("Unknown project.", 404);
    if (!gig.analysis || !gig.priceCents) return jsonError("Analyse the opportunity before writing a proposal.", 409);
    const milestones = await listMilestones(id);

    const proposal =
      mode === "demo"
        ? buildTemplateProposal({ analysis: gig.analysis, clientName: gig.clientName, priceCents: gig.priceCents, milestones })
        : await writeProposal({
            description: gig.description,
            clientName: gig.clientName,
            analysis: gig.analysis,
            priceCents: gig.priceCents,
            milestones,
            profile: await getProfile(),
          });
    await saveProposal(id, proposal, mode);
    return NextResponse.json({ proposal, source: mode });
  } catch (err) {
    return handleRouteError(err);
  }
}

// PUT /api/gigs/:id/proposal — save the freelancer's edits.
export async function PUT(request: Request, ctx: RouteContext<"/api/gigs/[id]/proposal">) {
  const id = parseId((await ctx.params).id);
  if (!id) return jsonError("Unknown project.", 404);
  const body = await readJson<{ proposal?: unknown }>(request);
  const parsed = ProposalSchema.safeParse(body?.proposal);
  if (!parsed.success) return jsonError("The proposal is incomplete.", 400);

  try {
    const gig = await getGig(id);
    if (!gig) return jsonError("Unknown project.", 404);
    // Edited text keeps its origin label unless it was never generated.
    await saveProposal(id, parsed.data, gig.proposalSource ?? "manual");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
