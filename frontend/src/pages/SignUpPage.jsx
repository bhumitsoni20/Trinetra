import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Mail, Lock, UserPlus } from "lucide-react";

import { submitAuthToken } from "../services/api";
import { auth, googleProvider } from "../services/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, sendEmailVerification } from "firebase/auth";

export default function SignUpPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Send verification email immediately
      await sendEmailVerification(userCredential.user);
      setMessage("Verification email sent! Please check your inbox before logging in.");
      
      // We don't automatically log them in because they need to verify first
      // But we can clear the form
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setLoading(true);
    try {
      let idToken = "mock_google_token";
      try {
        const result = await signInWithPopup(auth, googleProvider);
        idToken = await result.user.getIdToken();
      } catch (fbError) {
        if (!auth.app.options.apiKey || auth.app.options.apiKey === "dummy-api-key") {
          console.warn("Using dummy token fallback for Google Login.");
        } else {
          throw fbError;
        }
      }

      const res = await submitAuthToken("/api/auth/google/", idToken);
      onLogin(res.user);

      if (res.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/exam-gate");
      }
    } catch (err) {
      setError(err.message || "Google Sign-Up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 bg-slate-900">
      <div className="ambient-bg" />
      <div className="ambient-grid" />

      <div className="relative z-10 w-full max-w-md">
        <div className="animate-fadeInUp mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
            <UserPlus size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Create an Account</h1>
          <p className="mt-1 text-sm text-slate-400">Join Trinetra Proctoring today</p>
        </div>

        <div className="glass-card animate-fadeInUp stagger-1 rounded-2xl p-8 backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
          <form onSubmit={handleEmailSignUp} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  className="input-field pl-10 w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                  placeholder="name@domain.com"
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
                  className="input-field pl-10 w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                  placeholder="........"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-500">Must be at least 6 characters long.</p>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 transition-all">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300 transition-all">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-cyan-500/20"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <UserPlus size={16} className="mr-2" /> Sign Up
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
              <div className="h-px w-full bg-slate-700/50"></div>
              <span className="text-xs text-slate-500 uppercase font-medium tracking-wide">OR</span>
              <div className="h-px w-full bg-slate-700/50"></div>
          </div>

          <button
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center py-3 bg-white hover:bg-slate-50 text-slate-800 rounded-lg transition-colors font-medium cursor-pointer"
          >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />
              Sign up with Google
          </button>
          
          <p className="mt-5 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-400 transition">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
