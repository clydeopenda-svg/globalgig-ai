import Link from "next/link";

// Wordmark: a simple square mark (an upward step = opportunity → income).
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-[-0.01em] text-ink">
      <span className="grid size-7 place-items-center rounded-md bg-ink text-white" aria-hidden>
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 12h3V8.5h3V5h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>
        GlobalGig <span className="text-brand">AI</span>
      </span>
    </Link>
  );
}
