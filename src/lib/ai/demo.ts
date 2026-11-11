import { formatMoney } from "@/lib/format";
import type { GigAnalysis, Milestone, Proposal } from "@/lib/types";

// DEMO MODE — clearly labelled sample content for when ANTHROPIC_API_KEY is
// not configured. It is NOT AI output and is never presented as such: records
// created from it are stored with source = "demo" and the UI badges them.

export const EXAMPLE_BRIEF =
  "We need a frontend developer to build a responsive e-commerce website with an admin dashboard, product management and payment integration. The store sells handmade ceramics (around 120 products). Customers should be able to browse by category, search, add to cart and check out. Staff need an admin area to add products, manage stock and see orders. We'd like to launch within two months.";

export const DEMO_ANALYSIS: GigAnalysis = {
  title: "Handmade ceramics e-commerce store",
  clientSummary:
    "A small ceramics brand needs a responsive online store with catalogue browsing, search, cart and checkout, plus an admin dashboard for products, stock and orders, launching within about two months.",
  requirements: [
    "Responsive storefront for ~120 products",
    "Category browsing and product search",
    "Cart and checkout with payment integration",
    "Admin dashboard: create/edit products and images",
    "Stock management and order list",
  ],
  skills: ["React / Next.js", "TypeScript", "Responsive UI", "Payments API", "REST/DB design", "Admin UX"],
  complexity: {
    level: "medium",
    rationale: "Standard e-commerce scope, but admin tooling and payment integration add backend work and testing.",
  },
  estimatedHours: { low: 110, high: 150 },
  pricing: {
    minimum: 6000,
    recommended: 8400,
    premium: 11500,
    hourlyRateAssumed: 65,
    rationale: "~130 hours at $65/h ≈ $8,450. Minimum trims search and admin polish; premium adds faster delivery and 60 days of support.",
  },
  milestones: [
    {
      title: "Discovery and design",
      description: "Confirm scope, sitemap and data model; deliver page designs for storefront and admin.",
      percent: 25,
      deliverables: ["Scope document", "Storefront and admin designs"],
    },
    {
      title: "Storefront and admin build",
      description: "Build catalogue, search, cart and the admin dashboard with product and stock management.",
      percent: 45,
      deliverables: ["Working storefront", "Admin dashboard"],
    },
    {
      title: "Payments, QA and launch",
      description: "Integrate checkout payments, test end-to-end, deploy and hand over.",
      percent: 30,
      deliverables: ["Live payments", "Launch", "Handover guide"],
    },
  ],
  risks: [
    { risk: "Product data and photos arrive late", mitigation: "Agree a content deadline in milestone 1 and use placeholders until then." },
    { risk: "Payment provider approval delays", mitigation: "Start provider onboarding in week 1 and test in sandbox." },
    { risk: "Scope creep in the admin area", mitigation: "Freeze admin features at the end of discovery; price extras separately." },
  ],
  timeline: { weeks: 7, summary: "1 week discovery, 4 weeks build, 2 weeks payments, QA and launch." },
  paymentStructure: "25% upfront to start, 45% on storefront and admin delivery, 30% on launch.",
  clarifyingQuestions: [
    "Which payment methods and countries must checkout support?",
    "Do you need shipping rate calculation or a flat rate?",
    "Who supplies product photography and descriptions?",
  ],
};

/** A fill-in-the-blanks proposal assembled from the saved plan (demo mode only). */
export function buildTemplateProposal(input: {
  analysis: GigAnalysis;
  clientName: string;
  priceCents: number;
  milestones: Milestone[];
}): Proposal {
  const { analysis } = input;
  const who = input.clientName || "there";
  return {
    subject: `Proposal: ${analysis.title}`,
    overview: `Hi ${who}, thank you for sharing the details of your project. Below is how I would deliver it, what it will cost and how payments are scheduled.`,
    understanding: analysis.clientSummary,
    solution: `I'll use ${analysis.skills.slice(0, 4).join(", ")} to deliver: ${analysis.requirements.join("; ")}.`,
    deliverables: analysis.milestones.flatMap((m) => m.deliverables),
    timeline: `${analysis.timeline.weeks} weeks. ${analysis.timeline.summary}`,
    pricing: `The total project price is ${formatMoney(input.priceCents)} USD.`,
    paymentTerms: input.milestones
      .map((m) => `${m.title}: ${m.percent}% (${formatMoney(m.amountCents)})`)
      .join(". ") + ". Each milestone is paid securely through PayPal.",
    closing: "If this looks right, reply and I'll send the first milestone payment link so we can get started.",
  };
}
