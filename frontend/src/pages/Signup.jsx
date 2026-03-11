import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ import indispensable
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";
import Footer from "../components/Footer";
import { isValidPassword, PASSWORD_POLICY_MESSAGE } from "../utils/passwordValidation";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

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
    if (!isValidPassword(formData.password)) {
      setMessage(`❌ Erreur : ${PASSWORD_POLICY_MESSAGE}`);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
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
      console.error(error);
      setMessage("⚠️ Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackground>
      <Header showNavigation={false} />
      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-12 sm:min-h-[70vh] sm:justify-center">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/80 p-8 shadow-2xl backdrop-blur">
          <h1 className="mb-6 text-center text-2xl font-semibold text-[#B8C5E5]">
            Créer un compte 📚
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom d&apos;utilisateur
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-[#B8C5E5] px-3 py-2 shadow-sm focus:border-[#B8C5E5] focus:outline-none focus:ring-2 focus:ring-[#B8C5E5]"
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
                className="mt-1 w-full rounded-lg border border-[#B8C5E5] px-3 py-2 shadow-sm focus:border-[#B8C5E5] focus:outline-none focus:ring-2 focus:ring-[#B8C5E5]"
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
                minLength={8}
                className="mt-1 w-full rounded-lg border border-[#B8C5E5] px-3 py-2 shadow-sm focus:border-[#B8C5E5] focus:outline-none focus:ring-2 focus:ring-[#B8C5E5]"
              />
              <p className="mt-1 text-xs text-gray-500">{PASSWORD_POLICY_MESSAGE}</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-2 w-full rounded-lg py-2 font-semibold text-white transition ${
                loading
                  ? "cursor-not-allowed bg-[#B8C5E5]"
                  : "bg-[#B8C5E5] hover:bg-[#B8C5E5]"
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
      </main>
      <Footer />
    </AuroraBackground>
  );
}
