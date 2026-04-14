import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, CheckCircle, ArrowLeft } from "lucide-react";
import { resetPasswordAPI } from "../services/api";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const otp = location.state?.otp;

  useEffect(() => {
    if (!email || !otp) {
      navigate("/login");
    }
  }, [email, otp, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      await resetPasswordAPI(email, otp, password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
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
          <h1 className="font-display text-2xl font-bold text-white">Create New Password</h1>
          <p className="mt-2 text-sm text-center text-slate-400">
            Please enter your new password below.
          </p>
        </div>

        <div className="glass-card animate-fadeInUp stagger-1 rounded-2xl p-8 backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
          {success ? (
            <div className="flex flex-col items-center py-6">
              <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/50">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Password Updated!</h3>
              <p className="text-sm text-slate-400 text-center mb-6">
                Your password has been changed successfully. You will be redirected to the login page shortly.
              </p>
              <Link to="/login" className="btn-primary w-full justify-center py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    className="input-field pl-10 w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    className="input-field pl-10 w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 transition-all text-center">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="btn-primary w-full flex items-center justify-center py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}
        </div>

        {!success && (
          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center text-xs text-slate-400 hover:text-white transition">
              <ArrowLeft size={14} className="mr-1.5" /> Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
