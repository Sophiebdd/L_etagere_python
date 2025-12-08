import { useState } from "react";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setInfoMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8001/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Impossible d'envoyer la demande pour le moment.");
      }

      setInfoMessage(data.message);
      setEmail("");
      toast.success("Si un compte existe, un email a été envoyé 🎉");
    } catch (err) {
      toast.error(err.message || "Une erreur est survenue");
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
            Mot de passe oublié ?
          </h2>
          <p className="mb-6 text-center text-sm text-gray-600">
            Indique ton adresse email et on t&apos;enverra un lien pour définir un nouveau mot de passe.
          </p>

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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-purple-600 py-2 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Envoi en cours..." : "Recevoir le lien"}
            </button>
          </form>

          {infoMessage && (
            <p className="mt-4 text-center text-sm text-purple-700">
              {infoMessage}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-gray-600">
            <a
              href="/login"
              className="font-medium text-purple-600 transition hover:text-purple-700 hover:underline"
            >
              ⟵ Retour à la connexion
            </a>
          </p>
        </div>
      </main>
    </AuroraBackground>
  );
}
