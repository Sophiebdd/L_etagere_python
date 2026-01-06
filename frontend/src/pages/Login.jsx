import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";
import Footer from "../components/Footer";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Identifiants invalides");
      }

      const data = await response.json();

      // Sauvegarder le token JWT
      localStorage.setItem("token", data.access_token);

      // Rediriger vers la page d'accueil
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Erreur de connexion");
    }
  };

  return (
    <AuroraBackground>
      <Header showNavigation={false} />
      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-12 sm:min-h-[70vh] sm:justify-center">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/75 p-8 shadow-2xl backdrop-blur">
          <h2 className="mb-6 text-center text-2xl font-semibold text-purple-700">
            Se connecter 🔐
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-purple-200/80 p-2 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-purple-200/80 p-2 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                required
              />
              <p className="mt-2 text-right text-sm">
                <a
                  href="/forgot-password"
                  className="font-medium text-purple-600 transition hover:text-purple-700 hover:underline"
                >
                  Mot de passe oublié ?
                </a>
              </p>
            </div>

            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-purple-600 py-2 font-semibold text-white transition hover:bg-purple-700"
            >
              Connexion
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Pas encore de compte ?{" "}
            <a
              href="/signup"
              className="font-medium text-purple-600 transition hover:text-purple-700 hover:underline"
            >
              S’inscrire
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </AuroraBackground>
  );
}
