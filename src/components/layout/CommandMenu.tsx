"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABELS, type GigStatus } from "@/lib/types";

// ⌘K / Ctrl+K command menu: jump to any page or project from the keyboard.
// Projects are fetched when the menu opens, so the list is always current.

interface Command {
  id: string;
  label: string;
  hint?: string;
  group: "Actions" | "Go to" | "Projects";
  href: string;
}

const STATIC_COMMANDS: Command[] = [
  { id: "new", label: "Analyse a new opportunity", group: "Actions", href: "/app/studio" },
  { id: "overview", label: "Overview", group: "Go to", href: "/app" },
  { id: "studio", label: "AI Gig Studio", group: "Go to", href: "/app/studio" },
  { id: "proposals", label: "Proposals", group: "Go to", href: "/app/proposals" },
  { id: "projects", label: "Projects", group: "Go to", href: "/app/projects" },
  { id: "payments", label: "Payments", group: "Go to", href: "/app/payments" },
  { id: "settings", label: "Settings", group: "Go to", href: "/app/settings" },
];

/** Opens the menu from anywhere (e.g. the sidebar search button). */
export function openCommandMenu() {
  window.dispatchEvent(new Event("open-command-menu"));
}

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [projects, setProjects] = useState<Command[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const show = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
    fetch("/api/gigs")
      .then((r) => (r.ok ? r.json() : { gigs: [] }))
      .then((data: { gigs: { id: number; title: string; clientName: string; status: GigStatus }[] }) =>
        setProjects(
          data.gigs.map((g) => ({
            id: `gig-${g.id}`,
            label: g.title,
            hint: [g.clientName, STATUS_LABELS[g.status]].filter(Boolean).join(" · "),
            group: "Projects",
            href: `/app/projects/${g.id}`,
          })),
        ),
      )
      .catch(() => setProjects([])); // navigation still works without project search
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-menu", show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-menu", show);
    };
  }, [open, show]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = [...STATIC_COMMANDS, ...projects];
    if (!q) return all;
    return all.filter((c) => `${c.label} ${c.hint ?? ""}`.toLowerCase().includes(q));
  }, [query, projects]);

  // Keep the highlighted row visible while arrowing through a long list.
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function run(command: Command | undefined) {
    if (!command) return;
    setOpen(false);
    router.push(command.href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command menu">
      <button type="button" aria-label="Close command menu" className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
      <div className="animate-toast-in relative w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-[0_24px_60px_rgb(23_25_28/0.2)]">
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded="true"
          aria-controls="command-results"
          aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
          placeholder="Search pages and projects…"
          className="w-full border-b border-line bg-transparent px-4 py-3.5 text-[15px] outline-none placeholder:text-muted"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); run(results[active]); }
            else if (e.key === "Escape") setOpen(false);
          }}
        />
        <ul id="command-results" role="listbox" ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matches</li>}
          {results.map((c, i) => (
            <li key={c.id}>
              {(i === 0 || results[i - 1].group !== c.group) && (
                <p className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{c.group}</p>
              )}
              <button
                type="button"
                id={`cmd-${c.id}`}
                role="option"
                aria-selected={i === active}
                data-index={i}
                onMouseMove={() => setActive(i)}
                onClick={() => run(c)}
                className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-sm ${i === active ? "bg-mint text-brand" : "text-ink"}`}
              >
                <span className="truncate">{c.label}</span>
                {c.hint && <span className="shrink-0 text-[12px] text-muted">{c.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-4 border-t border-line bg-canvas px-4 py-2 text-[11.5px] text-muted">
          <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate</span>
          <span><Kbd>↵</Kbd> open</span>
          <span><Kbd>esc</Kbd> close</span>
        </div>
      </div>
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-line-strong bg-surface px-1 font-mono text-[10.5px] text-ink-soft">{children}</kbd>;
}
