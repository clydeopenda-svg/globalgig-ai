import { NextResponse } from "next/server";
import { AnalysisSchema } from "@/lib/ai/schemas";
import { createGigFromAnalysis } from "@/lib/db/queries";
import { cleanText, handleRouteError, jsonError, readJson } from "@/lib/api";

// POST /api/gigs — saves a reviewed (and possibly edited) analysis as a project.
// The analysis comes back from the browser after editing, so it is
// re-validated against the same schema the AI output had to match.
export async function POST(request: Request) {
  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return jsonError("Invalid request body.", 400);

  const parsed = AnalysisSchema.safeParse(body.analysis);
  if (!parsed.success) return jsonError("The analysis is incomplete or malformed.", 400);
  const analysis = parsed.data;
  if (analysis.milestones.length === 0) return jsonError("Add at least one milestone.", 400);

  const description = cleanText(body.description, 8000);
  const priceDollars = Number(body.priceDollars);
  if (!description) return jsonError("The job description is missing.", 400);
  if (!Number.isFinite(priceDollars) || priceDollars < 1 || priceDollars > 1_000_000) {
    return jsonError("Choose a price between $1 and $1,000,000.", 400);
  }
  const source = body.source === "ai" ? "ai" : "demo";

  try {
    const id = await createGigFromAnalysis({
      description,
      clientName: cleanText(body.clientName, 120),
      analysis: { ...analysis, title: analysis.title.trim().slice(0, 120) || "Untitled project" },
      source,
      priceDollars,
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
