export default function AuroraBackground({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f7f1ff] via-[#fdeafd] to-[#f6f8ff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(124,58,237,0.18),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.15),transparent_50%),radial-gradient(circle_at_65%_80%,rgba(56,189,248,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen blur-3xl bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.75),transparent_65%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}
