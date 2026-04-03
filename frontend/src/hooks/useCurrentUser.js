import { useEffect, useState } from "react";
import { apiFetch, redirectToLogin } from "../utils/auth";
import { getApiBaseUrl } from "../utils/api";

const API_BASE_URL = getApiBaseUrl();

export default function useCurrentUser(navigate) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    apiFetch(`${API_BASE_URL}/auth/me`, {
      signal: controller.signal,
    })
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
          throw new Error(err.detail || "Impossible de récupérer l'utilisateur");
        }
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [navigate]);

  return {
    user,
    loading,
    isAdmin: Boolean(user?.is_admin),
  };
}
