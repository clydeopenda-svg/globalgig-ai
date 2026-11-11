import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import type { ContentSource, GigStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

// Shared presentational building blocks. Server-safe (no hooks), so both
// server pages and client components can use them.

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-brand-ink hover:bg-brand-hover border border-brand",
  secondary: "bg-surface text-ink border border-line-strong hover:border-ink/40 hover:bg-canvas",
  ghost: "text-ink-soft hover:bg-ink/5 border border-transparent",
  danger: "bg-surface text-danger border border-line-strong hover:bg-danger-soft hover:border-danger/40",
};
const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-[15px] gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Card({ className = "", children, ...props }: ComponentProps<"section">) {
  return (
    <section {...props} className={`rounded-xl border border-line bg-surface ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = "neutral" | "green" | "amber" | "red" | "blue";
const TONES: Record<Tone, string> = {
  neutral: "bg-ink/5 text-ink-soft",
  green: "bg-mint text-brand",
  amber: "bg-amber-soft text-amber",
  red: "bg-danger-soft text-danger",
  blue: "bg-info-soft text-info",
};

export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11.5px] font-medium ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

const STATUS_TONES: Record<GigStatus, Tone> = {
  opportunity: "neutral",
  analysed: "blue",
  proposal: "amber",
  in_progress: "blue",
  paid: "green",
};

export function StatusBadge({ status }: { status: GigStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}

/** Honest provenance label: what the AI wrote vs. labelled demo content. */
export function SourceBadge({ source }: { source: ContentSource | null }) {
  if (source === "ai") return <Badge tone="green">AI generated</Badge>;
  if (source === "demo") return <Badge tone="amber">Demo data — not AI</Badge>;
  if (source === "manual") return <Badge>Written manually</Badge>;
  return null;
}

export function SandboxBadge() {
  return <Badge tone="amber">PayPal Sandbox</Badge>;
}

export function PageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{eyebrow}</p>}
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink sm:text-[30px]">{title}</h1>
        {description && <p className="mt-2 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
      <div className="mb-4 grid size-10 place-items-center rounded-lg bg-mint text-brand" aria-hidden>
        <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M10 4v12M4 10h12" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}
      className="h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.06]">
      <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
