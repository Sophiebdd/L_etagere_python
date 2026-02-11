export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-white/30 bg-white/90 text-[#B8C5E5] shadow-inner backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] sm:flex-row sm:text-xs sm:tracking-[0.25em]">
        <span>L&apos;étagère © {year}</span>
        <span className="text-[#B8C5E5]">Cabinet de curiosités littéraires</span>
        <a href="mailto:contact@letagere.app" className="break-words text-[#B8C5E5] transition hover:text-[#B8C5E5]">
          contact@letagere.app
        </a>
      </div>
    </footer>
  );
}
