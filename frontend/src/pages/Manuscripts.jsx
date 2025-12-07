import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";
import PageBreadcrumb from "../components/PageBreadcrumb";
import Footer from "../components/Footer";
import RichTextEditor from "../components/RichTextEditor";
import { redirectToLogin } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:8001";

const isContentEmpty = (html) => {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length === 0;
};

const formatDate = (date) => {
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

export default function Manuscripts() {
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState({ title: "", description: "" });
  const [savingManuscript, setSavingManuscript] = useState(false);
  const [selectedManuscriptId, setSelectedManuscriptId] = useState(null);
  const [chapterForm, setChapterForm] = useState({ title: "", content: "" });
  const [savingChapter, setSavingChapter] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [deletingManuscriptId, setDeletingManuscriptId] = useState(null);
  const [deletingChapterId, setDeletingChapterId] = useState(null);
  const [previewChapter, setPreviewChapter] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareRecipients, setShareRecipients] = useState("");
  const [shareSubject, setShareSubject] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareIncludeAll, setShareIncludeAll] = useState(true);
  const [shareSelectedChapters, setShareSelectedChapters] = useState([]);
  const [sharing, setSharing] = useState(false);
  const navigate = useNavigate();

  const selectedManuscript = useMemo(() => {
    if (!manuscripts.length) return null;
    return (
      manuscripts.find((manuscript) => manuscript.id === selectedManuscriptId) ||
      manuscripts[0] ||
      null
    );
  }, [manuscripts, selectedManuscriptId]);

  const getTokenOrRedirect = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      redirectToLogin(navigate);
      return null;
    }
    return token;
  }, [navigate]);

  const loadManuscripts = useCallback(async () => {
    const token = getTokenOrRedirect();
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/manuscripts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        redirectToLogin(navigate);
        return;
      }

      if (!response.ok) {
        throw new Error("Impossible de récupérer les manuscrits");
      }

      const data = await response.json();
      const safeManuscripts = Array.isArray(data)
        ? data.map((manuscript) => ({
            ...manuscript,
            chapters: Array.isArray(manuscript.chapters)
              ? [...manuscript.chapters].sort(
                  (a, b) => (a.order_index || 0) - (b.order_index || 0)
                )
              : [],
          }))
        : [];

      setManuscripts(safeManuscripts);
      setSelectedManuscriptId((currentId) => {
        if (!currentId) {
          return safeManuscripts[0]?.id ?? null;
        }
        const exists = safeManuscripts.some((manuscript) => manuscript.id === currentId);
        return exists ? currentId : safeManuscripts[0]?.id ?? null;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [getTokenOrRedirect, navigate]);

  useEffect(() => {
    loadManuscripts();
  }, [loadManuscripts]);

  useEffect(() => {
    setChapterForm({ title: "", content: "" });
    setEditingChapterId(null);
  }, [selectedManuscriptId]);

  useEffect(() => {
    if (previewChapter || isShareModalOpen) {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "hidden";
      }
    } else if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [previewChapter, isShareModalOpen]);

  useEffect(() => {
    if (!isShareModalOpen) {
      setShareSelectedChapters([]);
      setShareRecipients("");
      setShareSubject("");
      setShareMessage("");
      setShareIncludeAll(true);
      setSharing(false);
    }
  }, [isShareModalOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const handleCreateManuscript = async (event) => {
    event.preventDefault();
    if (!formValues.title.trim()) {
      toast.error("Ajoute un titre à ton manuscrit ✨");
      return;
    }

    const token = getTokenOrRedirect();
    if (!token) return;

    setSavingManuscript(true);
    try {
      const response = await fetch(`${API_BASE_URL}/manuscripts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formValues.title.trim(),
          description: formValues.description.trim(),
        }),
      });

      if (response.status === 401) {
        redirectToLogin(navigate);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Impossible de créer le manuscrit");
      }

      const created = await response.json();
      setManuscripts((current) => [
        { ...created, chapters: [] },
        ...current,
      ]);
      setFormValues({ title: "", description: "" });
      setSelectedManuscriptId(created.id);
    } catch (error) {
      toast.error(error.message || "Erreur lors de la création du manuscrit");
    } finally {
      setSavingManuscript(false);
    }
  };

  const handleDeleteManuscript = async (manuscriptId) => {
    if (!window.confirm("Supprimer définitivement ce manuscrit et ses chapitres ?")) {
      return;
    }

    const token = getTokenOrRedirect();
    if (!token) return;

    setDeletingManuscriptId(manuscriptId);
    try {
      const response = await fetch(`${API_BASE_URL}/manuscripts/${manuscriptId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        redirectToLogin(navigate);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Impossible de supprimer le manuscrit");
      }

      const remaining = manuscripts.filter((manuscript) => manuscript.id !== manuscriptId);
      setManuscripts(remaining);
      setSelectedManuscriptId((currentId) => {
        if (currentId === manuscriptId) {
          return remaining[0]?.id ?? null;
        }
        return currentId;
      });
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setDeletingManuscriptId(null);
    }
  };

  const handleChapterSubmit = async (event) => {
    event.preventDefault();
    if (!selectedManuscript) {
      toast.error("Commence par créer un manuscrit 📔");
      return;
    }
    if (!chapterForm.title.trim()) {
      toast.error("Ajoute un titre à ton chapitre");
      return;
    }
    if (isContentEmpty(chapterForm.content)) {
      toast.error("Le contenu du chapitre est vide");
      return;
    }

    const token = getTokenOrRedirect();
    if (!token) return;

    setSavingChapter(true);
    try {
      const endpoint = editingChapterId
        ? `${API_BASE_URL}/manuscripts/chapters/${editingChapterId}`
        : `${API_BASE_URL}/manuscripts/${selectedManuscript.id}/chapters`;

      const response = await fetch(endpoint, {
        method: editingChapterId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: chapterForm.title.trim(),
          content: chapterForm.content,
        }),
      });

      if (response.status === 401) {
        redirectToLogin(navigate);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Impossible d'enregistrer le chapitre");
      }

      const savedChapter = await response.json();
      setManuscripts((current) =>
        current.map((manuscript) => {
          if (manuscript.id !== savedChapter.manuscript_id) return manuscript;
          const nextChapters = editingChapterId
            ? manuscript.chapters.map((chapter) =>
                chapter.id === savedChapter.id ? savedChapter : chapter
              )
            : [...manuscript.chapters, savedChapter].sort(
                (a, b) => (a.order_index || 0) - (b.order_index || 0)
              );
          return { ...manuscript, chapters: nextChapters };
        })
      );
      setChapterForm({ title: "", content: "" });
      setEditingChapterId(null);
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'enregistrement du chapitre");
    } finally {
      setSavingChapter(false);
    }
  };

  const handleEditChapter = (chapter) => {
    setChapterForm({ title: chapter.title, content: chapter.content });
    setEditingChapterId(chapter.id);
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm("Supprimer ce chapitre ?")) {
      return;
    }

    const token = getTokenOrRedirect();
    if (!token) return;

    setDeletingChapterId(chapterId);
    try {
      const response = await fetch(`${API_BASE_URL}/manuscripts/chapters/${chapterId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        redirectToLogin(navigate);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Impossible de supprimer le chapitre");
      }

      setManuscripts((current) =>
        current.map((manuscript) => {
          if (manuscript.id === selectedManuscript?.id) {
            return {
              ...manuscript,
              chapters: manuscript.chapters.filter((chapter) => chapter.id !== chapterId),
            };
          }
          return manuscript;
        })
      );
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression du chapitre");
    } finally {
      setDeletingChapterId(null);
    }
  };

  const openChapterPreview = (chapter) => {
    setPreviewChapter(chapter);
  };

  const closeChapterPreview = () => {
    setPreviewChapter(null);
  };

  const chapterExcerpt = (html = "") => {
    const plainText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return plainText.length > 240 ? `${plainText.slice(0, 240)}…` : plainText;
  };

  const toggleChapterShareSelection = (chapterId) => {
    setShareSelectedChapters((current) =>
      current.includes(chapterId)
        ? current.filter((id) => id !== chapterId)
        : [...current, chapterId]
    );
  };

  const handleShareSubmit = async (event) => {
    event.preventDefault();
    if (!selectedManuscript) {
      toast.error("Sélectionne un manuscrit à partager");
      return;
    }
    const token = getTokenOrRedirect();
    if (!token) return;

    const recipients = shareRecipients
      .split(/[,;\s]+/)
      .map((email) => email.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      toast.error("Ajoute au moins un destinataire");
      return;
    }

    if (!shareIncludeAll && shareSelectedChapters.length === 0) {
      toast.error("Sélectionne au moins un chapitre à partager");
      return;
    }

    const payload = {
      recipients,
      subject: shareSubject.trim() || undefined,
      message: shareMessage.trim() || undefined,
      chapter_ids: shareIncludeAll ? undefined : shareSelectedChapters,
    };

    setSharing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/manuscripts/${selectedManuscript.id}/share`, {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Impossible d'envoyer le manuscrit");
      }

      toast.success("Manuscrit envoyé avec succès !");
      setIsShareModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'envoi du manuscrit");
    } finally {
      setSharing(false);
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
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-12">
        <div className="mb-8 space-y-3">
          <PageBreadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Manuscrits" }]} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold text-purple-900">Mes manuscrits</h1>
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              disabled={!selectedManuscript}
              className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              ✉️ Partager
            </button>
          </div>
        </div>

        <div className="grid w-full gap-8 lg:grid-cols-[320px,1fr]">
          <div className="space-y-6 w-full">
            <section className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-purple-800">Nouveau manuscrit</h2>
              <p className="mb-4 text-sm text-gray-500">
                Donne un titre et une intention, tu pourras ensuite ajouter tes chapitres.
              </p>
              <form className="space-y-4" onSubmit={handleCreateManuscript}>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-purple-500">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={formValues.title}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, title: event.target.value }))
                    }
                    className="mt-1 w-full rounded-2xl border border-purple-100 px-3 py-2 text-sm text-gray-800 shadow-inner focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    placeholder="Mon prochain roman..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-purple-500">
                    Synopsis
                  </label>
                  <textarea
                    value={formValues.description}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-2xl border border-purple-100 px-3 py-2 text-sm text-gray-800 shadow-inner focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    rows={4}
                    placeholder="Une idée, une ambiance, une discussion avec ton personnage principal..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingManuscript}
                  className="w-full rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
                >
                  {savingManuscript ? "Création..." : "Créer le manuscrit"}
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-purple-800">Mes manuscrits</h2>
              {manuscripts.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed border-purple-200 bg-purple-50/60 p-4 text-sm text-purple-700">
                  Aucun manuscrit pour l'instant. Commence par en créer un pour débloquer ton espace d'écriture.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {manuscripts.map((manuscript) => (
                    <li
                      key={manuscript.id}
                      className={`rounded-2xl border px-4 py-3 shadow-sm transition ${
                        selectedManuscript?.id === manuscript.id
                          ? "border-purple-400 bg-purple-50"
                          : "border-purple-100 bg-white hover:border-purple-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedManuscriptId(manuscript.id)}
                        className="flex w-full items-start justify-between text-left"
                      >
                        <div>
                          <p className="text-sm font-semibold text-purple-900">{manuscript.title}</p>
                          <p className="text-xs text-gray-500">
                            {manuscript.chapters?.length || 0} chapitre
                            {manuscript.chapters?.length > 1 ? "s" : ""}
                          </p>
                        </div>
                        <span className="text-lg text-purple-400">→</span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteManuscript(manuscript.id);
                        }}
                        disabled={deletingManuscriptId === manuscript.id}
                        className="mt-2 text-xs font-semibold text-red-500 transition hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingManuscriptId === manuscript.id ? "Suppression..." : "Supprimer"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="space-y-8 w-full">
            {selectedManuscript ? (
              <>
                <section className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">
                        Manuscrit
                      </p>
                      <h2 className="text-2xl font-bold text-purple-900">{selectedManuscript.title}</h2>
                      <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                        {selectedManuscript.description || "Pas encore de synopsis, laisse parler ton inspiration ✨"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-2 text-center text-sm font-semibold text-purple-700 shadow-inner">
                      {selectedManuscript.chapters?.length || 0} chapitre
                      {selectedManuscript.chapters?.length > 1 ? "s" : ""}
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">
                        {editingChapterId ? "Modifier le chapitre" : "Nouveau chapitre"}
                      </p>
                      <h3 className="text-xl font-semibold text-purple-900">
                        {editingChapterId ? "Tu ajustes ton texte" : "Pose les premières lignes"}
                      </h3>
                    </div>
                    {editingChapterId && (
                      <button
                        type="button"
                        onClick={() => {
                          setChapterForm({ title: "", content: "" });
                          setEditingChapterId(null);
                        }}
                        className="text-sm font-semibold text-purple-600 transition hover:text-purple-800"
                      >
                        Annuler la modification
                      </button>
                    )}
                  </div>

                  <form className="mt-4 space-y-4" onSubmit={handleChapterSubmit}>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-purple-500">
                        Titre du chapitre
                      </label>
                      <input
                        type="text"
                        value={chapterForm.title}
                        onChange={(event) =>
                          setChapterForm((current) => ({ ...current, title: event.target.value }))
                        }
                        className="mt-1 w-full rounded-2xl border border-purple-100 px-3 py-2 text-sm text-gray-800 shadow-inner focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                        placeholder="Chapitre 1 - La rencontre"
                      />
                    </div>
                    <RichTextEditor
                      value={chapterForm.content}
                      onChange={(content) =>
                        setChapterForm((current) => ({ ...current, content }))
                      }
                    />
                    <button
                      type="submit"
                      disabled={savingChapter}
                      className="rounded-2xl bg-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
                    >
                      {savingChapter
                        ? "Enregistrement..."
                        : editingChapterId
                        ? "Mettre à jour le chapitre"
                        : "Ajouter le chapitre"}
                    </button>
                  </form>
                </section>

                <section className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-xl">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">
                      Progression
                    </p>
                    <h3 className="text-xl font-semibold text-purple-900">
                      {selectedManuscript.chapters?.length || 0} chapitre
                      {selectedManuscript.chapters?.length > 1 ? "s" : ""}
                    </h3>
                  </div>

                  {selectedManuscript.chapters?.length ? (
                    <div className="mt-4 space-y-4">
                      {selectedManuscript.chapters.map((chapter) => (
                        <article
                          key={chapter.id}
                          className="rounded-2xl border border-purple-100 bg-white/90 p-4 shadow hover:border-purple-200"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
                                Chapitre {chapter.order_index ?? "?"}
                              </p>
                              <h4 className="text-lg font-semibold text-purple-900">{chapter.title}</h4>
                              <p className="text-xs text-gray-500">Rédigé le {formatDate(chapter.created_at)}</p>
                            </div>
                            <div className="flex gap-4 text-sm font-semibold">
                              <button
                                type="button"
                                onClick={() => handleEditChapter(chapter)}
                                className="text-purple-600 transition hover:text-purple-800"
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteChapter(chapter.id)}
                                disabled={deletingChapterId === chapter.id}
                                className="text-red-500 transition hover:text-red-700 disabled:opacity-50"
                              >
                                {deletingChapterId === chapter.id ? "Suppression..." : "Supprimer"}
                              </button>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-gray-700">
                            {chapterExcerpt(chapter.content) || "Chapitre encore vide."}
                          </p>
                          <button
                            type="button"
                            onClick={() => openChapterPreview(chapter)}
                            className="mt-3 text-sm font-semibold text-purple-600 transition hover:text-purple-800"
                          >
                            Voir le chapitre →
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl border border-dashed border-purple-200 bg-purple-50/60 p-6 text-center text-sm text-purple-700">
                      Pas encore de chapitre pour ce manuscrit. Ton espace d'écriture est prêt !
                    </p>
                  )}
                </section>
              </>
            ) : (
              <section className="rounded-3xl border border-dashed border-purple-200 bg-white/60 p-10 text-center text-purple-700 shadow-inner">
                <p className="text-lg font-semibold">Commence par créer ton premier manuscrit ✨</p>
              </section>
            )}
          </div>
        </div>
      </main>
      </div>
      <Footer />
      {isShareModalOpen && selectedManuscript && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-purple-100 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">Partager</p>
                <h2 className="text-2xl font-semibold text-purple-900">{selectedManuscript.title}</h2>
                <p className="text-sm text-gray-500">Prépare ton envoi par e-mail.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="rounded-full border border-purple-200 p-2 text-purple-700 transition hover:bg-purple-50"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleShareSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-purple-500">Destinataires</label>
                <input
                  type="text"
                  value={shareRecipients}
                  onChange={(event) => setShareRecipients(event.target.value)}
                  placeholder="email1@example.com, autreadresse@mail.com"
                  className="mt-1 w-full rounded-2xl border border-purple-100 px-3 py-2 text-sm text-gray-800 shadow-inner focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
                <p className="mt-1 text-xs text-gray-500">Sépare les adresses avec une virgule ou un espace.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-purple-500">Sujet</label>
                  <input
                    type="text"
                    value={shareSubject}
                    onChange={(event) => setShareSubject(event.target.value)}
                    placeholder={`Partage de ${selectedManuscript.title}`}
                    className="mt-1 w-full rounded-2xl border border-purple-100 px-3 py-2 text-sm text-gray-800 shadow-inner focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-purple-500">Message</label>
                  <input
                    type="text"
                    value={shareMessage}
                    onChange={(event) => setShareMessage(event.target.value)}
                    placeholder="Quelques mots pour présenter ton texte"
                    className="mt-1 w-full rounded-2xl border border-purple-100 px-3 py-2 text-sm text-gray-800 shadow-inner focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>
              <div className="space-y-2 rounded-2xl border border-purple-100 p-4 text-sm">
                <label className="flex items-center gap-2 font-semibold text-purple-800">
                  <input type="radio" checked={shareIncludeAll} onChange={() => setShareIncludeAll(true)} />
                  Tout le manuscrit
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="radio" checked={!shareIncludeAll} onChange={() => setShareIncludeAll(false)} />
                  Sélectionner des chapitres
                </label>
                {!shareIncludeAll && (
                  <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-dashed border-purple-200 p-3">
                    {selectedManuscript.chapters.length === 0 && (
                      <p className="text-xs text-gray-500">Ce manuscrit n&apos;a pas encore de chapitre.</p>
                    )}
                    {selectedManuscript.chapters.map((chapter) => (
                      <label key={chapter.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={shareSelectedChapters.includes(chapter.id)}
                          onChange={() => toggleChapterShareSelection(chapter.id)}
                        />
                        {chapter.order_index ? `Chapitre ${chapter.order_index} · ` : ""}
                        {chapter.title}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="rounded-full border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sharing}
                  className="rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
                >
                  {sharing ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {previewChapter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={closeChapterPreview}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-purple-100 bg-white p-6 shadow-2xl no-scrollbar"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">
                  Chapitre {previewChapter.order_index ?? "?"}
                </p>
                <h2 className="text-2xl font-semibold text-purple-900">{previewChapter.title}</h2>
                <p className="text-xs text-gray-500">Rédigé le {formatDate(previewChapter.created_at)}</p>
              </div>
              <button
                type="button"
                onClick={closeChapterPreview}
                className="rounded-full border border-purple-200 p-2 text-purple-700 transition hover:bg-purple-50"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <div
              className="mt-6 space-y-4 text-sm leading-relaxed text-gray-700"
              dangerouslySetInnerHTML={{ __html: previewChapter.content }}
            />
          </div>
        </div>
      )}
    </AuroraBackground>
  );
}
