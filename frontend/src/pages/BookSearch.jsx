import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import BookCard from "../components/BookCard";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";
import PageBreadcrumb from "../components/PageBreadcrumb";
import Footer from "../components/Footer";
import useCurrentUser from "../hooks/useCurrentUser";
import { redirectToLogin } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export default function BookSearch() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [results, setResults] = useState([]);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [libraryExternalIds, setLibraryExternalIds] = useState(new Set());
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser(navigate);

  const fetchResults = async (searchQuery, pageNumber, size) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const startIndex = (pageNumber - 1) * size;
      const res = await fetch(
        `${API_BASE_URL}/google/search?q=${encodeURIComponent(
          searchQuery
        )}&start_index=${startIndex}&max_results=${size}`
      );
      if (!res.ok) throw new Error("Erreur lors de la recherche");
      const data = await res.json();

      if (Array.isArray(data)) {
        setResults(data);
        setDisplayedCount(data.length);
        setHasMore(false);
      } else {
        const nextResults = Array.isArray(data.items) ? data.items : [];
        setResults(nextResults);
        setDisplayedCount(nextResults.length);
        setHasMore(Boolean(data.has_more));
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la recherche.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    if (trimmedQuery === activeQuery && page === 1) {
      fetchResults(trimmedQuery, 1, pageSize);
      return;
    }

    setActiveQuery(trimmedQuery);
    setPage(1);
  };

  useEffect(() => {
    if (!activeQuery) return;
    fetchResults(activeQuery, page, pageSize);
  }, [activeQuery, page, pageSize]);

  const fetchLibraryIds = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/books/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) {
      redirectToLogin(navigate);
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    const ids = Array.isArray(data)
      ? data.map((book) => book.external_id).filter(Boolean)
      : [];
    setLibraryExternalIds(new Set(ids));
  }, [navigate]);

  useEffect(() => {
    fetchLibraryIds();
  }, [fetchLibraryIds]);

  useEffect(() => {
    const handleFocus = () => {
      fetchLibraryIds();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchLibraryIds();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchLibraryIds]);

  return (
    <AuroraBackground>
      <div className="flex min-h-screen flex-col">
        <Header
          onLogout={handleLogout}
          showAdmin={isAdmin}
          onAdmin={() => navigate("/admin/users")}
        />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-32 pt-12">
        <div className="mb-6 space-y-2">
          <PageBreadcrumb
            items={[
              { label: "Dashboard", to: "/dashboard" },
              { label: "Bibliothèque", to: "/library" },
              { label: "Recherche" },
            ]}
          />
          <h1 className="text-3xl font-semibold text-[#B8C5E5]">
            🔍 Rechercher un livre (Google Books)
          </h1>
        </div>

        <form
          onSubmit={handleSearch}
          className="mb-6 flex w-full flex-col gap-3 rounded-2xl border border-[#B8C5E5] bg-white/80 p-4 shadow-lg backdrop-blur sm:flex-row"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Entrez un titre ou un auteur..."
            className="flex-grow rounded-lg border border-[#B8C5E5] px-4 py-2 shadow-sm focus:border-[#B8C5E5] focus:outline-none focus:ring-2 focus:ring-[#B8C5E5]"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#B8C5E5] px-5 py-2 font-semibold text-white transition hover:bg-[#B8C5E5] disabled:cursor-not-allowed disabled:bg-[#B8C5E5]"
          >
            {loading ? "Recherche..." : "Rechercher"}
          </button>
        </form>

        {(activeQuery || loading) && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#B8C5E5]">
            <div>
              {loading
                ? "Recherche..."
                : displayedCount > 0
                  ? `${displayedCount} résultat${displayedCount > 1 ? "s" : ""} affiché${displayedCount > 1 ? "s" : ""}`
                  : "Aucun résultat"}
              {!loading && hasMore ? " • d'autres pages sont disponibles" : ""}
              {activeQuery ? ` pour “${activeQuery}”` : ""}
            </div>
            <label className="flex items-center gap-2">
              Affichage
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-full border border-[#B8C5E5] bg-white px-3 py-1 text-sm text-[#B8C5E5] shadow-sm focus:border-[#B8C5E5] focus:outline-none focus:ring-2 focus:ring-[#B8C5E5]"
              >
                {[20, 50, 100].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {results.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isInLibrary={libraryExternalIds.has(book.id)}
                  onAdded={(externalId) =>
                    setLibraryExternalIds((prev) => {
                      const next = new Set(prev);
                      next.add(externalId);
                      return next;
                    })
                  }
                />
              ))}
            </div>
            {(page > 1 || hasMore) && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-[#B8C5E5]">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1 || loading}
                  className="rounded-full border border-[#B8C5E5] bg-white px-4 py-2 shadow-sm transition hover:bg-[#B8C5E5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Précédent
                </button>
                <span>Page {page}</span>
                <button
                  type="button"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={!hasMore || loading}
                  className="rounded-full border border-[#B8C5E5] bg-white px-4 py-2 shadow-sm transition hover:bg-[#B8C5E5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        ) : (
          !loading && (
            <p className="w-full rounded-2xl border border-[#B8C5E5] bg-white/80 p-10 text-center text-[#B8C5E5] shadow-lg backdrop-blur">
              {activeQuery
                ? `Aucun résultat français pour “${activeQuery}”.`
                : "Saisissez un mot-clé pour commencer la recherche."}
            </p>
          )
        )}
      </main>
      </div>
      <Footer />
    </AuroraBackground>
  );
}
