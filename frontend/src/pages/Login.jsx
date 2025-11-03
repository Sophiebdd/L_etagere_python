import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8001/auth/login", {
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center text-purple-700 mb-6">
          Se connecter 🔐
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md focus:ring focus:ring-purple-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md focus:ring focus:ring-purple-200"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-md transition"
          >
            Connexion
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Pas encore de compte ?{" "}
          <a
            href="/signup"
            className="text-purple-600 hover:underline font-medium"
          >
            S’inscrire
          </a>
        </p>
      </div>
    </div>
  );
}
