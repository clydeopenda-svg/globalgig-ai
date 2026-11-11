// A template (unlike a layout) re-mounts on every navigation, which gives each
// workspace page a short, subtle enter transition.
export default function WorkspaceTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
