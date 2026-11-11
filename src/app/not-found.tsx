import { ButtonLink } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-mono text-sm text-brand">404</p>
        <h1 className="mt-2 text-2xl font-semibold">This page doesn&apos;t exist</h1>
        <p className="mt-1 text-muted">The project or payment link may have been removed.</p>
        <ButtonLink href="/app" className="mt-6">Back to workspace</ButtonLink>
      </div>
    </div>
  );
}
