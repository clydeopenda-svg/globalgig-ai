import { z } from "zod";

// Zod schemas for the AI's structured JSON output. They are passed to the
// Claude API as the response format, so the model is constrained to produce
// exactly these shapes, and the SDK validates the result before we use it.
// They mirror GigAnalysis / Proposal in src/lib/types.ts.

export const AnalysisSchema = z.object({
  title: z.string().describe("Short project title, max 8 words"),
  clientSummary: z.string().describe("2-3 sentence plain-English summary of what the client wants"),
  requirements: z.array(z.string()).describe("Concrete requirements stated or clearly implied"),
  skills: z.array(z.string()).describe("Skills/technologies needed, most important first"),
  complexity: z.object({
    level: z.enum(["low", "medium", "high"]),
    rationale: z.string(),
  }),
  estimatedHours: z.object({ low: z.number(), high: z.number() }),
  pricing: z.object({
    minimum: z.number().describe("Whole USD; floor price for a lean scope"),
    recommended: z.number().describe("Whole USD; fair price for the scope as described"),
    premium: z.number().describe("Whole USD; price with extras like faster delivery or extended support"),
    hourlyRateAssumed: z.number().describe("USD per hour the estimate assumes"),
    rationale: z.string().describe("How the price was derived from hours, complexity and scope"),
  }),
  milestones: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        percent: z.number().describe("Share of the total price; all milestones sum to 100"),
        deliverables: z.array(z.string()),
      }),
    )
    .describe("2-5 payable milestones in delivery order"),
  risks: z.array(z.object({ risk: z.string(), mitigation: z.string() })),
  timeline: z.object({ weeks: z.number(), summary: z.string() }),
  paymentStructure: z.string().describe("Recommended payment terms, e.g. deposit + milestone releases"),
  clarifyingQuestions: z.array(z.string()).describe("Questions to ask the client before committing"),
});

export const ProposalSchema = z.object({
  subject: z.string().describe("Email/message subject line"),
  overview: z.string().describe("Opening paragraph addressed to the client"),
  understanding: z.string().describe("Restates the client's goals and requirements"),
  solution: z.string().describe("Proposed approach and technical solution"),
  deliverables: z.array(z.string()),
  timeline: z.string(),
  pricing: z.string().describe("Total price and what it includes"),
  paymentTerms: z.string().describe("Milestone payment schedule, paid via PayPal"),
  closing: z.string().describe("Short call to action and sign-off"),
});

export const PricingSchema = z.object({
  estimatedHours: z.object({ low: z.number(), high: z.number() }),
  hourlyRateAssumed: z.number().describe("USD per hour the estimate assumes"),
  minimum: z.number().describe("Whole USD; floor price for a lean scope"),
  recommended: z.number().describe("Whole USD; fair price for the current scope"),
  premium: z.number().describe("Whole USD; price with extras such as faster delivery or extended support"),
  factors: z
    .array(z.object({ factor: z.string(), effect: z.enum(["raises", "lowers", "neutral"]), detail: z.string() }))
    .describe("3-6 factors that drove the price: complexity, skills, hours, timeline, scope"),
  rationale: z.string().describe("2-3 sentences explaining the recommendation"),
});
