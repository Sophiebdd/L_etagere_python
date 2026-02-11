export default function AuroraBackground({ children }) {
  return (
    <div className="aurora-watercolor relative min-h-screen overflow-hidden bg-[#f2e6d8]">
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top,rgba(255,250,244,0.55),transparent_60%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
