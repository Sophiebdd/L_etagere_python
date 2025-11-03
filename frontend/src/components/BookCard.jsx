export default function BookCard({ book }) {
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
    if (!token) return alert("Veuillez vous connecter pour ajouter un livre.");

    const bookData = {
      external_id: item.id,
      title,
      author: authors,
      description: volume.description || "",
      publication_date: volume.publishedDate || null,
      isbn:
        volume.industryIdentifiers?.[0]?.identifier ||
        null,
      cover_image: cover,
      status: "À lire",
    };

    const response = await fetch("http://127.0.0.1:8001/books/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookData),
    });

    if (response.ok) {
      alert("📚 Livre ajouté à ta bibliothèque !");
    } else {
      const err = await response.json();
      alert("❌ Erreur : " + (err.detail || "Impossible d’ajouter le livre"));
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
