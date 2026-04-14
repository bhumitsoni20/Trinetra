import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import ExamGate from "./pages/ExamGate";
import ExamRoom from "./pages/ExamRoom";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminLogs from "./pages/AdminLogs";
import LandingPage from "./pages/LandingPage";

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("trinetra_user"));
    } catch {
      return null;
    }
  });

  const handleLogin = (userData) => {
    localStorage.setItem("trinetra_user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("trinetra_user");
    setUser(null);
  };

  const isStudent = user && user.role === "student";
  const isAdmin = user && user.role === "admin";

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        user ? <Navigate to={isAdmin ? "/admin" : "/exam-gate"} replace /> :
        <LoginPage onLogin={handleLogin} />
      } />
      <Route path="/admin-login" element={
        <Navigate to="/login" replace />
      } />

      {/* Student Routes */}
      <Route path="/exam-gate" element={
        isStudent ? <ExamGate user={user} onLogout={handleLogout} /> :
        <Navigate to="/login" />
      } />
      <Route path="/exam" element={
        isStudent ? <ExamRoom user={user} onLogout={handleLogout} /> :
        <Navigate to="/login" />
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        isAdmin ? <AdminDashboard user={user} onLogout={handleLogout} /> :
        <Navigate to="/login" />
      } />
      <Route path="/admin/users" element={
        isAdmin ? <AdminUsers user={user} onLogout={handleLogout} /> :
        <Navigate to="/login" />
      } />
      <Route path="/admin/logs" element={
        isAdmin ? <AdminLogs user={user} onLogout={handleLogout} /> :
        <Navigate to="/login" />
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
