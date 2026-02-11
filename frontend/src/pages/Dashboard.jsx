import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";
import Footer from "../components/Footer";
import { redirectToLogin } from "../utils/auth";
import CoverPlaceholder from "../assets/cover-placeholder.svg";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const PLACEHOLDER_HOST = "via.placeholder.com";

export default function Dashboard() {
  const [highlights, setHighlights] = useState({
    toRead: { items: [], total: 0 },
    inProgress: { items: [], total: 0 },
    done: { items: [], total: 0 },
  });
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
        void chaptersData;
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
      title: "À lire",
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
          src={resolveCover(book.cover_image)}
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

  const resolveCover = (coverUrl) => {
    if (!coverUrl || coverUrl.includes(PLACEHOLDER_HOST)) {
      return CoverPlaceholder;
    }
    return coverUrl;
  };

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
                src={resolveCover(book.cover_image)}
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
          <p className="rounded-full border border-[#B8C5E5] bg-white/80 px-6 py-3 text-sm font-medium uppercase tracking-[0.28em] text-[#B8C5E5] shadow-lg">
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

        <section className="space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-white">
              <div>
                <h2 className="text-xl font-semibold text-[#6b4b35]">Suggestions pour toi</h2>
                <p className="text-sm text-[#7a5a44]/70">
                  Basées sur tes lectures et favoris
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_20%_15%,#d7def0,transparent_55%),radial-gradient(circle_at_85%_10%,#c2cde7,transparent_45%),radial-gradient(circle_at_70%_85%,#e6ebf7,transparent_50%),radial-gradient(circle_at_15%_80%,#b8c5e5,transparent_55%),radial-gradient(circle_at_55%_50%,#cfd8ee,transparent_58%)] px-4 py-4 text-[#6b4b35] shadow-xl ring-1 ring-white/20 backdrop-blur sm:px-6 sm:py-5">
              <div className="absolute inset-0 opacity-45 bg-[radial-gradient(circle_at_top,rgba(226,233,247,0.7),transparent_55%),radial-gradient(circle_at_bottom,rgba(184,197,229,0.6),transparent_60%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_35%)] opacity-60" />
              <div className="relative z-10">
                {recommendationsLoading ? (
                  <div className="rounded-2xl bg-white/15 p-6 text-sm text-[#6b4b35]/80">
                    Chargement des suggestions...
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/15 p-6 text-sm text-[#6b4b35]/80">
                    <span>
                      Ajoute quelques livres aimés ou lus pour activer les suggestions.
                    </span>
                    <Link
                      to="/library"
                      className="rounded-full border border-[#B8C5E5] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#6b4b35] transition hover:bg-white hover:text-[#5a3f2d]"
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
                  </div>
                )}
              </div>
            </div>
          </div>
          {highlightSections.map((section) => (
            <div key={section.key} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-[#6b4b35]">
                <div>
                  <h2 className="text-xl font-semibold text-[#6b4b35]">{section.title}</h2>
                  <p className="text-sm text-[#7a5a44]/70">
                    {section.total} livre{section.total > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/20 px-4 py-4 text-[#6b4b35] shadow-lg backdrop-blur-md sm:px-6 sm:py-5">
                <div className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.65),transparent_65%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.4),transparent_70%)]" />
                <div className="relative z-10">
                  {section.items.length === 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/20 p-6 text-sm text-[#6b4b35]/80">
                      <span>Aucun livre dans cette section pour le moment.</span>
                      <Link
                        to={`/library?status=${encodeURIComponent(section.status)}`}
                        className="rounded-full border border-[#B8C5E5] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#6b4b35] transition hover:bg-white hover:text-[#5a3f2d]"
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
                        className="flex h-44 w-28 shrink-0 items-center justify-center rounded-xl border border-[#B8C5E5] bg-white/70 text-[10px] font-semibold uppercase tracking-wider text-[#6b4b35] transition hover:bg-white hover:text-[#5a3f2d] sm:h-52 sm:w-36 sm:text-xs lg:h-60 lg:w-40"
                      >
                        Tout voir →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>

        {selectedBook && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={closeBookModal}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#B8C5E5] bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-col gap-6 sm:flex-row">
                <img
                  src={resolveCover(selectedBook.cover_image)}
                  alt={selectedBook.title}
                  className="h-60 w-40 flex-shrink-0 rounded-xl object-cover shadow-lg"
                />

                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#B8C5E5]">
                      {selectedBook.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedBook.author || selectedBook.authors || "Auteur inconnu"}
                    </p>
                  </div>

                  <div className="text-sm text-gray-700">
                    <p className="font-semibold text-[#B8C5E5]">Description</p>
                    <p className="mt-1 whitespace-pre-line">
                      {selectedBook.description || "Pas de description disponible."}
                    </p>
                  </div>

                  {selectedBook.status && (
                    <div className="inline-flex rounded-full bg-[#B8C5E5]/35 px-3 py-1 text-xs font-semibold text-[#6b4b35]">
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
