"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/primitives";

// Error boundary for workspace pages (e.g. the database is unreachable).
// Shows a recoverable message instead of a blank screen, and logs the error.
export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="font-mono text-sm text-danger">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">This page couldn&apos;t load</h1>
      <p className="mt-2 text-muted">
        Your data is safe. This is usually a temporary problem reaching the database. Try again, or go back to the overview.
      </p>
      {error.digest && <p className="mt-2 font-mono text-[12px] text-muted">Reference: {error.digest}</p>}
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/app" variant="secondary">Overview</ButtonLink>
      </div>
    </div>
  );
}
