import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";
import Footer from "../components/Footer";
import { redirectToLogin } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

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
  const [highlights, setHighlights] = useState({
    toRead: { items: [], total: 0 },
    inProgress: { items: [], total: 0 },
    done: { items: [], total: 0 },
  });
  const [recentChapters, setRecentChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [addingRecommendations, setAddingRecommendations] = useState({});
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

    const sections = [
      { key: "toRead", status: "À lire" },
      { key: "inProgress", status: "En cours" },
      { key: "done", status: "Lu" },
    ];

    const buildParams = (status) => {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("page_size", "12");
      params.set("status", status);
      return params.toString();
    };

    Promise.all([
      ...sections.map((section) =>
        fetch(`${API_BASE_URL}/books/mine?${buildParams(section.status)}`, {
          headers,
        })
      ),
      fetch(`${API_BASE_URL}/manuscripts/chapters/recent`, { headers }),
    ])
      .then(async (responses) => {
        const chaptersRes = responses[responses.length - 1];
        const bookResponses = responses.slice(0, -1);

        if (
          bookResponses.some((res) => res.status === 401) ||
          chaptersRes.status === 401
        ) {
          redirectToLogin(navigate);
          throw new Error("Session expirée");
        }

        const bookPayloads = await Promise.all(
          bookResponses.map(async (res) => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.detail || "Erreur lors du chargement des livres");
            }
            return res.json();
          })
        );

        if (!chaptersRes.ok) {
          const err = await chaptersRes.json().catch(() => ({}));
          throw new Error(err.detail || "Erreur lors du chargement des chapitres");
        }

        const chaptersData = await chaptersRes.json();
        const nextHighlights = {};
        sections.forEach((section, index) => {
          const data = bookPayloads[index];
          const items = Array.isArray(data)
            ? data
            : Array.isArray(data.items)
              ? data.items
              : [];
          nextHighlights[section.key] = {
            items,
            total: Array.isArray(data) ? items.length : Number(data.total_items) || 0,
          };
        });

        setHighlights(nextHighlights);
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
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    setRecommendationsLoading(true);
    fetch(`${API_BASE_URL}/books/recommendations?limit=12`, { headers })
      .then(async (res) => {
        if (res.status === 401) {
          redirectToLogin(navigate);
          throw new Error("Session expirée");
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Erreur lors du chargement des suggestions");
        }
        return res.json();
      })
      .then((data) => {
        setRecommendations(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setRecommendationsLoading(false));
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

  const highlightSections = [
    {
      key: "inProgress",
      title: "En cours de lecture",
      status: "En cours",
      items: highlights.inProgress.items,
      total: highlights.inProgress.total,
    },
    {
      key: "toRead",
      title: "À découvrir",
      status: "À lire",
      items: highlights.toRead.items,
      total: highlights.toRead.total,
    },
    {
      key: "done",
      title: "Livres lus",
      status: "Lu",
      items: highlights.done.items,
      total: highlights.done.total,
    },
  ];

  const handleHorizontalWheel = (event) => {
    const container = event.currentTarget;
    if (container.scrollWidth <= container.clientWidth) {
      return;
    }
    if (event.deltaY === 0 && event.deltaX === 0) {
      return;
    }
    const dominantDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    container.scrollLeft += dominantDelta;
    event.preventDefault();
    event.stopPropagation();
  };

  const renderPoster = (book) => (
    <div className="group relative w-28 shrink-0 snap-start sm:w-36 lg:w-40">
      <button
        type="button"
        onClick={() => openBookModal(book)}
        className="relative w-full overflow-hidden rounded-xl shadow-xl ring-1 ring-white/10"
      >
        <img
          src={
            book.cover_image ||
            "https://via.placeholder.com/160x240?text=Pas+d'image"
          }
          alt={book.title}
          className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03] sm:h-52 lg:h-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-left opacity-0 transition duration-300 group-hover:opacity-100">
          <p className="text-xs font-semibold text-white line-clamp-2">
            {book.title}
          </p>
          <p className="text-[11px] text-white/70 line-clamp-1">
            {book.author || book.authors || "Auteur inconnu"}
          </p>
        </div>
      </button>
    </div>
  );

  const renderRecommendationCard = (book) => {
    const recKey = book.external_id || `${book.title}-${book.author}`;
    const isAdding = Boolean(addingRecommendations[recKey]);

    return (
      <div className="group relative w-36 shrink-0 snap-start sm:w-40 lg:w-44">
        <div className="flex h-[18.5rem] flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-xl sm:h-[20.5rem] lg:h-[22rem]">
          <button
            type="button"
            onClick={() => openBookModal(book)}
            className="relative w-full overflow-hidden bg-black/10"
          >
            <div className="h-44 w-full overflow-hidden sm:h-52 lg:h-60">
              <img
                src={
                  book.cover_image ||
                  "https://via.placeholder.com/160x240?text=Pas+d'image"
                }
                alt={book.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
          </button>
          <div className="flex flex-1 flex-col gap-2 p-3">
            <div>
              <p className="text-xs font-semibold text-white line-clamp-2">
                {book.title}
              </p>
              <p className="text-[11px] text-white/70 line-clamp-1">
                {book.author || "Auteur inconnu"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAddRecommendation(book)}
              disabled={isAdding}
              className="mt-auto rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAdding ? "Ajout..." : "Ajouter"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleAddRecommendation = async (book) => {
    const token = localStorage.getItem("token");
    if (!token) {
      redirectToLogin(navigate);
      return;
    }

    const recKey = book.external_id || `${book.title}-${book.author}`;
    setAddingRecommendations((prev) => ({ ...prev, [recKey]: true }));

    const payload = {
      external_id: book.external_id || null,
      title: book.title,
      author: book.author || "Auteur inconnu",
      description: book.description || "",
      publication_date: book.publication_date || null,
      isbn: book.isbn || null,
      cover_image: book.cover_image || null,
      genre: book.genre || null,
      status: "À lire",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/books/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        redirectToLogin(navigate);
        return;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const detail = err.detail;
        if (Array.isArray(detail)) {
          const messages = detail.map((item) => item.msg || JSON.stringify(item));
          throw new Error(messages.join(", "));
        }
        throw new Error(detail || "Impossible d'ajouter le livre");
      }

      toast.success("📚 Livre ajouté à ta bibliothèque !");
      setRecommendations((prev) =>
        prev.filter(
          (item) =>
            (item.external_id || `${item.title}-${item.author}`) !== recKey
        )
      );
    } catch (err) {
      toast.error(err.message || "Impossible d'ajouter le livre");
    } finally {
      setAddingRecommendations((prev) => {
        const next = { ...prev };
        delete next[recKey];
        return next;
      });
    }
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
      <div className="flex min-h-screen flex-col">
        <Header onLogout={handleLogout} />
        <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 pb-32 pt-12">
        <div className="mb-8">
          <Link
            to="/library"
            className="text-3xl font-semibold text-purple-900 transition hover:text-purple-700"
          >
            Ma bibliothèque
          </Link>
        </div>

        <section className="space-y-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900 via-rose-900 to-slate-900 px-4 py-4 text-white shadow-xl ring-1 ring-white/10 backdrop-blur sm:px-6 sm:py-5">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(255,214,165,0.35),transparent_55%),radial-gradient(circle_at_bottom,rgba(255,132,94,0.3),transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_35%)] opacity-60" />
            <div className="relative z-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Suggestions pour toi</h2>
                  <p className="text-sm text-white/60">
                    Basées sur tes lectures et favoris
                  </p>
                </div>
              </div>
              {recommendationsLoading ? (
                <div className="rounded-2xl bg-white/10 p-6 text-sm text-white/70">
                  Chargement des suggestions...
                </div>
              ) : recommendations.length === 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/10 p-6 text-sm text-white/70">
                  <span>
                    Ajoute quelques livres aimés ou lus pour activer les suggestions.
                  </span>
                  <Link
                    to="/library"
                    className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    Voir ma bibliothèque →
                  </Link>
                </div>
              ) : (
                <div
                  className="no-scrollbar flex items-end gap-3 overflow-x-auto pb-3 pr-2 snap-x snap-mandatory overscroll-x-contain overscroll-y-none sm:gap-4 sm:pb-4"
                  onWheel={handleHorizontalWheel}
                >
                  {recommendations.map((book) => (
                    <div key={book.external_id || book.title} className="shrink-0">
                      {renderRecommendationCard(book)}
                    </div>
                  ))}
                  <Link
                    to="/library"
                    className="flex h-44 w-28 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-[10px] font-semibold uppercase tracking-wider text-white/80 transition hover:bg-white/10 hover:text-white sm:h-52 sm:w-36 sm:text-xs lg:h-60 lg:w-40"
                  >
                    Explorer →
                  </Link>
                </div>
              )}
            </div>
          </div>
          {highlightSections.map((section) => (
            <div
              key={section.key}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 px-4 py-4 text-white shadow-xl ring-1 ring-white/10 backdrop-blur sm:px-6 sm:py-5"
            >
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(244,194,255,0.35),transparent_55%),radial-gradient(circle_at_bottom,rgba(124,77,255,0.3),transparent_60%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.2),transparent_35%)] opacity-60" />
              <div className="relative z-10">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{section.title}</h2>
                    <p className="text-sm text-white/60">
                      {section.total} livre{section.total > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {section.items.length === 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/10 p-6 text-sm text-white/70">
                    <span>Aucun livre dans cette section pour le moment.</span>
                    <Link
                      to={`/library?status=${encodeURIComponent(section.status)}`}
                      className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      Tout voir →
                    </Link>
                  </div>
                ) : (
                  <div
                    className="no-scrollbar flex items-end gap-3 overflow-x-auto pb-3 pr-2 snap-x snap-mandatory overscroll-x-contain overscroll-y-none sm:gap-4 sm:pb-4"
                    onWheel={handleHorizontalWheel}
                  >
                    {section.items.map((book) => (
                      <div key={book.id} className="shrink-0">
                        {renderPoster(book)}
                      </div>
                    ))}
                    <Link
                      to={`/library?status=${encodeURIComponent(section.status)}`}
                      className="flex h-44 w-28 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-[10px] font-semibold uppercase tracking-wider text-white/80 transition hover:bg-white/10 hover:text-white sm:h-52 sm:w-36 sm:text-xs lg:h-60 lg:w-40"
                    >
                      Tout voir →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

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
      </div>
      <Footer />
    </AuroraBackground>
  );
}
