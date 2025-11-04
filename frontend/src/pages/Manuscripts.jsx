import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";

export default function Manuscripts() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <AuroraBackground>
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-12">
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

        <section className="rounded-2xl border border-purple-100 bg-white/80 p-10 text-center text-purple-700 shadow-lg backdrop-blur">
          <h2 className="mb-4 text-2xl font-semibold text-purple-800">
            Bientôt disponible ✨
          </h2>
          <p className="text-sm text-gray-600">
            Nous préparons un espace d’écriture pour que tu puisses travailler sur tes manuscrits,
            suivre ta progression et conserver toutes tes notes. Reste connecté·e pour la V2 !
          </p>
        </section>
      </main>
    </AuroraBackground>
  );
}
