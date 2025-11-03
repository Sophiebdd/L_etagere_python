import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

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
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 py-10">
      <div className="max-w-5xl mx-auto px-4">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-purple-700">
            📚 Ma bibliothèque
          </h1>

          <div className="flex gap-3">
            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md transition"
            >
              🚪 Déconnexion
            </button>

            <Link
              to="/search"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition"
            >
              🔍 Rechercher un livre
            </Link>
          </div>
        </div>

        {/* Contenu */}
        {books.length === 0 ? (
          <p className="text-center text-gray-600">
            Aucun livre ajouté pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition"
              >
                <img
                    src={book.cover_image || "https://via.placeholder.com/200x300?text=Pas+d'image"}
                    alt={book.title}
                    className="w-full h-56 object-cover"
                />

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-purple-700 truncate">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600">{book.authors}</p>
                  <p className="text-sm mt-2 text-gray-500 line-clamp-3">
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
