import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BookCard from "../components/BookCard";

export default function BookSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      alert("Erreur lors de la recherche.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-purple-700">
            🔍 Rechercher un livre (Google Books)
          </h1>

          {/* ✅ Lien de retour vers le dashboard */}
          <Link
            to="/dashboard"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition"
          >
            🏠 Ma bibliothèque
          </Link>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Entrez un titre ou un auteur..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 rounded-lg transition"
          >
            {loading ? "Recherche..." : "Rechercher"}
          </button>
        </form>

        {/* Résultats */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {results.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          !loading && (
            <p className="text-center text-gray-500">
              Saisissez un mot-clé pour commencer la recherche.
            </p>
          )
        )}
      </div>
    </div>
  );
}
