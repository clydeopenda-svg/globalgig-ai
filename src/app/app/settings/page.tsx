import { getProfile } from "@/lib/db/queries";
import { isAiConfigured } from "@/lib/ai/service";
import { isPayPalConfigured } from "@/lib/paypal";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/primitives";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PayPalSetup } from "@/components/payments/PayPalSetup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await getProfile();
  const ai = isAiConfigured();
  const paypal = isPayPalConfigured();

  return (
    <>
      <PageHeader eyebrow="Settings" title="Workspace settings" description="Your freelancer profile and the services GlobalGig connects to." />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Freelancer profile" description="Personalises pricing and proposals." />
          <ProfileForm initial={profile} />
        </Card>

        <Card>
          <CardHeader title="Integrations" description="Configured with server environment variables (see .env.example)." />
          <ul className="divide-y divide-line">
            <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-medium">Claude AI</p>
                <p className="text-[13px] text-muted">Job analysis, pricing, milestone planning and proposals. Model: {process.env.ANTHROPIC_MODEL || "claude-opus-5-5"}</p>
              </div>
              {ai ? <Badge tone="green">Connected</Badge> : <Badge tone="amber">Set ANTHROPIC_API_KEY</Badge>}
            </li>
            <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-medium">PayPal Orders API</p>
                <p className="text-[13px] text-muted">Milestone checkout and backend capture. Sandbox environment only.</p>
              </div>
              {paypal ? <Badge tone="green">Sandbox connected</Badge> : <Badge tone="amber">Set PayPal credentials</Badge>}
            </li>
          </ul>
        </Card>

        {!ai && (
          <Card className="border-amber/30 p-5 text-sm">
            <p className="font-semibold">Connect the AI</p>
            <p className="mt-1 text-ink-soft">
              Create a key at <a className="font-medium text-brand underline" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">console.anthropic.com → API keys</a>,
              add <code className="rounded bg-ink/5 px-1 font-mono text-[12.5px]">ANTHROPIC_API_KEY=...</code> to <code className="font-mono text-[12.5px]">.env.local</code> and restart the server.
              Until then the studio offers a clearly labelled demo mode.
            </p>
          </Card>
        )}
        {!paypal && <PayPalSetup />}
      </div>
    </>
  );
}
