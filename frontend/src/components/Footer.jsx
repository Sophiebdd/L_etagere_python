export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-white/30 bg-white/90 text-purple-600 shadow-inner backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] sm:flex-row">
        <span>L&apos;étagère © {year}</span>
        <span className="text-pink-500">Cabinet de curiosités littéraires</span>
        <a href="mailto:contact@letagere.app" className="text-purple-700 transition hover:text-purple-900">
          contact@letagere.app
        </a>
      </div>
    </footer>
  );
}
