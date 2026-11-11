import "server-only";
import { NextResponse } from "next/server";
import { AiError } from "@/lib/ai/service";
import { PayPalError } from "@/lib/paypal";
import { PlanError } from "@/lib/db/queries";

// Small helpers that keep every route handler's error format identical:
// { error: string, code?: string }. The UI reads `error` for toasts and
// `code` to decide whether to offer demo mode.

export function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function readJson<T = unknown>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Maps known service errors to clean responses; anything else is a logged 500. */
export function handleRouteError(err: unknown) {
  if (err instanceof AiError) return jsonError(err.message, err.status, err.code);
  if (err instanceof PayPalError) return jsonError(err.message, err.status >= 500 ? 502 : err.status, err.issue);
  if (err instanceof PlanError) return jsonError(err.message, 400);
  console.error(err);
  return jsonError("Something went wrong on our side. Please try again.", 500);
}

export function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
