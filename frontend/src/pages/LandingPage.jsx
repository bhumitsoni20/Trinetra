import { Link } from "react-router-dom";
import { ShieldCheck, Eye, Monitor, Users, Zap, Lock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="ambient-bg" />
      <div className="ambient-grid" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Eye size={20} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white">Trinetra</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost text-sm">Student Login</Link>
          <Link to="/admin-login" className="btn-primary text-sm">Admin Panel</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center px-6 pt-16 pb-20 text-center sm:pt-24 lg:pt-32">
        <div className="animate-fadeInUp mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-300">
          <Zap size={14} />
          AI-Powered Exam Proctoring System
        </div>

        <h1 className="animate-fadeInUp stagger-1 font-display max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-7xl">
          Secure Exams with{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Intelligence
          </span>
        </h1>

        <p className="animate-fadeInUp stagger-2 mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
          Real-time face detection, tab-switch monitoring, and behavioral analysis.
          Trinetra ensures exam integrity with privacy-first AI surveillance.
        </p>

        <div className="animate-fadeInUp stagger-3 mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/login" className="btn-primary px-8 py-3 text-base">
            <Monitor size={18} />
            Take an Exam
          </Link>
          <Link to="/admin-login" className="btn-ghost px-8 py-3 text-base">
            <ShieldCheck size={18} />
            Admin Dashboard
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 pb-24 sm:px-10">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              icon: Eye,
              title: "Face Detection",
              desc: "Detects when the student's face is not visible or multiple faces appear in the frame.",
              color: "from-cyan-500 to-cyan-600",
              glow: "shadow-cyan-500/15",
            },
            {
              icon: Monitor,
              title: "Tab Switch Guard",
              desc: "Detects tab switching and window minimization. 3 violations = automatic disqualification.",
              color: "from-purple-500 to-purple-600",
              glow: "shadow-purple-500/15",
            },
            {
              icon: Lock,
              title: "Privacy First",
              desc: "No continuous video stored. Only event logs and suspicious-activity snapshots are captured.",
              color: "from-emerald-500 to-emerald-600",
              glow: "shadow-emerald-500/15",
            },
          ].map((feat, i) => (
            <div
              key={feat.title}
              className={`glass-card animate-fadeInUp stagger-${i + 1} rounded-2xl p-6`}
            >
              <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${feat.color} p-3 shadow-lg ${feat.glow}`}>
                <feat.icon size={22} className="text-white" />
              </div>
              <h3 className="font-display mb-2 text-lg font-semibold text-white">{feat.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 px-6 py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Trinetra AI Proctoring. Built for secure online examinations.</p>
      </footer>
    </div>
  );
}
