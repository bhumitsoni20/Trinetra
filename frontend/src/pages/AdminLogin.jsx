import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, LogIn } from "lucide-react";
import { loginUser } from "../services/api";

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginUser(email, password);
      if (user.role !== "admin") {
        setError("Access denied. This portal is for administrators only.");
        setLoading(false);
        return;
      }
      onLogin(user);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="ambient-bg" />
      <div className="ambient-grid" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="animate-fadeInUp mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Admin Panel</h1>
          <p className="mt-1 text-sm text-slate-400">Trinetra Proctoring Management</p>
        </div>

        {/* Form Card */}
        <div className="glass-card animate-fadeInUp stagger-1 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Admin Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="admin@trinetra.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  className="input-field pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full justify-center py-3"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#fff",
                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                borderRadius: "0.75rem",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(139, 92, 246, 0.25)",
                transition: "all 0.3s ease",
              }}
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <><LogIn size={16} /> Access Dashboard</>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-slate-500 hover:text-slate-400 transition">
            ← Student Login
          </Link>
        </div>
      </div>
    </div>
  );
}
