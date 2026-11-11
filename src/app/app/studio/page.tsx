import { isAiConfigured } from "@/lib/ai/service";
import { GigStudio } from "@/components/studio/GigStudio";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Gig Studio" };

export default function StudioPage() {
  return (
    <>
      <PageHeader
        eyebrow="AI Gig Studio"
        title="Turn a job post into a priced, payable plan"
        description="Paste any freelance opportunity. The AI analyses it like an experienced consultant; you stay in control of every number before it becomes a project."
      />
      <GigStudio aiConfigured={isAiConfigured()} />
    </>
  );
}
