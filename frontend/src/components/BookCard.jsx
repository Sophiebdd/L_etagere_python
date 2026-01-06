import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { redirectToLogin } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export default function BookCard({ book }) {
  const navigate = useNavigate();
  const item = book || {};
  const volume = item.volumeInfo || {};
  const title = volume.title || "Titre inconnu";
  const authors = volume.authors ? volume.authors.join(", ") : "Auteur inconnu";
  const cover =
    volume.imageLinks?.thumbnail ||
    "https://via.placeholder.com/128x200?text=Pas+d'image";

  const rawDescription = volume.description || "";
  const description =
    rawDescription.slice(0, 150).replace(/<\/?[^>]+(>|$)/g, "") +
    (rawDescription.length > 150 ? "..." : "");

  const handleAddBook = async () => {
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
    } else {
      const err = await response.json().catch(() => ({}));
      // Gérer les erreurs de validation Pydantic
      if (err.detail && Array.isArray(err.detail)) {
        const messages = err.detail.map(e => e.msg || JSON.stringify(e)).join(", ");
        toast.error(`Erreur: ${messages}`);
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
      <h3 className="font-semibold text-violet-700 line-clamp-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-2">{authors}</p>
      <p className="text-xs text-gray-500 flex-grow">{description}</p>

      <button
        onClick={handleAddBook}
        className="mt-3 bg-violet-600 text-white rounded-lg py-2 hover:bg-violet-700 transition"
      >
        📚 Ajouter
      </button>
    </div>
  );
}
