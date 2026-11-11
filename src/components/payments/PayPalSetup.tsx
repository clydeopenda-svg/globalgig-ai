import { Card } from "@/components/ui/primitives";

// Shown wherever PayPal is needed but the Sandbox credentials are missing.
export function PayPalSetup() {
  return (
    <Card className="border-amber/30 p-5">
      <p className="font-semibold">Connect PayPal Sandbox to accept milestone payments</p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink-soft">
        <li>
          Sign in at <a className="font-medium text-brand underline" href="https://developer.paypal.com/dashboard/applications/sandbox" target="_blank" rel="noopener noreferrer">developer.paypal.com → Apps &amp; Credentials</a> (Sandbox tab).
        </li>
        <li>Create an app (type: Merchant) or open the Default Application.</li>
        <li>
          Copy the <strong>Client ID</strong> and <strong>Secret</strong> into <code className="rounded bg-ink/5 px-1 font-mono text-[12.5px]">.env.local</code>:
          <pre className="mt-2 overflow-x-auto rounded-md bg-ink px-3 py-2 font-mono text-[12px] text-white">{`PAYPAL_CLIENT_ID=...\nPAYPAL_CLIENT_SECRET=...`}</pre>
        </li>
        <li>Restart the dev server. Pay with a Sandbox <em>personal</em> account from Testing Tools → Sandbox Accounts.</li>
      </ol>
      <p className="mt-3 text-[12.5px] text-muted">Sandbox only — no real money moves. The secret stays on the server.</p>
    </Card>
  );
}
