import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { KeyRound, ArrowRight, ArrowLeft } from "lucide-react";
import { verifyOTP } from "../services/api";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await verifyOTP(email, otp);
      navigate("/reset-password", { state: { email, otp } });
    } catch (err) {
      setError(err.message || "Invalid OTP code. Please try again.");
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
          <h1 className="font-display text-2xl font-bold text-white">Enter OTP Code</h1>
          <p className="mt-2 text-sm text-center text-slate-400">
            We've sent a 6-digit code to <span className="text-white font-medium">{email}</span>.
          </p>
        </div>

        <div className="glass-card animate-fadeInUp stagger-1 rounded-2xl p-8 backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400 text-center">6-Digit Code</label>
              <div className="relative flex justify-center">
                <KeyRound size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  maxLength={6}
                  className="input-field pl-12 text-center text-2xl tracking-[0.5em] font-mono bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none w-full"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
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
              disabled={loading || otp.length !== 6}
              className="btn-primary w-full flex items-center justify-center py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Verify Code <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link to="/forgot-password" className="inline-flex items-center text-xs text-slate-400 hover:text-white transition">
            <ArrowLeft size={14} className="mr-1.5" /> Back
          </Link>
        </div>
      </div>
    </div>
  );
}
