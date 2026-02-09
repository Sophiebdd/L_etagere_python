import { Link } from "react-router-dom";
export default function Header({ showNavigation = true, onLogout = null }) {
  return (
    <header className="relative overflow-hidden bg-transparent text-white">
      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="absolute right-4 top-4 z-20 inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white sm:right-6 sm:top-6"
          title="Se déconnecter"
          aria-label="Se déconnecter"
        >
          <svg
            className="h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
          </svg>
        </button>
      )}
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-12 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200/80 sm:tracking-[0.45em]">
          Cabinet de curiosités littéraires
        </span>
        <div className="mt-6 flex flex-col items-center gap-1">
          <img
            src="/titre.png"
            alt="L'étagère"
            className="h-16 w-auto drop-shadow sm:h-20"
          />
        </div>
        
        {showNavigation && (
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-white/70 sm:tracking-[0.28em]">
            <Link
              to="/library"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2 transition hover:bg-white/20 hover:text-white"
            >
              Ma bibliothèque
            </Link>
            <Link
              to="/manuscrits"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2 transition hover:bg-white/20 hover:text-white"
            >
              Mes manuscrits
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
