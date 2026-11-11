// Shared types used by both server code and client components.
// Keep this file free of server-only imports.

export const GIG_STATUSES = ["opportunity", "analysed", "proposal", "in_progress", "paid"] as const;
export type GigStatus = (typeof GIG_STATUSES)[number];

export const STATUS_LABELS: Record<GigStatus, string> = {
  opportunity: "Opportunity",
  analysed: "Analysed",
  proposal: "Proposal",
  in_progress: "In progress",
  paid: "Paid",
};

export type Complexity = "low" | "medium" | "high";

export interface AnalysisMilestone {
  title: string;
  description: string;
  percent: number;
  deliverables: string[];
}

/** What the AI returns for a job description. Prices are whole USD. */
export interface GigAnalysis {
  title: string;
  clientSummary: string;
  requirements: string[];
  skills: string[];
  complexity: { level: Complexity; rationale: string };
  estimatedHours: { low: number; high: number };
  pricing: {
    minimum: number;
    recommended: number;
    premium: number;
    hourlyRateAssumed: number;
    rationale: string;
  };
  milestones: AnalysisMilestone[];
  risks: { risk: string; mitigation: string }[];
  timeline: { weeks: number; summary: string };
  paymentStructure: string;
  clarifyingQuestions: string[];
}

export interface Proposal {
  subject: string;
  overview: string;
  understanding: string;
  solution: string;
  deliverables: string[];
  timeline: string;
  pricing: string;
  paymentTerms: string;
  closing: string;
}

/** "ai" = real model inference; "demo" = clearly labelled sample content. */
export type ContentSource = "ai" | "demo" | "manual";

export interface Milestone {
  id: number;
  gigId: number;
  position: number;
  title: string;
  description: string;
  percent: number;
  amountCents: number;
  status: "pending" | "in_progress" | "paid";
  paypalOrderId: string | null;
  paidAt: string | null;
}

export interface Gig {
  id: number;
  title: string;
  clientName: string;
  description: string;
  status: GigStatus;
  analysis: GigAnalysis | null;
  analysisSource: ContentSource | null;
  proposal: Proposal | null;
  proposalSource: ContentSource | null;
  priceCents: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface GigSummary extends Omit<Gig, "analysis" | "proposal" | "description"> {
  milestoneCount: number;
  paidCents: number;
}

export interface Payment {
  id: number;
  gigId: number;
  gigTitle: string;
  clientName: string;
  milestoneId: number;
  milestoneTitle: string;
  paypalOrderId: string;
  paypalCaptureId: string;
  status: string;
  amountCents: number;
  currency: string;
  payerName: string;
  payerEmail: string;
  environment: string;
  createdAt: string;
}

export interface FreelancerProfile {
  name: string;
  headline: string;
  skills: string;
  hourlyRate: number | null;
}
