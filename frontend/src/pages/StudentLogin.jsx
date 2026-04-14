import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { loginUser, registerUser } from "../services/api";

export default function StudentLogin({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const data = await registerUser({
          username,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          role: "student",
        });
        // Auto-login after registration
        const user = await loginUser(email, password);
        onLogin(user);
        navigate("/exam-gate");
      } else {
        const user = await loginUser(email, password);
        if (user.role === "admin") {
          setError("Please use Admin Login for admin accounts.");
          setLoading(false);
          return;
        }
        onLogin(user);
        navigate("/exam-gate");
      }
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
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
            <Eye size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Trinetra</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isRegister ? "Create your student account" : "Student Exam Portal"}
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card animate-fadeInUp stagger-1 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Username</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">First Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Last Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="student@university.edu"
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
                  minLength={6}
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
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : isRegister ? (
                <><UserPlus size={16} /> Create Account</>
              ) : (
                <><LogIn size={16} /> Sign In</>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-400">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(""); }}
              className="font-medium text-cyan-400 hover:text-cyan-300 transition"
            >
              {isRegister ? "Sign In" : "Register"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/admin-login" className="text-xs text-slate-500 hover:text-slate-400 transition">
            Admin Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
