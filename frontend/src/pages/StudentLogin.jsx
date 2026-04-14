import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus } from "lucide-react";

import Logo from "../assets/TRINETRA.png";
import { loginUser, registerUser } from "../services/api";

export default function StudentLogin({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <img src={Logo} alt="Trinetra logo" className="h-11 w-11 object-contain" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            <span className="text-[#6B2BD9]">T</span>RI<span className="text-[#6B2BD9]">N</span>ETRA
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isRegister ? "Create your student account" : "Student Exam Portal"}
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card animate-fadeInUp stagger-1 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700">Username</label>
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
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">First Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">Last Name</label>
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
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                {isRegister ? "Email Address" : "Email or Username"}
              </label>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
                  <Mail size={16} className="text-slate-600" />
                </span>
                <input
                  type={isRegister ? "email" : "text"}
                  className="input-field flex-1"
                  placeholder={isRegister ? "student@university.edu" : "student@university.edu or username"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">Password</label>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
                  <Lock size={16} className="text-slate-600" />
                </span>
                <div className="relative flex-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input-field w-full pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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

          <div className="mt-5 text-center text-sm text-slate-600">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(""); }}
              className="font-medium text-blue-600 hover:text-blue-700 transition"
            >
              {isRegister ? "Sign In" : "Register"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/admin-login" className="text-xs text-slate-600 hover:text-slate-900 transition">
            Admin Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
