import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";

export default function Library() {
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
      .then((data) => {
        const sortedBooks = Array.isArray(data)
          ? [...data].sort((a, b) => {
              const dateA = a?.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b?.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA;
            })
          : [];
        setBooks(sortedBooks);
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
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-12">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-semibold text-purple-900">📚 Ma bibliothèque</h1>
          <Link
            to="/dashboard"
            className="rounded-md border border-purple-200 bg-white px-4 py-2 font-semibold text-purple-700 shadow-sm transition hover:bg-purple-50"
          >
            ← Retour au dashboard
          </Link>
        </div>

        {books.length === 0 ? (
          <p className="rounded-2xl border border-purple-100 bg-white/80 p-10 text-center text-purple-600 shadow-lg backdrop-blur">
            Aucun livre ajouté pour le moment.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-lg">
            <table className="min-w-full divide-y divide-purple-100 text-sm">
              <thead className="bg-purple-50/50 text-left text-xs font-semibold uppercase tracking-wider text-purple-700">
                <tr>
                  <th className="px-6 py-4">Couverture</th>
                  <th className="px-6 py-4">Titre</th>
                  <th className="px-6 py-4">Auteur</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 text-gray-700">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-purple-50/50">
                    <td className="px-6 py-4">
                      <img
                        src={
                          book.cover_image ||
                          "https://via.placeholder.com/80x120?text=Pas+d'image"
                        }
                        alt={book.title}
                        className="h-24 w-16 rounded-md object-cover shadow"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-purple-800">{book.title}</td>
                    <td className="px-6 py-4">{book.author || book.authors || "Auteur inconnu"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                        {book.status || "À lire"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          className="rounded-md border border-purple-200 px-3 py-2 text-xs font-semibold text-purple-700 shadow-sm transition hover:bg-purple-50"
                        >
                          ✏️ Éditer
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-pink-200 px-3 py-2 text-xs font-semibold text-pink-600 shadow-sm transition hover:bg-pink-50"
                        >
                          ❤️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AuroraBackground>
  );
}
