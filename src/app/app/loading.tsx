// Shown instantly while a workspace page's data loads, so navigation
// always feels responsive.
export default function WorkspaceLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-2/3 max-w-md" />
        <div className="skeleton h-4 w-1/2 max-w-sm" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
      <div className="skeleton h-64 w-full" />
    </div>
  );
}
