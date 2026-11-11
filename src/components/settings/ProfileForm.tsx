"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import type { FreelancerProfile } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { Button, Field, inputClass } from "@/components/ui/primitives";

export function ProfileForm({ initial }: { initial: FreelancerProfile }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ ...initial, hourlyRate: initial.hourlyRate === null ? "" : String(initial.hourlyRate) });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/settings/profile", { method: "PUT", body: { ...form, hourlyRate: form.hourlyRate || null } });
      toast.success("Profile saved. New analyses will use it.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-4 p-5 sm:grid-cols-2">
      <Field label="Your name" htmlFor="p-name" hint="Used to sign proposals.">
        <input id="p-name" className={inputClass} value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Target hourly rate (USD)" htmlFor="p-rate" hint="The AI prices work from this. Leave blank to use market rates.">
        <input id="p-rate" inputMode="numeric" className={`${inputClass} font-mono`} value={form.hourlyRate}
          onChange={(e) => setForm({ ...form, hourlyRate: e.target.value.replace(/\D/g, "") })} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Headline" htmlFor="p-headline">
          <input id="p-headline" className={inputClass} value={form.headline} maxLength={160} placeholder="Full-stack developer specialising in e-commerce"
            onChange={(e) => setForm({ ...form, headline: e.target.value })} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Skills" htmlFor="p-skills" hint="Comma-separated. Proposals highlight relevant experience.">
          <textarea id="p-skills" rows={2} className={inputClass} value={form.skills} maxLength={400} placeholder="React, Next.js, Node, Stripe, PayPal, Figma"
            onChange={(e) => setForm({ ...form, skills: e.target.value })} />
        </Field>
      </div>
      <div className="sm:col-span-2"><Button type="submit" loading={saving}>Save profile</Button></div>
    </form>
  );
}
