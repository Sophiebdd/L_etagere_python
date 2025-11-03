import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // 🚪 Si pas de token → redirection vers /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Sinon on affiche la page demandée
  return children;
}
