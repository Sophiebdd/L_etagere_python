import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const handleCreateManuscript = async (event) => {
    event.preventDefault();
    if (!formValues.title.trim()) {
      alert("Ajoute un titre à ton manuscrit ✨");
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
      alert(error.message || "Erreur lors de la création du manuscrit");
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
      alert(error.message || "Erreur lors de la suppression");
    } finally {
      setDeletingManuscriptId(null);
    }
  };

  const handleChapterSubmit = async (event) => {
    event.preventDefault();
    if (!selectedManuscript) {
      alert("Commence par créer un manuscrit 📔");
      return;
    }
    if (!chapterForm.title.trim()) {
      alert("Ajoute un titre à ton chapitre");
      return;
    }
    if (isContentEmpty(chapterForm.content)) {
      alert("Le contenu du chapitre est vide");
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
      alert(error.message || "Erreur lors de l'enregistrement du chapitre");
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
      alert(error.message || "Erreur lors de la suppression du chapitre");
    } finally {
      setDeletingChapterId(null);
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
          <h1 className="text-3xl font-semibold text-purple-900">✍️ Mes manuscrits</h1>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="rounded-md border border-purple-200 bg-white px-4 py-2 font-semibold text-purple-700 shadow-sm transition hover:bg-purple-50"
            >
              ← Retour au dashboard
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

        <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
          <div className="space-y-6">
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

          <div className="space-y-8">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">
                        Progression
                      </p>
                      <h3 className="text-xl font-semibold text-purple-900">
                        {selectedManuscript.chapters?.length || 0} chapitre
                        {selectedManuscript.chapters?.length > 1 ? "s" : ""}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={loadManuscripts}
                      className="text-sm font-semibold text-purple-600 transition hover:text-purple-800"
                    >
                      Rafraîchir ↺
                    </button>
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
                          <div
                            className="mt-3 space-y-2 text-sm leading-relaxed text-gray-700"
                            dangerouslySetInnerHTML={{ __html: chapter.content }}
                          />
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
    </AuroraBackground>
  );
}
