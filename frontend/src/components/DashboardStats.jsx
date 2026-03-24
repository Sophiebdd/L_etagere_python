import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, redirectToLogin } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Configuration des mini-cartes de statistiques affichées en tête du composant.
const statCards = [
  {
    key: "total_books",
    label: "Livres",
    accent: "from-[#6b4b35] to-[#8a6a52]",
  },
  {
    key: "read_count",
    label: "Lus",
    accent: "from-[#7f8fb0] to-[#b8c5e5]",
  },
  {
    key: "in_progress_count",
    label: "En cours",
    accent: "from-[#8f6f52] to-[#c6a589]",
  },
  {
    key: "favorite_count",
    label: "Favoris",
    accent: "from-[#a16a7a] to-[#d7a2b0]",
  },
];

// Formate la date renvoyée par l'API pour un affichage lisible en français.
const formatRelativeDate = (value) => {
  if (!value) {
    return "Aucun ajout pour le moment";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date indisponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export default function DashboardStats() {
  // Etat local du composant : données chargées, chargement en cours et éventuelle erreur.
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Charge les statistiques utilisateur depuis l'endpoint dédié du dashboard.
    let isMounted = true;

    const loadStats = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch(`${API_BASE_URL}/users/me/book-stats`);

        if (response.status === 401) {
          redirectToLogin(navigate);
          return;
        }

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.detail || "Impossible de charger les statistiques");
        }

        const payload = await response.json();
        if (isMounted) {
          setStats(payload);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Impossible de charger les statistiques");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Affichage transitoire pendant la récupération des données.
  if (loading) {
    return (
      <section className="overflow-hidden rounded-3xl border border-white/30 bg-white/55 p-6 shadow-lg backdrop-blur-md">
        <p className="text-sm text-[#6b4b35]/75">Chargement des statistiques...</p>
      </section>
    );
  }

  // Etat d'erreur ou absence de données exploitables côté API.
  if (error || !stats) {
    return (
      <section className="overflow-hidden rounded-3xl border border-[#d9b9b9] bg-white/70 p-6 shadow-lg backdrop-blur-md">
        <p className="text-sm text-[#8a4d4d]">
          {error || "Statistiques indisponibles pour le moment."}
        </p>
      </section>
    );
  }

  // Pourcentage de livres terminés par rapport au nombre total de livres.
  const completionRate = stats.total_books
    ? Math.round((stats.read_count / stats.total_books) * 100)
    : 0;

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_38%),radial-gradient(circle_at_85%_15%,rgba(188,206,235,0.8),transparent_30%),linear-gradient(145deg,rgba(245,238,228,0.95),rgba(225,233,246,0.95))] p-6 shadow-2xl">
      <div className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.55),transparent_45%)]" />
      <div className="relative z-10 space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-[#6b4b35]">
            Tes stats de lecture
          </h2>
        </div>

        {/* Première ligne : indicateurs rapides issus directement de la vue SQL. */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <article
              key={card.key}
              className="overflow-hidden rounded-3xl border border-white/45 bg-white/60 p-4 shadow-lg backdrop-blur-sm"
            >
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${card.accent}`} />
              <p className="mt-4 text-sm font-medium text-[#7a5a44]">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-[#6b4b35]">
                {stats[card.key]}
              </p>
            </article>
          ))}
        </div>

        {/* Deuxième ligne : synthèse visuelle de progression et rappel du dernier ajout. */}
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <article className="rounded-3xl border border-white/45 bg-white/55 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#7a5a44]">Progression de lecture</p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[#9a806d]">
                  livres terminés
                </p>
              </div>
              <p className="text-2xl font-semibold text-[#6b4b35]">{completionRate}%</p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#7f8fb0,#b8c5e5)] transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-[#6b4b35]/80">
              {stats.read_count} livre{stats.read_count > 1 ? "s" : ""} lu
              {stats.read_count > 1 ? "s" : ""} sur {stats.total_books}.
            </p>
          </article>

          <article className="rounded-3xl border border-white/45 bg-white/55 p-5 shadow-lg backdrop-blur-sm">
            <p className="text-sm font-medium text-[#7a5a44]">Dernier ajout</p>
            <p className="mt-3 text-lg font-semibold text-[#6b4b35]">
              {formatRelativeDate(stats.last_book_added_at)}
            </p>
            <p className="mt-4 text-sm text-[#6b4b35]/75">
              {stats.to_read_count} a lire, {stats.in_progress_count} en cours.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
