export default function AuroraBackground({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(244,194,255,0.35),transparent_55%),radial-gradient(circle_at_bottom,rgba(124,77,255,0.3),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.2),transparent_35%)] opacity-60" />
      <div className="relative">{children}</div>
    </div>
  );
}
