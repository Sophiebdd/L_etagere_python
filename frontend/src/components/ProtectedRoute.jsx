import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;

    apiFetch(`${API_BASE_URL}/auth/me`)
      .then((response) => {
        if (!isMounted) {
          return;
        }
        setStatus(response.ok ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (isMounted) {
          setStatus("unauthenticated");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white/70 px-4">
        <p className="rounded-full border border-[#B8C5E5] bg-white px-6 py-3 text-sm font-medium uppercase tracking-[0.28em] text-[#B8C5E5] shadow-lg">
          Chargement...
        </p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
