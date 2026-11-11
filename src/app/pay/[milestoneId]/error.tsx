"use client";

import { Button } from "@/components/ui/primitives";

// The client-facing payment page gets its own neutral error screen, so a
// client never sees workspace navigation.
export default function PayError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="max-w-sm">
        <h1 className="text-xl font-semibold">This payment page couldn&apos;t load</h1>
        <p className="mt-2 text-muted">You haven&apos;t been charged. Please try again in a moment.</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
