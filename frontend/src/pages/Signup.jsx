import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ import indispensable

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // ✅ déclare ici ton hook

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8001/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Compte créé avec succès ! Bienvenue, ${data.username}.`);

        // 🧹 Reset du formulaire
        setFormData({ username: "", email: "", password: "" });

        // ⏳ Petite pause avant la redirection (optionnelle, pour que le message s’affiche)
        setTimeout(() => navigate("/login"), 1500);
      } else {
        const err = await response.json();
        setMessage(`❌ Erreur : ${err.detail || "Une erreur est survenue."}`);
      }
    } catch (error) {
      setMessage("⚠️ Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 to-pink-100">
      <div className="bg-white/70 backdrop-blur-md shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center text-violet-700 mb-6">
          Créer un compte 📚
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 mt-2 text-white font-semibold rounded-lg transition ${
              loading
                ? "bg-violet-300 cursor-not-allowed"
                : "bg-violet-500 hover:bg-violet-600"
            }`}
          >
            {loading ? "Création..." : "S'inscrire"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center text-sm font-medium ${
              message.startsWith("✅")
                ? "text-green-600"
                : message.startsWith("❌")
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
