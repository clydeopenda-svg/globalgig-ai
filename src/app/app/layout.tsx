import { Sidebar } from "@/components/layout/Sidebar";
import { CommandMenu } from "@/components/layout/CommandMenu";

// Workspace shell: sidebar on desktop, top bar + drawer on mobile.
export default function WorkspaceLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Sidebar />
      <CommandMenu />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
