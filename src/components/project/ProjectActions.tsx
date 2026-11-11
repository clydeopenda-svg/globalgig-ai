"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button, Field, inputClass } from "@/components/ui/primitives";

// Edit project details / delete project, each behind a modal dialog.
export function ProjectActions({ gigId, title, clientName, canDelete }: {
  gigId: number;
  title: string;
  clientName: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const [form, setForm] = useState({ title, clientName });
  const [busy, setBusy] = useState(false);

  async function saveDetails() {
    setBusy(true);
    try {
      await api(`/api/gigs/${gigId}`, { method: "PATCH", body: form });
      toast.success("Project details updated.");
      setMode(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the project.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api(`/api/gigs/${gigId}`, { method: "DELETE" });
      toast.success("Project deleted.");
      router.push("/app/projects");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the project.");
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => { setForm({ title, clientName }); setMode("edit"); }}>Edit details</Button>
      {canDelete && <Button variant="danger" onClick={() => setMode("delete")}>Delete</Button>}

      <Modal open={mode === "edit"} onClose={() => setMode(null)} title="Edit project"
        footer={<><Button variant="ghost" onClick={() => setMode(null)}>Cancel</Button><Button onClick={saveDetails} loading={busy}>Save</Button></>}>
        <div className="space-y-4">
          <Field label="Project title" htmlFor="edit-title">
            <input id="edit-title" className={inputClass} value={form.title} maxLength={120}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Client name" htmlFor="edit-client" hint="Shown on the client's payment page and proposal.">
            <input id="edit-client" className={inputClass} value={form.clientName} maxLength={120}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <Modal open={mode === "delete"} onClose={() => setMode(null)} title="Delete this project?"
        footer={<><Button variant="ghost" onClick={() => setMode(null)}>Cancel</Button><Button variant="danger" onClick={remove} loading={busy}>Delete project</Button></>}>
        <p className="text-sm text-ink-soft">
          This permanently removes the analysis, proposal and milestones for <strong>{title}</strong>. It can&apos;t be undone.
        </p>
      </Modal>
    </>
  );
}
