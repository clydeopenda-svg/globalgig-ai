import { NextResponse } from "next/server";
import { analyseOpportunity } from "@/lib/ai/service";
import { getProfile } from "@/lib/db/queries";
import { cleanText, handleRouteError, jsonError, readJson } from "@/lib/api";

// POST /api/ai/analyse — runs real AI inference on a pasted job description.
// Nothing is saved here; the freelancer reviews and edits the result first.
export async function POST(request: Request) {
  const body = await readJson<{ description?: unknown }>(request);
  const description = cleanText(body?.description, 8000);
  if (description.length < 40) {
    return jsonError("Paste a fuller job description (at least a couple of sentences).", 400);
  }
  try {
    const analysis = await analyseOpportunity(description, await getProfile());
    return NextResponse.json({ analysis, source: "ai" });
  } catch (err) {
    return handleRouteError(err);
  }
}
