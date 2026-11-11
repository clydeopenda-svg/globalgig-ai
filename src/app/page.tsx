import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { JourneySteps } from "@/components/JourneySteps";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { ButtonLink } from "@/components/ui/primitives";

const BENEFITS = [
  {
    title: "Understand opportunities faster",
    body: "Paste any job post. AI summarises what the client really needs, the skills involved, the risks and the questions worth asking first.",
    icon: "M4 6h12M4 10h8M4 14h10",
  },
  {
    title: "Price your work confidently",
    body: "Get minimum, recommended and premium prices derived from estimated hours, complexity and scope — with the reasoning shown.",
    icon: "M10 3v14M13.5 6.5c0-1.4-1.6-2.5-3.5-2.5S6.5 5.1 6.5 6.5 8 8.6 10 9s3.5 1.3 3.5 3-1.6 3-3.5 3-3.5-1.1-3.5-2.5",
  },
  {
    title: "Get paid through PayPal",
    body: "Split the price into milestones and send your client a PayPal checkout link for each one. Payments are verified before they count.",
    icon: "M3 6h14v9H3zM3 9h14M6 12.5h3",
  },
];

const HOW = [
  ["Paste the opportunity", "Drop in the job description from any platform or email."],
  ["Review the AI plan", "Edit the requirements, price and milestones. You're always in control."],
  ["Send and get paid", "Copy the proposal, then collect each milestone with PayPal."],
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="#how" className="hidden rounded-md px-3 py-2 text-sm text-ink-soft hover:text-ink sm:block">How it works</a>
          <ButtonLink href="/app" variant="secondary" size="sm">Open workspace</ButtonLink>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1 text-[12.5px] text-ink-soft">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />
              From your next gig to your next payment
            </p>
            <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[60px]">
              Your next gig deserves a better business partner.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-ink-soft">
              Turn opportunities into professional proposals, smarter project prices and seamless payments with one
              intelligent freelance workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/app/studio" size="lg">Start building your next gig</ButtonLink>
              <ButtonLink href="#how" variant="secondary" size="lg">See how it works</ButtonLink>
            </div>
          </div>

          <div className="mt-8">
            <JourneySteps compact />
          </div>

          <div className="mt-12">
            <ProductPreview />
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-px bg-line px-0 sm:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-surface px-6 py-10">
                <div className="grid size-9 place-items-center rounded-lg bg-mint text-brand" aria-hidden>
                  <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={b.icon} /></svg>
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-[-0.01em]">{b.title}</h2>
                <p className="mt-2 text-ink-soft">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20 sm:px-6">
          <p className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-brand">How it works</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Three steps from job post to paid milestone.</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-3">
            {HOW.map(([title, body], i) => (
              <li key={title} className="rounded-xl border border-line bg-surface p-6">
                <span className="font-mono text-sm text-brand">0{i + 1}</span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1.5 text-ink-soft">{body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl bg-ink px-6 py-10 text-white sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">Ready to price your next gig?</h2>
              <p className="mt-1 text-white/70">Paste a job description and get a payable plan in under a minute.</p>
            </div>
            <Link href="/app/studio" className="inline-flex h-12 items-center rounded-md bg-white px-5 font-medium text-ink hover:bg-mint">
              Start building your next gig
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13px] text-muted sm:px-6">
          <span>GlobalGig AI · Built for the PayPal AI Hackathon 2026</span>
          <span>PayPal Sandbox integration · MIT licensed</span>
        </div>
      </footer>
    </div>
  );
}
