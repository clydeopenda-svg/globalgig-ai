import { NextResponse } from "next/server";
import { AnalysisSchema } from "@/lib/ai/schemas";
import { createOpportunity, saveAnalysedGig } from "@/lib/db/queries";
import { cleanText, handleRouteError, jsonError, parseId, readJson } from "@/lib/api";

// POST /api/gigs — two ways to add work to the pipeline:
//   { kind: "opportunity", description, clientName, title? }
//       saves the job post un-analysed (the "Opportunity" pipeline stage);
//   { description, clientName, analysis, source, priceDollars, gigId? }
//       saves a reviewed analysis as a project. With gigId, an existing
//       opportunity is upgraded in place.
// The analysis comes back from the browser after editing, so it is
// re-validated against the same schema the AI output had to match.
export async function POST(request: Request) {
  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return jsonError("Invalid request body.", 400);

  const description = cleanText(body.description, 8000);
  const clientName = cleanText(body.clientName, 120);
  if (description.length < 40) return jsonError("Paste a fuller job description (at least a couple of sentences).", 400);

  try {
    if (body.kind === "opportunity") {
      const title = cleanText(body.title, 120) || titleFromDescription(description);
      const id = await createOpportunity({ title, clientName, description });
      return NextResponse.json({ id }, { status: 201 });
    }

    const parsed = AnalysisSchema.safeParse(body.analysis);
    if (!parsed.success) return jsonError("The analysis is incomplete or malformed.", 400);
    const analysis = parsed.data;
    if (analysis.milestones.length === 0) return jsonError("Add at least one milestone.", 400);

    const priceDollars = Number(body.priceDollars);
    if (!Number.isFinite(priceDollars) || priceDollars < 1 || priceDollars > 1_000_000) {
      return jsonError("Choose a price between $1 and $1,000,000.", 400);
    }
    const gigId = body.gigId === undefined || body.gigId === null ? undefined : parseId(String(body.gigId));
    if (gigId === null) return jsonError("Unknown opportunity.", 404);

    const id = await saveAnalysedGig({
      gigId,
      description,
      clientName,
      analysis: { ...analysis, title: analysis.title.trim().slice(0, 120) || "Untitled project" },
      source: body.source === "ai" ? "ai" : "demo",
      priceDollars,
    });
    return NextResponse.json({ id }, { status: gigId ? 200 : 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** A readable placeholder title until the AI names the project: the first few words. */
function titleFromDescription(description: string): string {
  const words = description.replace(/\s+/g, " ").split(" ").slice(0, 8).join(" ");
  return words.length < description.length ? `${words}…` : words;
}
