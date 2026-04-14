import { Link } from "react-router-dom";
import { Activity, Brain, Eye, Lock, Monitor, ShieldCheck, Menu, X } from "lucide-react";
import { useState } from "react";

import Logo from "../assets/TRINETRA.png";

import FeatureCard from "../components/landing/FeatureCard";
import Footer from "../components/landing/Footer";
import HeroSection from "../components/landing/HeroSection";
import HowItWorks from "../components/landing/HowItWorks";

const CORE_FEATURES = [
  {
    icon: Eye,
    title: "Vision Monitoring",
    description:
      "Checks face presence and flags multiple faces in the frame.",
    tone: "cyan",
    tag: "Vision",
  },
  {
    icon: Brain,
    title: "Behavior Signals",
    description:
      "Tracks movement patterns and highlights unusual activity with clear risk scoring.",
    tone: "violet",
    tag: "AI Engine",
  },
  {
    icon: ShieldCheck,
    title: "Audit-Ready Logs",
    description:
      "Stores metadata-only logs and supports role-based review.",
    tone: "emerald",
    tag: "Governance",
  },
];

const KEY_FEATURES = [
  {
    icon: Activity,
    title: "Real-time monitoring",
    description: "Analyzes live sessions continuously with fast event detection.",
    tone: "cyan",
  },
  {
    icon: Monitor,
    title: "Tab switch detection",
    description: "Tracks focus changes and logs each switch immediately.",
    tone: "violet",
  },
  {
    icon: Lock,
    title: "Privacy-first system",
    description: "No raw video storage. Only metadata and alert trails for review.",
    tone: "emerald",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-slate-900">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-36 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px] sm:h-96 sm:w-96" />
        <div className="absolute -right-20 top-32 h-60 w-60 rounded-full bg-indigo-500/20 blur-[110px] sm:h-80 sm:w-80" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-violet-500/15 blur-[100px] sm:h-72 sm:w-72" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl">
                <img src={Logo} alt="Trinetra logo" className="h-10 w-10 object-contain" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#6B2BD9]">T</span>RI<span className="text-[#6B2BD9]">N</span>ETRA
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden items-center gap-3 sm:flex">
              <a
                href="#features"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Features
              </a>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-linear-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-300 hover:scale-[1.02]"
              >
                Login
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 sm:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-xl sm:hidden">
              <div className="flex flex-col gap-3">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Features
                </a>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-300/30 bg-linear-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
                >
                  Login
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">Core Features</p>
              <h2 className="mx-auto mt-3 max-w-3xl font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
                Reliable exam proctoring for online classrooms.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-900">
                Clear layouts, real-time signals, and simple review tools keep oversight consistent.
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">Key Features</p>
              <h2 className="mx-auto mt-3 max-w-3xl font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
                Everything you need for secure online exams.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-900">
                Balanced for speed, transparency, and privacy without extra complexity.
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
