import { NextResponse } from "next/server";
import { saveProfile } from "@/lib/db/queries";
import { cleanText, handleRouteError, jsonError, readJson } from "@/lib/api";

// PUT /api/settings/profile — the freelancer profile the AI uses to tailor
// pricing (hourly rate) and proposals (name, headline, skills).
export async function PUT(request: Request) {
  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return jsonError("Invalid request body.", 400);
  let hourlyRate: number | null = null;
  if (body.hourlyRate !== null && body.hourlyRate !== "" && body.hourlyRate !== undefined) {
    hourlyRate = Math.round(Number(body.hourlyRate));
    if (!Number.isFinite(hourlyRate) || hourlyRate < 5 || hourlyRate > 1000) {
      return jsonError("Hourly rate must be between $5 and $1,000.", 400);
    }
  }
  try {
    await saveProfile({
      name: cleanText(body.name, 80),
      headline: cleanText(body.headline, 160),
      skills: cleanText(body.skills, 400),
      hourlyRate,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
