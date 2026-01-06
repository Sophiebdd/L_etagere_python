import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Lien invalide. Merci de refaire la demande.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Impossible de mettre à jour le mot de passe");
      }

      toast.success("Ton mot de passe a été mis à jour 🎉");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Impossible de mettre à jour le mot de passe");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuroraBackground>
      <Header showNavigation={false} />
      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-12 sm:min-h-[70vh] sm:justify-center">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/75 p-8 shadow-2xl backdrop-blur">
          <h2 className="mb-6 text-center text-2xl font-semibold text-purple-700">
            Définir un nouveau mot de passe
          </h2>

          {!token ? (
            <p className="text-center text-sm text-red-500">
              Le lien de réinitialisation est invalide ou expiré. Merci de refaire une demande.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-purple-200/80 p-2 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirme le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-purple-200/80 p-2 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  required
                  minLength={8}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-purple-600 py-2 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-600">
            <a
              href="/forgot-password"
              className="font-medium text-purple-600 transition hover:text-purple-700 hover:underline"
            >
              Besoin d&apos;un nouveau lien ?
            </a>
          </p>
        </div>
      </main>
    </AuroraBackground>
  );
}
