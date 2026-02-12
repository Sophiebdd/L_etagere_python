import { Link } from "react-router-dom";
export default function Header({
  showNavigation = true,
  onLogout = null,
  showAdmin = false,
  onAdmin = null,
}) {
  return (
    <header className="header-glow relative overflow-hidden bg-white/90 text-[#B8C5E5] shadow-inner backdrop-blur">
      {(onLogout || (showAdmin && onAdmin)) && (
        <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
          {showAdmin && onAdmin && (
            <button
              type="button"
              onClick={onAdmin}
              className="inline-flex items-center justify-center rounded-full border border-[#B8C5E5]/70 bg-white/80 p-2 text-[#6b4b35] transition hover:bg-[#B8C5E5] hover:text-[#6b4b35]"
              title="Gérer les utilisateurs"
              aria-label="Gérer les utilisateurs"
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
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09c0 .63.37 1.2 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01A1.65 1.65 0 0 0 20.91 10H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
              </svg>
            </button>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center rounded-full border border-[#B8C5E5]/70 bg-white/80 p-2 text-[#6b4b35] transition hover:bg-[#B8C5E5] hover:text-[#6b4b35]"
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
        </div>
      )}
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-12 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a5a44]/80 sm:tracking-[0.45em]">
          Cabinet de curiosités littéraires
        </span>
        <div className="mt-6 flex flex-col items-center gap-1 relative">
          <h1
            className="text-5xl font-bold text-[#6b4b35] sm:text-6xl"
            style={{ fontFamily: '"Amatic SC", cursive' }}
          >
            L&apos;Étagère
          </h1>
          <img
            src="/bird.svg"
            alt=""
            aria-hidden="true"
            className="bird-orbit absolute h-10 w-auto sm:h-12"
          />
        </div>
        
        {showNavigation && (
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-[#B8C5E5]/80 sm:tracking-[0.28em]">
            <Link
              to="/library"
              className="rounded-full border border-[#B8C5E5]/70 bg-white/80 px-5 py-2 text-[#6b4b35] transition hover:bg-[#B8C5E5] hover:text-[#6b4b35]"
            >
              Ma bibliothèque
            </Link>
            <Link
              to="/manuscrits"
              className="rounded-full border border-[#B8C5E5]/70 bg-white/80 px-5 py-2 text-[#6b4b35] transition hover:bg-[#B8C5E5] hover:text-[#6b4b35]"
            >
              Mes manuscrits
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
