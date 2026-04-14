import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";

import Logo from "../assets/TRINETRA.png";

import { submitAuthToken, loginUser } from "../services/api";
import { auth, googleProvider } from "../services/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let idToken = null;
      let userData = null;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Enforce Email Verification Rule
        if (!userCredential.user.emailVerified) {
          throw new Error("Please verify your email before logging in.");
        }

        idToken = await userCredential.user.getIdToken();
      } catch (fbError) {
        // If Firebase fails (e.g., they reset the password via OTP which only updated Django database)
        // We will fallback to logging them in directly to Django using the email/password natively!
        if (fbError.message.includes("verify your email")) {
             throw fbError; // Don't bypass email verification limits
        }
        console.warn("Firebase Auth failed, attempting direct Backend DB login...");
      }

      if (idToken) {
           const res = await submitAuthToken("/api/auth/login/", idToken);
           userData = res.user;
      } else {
           // Fallback to Django Password DB
           const res = await loginUser(email, password);
           userData = res.user;
      }

      onLogin(userData);

      if (userData.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/exam-gate");
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
      setError(err.message || "Google Authentication failed.");
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
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <img src={Logo} alt="Trinetra logo" className="h-11 w-11 object-contain" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Sign In</h1>
          <p className="mt-1 text-sm text-slate-400">Welcome to Trinetra Proctoring</p>
        </div>

        <div className="glass-card animate-fadeInUp stagger-1 rounded-2xl p-8 backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">Email Address</label>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
                  <Mail size={16} className="text-slate-600" />
                </span>
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
              <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-400">Password</label>
                  <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                      Forgot Password?
                  </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pl-10 pr-10 w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                  placeholder="........"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 transition-all">
                {error}
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
                  <LogIn size={16} className="mr-2" /> Access Dashboard
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
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center py-3 bg-white hover:bg-slate-50 text-slate-800 rounded-lg transition-colors font-medium cursor-pointer"
          >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />
              Sign in with Google
          </button>
          
          <p className="mt-5 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Sign Up
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-slate-600 hover:text-slate-900 transition">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
