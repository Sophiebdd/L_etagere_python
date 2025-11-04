import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";

export default function Dashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://127.0.0.1:8001/books/mine", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors du chargement des livres");
        return res.json();
      })
      .then((data) => {
        const sortedBooks = Array.isArray(data)
          ? [...data].sort((a, b) => {
              const dateA = a?.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b?.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA;
            })
          : [];
        setBooks(sortedBooks.slice(0, 6));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <AuroraBackground>
        <Header />
        <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-12">
          <p className="rounded-full border border-purple-200 bg-white/80 px-6 py-3 text-sm font-medium uppercase tracking-[0.28em] text-purple-600 shadow-lg">
            Chargement...
          </p>
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-12">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Link
            to="/library"
            className="text-3xl font-semibold text-purple-900 transition hover:text-purple-700"
          >
            📚 Ma bibliothèque
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/search"
              className="rounded-md bg-purple-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-purple-700"
            >
              🔍 Rechercher un livre
            </Link>

            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-purple-200 bg-white text-lg shadow-sm transition hover:bg-purple-50"
            >
              🚪
            </button>
          </div>
        </div>

        {books.length === 0 ? (
          <p className="rounded-2xl border border-purple-100 bg-white/80 p-10 text-center text-purple-600 shadow-lg backdrop-blur">
            Aucun livre ajouté pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {books.map((book) => (
              <div
                key={book.id}
                className="overflow-hidden rounded-xl border border-purple-100 bg-white shadow-xl transition hover:shadow-2xl"
              >
                <img
                  src={
                    book.cover_image ||
                    "https://via.placeholder.com/200x300?text=Pas+d'image"
                  }
                  alt={book.title}
                  className="h-56 w-full object-cover"
                />

                <div className="p-4">
                  <h3 className="truncate text-lg font-semibold text-purple-700">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {book.author || book.authors || "Auteur inconnu"}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm text-gray-500">
                    {book.description || "Pas de description"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AuroraBackground>
  );
}
