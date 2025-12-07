import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";
import PageBreadcrumb from "../components/PageBreadcrumb";
import { redirectToLogin } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:8001";

const toPlainText = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const formatChapterDate = (date) => {
  if (!date) return "";
  try {
    return new Date(date).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
};

export default function Dashboard() {
  const [books, setBooks] = useState([]);
  const [recentChapters, setRecentChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
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

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    Promise.all([
      fetch(`${API_BASE_URL}/books/mine`, { headers }),
      fetch(`${API_BASE_URL}/manuscripts/chapters/recent`, { headers }),
    ])
      .then(async ([booksRes, chaptersRes]) => {
        if (booksRes.status === 401 || chaptersRes.status === 401) {
          redirectToLogin(navigate);
          throw new Error("Session expirée");
        }
        if (!booksRes.ok) {
          const err = await booksRes.json().catch(() => ({}));
          throw new Error(err.detail || "Erreur lors du chargement des livres");
        }
        if (!chaptersRes.ok) {
          const err = await chaptersRes.json().catch(() => ({}));
          throw new Error(err.detail || "Erreur lors du chargement des chapitres");
        }
        const [booksData, chaptersData] = await Promise.all([booksRes.json(), chaptersRes.json()]);
        const sortedBooks = Array.isArray(booksData)
          ? [...booksData].sort((a, b) => {
              const dateA = a?.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b?.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA;
            })
          : [];
        setBooks(sortedBooks.slice(0, 6));
        const safeChapters = Array.isArray(chaptersData)
          ? chaptersData.map((chapter) => ({
              ...chapter,
              manuscript: chapter.manuscript ?? null,
            }))
          : [];
        setRecentChapters(safeChapters);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedBook(null);
      }
    };

    if (selectedBook) {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "hidden";
      }
      if (typeof window !== "undefined") {
        window.addEventListener("keydown", handleKeyDown);
      }
    }

    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [selectedBook]);

  const openBookModal = (book) => {
    setSelectedBook(book);
  };

  const closeBookModal = () => {
    setSelectedBook(null);
  };

  if (loading) {
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
      <Header onLogout={handleLogout} />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-12">
        <div className="mb-8">
          <Link
            to="/library"
            className="text-3xl font-semibold text-purple-900 transition hover:text-purple-700"
          >
            Ma bibliothèque
          </Link>
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
                role="button"
                tabIndex={0}
                onClick={() => openBookModal(book)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openBookModal(book);
                  }
                }}
                className="cursor-pointer overflow-hidden rounded-xl border border-purple-100 bg-white shadow-xl transition hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
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

        <section className="mt-12">
          <div className="mb-4">
            <Link
              to="/manuscrits"
              className="text-3xl font-semibold text-purple-900 transition hover:text-purple-700"
            >
              Mes manuscrits
            </Link>
          </div>
          {recentChapters.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-purple-200 bg-white/80 p-8 text-center text-sm text-purple-600 shadow-inner">
              Pas encore de chapitre rédigé. Rejoins l'atelier pour écrire le premier !
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recentChapters.map((chapter) => {
                const plainText = toPlainText(chapter.content);
                const excerpt =
                  plainText.length > 260 ? `${plainText.slice(0, 260)}…` : plainText;
                return (
                  <article
                    key={chapter.id}
                    className="rounded-2xl border border-purple-100 bg-white p-5 shadow-lg"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">
                      {chapter.manuscript?.title || "Manuscrit en brouillon"}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-purple-900">{chapter.title}</h3>
                    <p className="text-xs text-gray-500">{formatChapterDate(chapter.created_at)}</p>
                    <p className="mt-3 text-sm text-gray-600">{excerpt || "Chapitre enregistré."}</p>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {selectedBook && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={closeBookModal}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-purple-100 bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-col gap-6 sm:flex-row">
                <img
                  src={
                    selectedBook.cover_image ||
                    "https://via.placeholder.com/200x300?text=Pas+d'image"
                  }
                  alt={selectedBook.title}
                  className="h-60 w-40 flex-shrink-0 rounded-xl object-cover shadow-lg"
                />

                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-purple-800">
                      {selectedBook.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedBook.author || selectedBook.authors || "Auteur inconnu"}
                    </p>
                  </div>

                  <div className="text-sm text-gray-700">
                    <p className="font-semibold text-purple-700">Description</p>
                    <p className="mt-1 whitespace-pre-line">
                      {selectedBook.description || "Pas de description disponible."}
                    </p>
                  </div>

                  {selectedBook.status && (
                    <div className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                      Statut : {selectedBook.status}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuroraBackground>
  );
}
