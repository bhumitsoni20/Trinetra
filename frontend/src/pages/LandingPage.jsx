import { Link } from "react-router-dom";
import { Activity, Brain, Eye, Lock, Monitor, ShieldCheck, Menu, X } from "lucide-react";
import { useState } from "react";

import FeatureCard from "../components/landing/FeatureCard";
import Footer from "../components/landing/Footer";
import HeroSection from "../components/landing/HeroSection";
import HowItWorks from "../components/landing/HowItWorks";

const CORE_FEATURES = [
  {
    icon: Eye,
    title: "Computer Vision Vigilance",
    description:
      "Continuously analyzes face presence and detects multiple-person anomalies in the candidate frame.",
    tone: "cyan",
    tag: "Vision",
  },
  {
    icon: Brain,
    title: "Behavior Intelligence",
    description:
      "Tracks movement and behavioral signals to surface suspicious activity with transparent risk scoring.",
    tone: "violet",
    tag: "AI Engine",
  },
  {
    icon: ShieldCheck,
    title: "Audit-Ready Control",
    description:
      "Maintains metadata-only logs and role-based oversight to support institutional compliance needs.",
    tone: "emerald",
    tag: "Governance",
  },
];

const KEY_FEATURES = [
  {
    icon: Activity,
    title: "Real-time monitoring",
    description: "Live exam streams are evaluated continuously with low-latency event detection.",
    tone: "cyan",
  },
  {
    icon: Monitor,
    title: "Tab switch detection",
    description: "Browser focus changes and exam context switches are tracked and logged immediately.",
    tone: "violet",
  },
  {
    icon: Lock,
    title: "Privacy-first system",
    description: "No raw video storage, only meaningful metadata and alert trails for review.",
    tone: "emerald",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-36 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px] sm:h-96 sm:w-96" />
        <div className="absolute -right-20 top-32 h-60 w-60 rounded-full bg-indigo-500/20 blur-[110px] sm:h-80 sm:w-80" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-violet-500/15 blur-[100px] sm:h-72 sm:w-72" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/25 bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                <Eye size={20} className="text-white" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight text-white">Trinetra</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden items-center gap-3 sm:flex">
              <a
                href="#features"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
              >
                Features
              </a>
              <Link
                to="/admin-login"
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-300 hover:scale-[1.02]"
              >
                Admin Login
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5 sm:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-xl sm:hidden">
              <div className="flex flex-col gap-3">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-center text-sm font-medium text-slate-300 transition hover:bg-white/5"
                >
                  Features
                </a>
                <Link
                  to="/admin-login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-300/30 bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          )}
        </header>

        <HeroSection />

        {/* Core Features Section */}
        <section id="features" className="mt-4 pb-20 sm:mt-8">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Core Features</p>
              <h2 className="mx-auto mt-3 max-w-3xl font-display text-3xl font-semibold text-white sm:text-4xl">
                Production-ready exam proctoring, designed like modern SaaS.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
                Built with visual depth, strong hierarchy, and real-time intelligence to deliver trust at scale.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CORE_FEATURES.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  tone={feature.tone}
                  tag={feature.tag}
                />
              ))}
            </div>
          </div>
        </section>

        <HowItWorks />

        {/* Key Features Section */}
        <section className="mt-4 pb-20 sm:mt-8">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Key Features</p>
              <h2 className="mx-auto mt-3 max-w-3xl font-display text-3xl font-semibold text-white sm:text-4xl">
                Everything needed for trustworthy online exams.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
                Balanced for performance, transparency, and privacy while maintaining a premium user experience.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {KEY_FEATURES.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  tone={feature.tone}
                />
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
