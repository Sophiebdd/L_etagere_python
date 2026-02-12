import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { redirectToLogin } from "../utils/auth";
import CoverPlaceholder from "../assets/cover-placeholder.svg";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export default function BookCard({ book, isInLibrary = false, onAdded }) {
  const navigate = useNavigate();
  const item = book || {};
  const volume = item.volumeInfo || {};
  const title = volume.title || "Titre inconnu";
  const authors = volume.authors ? volume.authors.join(", ") : "Auteur inconnu";
  const genre = volume.categories?.[0] || null;
  const cover = volume.imageLinks?.thumbnail || CoverPlaceholder;

  const rawDescription = volume.description || "";
  const description =
    rawDescription.slice(0, 150).replace(/<\/?[^>]+(>|$)/g, "") +
    (rawDescription.length > 150 ? "..." : "");

  const handleAddBook = async () => {
    if (isInLibrary) return;
    const token = localStorage.getItem("token");
    if (!token) {
      redirectToLogin(navigate);
      return;
    }

    const bookData = {
      external_id: item.id,
      title,
      author: authors,
      description: volume.description || "",
      publication_date: volume.publishedDate || null,
      isbn:
        volume.industryIdentifiers?.[0]?.identifier ||
        null,
      cover_image: volume.imageLinks?.thumbnail || null,
      genre,
      status: "À lire",
    };

    const response = await fetch(`${API_BASE_URL}/books/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookData),
    });

    if (response.status === 401) {
      redirectToLogin(navigate);
      return;
    }

    if (response.ok) {
      toast.success("📚 Livre ajouté à ta bibliothèque !");
      if (item.id && typeof onAdded === "function") {
        onAdded(item.id);
      }
    } else {
      const err = await response.json().catch(() => ({}));
      // Gérer les erreurs de validation Pydantic
      if (err.detail && Array.isArray(err.detail)) {
        const messages = err.detail.map(e => e.msg || JSON.stringify(e)).join(", ");
        toast.error(`Erreur: ${messages}`);
      } else if (response.status === 409) {
        toast.error("Déjà dans ta bibliothèque.");
      } else {
        toast.error(err.detail || "Impossible d'ajouter le livre");
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col">
      <img
        src={cover}
        alt={title}
        className="rounded-md mb-3 h-56 object-cover"
      />
      <h3 className="font-semibold text-[#B8C5E5] line-clamp-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-2">{authors}</p>
      {genre && <p className="text-xs text-[#B8C5E5] mb-2">{genre}</p>}
      <p className="text-xs text-gray-500 flex-grow">{description}</p>

      <button
        onClick={handleAddBook}
        disabled={isInLibrary}
        className="mt-3 rounded-lg bg-[#B8C5E5] py-2 text-white transition hover:bg-[#B8C5E5] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isInLibrary ? "Dans ma bibliothèque" : "📚 Ajouter"}
      </button>
    </div>
  );
}
