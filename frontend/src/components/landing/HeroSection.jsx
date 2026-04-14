import { ArrowRight, PlayCircle, ShieldCheck, Activity, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const HERO_METRICS = [
  { label: "Realtime AI Checks", value: "24/7", icon: Activity },
  { label: "Live Alerts", value: "Instant", icon: Eye },
  { label: "Secure Sessions", value: "99.9%", icon: ShieldCheck },
];

export default function HeroSection() {
  return (
    <section className="relative py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Text Content */}
          <div>
            <span className="inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200 sm:px-4 sm:py-1.5 sm:text-xs">
              AI Exam Proctoring Platform
            </span>

            <h1 className="mt-6 font-display text-3xl font-bold leading-[1.08] text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Upgrade Exam Integrity with
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base lg:text-lg">
              Monitor candidates in realtime, detect suspicious behavior instantly, and maintain privacy-first logs in a
              polished invigilation workflow built for modern institutions.
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                to="/admin-login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition duration-300 hover:scale-[1.02] hover:shadow-blue-400/35"
              >
                Access Admin Dashboard
                <ArrowRight size={16} />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/10"
              >
                <PlayCircle size={16} />
                See How It Works
              </a>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {HERO_METRICS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 backdrop-blur-xl transition duration-300 hover:border-cyan-300/25"
                >
                  <item.icon className="mb-2 h-4 w-4 text-cyan-200" />
                  <p className="font-display text-lg font-semibold text-white">{item.value}</p>
                  <p className="text-[10px] text-slate-400 sm:text-xs">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - System Status Card */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-500/25 via-blue-500/10 to-violet-500/20 blur-3xl" />

            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/50 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">System Status</p>
                  <p className="mt-1 font-display text-xl font-semibold text-white">Monitoring Active</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                  Online
                </span>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Face Detection Confidence", value: "96%", width: "96%", gradient: "from-cyan-400 to-blue-500" },
                  { label: "Alert Pipeline Latency", value: "120 ms", width: "82%", gradient: "from-violet-400 to-indigo-500" },
                  { label: "Exam Session Integrity", value: "High", width: "91%", gradient: "from-emerald-400 to-cyan-500" },
                ].map((bar) => (
                  <div key={bar.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                      <span>{bar.label}</span>
                      <span>{bar.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${bar.gradient}`}
                        style={{ width: bar.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
