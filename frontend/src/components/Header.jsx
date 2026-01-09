import { Link } from "react-router-dom";
export default function Header({ showNavigation = true, onLogout = null }) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white shadow-lg">
      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="absolute right-6 top-6 z-20 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:bg-white/20 hover:text-white"
          title="Se déconnecter"
        >
          Se déconnecter
        </button>
      )}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(244,194,255,0.35),transparent_55%),radial-gradient(circle_at_bottom,rgba(124,77,255,0.3),transparent_60%)]" />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-12 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.45em] text-purple-200/80">
          Cabinet de curiosités littéraires
        </span>
        <div className="mt-6 flex flex-col items-center gap-1">
          
          <h1 className="text-4xl font-light tracking-[0.08em] text-white drop-shadow sm:text-5xl">
            L&apos;étagère
          </h1>
        </div>
        <p className="mt-3 max-w-3xl text-base text-indigo-100/90 sm:text-lg">
          Un refuge suspendu où les histoires patientent, parfumées d&apos;encre et d&apos;aventures, prêtes à se glisser entre vos mains.
        </p>
        {showNavigation && (
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-white/70">
            <Link
              to="/library"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2 transition hover:bg-white/20 hover:text-white"
            >
              Partitions de papier
            </Link>
            <Link
              to="/manuscrits"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2 transition hover:bg-white/20 hover:text-white"
            >
              Horizons feuilletés
            </Link>
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.2),transparent_35%)] opacity-60" />
    </header>
  );
}
