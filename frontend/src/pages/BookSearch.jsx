import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BookCard from "../components/BookCard";
import Header from "../components/Header";
import PageBackground from "../components/PageBackground";
import PageBreadcrumb from "../components/PageBreadcrumb";
import Footer from "../components/Footer";
import useCurrentUser from "../hooks/useCurrentUser";
import { apiFetch, logout, redirectToLogin } from "../utils/auth";
import { getApiBaseUrl } from "../utils/api";

const API_BASE_URL = getApiBaseUrl();
const MAX_RESULTS = 40;

export default function BookSearch() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [libraryExternalIds, setLibraryExternalIds] = useState(new Set());
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser(navigate);

  // frontend/src/pages/BookSearch.jsx (fonction de recherche et gestion des résultats)
  const fetchResults = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/google/search?q=${encodeURIComponent(searchQuery)}&start_index=0&max_results=${MAX_RESULTS}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Erreur lors de la recherche");
      const data = await res.json();

      const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
      setResults(items);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la recherche.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    void logout(navigate);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    setActiveQuery(trimmedQuery);
  };

  useEffect(() => {
    if (!activeQuery) return;
    fetchResults(activeQuery);
  }, [activeQuery]);

  const fetchLibraryIds = useCallback(async () => {
    const res = await apiFetch(`${API_BASE_URL}/books/`);
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
    const handleFocus = () => fetchLibraryIds();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchLibraryIds();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchLibraryIds]);

  return (
    <PageBackground>
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
            <div className="mb-4 text-sm text-[#B8C5E5]">
              {loading
                ? "Recherche en cours..."
                : results.length > 0
                  ? `${results.length} résultat${results.length > 1 ? "s" : ""} pour "${activeQuery}"`
                  : `Aucun résultat pour "${activeQuery}"`}
            </div>
          )}

          {results.length > 0 ? (
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
          ) : (
            !loading && (
              <p className="w-full rounded-2xl border border-[#B8C5E5] bg-white/80 p-10 text-center text-[#B8C5E5] shadow-lg backdrop-blur">
                {activeQuery
                  ? `Aucun résultat français pour "${activeQuery}".`
                  : "Saisissez un mot-clé pour commencer la recherche."}
              </p>
            )
          )}
        </main>
      </div>
      <Footer />
    </PageBackground>
  );
}
