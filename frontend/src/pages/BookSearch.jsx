import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import BookCard from "../components/BookCard";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";
import PageBreadcrumb from "../components/PageBreadcrumb";
import Footer from "../components/Footer";

export default function BookSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8001/google/search?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error("Erreur lors de la recherche");
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la recherche.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackground>
      <div className="flex min-h-screen flex-col">
        <Header onLogout={handleLogout} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-32 pt-12">
        <div className="mb-6 space-y-2">
          <PageBreadcrumb
            items={[
              { label: "Dashboard", to: "/dashboard" },
              { label: "Bibliothèque", to: "/library" },
              { label: "Recherche" },
            ]}
          />
          <h1 className="text-3xl font-semibold text-purple-900">
            🔍 Rechercher un livre (Google Books)
          </h1>
        </div>

        <form
          onSubmit={handleSearch}
          className="mb-6 flex w-full flex-col gap-3 rounded-2xl border border-purple-100 bg-white/80 p-4 shadow-lg backdrop-blur sm:flex-row"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Entrez un titre ou un auteur..."
            className="flex-grow rounded-lg border border-purple-200 px-4 py-2 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-purple-600 px-5 py-2 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-400"
          >
            {loading ? "Recherche..." : "Rechercher"}
          </button>
        </form>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {results.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          !loading && (
            <p className="w-full rounded-2xl border border-purple-100 bg-white/80 p-10 text-center text-purple-600 shadow-lg backdrop-blur">
              Saisissez un mot-clé pour commencer la recherche.
            </p>
          )
        )}
      </main>
      </div>
      <Footer />
    </AuroraBackground>
  );
}
