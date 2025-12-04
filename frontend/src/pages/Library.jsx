import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";
import { redirectToLogin } from "../utils/auth";

const STATUS_OPTIONS = ["À lire", "En cours", "Lu"];

export default function Library() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deletingBookId, setDeletingBookId] = useState(null);
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
        if (res.status === 401) {
          redirectToLogin(navigate);
          throw new Error("Session expirée");
        }
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

  const handleStatusChange = async (bookId, newStatus) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const previousBooks = books;
    setUpdatingStatusId(bookId);
    setBooks((current) =>
      current.map((book) =>
        book.id === bookId ? { ...book, status: newStatus } : book
      )
    );

    try {
      const response = await fetch(`http://127.0.0.1:8001/books/${bookId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.status === 401) {
        redirectToLogin(navigate);
        throw new Error("Session expirée");
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setBooks(previousBooks);
        throw new Error(err.detail || "Impossible de mettre à jour le statut");
      }

      const updatedBook = await response.json();
      setBooks((current) =>
        current.map((book) =>
          book.id === bookId ? { ...book, ...updatedBook } : book
        )
      );
    } catch (err) {
      alert(err.message || "Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm("Supprimer ce livre de ta bibliothèque ?")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const previousBooks = books;
    setDeletingBookId(bookId);
    setBooks((current) => current.filter((book) => book.id !== bookId));

    try {
      const response = await fetch(`http://127.0.0.1:8001/books/${bookId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        redirectToLogin(navigate);
        throw new Error("Session expirée");
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setBooks(previousBooks);
        throw new Error(err.detail || "Impossible de supprimer le livre");
      }
    } catch (err) {
      alert(err.message || "Erreur lors de la suppression du livre");
    } finally {
      setDeletingBookId(null);
    }
  };

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
          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="rounded-md border border-purple-200 bg-white px-4 py-2 font-semibold text-purple-700 shadow-sm transition hover:bg-purple-50"
            >
              ← Retour au dashboard
            </Link>
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
                      <select
                        className="rounded-md border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 shadow-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-60"
                        value={
                          STATUS_OPTIONS.includes(book.status)
                            ? book.status
                            : STATUS_OPTIONS[0]
                        }
                        onChange={(event) => handleStatusChange(book.id, event.target.value)}
                        disabled={updatingStatusId === book.id || deletingBookId === book.id}
                      >
                        {STATUS_OPTIONS.map((statusOption) => (
                          <option key={statusOption} value={statusOption}>
                            {statusOption}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="rounded-md border border-pink-200 px-3 py-2 text-xs font-semibold text-pink-600 shadow-sm transition hover:bg-pink-50"
                          >
                          ❤️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(book.id)}
                          disabled={deletingBookId === book.id}
                          className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          🗑️ Supprimer
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
