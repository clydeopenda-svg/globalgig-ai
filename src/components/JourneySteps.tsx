// The core journey, shown on the landing page and the dashboard so the
// product's purpose is obvious at a glance. `current` highlights progress.
export const JOURNEY = [
  "Find an opportunity",
  "Analyse with AI",
  // Price comes before the proposal: the proposal quotes the agreed price.
  "Set a price",
  "Generate proposal",
  "Request payment",
  "Get paid",
] as const;

export function JourneySteps({ current = -1, compact = false }: { current?: number; compact?: boolean }) {
  return (
    <ol className={`flex flex-wrap items-center gap-y-2 ${compact ? "gap-x-1.5 text-[12px]" : "gap-x-2 text-[13px]"}`}>
      {JOURNEY.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-medium ${
                active
                  ? "border-brand bg-mint text-brand"
                  : done
                    ? "border-mint-strong bg-mint/60 text-brand"
                    : "border-line bg-surface text-ink-soft"
              }`}
            >
              <span className="font-mono text-[10.5px] opacity-70">{String(i + 1).padStart(2, "0")}</span>
              {step}
            </span>
            {i < JOURNEY.length - 1 && <span className="text-line-strong" aria-hidden>→</span>}
          </li>
        );
      })}
    </ol>
  );
}
