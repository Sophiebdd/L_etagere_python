import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";

export default function Dashboard() {
  const [books, setBooks] = useState([]);
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

        <Link
          to="/manuscrits"
          className="mt-12 inline-block text-3xl font-semibold text-purple-900 transition hover:text-purple-700"
        >
          ✍️ Mes manuscrits
        </Link>

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
