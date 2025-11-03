import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BookSearch from "./pages/BookSearch";
import ProtectedRoute from "./components/ProtectedRoute"; 

function App() {
  return (
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
          path="/search"
          element={
            <ProtectedRoute>
              <BookSearch />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
