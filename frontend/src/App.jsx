import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import ExamGate from "./pages/ExamGate";
import ExamRoom from "./pages/ExamRoom";
import AdminDashboard from "./pages/AdminDashboard";
import LiveMonitering from "./pages/LiveMonitering";
import AdminUsers from "./pages/AdminUsers";
import AdminLogs from "./pages/AdminLogs";
import CreateExam from "./pages/CreateExam";
import ExaminerDashboard from "./pages/ExaminerDashboard";
import LandingPage from "./pages/LandingPage";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";
import SignUpPage from "./pages/SignUpPage";



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
  const isExaminer = user && user.role === "examiner";

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        user ? (
          <Navigate to={
            isAdmin ? "/admin-dashboard" : isExaminer ? "/examiner-dashboard" : "/exam"
          } replace />
        ) :
        <LoginPage onLogin={handleLogin} />
      } />
      <Route path="/signup" element={
        user ? (
          <Navigate to={
            isAdmin ? "/admin-dashboard" : isExaminer ? "/examiner-dashboard" : "/exam"
          } replace />
        ) :
        <SignUpPage onLogin={handleLogin} />
      } />
      <Route path="/admin-login" element={
        <Navigate to="/login" replace />
      } />
      
      {/* Auth Flows */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Student Routes */}
      <Route path="/exam" element={
        isStudent ? <ExamGate user={user} onLogout={handleLogout} /> :
        <Navigate to="/login" />
      } />
      <Route path="/exam/:examId" element={
        isStudent ? <ExamRoom user={user} onLogout={handleLogout} /> :
        <Navigate to="/login" />
      } />
      <Route path="/exam-gate" element={<Navigate to="/exam" replace />} />

      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={
        isAdmin ? <AdminDashboard user={user} onLogout={handleLogout} /> :
        <Navigate to="/login" />
      } />
      <Route path="/admin" element={
        isAdmin ? <AdminDashboard user={user} onLogout={handleLogout} /> :
        <Navigate to="/login" />
      } />
      <Route path="/admin/live" element={
        isAdmin ? <LiveMonitering user={user} onLogout={handleLogout} /> :
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
      <Route path="/admin/create-exam/*" element={
        <CreateExam user={user} onLogout={handleLogout} />
      } />

      {/* Examiner Routes */}
      <Route path="/examiner-dashboard" element={
        isExaminer ? <ExaminerDashboard user={user} onLogout={handleLogout} /> :
        <Navigate to="/login" />
      } />
      <Route path="/examiner/live" element={
        isExaminer ? <LiveMonitering user={user} onLogout={handleLogout} /> :
        <Navigate to="/login" />
      } />
      <Route path="/examiner/users" element={
        isExaminer ? <AdminUsers user={user} onLogout={handleLogout} /> :
        <Navigate to="/login" />
      } />
      <Route path="/examiner/create-exam" element={
        isExaminer ? <CreateExam user={user} onLogout={handleLogout} /> :
        <Navigate to="/login" />
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
