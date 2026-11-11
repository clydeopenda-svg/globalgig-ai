"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Accessible modal built on the native <dialog> element: focus trapping,
// Escape-to-close and the backdrop come from the browser for free.
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-line bg-surface p-0 text-ink shadow-[0_24px_60px_rgb(23_25_28/0.18)]"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <button type="button" onClick={onClose} className="text-xl leading-none text-muted hover:text-ink" aria-label="Close">
          ×
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
    </dialog>
  );
}
