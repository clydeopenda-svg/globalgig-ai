import { isAiConfigured } from "@/lib/ai/service";
import { getGig } from "@/lib/db/queries";
import { GigStudio, type StudioOpportunity } from "@/components/studio/GigStudio";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Gig Studio" };

// /app/studio?gig=<id> opens a saved, un-analysed opportunity for analysis.
export default async function StudioPage({ searchParams }: PageProps<"/app/studio">) {
  const gigParam = (await searchParams).gig;
  const gigId = Number(Array.isArray(gigParam) ? gigParam[0] : gigParam);
  const gig = Number.isSafeInteger(gigId) && gigId > 0 ? await getGig(gigId) : null;
  const opportunity: StudioOpportunity | undefined =
    gig && gig.status === "opportunity"
      ? { id: gig.id, title: gig.title, description: gig.description, clientName: gig.clientName }
      : undefined;

  return (
    <>
      <PageHeader
        eyebrow="AI Gig Studio"
        title="Turn a job post into a priced, payable plan"
        description="Paste any freelance opportunity. The AI analyses it like an experienced consultant; you stay in control of every number before it becomes a project."
      />
      {/* key: switching between opportunities resets the studio's state */}
      <GigStudio key={opportunity?.id ?? "new"} aiConfigured={isAiConfigured()} opportunity={opportunity} />
    </>
  );
}
