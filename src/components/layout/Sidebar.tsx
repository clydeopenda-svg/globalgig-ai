"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const NAV = [
  { href: "/app", label: "Overview", icon: "M3 10.5 10 4l7 6.5V16a1 1 0 0 1-1 1h-3.5v-4h-5v4H4a1 1 0 0 1-1-1z" },
  { href: "/app/studio", label: "AI Gig Studio", icon: "M10 2.5l1.8 4.2 4.2 1.8-4.2 1.8L10 14.5l-1.8-4.2L4 8.5l4.2-1.8zM15.5 13l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z" },
  { href: "/app/proposals", label: "Proposals", icon: "M6 2.5h5.5L15 6v11a.5.5 0 0 1-.5.5h-8.5A1 1 0 0 1 5 16.5v-13a1 1 0 0 1 1-1zM11 2.5V6.5h4M7.5 10h5M7.5 13h5" },
  { href: "/app/projects", label: "Projects", icon: "M3 5.5A1.5 1.5 0 0 1 4.5 4H8l1.5 2h6A1.5 1.5 0 0 1 17 7.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5z" },
  { href: "/app/payments", label: "Payments", icon: "M2.5 5.5h15v9h-15zM2.5 8.5h15M5.5 12h3" },
  { href: "/app/settings", label: "Settings", icon: "M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" },
];

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Workspace" className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13.5px] font-medium transition-colors ${
              active ? "bg-surface text-ink shadow-[0_0_0_1px_var(--line)]" : "text-ink-soft hover:bg-ink/[0.04] hover:text-ink"
            }`}
          >
            <svg viewBox="0 0 20 20" className={`size-[18px] ${active ? "text-brand" : "text-muted group-hover:text-ink-soft"}`}
              fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
              <path d={item.icon} />
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="rounded-lg border border-line bg-surface p-3 text-[12.5px]">
      <p className="font-medium text-ink">Opportunity → income</p>
      <p className="mt-0.5 text-muted">Analyse a gig, send the proposal, get paid per milestone with PayPal.</p>
      <Link href="/app/studio" className="mt-2 inline-block font-medium text-brand hover:underline">
        Analyse a new gig →
      </Link>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  // The drawer closes when a nav link is clicked (onNavigate) or on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-line px-3 py-5 lg:flex">
        <div className="px-2"><Logo href="/app" /></div>
        <NavLinks />
        <div className="mt-auto"><SidebarFooter /></div>
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo href="/app" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-line-strong px-2.5 py-1.5 text-sm font-medium"
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          Menu
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" id="mobile-nav">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
          <div className="animate-page-in absolute inset-y-0 left-0 flex w-72 flex-col gap-6 bg-canvas px-3 py-5 shadow-xl">
            <div className="flex items-center justify-between px-2">
              <Logo href="/app" />
              <button type="button" onClick={() => setOpen(false)} className="text-xl text-muted" aria-label="Close menu">×</button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto"><SidebarFooter /></div>
          </div>
        </div>
      )}
    </>
  );
}
