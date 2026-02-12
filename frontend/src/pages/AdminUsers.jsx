import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AuroraBackground from "../components/AuroraBackground";
import Footer from "../components/Footer";
import { redirectToLogin } from "../utils/auth";
import useCurrentUser from "../hooks/useCurrentUser";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: userLoading } = useCurrentUser(navigate);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const headers = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (userLoading) return;
    if (!user) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    const url = `${API_BASE_URL}/users${params.toString() ? `?${params.toString()}` : ""}`;

    setLoading(true);
    fetch(url, { headers })
      .then(async (res) => {
        if (res.status === 401) {
          redirectToLogin(navigate);
          throw new Error("Session expirée");
        }
        if (res.status === 403) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Accès interdit");
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Impossible de charger les utilisateurs");
        }
        return res.json();
      })
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        toast.error(err.message || "Erreur lors du chargement");
      })
      .finally(() => setLoading(false));
  }, [headers, isAdmin, navigate, query, user, userLoading]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setQuery(searchInput.trim());
  };

  const toggleActive = async (target) => {
    const token = localStorage.getItem("token");
    if (!token) {
      redirectToLogin(navigate);
      return;
    }

    setUpdatingId(target.id);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${target.id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !target.is_active }),
      });

      if (response.status === 401) {
        redirectToLogin(navigate);
        return;
      }
      if (response.status === 403) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Accès interdit");
      }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Impossible de mettre à jour l'utilisateur");
      }

      const updated = await response.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erreur lors de la mise à jour");
    } finally {
      setUpdatingId(null);
    }
  };

  if (userLoading) {
    return (
      <AuroraBackground>
        <Header onLogout={handleLogout} />
        <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-12">
          <p className="rounded-full border border-[#B8C5E5] bg-white/80 px-6 py-3 text-sm font-medium uppercase tracking-[0.28em] text-[#B8C5E5] shadow-lg">
            Chargement...
          </p>
        </div>
      </AuroraBackground>
    );
  }

  if (!isAdmin) {
    return (
      <AuroraBackground>
        <Header onLogout={handleLogout} />
        <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 pb-20 pt-12 text-center">
          <div className="rounded-3xl border border-white/20 bg-white/80 p-10 text-[#6b4b35] shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#B8C5E5]">
              Accès refusé
            </p>
            <h1 className="mt-4 text-3xl font-semibold">Cette zone est réservée aux admins.</h1>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-6 rounded-full border border-[#B8C5E5] bg-white px-6 py-2 text-xs font-semibold uppercase tracking-wider text-[#6b4b35] transition hover:bg-[#B8C5E5]"
            >
              Retour au tableau de bord
            </button>
          </div>
        </main>
        <Footer />
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <Header onLogout={handleLogout} showAdmin={isAdmin} onAdmin={() => navigate("/admin/users")} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-12">
        <div className="mb-10 space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8C5E5]">
            Administration
          </p>
          <h1 className="text-3xl font-semibold text-[#6b4b35]">Gestion des utilisateurs</h1>
          
        </div>

        <section className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-2xl backdrop-blur">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Rechercher par email ou pseudo"
              className="w-full flex-1 rounded-2xl border border-[#B8C5E5]/70 bg-white px-4 py-2 text-sm text-[#6b4b35] shadow-inner focus:border-[#B8C5E5] focus:outline-none focus:ring-2 focus:ring-[#B8C5E5]"
            />
            <button
              type="submit"
              className="rounded-full border border-[#B8C5E5] bg-[#B8C5E5] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#a8b7da]"
            >
              Rechercher
            </button>
          </form>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/30">
            <div className="grid grid-cols-[1.5fr,1.2fr,0.7fr,0.8fr] gap-4 bg-[#B8C5E5]/20 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6b4b35]">
              <span>Utilisateur</span>
              <span>Email</span>
              <span>Rôle</span>
              <span>Statut</span>
            </div>
            {loading ? (
              <div className="bg-white/60 px-4 py-6 text-sm text-[#6b4b35]/70">Chargement...</div>
            ) : users.length === 0 ? (
              <div className="bg-white/60 px-4 py-6 text-sm text-[#6b4b35]/70">
                Aucun utilisateur trouvé.
              </div>
            ) : (
              <div className="divide-y divide-white/40 bg-white/60">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="grid grid-cols-[1.5fr,1.2fr,0.7fr,0.8fr] gap-4 px-4 py-4 text-sm text-[#6b4b35]"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{u.username}</span>
                      <span className="text-xs text-[#7a5a44]/70">ID {u.id}</span>
                    </div>
                    <span className="break-all text-sm text-[#7a5a44]">{u.email}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#6b4b35]">
                      {u.is_admin ? "Admin" : "Lecteur"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleActive(u)}
                      disabled={updatingId === u.id}
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                        u.is_active
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {updatingId === u.id
                        ? "Mise à jour..."
                        : u.is_active
                          ? "Actif"
                          : "Désactivé"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </AuroraBackground>
  );
}
