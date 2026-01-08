import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";
import PageBreadcrumb from "../components/PageBreadcrumb";
import Footer from "../components/Footer";
import { redirectToLogin } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const STATUS_OPTIONS = ["À lire", "En cours", "Lu"];

export default function Library() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [searchText, setSearchText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deletingBookId, setDeletingBookId] = useState(null);
  const [notesModalBookId, setNotesModalBookId] = useState(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const navigate = useNavigate();
  const selectedNotesBook = useMemo(
    () => books.find((book) => book.id === notesModalBookId) || null,
    [books, notesModalBookId]
  );
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0;

  useEffect(() => {
    const handle = setTimeout(() => {
      const nextTerm = searchText.trim();
      setPage(1);
      setSearchTerm(nextTerm);
    }, 250);

    return () => clearTimeout(handle);
  }, [searchText]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const fetchBooks = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    if (statusFilter && statusFilter !== "Tous") {
      params.set("status", statusFilter);
    }
    if (searchTerm) {
      params.set("search", searchTerm);
    }
    if (favoritesOnly) {
      params.set("favorites", "true");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/books/mine?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        redirectToLogin(navigate);
        throw new Error("Session expirée");
      }
      if (!res.ok) throw new Error("Erreur lors du chargement des livres");
      const data = await res.json();

      const items = Array.isArray(data)
        ? [...data].sort((a, b) => {
            const dateA = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b?.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          })
        : Array.isArray(data.items)
          ? data.items
          : [];

      const withNotes = items.map((book) => ({
        ...book,
        notes: Array.isArray(book.notes) ? book.notes : [],
        is_favorite: Boolean(book.is_favorite),
      }));

      setBooks(withNotes);
      if (Array.isArray(data)) {
        setTotalItems(items.length);
      } else {
        setTotalItems(Number.isFinite(data.total_items) ? data.total_items : 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate, page, pageSize, statusFilter, searchTerm, favoritesOnly]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

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
      const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
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
          book.id === bookId
            ? {
                ...book,
                ...updatedBook,
                notes: Array.isArray(updatedBook.notes)
                  ? updatedBook.notes
                  : book.notes || [],
              }
            : book
        )
      );
      fetchBooks();
    } catch (err) {
      toast.error(err.message || "Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleToggleFavorite = async (bookId, currentValue) => {
    const token = localStorage.getItem("token");
    if (!token) {
      redirectToLogin(navigate);
      return;
    }

    const previousBooks = books;
    const nextValue = !currentValue;
    setBooks((current) =>
      current.map((book) =>
        book.id === bookId ? { ...book, is_favorite: nextValue } : book
      )
    );

    try {
      const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_favorite: nextValue }),
      });

      if (response.status === 401) {
        redirectToLogin(navigate);
        return;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setBooks(previousBooks);
        throw new Error(err.detail || "Impossible de mettre à jour le favori");
      }

      const updatedBook = await response.json();
      setBooks((current) =>
        current.map((book) =>
          book.id === bookId
            ? {
                ...book,
                ...updatedBook,
                notes: Array.isArray(updatedBook.notes)
                  ? updatedBook.notes
                  : book.notes || [],
              }
            : book
        )
      );
      fetchBooks();
    } catch (err) {
      setBooks(previousBooks);
      toast.error(err.message || "Erreur lors de la mise à jour du favori");
    }
  };

  const handleDelete = async (bookId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium">Supprimer ce livre de ta bibliothèque ?</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmDelete(bookId, token);
            }}
            className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const confirmDelete = async (bookId, token) => {
    const previousBooks = books;
    setDeletingBookId(bookId);
      setBooks((current) => current.filter((book) => book.id !== bookId));
      if (notesModalBookId === bookId) {
        setNotesModalBookId(null);
      }

    try {
      const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
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
      fetchBooks();
    } catch (err) {
      toast.error(err.message || "Erreur lors de la suppression du livre");
    } finally {
      setDeletingBookId(null);
    }
  };

  const openNotesModal = (bookId) => {
    setNotesModalBookId(bookId);
    setNewNoteContent("");
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearchTerm(searchText.trim());
  };

  const handleResetFilters = () => {
    setSearchText("");
    setSearchTerm("");
    setStatusFilter("Tous");
    setFavoritesOnly(false);
    setPage(1);
  };

  const closeNotesModal = () => {
    setNotesModalBookId(null);
    setNewNoteContent("");
    setDeletingNoteId(null);
  };

  const handleAddNote = async (event) => {
    event.preventDefault();
    if (!selectedNotesBook || !newNoteContent.trim()) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      redirectToLogin(navigate);
      return;
    }

    setAddingNote(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/books/${selectedNotesBook.id}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newNoteContent.trim() }),
        }
      );

      if (response.status === 401) {
        redirectToLogin(navigate);
        return;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Impossible d'ajouter la note");
      }

      const createdNote = await response.json();
      setBooks((current) =>
        current.map((book) =>
          book.id === selectedNotesBook.id
            ? { ...book, notes: [createdNote, ...(book.notes || [])] }
            : book
        )
      );
      setNewNoteContent("");
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'ajout de la note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!selectedNotesBook) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      redirectToLogin(navigate);
      return;
    }

    setDeletingNoteId(noteId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/books/${selectedNotesBook.id}/notes/${noteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        redirectToLogin(navigate);
        return;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Impossible de supprimer la note");
      }

      setBooks((current) =>
        current.map((book) =>
          book.id === selectedNotesBook.id
            ? {
                ...book,
                notes: (book.notes || []).filter((note) => note.id !== noteId),
              }
            : book
        )
      );
    } catch (err) {
      toast.error(err.message || "Erreur lors de la suppression de la note");
    } finally {
      setDeletingNoteId(null);
    }
  };

  if (loading && books.length === 0) {
    return (
      <AuroraBackground>
        <Header onLogout={handleLogout} />
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
      <div className="flex min-h-screen flex-col">
        <Header onLogout={handleLogout} />
        <main className="mx-auto max-w-7xl flex-1 px-4 pb-32 pt-12">
        <div className="mb-8 space-y-3">
          <PageBreadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Bibliothèque" }]} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold text-purple-900">Ma bibliothèque</h1>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm transition hover:bg-purple-50"
            >
              🔍 Rechercher un livre
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-purple-100 bg-white/80 p-4 shadow-lg backdrop-blur"
        >
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Rechercher par titre ou auteur..."
            className="min-w-[220px] flex-1 rounded-lg border border-purple-200 px-4 py-2 text-sm shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-full border border-purple-200 bg-white px-3 py-2 text-sm text-purple-700 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            {["Tous", ...STATUS_OPTIONS].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setFavoritesOnly((current) => !current);
              setPage(1);
            }}
            aria-pressed={favoritesOnly}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600 transition hover:text-pink-500"
          >
            <span className="text-base">{favoritesOnly ? "💜" : "🤍"}</span>
            Livres aimés
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-full border border-purple-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-purple-500 transition hover:bg-purple-50"
          >
            Réinitialiser
          </button>
        </form>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-purple-700">
          <div>
            {totalItems} livre{totalItems > 1 ? "s" : ""}
          </div>
          <label className="flex items-center gap-2">
            Affichage
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-full border border-purple-200 bg-white px-3 py-1 text-sm text-purple-700 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              {[10, 20, 50].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {books.length === 0 ? (
          <p className="rounded-2xl border border-purple-100 bg-white/80 p-10 text-center text-purple-600 shadow-lg backdrop-blur">
            Aucun livre ajouté pour le moment.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-purple-100 bg-white shadow-lg">
              <table className="min-w-[980px] w-full table-fixed divide-y divide-purple-100 text-sm">
                <thead className="bg-purple-50/50 text-left text-xs font-semibold uppercase tracking-wider text-purple-700">
                  <tr>
                    <th className="w-28 px-6 py-4">Couverture</th>
                    <th className="w-[280px] px-6 py-4">Titre</th>
                    <th className="px-6 py-4">Auteur</th>
                    <th className="w-28 px-6 py-4">Statut</th>
                    <th className="w-72 px-4 py-4">Actions</th>
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
                      <td className="px-6 py-4 font-medium text-purple-800">
                        <span className="block truncate" title={book.title}>
                          {book.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block truncate">
                          {book.author || book.authors || "Auteur inconnu"}
                        </span>
                      </td>
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
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2 whitespace-nowrap">
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              handleToggleFavorite(book.id, Boolean(book.is_favorite))
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleToggleFavorite(book.id, Boolean(book.is_favorite));
                              }
                            }}
                            className={`text-xl transition ${
                              book.is_favorite ? "text-pink-600" : "text-pink-300"
                            }`}
                            aria-pressed={book.is_favorite}
                            aria-label={
                              book.is_favorite
                                ? "Retirer des favoris"
                                : "Ajouter aux favoris"
                            }
                          >
                            {book.is_favorite ? "💜" : "🤍"}
                          </span>
                          <button
                            type="button"
                            onClick={() => openNotesModal(book.id)}
                            className="rounded-md border border-purple-200 px-3 py-2 text-xs font-semibold text-purple-600 shadow-sm transition hover:bg-purple-50"
                          >
                            📝 Notes
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
            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-purple-700">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1 || loading}
                  className="rounded-full border border-purple-200 bg-white px-4 py-2 shadow-sm transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Précédent
                </button>
                <span>
                  Page {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages || loading}
                  className="rounded-full border border-purple-200 bg-white px-4 py-2 shadow-sm transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
        </main>
      </div>
      <Footer />
      {selectedNotesBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeNotesModal}
        >
          <div
            className="w-full max-w-xl rounded-3xl border border-purple-100 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-400">
                  Appréciations
                </p>
                <h2 className="text-2xl font-bold text-purple-900">
                  {selectedNotesBook.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedNotesBook.author || selectedNotesBook.authors || "Auteur inconnu"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeNotesModal}
                className="rounded-full border border-purple-200 p-2 text-purple-700 transition hover:bg-purple-50"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNote} className="mt-6 flex flex-col gap-3">
              <textarea
                value={newNoteContent}
                onChange={(event) => setNewNoteContent(event.target.value)}
                placeholder="Ajoute une appréciation, une citation, une note..."
                className="min-h-[100px] rounded-2xl border border-purple-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 shadow-inner focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <button
                type="submit"
                disabled={addingNote || !newNoteContent.trim()}
                className="self-end rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
              >
                {addingNote ? "Ajout..." : "Ajouter la note"}
              </button>
            </form>

            <div className="mt-6 max-h-72 space-y-3 overflow-y-auto">
              {selectedNotesBook.notes && selectedNotesBook.notes.length > 0 ? (
                selectedNotesBook.notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start justify-between rounded-2xl border border-purple-100 bg-purple-50/60 p-4 shadow-sm"
                  >
                    <div>
                      <p className="text-sm text-purple-900">{note.content}</p>
                      <p className="mt-1 text-xs text-purple-500">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={deletingNoteId === note.id}
                      className="text-xs font-semibold text-red-500 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingNoteId === note.id ? "..." : "Supprimer"}
                    </button>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-purple-200 bg-white p-6 text-center text-sm text-purple-500">
                  Pas encore d'appréciation pour ce livre. Partage ton ressenti ! ✨
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </AuroraBackground>
  );
}
