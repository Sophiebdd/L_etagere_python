import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Manuscripts from "./pages/Manuscripts";
import BookSearch from "./pages/BookSearch";
import ProtectedRoute from "./components/ProtectedRoute"; 

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* redirection automatique */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manuscrits"
            element={
              <ProtectedRoute>
                <Manuscripts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <BookSearch />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "rounded-2xl border border-purple-100 bg-white/90 text-purple-900 shadow-xl backdrop-blur px-4 py-3",
          success: {
            iconTheme: {
              primary: "#7c3aed",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#dc2626",
              secondary: "#ffffff",
            },
          },
        }}
      />
    </>
  );
}

export default App;
