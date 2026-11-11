import { NextResponse } from "next/server";
import { deleteGig, getGig, hasPayments, updateGigDetails } from "@/lib/db/queries";
import { cleanText, handleRouteError, jsonError, parseId, readJson } from "@/lib/api";

// PATCH /api/gigs/:id — rename the project or set the client name.
export async function PATCH(request: Request, ctx: RouteContext<"/api/gigs/[id]">) {
  const id = parseId((await ctx.params).id);
  if (!id) return jsonError("Unknown project.", 404);
  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return jsonError("Invalid request body.", 400);

  const title = body.title === undefined ? undefined : cleanText(body.title, 120);
  if (title === "") return jsonError("The project needs a title.", 400);
  try {
    if (!(await getGig(id))) return jsonError("Unknown project.", 404);
    await updateGigDetails(id, {
      title,
      clientName: body.clientName === undefined ? undefined : cleanText(body.clientName, 120),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}

// DELETE /api/gigs/:id — only allowed before any money has been received,
// so payment records are never orphaned or lost.
export async function DELETE(_request: Request, ctx: RouteContext<"/api/gigs/[id]">) {
  const id = parseId((await ctx.params).id);
  if (!id) return jsonError("Unknown project.", 404);
  try {
    if (await hasPayments(id)) {
      return jsonError("This project has received payments, so it can't be deleted.", 409);
    }
    await deleteGig(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
