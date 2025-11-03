import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";

export default function Dashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      .then((data) => setBooks(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <p className="text-center mt-10">Chargement...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-100 to-violet-100">
      <Header />
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-12">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-semibold text-purple-700">
            📚 Ma bibliothèque
          </h1>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="rounded-md bg-white/70 px-4 py-2 font-semibold text-gray-700 shadow transition hover:bg-white"
            >
              🚪 Déconnexion
            </button>

            <Link
              to="/search"
              className="rounded-md bg-purple-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-purple-700"
            >
              🔍 Rechercher un livre
            </Link>
          </div>
        </div>

        {books.length === 0 ? (
          <p className="rounded-xl bg-white/70 p-10 text-center text-gray-600 shadow">
            Aucun livre ajouté pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {books.map((book) => (
              <div
                key={book.id}
                className="overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-purple-100 transition hover:shadow-xl"
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
                  <p className="text-sm text-gray-600">{book.authors}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-gray-500">
                    {book.description || "Pas de description"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
