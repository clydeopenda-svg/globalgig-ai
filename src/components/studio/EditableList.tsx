"use client";

import { inputClass } from "@/components/ui/primitives";

// A list of short text items the freelancer can edit, add to and remove from.
export function EditableList({
  items,
  onChange,
  label,
  addLabel = "Add item",
}: {
  items: string[];
  onChange: (items: string[]) => void;
  label: string;
  addLabel?: string;
}) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="group flex items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full bg-brand/60" aria-hidden />
          <input
            aria-label={`${label} ${i + 1}`}
            className={`${inputClass} border-transparent bg-transparent px-2 py-1 hover:border-line focus:bg-surface`}
            value={item}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="px-1 text-muted opacity-60 hover:text-danger group-hover:opacity-100"
            aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="ml-3.5 text-[13px] font-medium text-brand hover:underline"
      >
        + {addLabel}
      </button>
    </div>
  );
}
