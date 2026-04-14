import { useEffect, useState } from "react";
import { ShieldCheck, Activity, Eye } from "lucide-react";

import { fetchAdoptionStats } from "../../services/api";

const HERO_METRICS = [
  { label: "Realtime AI Checks", value: "24/7", icon: Activity },
  { label: "Live Alerts", value: "Instant", icon: Eye },
  { label: "Secure Sessions", value: "99.9%", icon: ShieldCheck },
];

const EXAMS_COUNT_FALLBACK = 12842;
const COUNT_DURATION_MS = 1400;
const STATS_POLL_INTERVAL_MS = 5000;

export default function HeroSection() {
  const [examsCount, setExamsCount] = useState(0);
  const [examsTarget, setExamsTarget] = useState(EXAMS_COUNT_FALLBACK);
  const [isEstimate, setIsEstimate] = useState(true);
  const [activeExams, setActiveExams] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let hasSuccess = false;
    let intervalId = 0;

    const loadStats = () => {
      fetchAdoptionStats()
        .then((data) => {
          if (!isMounted) {
            return;
          }
          const completedExams = Number.isFinite(data?.total_exams)
            ? data.total_exams
            : Number.isFinite(data?.completed_exams)
              ? data.completed_exams
              : EXAMS_COUNT_FALLBACK;
          const active = Number.isFinite(data?.active_exams) ? data.active_exams : 0;
          const users = Number.isFinite(data?.total_users) ? data.total_users : 0;

          setExamsTarget(completedExams);
          setActiveExams(active);
          setTotalUsers(users);
          setIsEstimate(false);
          hasSuccess = true;
        })
        .catch(() => {
          if (!isMounted) {
            return;
          }
          if (!hasSuccess) {
            setExamsTarget(EXAMS_COUNT_FALLBACK);
            setIsEstimate(true);
          }
        });
    };

    loadStats();
    intervalId = window.setInterval(loadStats, STATS_POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();
    const initialValue = Math.min(examsCount, examsTarget);
    const delta = Math.max(examsTarget - initialValue, 0);

    const tick = (now) => {
      const progress = Math.min((now - start) / COUNT_DURATION_MS, 1);
      const nextValue = Math.floor(initialValue + progress * delta);
      setExamsCount(nextValue);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [examsTarget]);

  const formattedExamsCount = examsCount.toLocaleString();
  const showPlus = isEstimate && examsCount >= EXAMS_COUNT_FALLBACK;

  return (
    <section className="relative py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Text Content */}
          <div>
            <span className="inline-flex items-center rounded-full border border-cyan-200/70 bg-cyan-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-900 sm:px-4 sm:py-1.5 sm:text-xs">
              AI Exam Proctoring Platform
            </span>

            <h1 className="mt-6 font-display text-3xl font-bold leading-[1.08] text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl">
              Upgrade Exam Integrity with
              <span className="block bg-linear-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-relaxed text-slate-900 sm:text-base lg:text-lg">
              Monitor candidates in realtime, detect suspicious behavior instantly, and maintain privacy-first logs in a
              polished invigilation workflow built for modern institutions.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {HERO_METRICS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl transition duration-300 hover:border-cyan-300/60"
                >
                  <item.icon className="mb-2 h-4 w-4 text-cyan-600" />
                  <p className="font-display text-lg font-semibold text-slate-900">{item.value}</p>
                  <p className="text-[10px] text-slate-900 sm:text-xs">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Exams Counter Card */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="pointer-events-none absolute -inset-4 rounded-4xl bg-linear-to-br from-cyan-500/25 via-blue-500/10 to-violet-500/20 blur-3xl" />

            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-2xl shadow-slate-200/60 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-900">Adoption</p>
                  <p className="mt-1 font-display text-xl font-semibold text-slate-900">Exams Proctored</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-100 px-3 py-1 text-xs font-medium text-slate-900">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
                  Live Count
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-900">Total Exams Completed</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
                    {formattedExamsCount}{showPlus ? "+" : ""}
                  </span>
                  <span className="text-sm text-slate-900">exams</span>
                </div>
                <p className="mt-3 text-sm text-slate-900">
                  Trusted by institutions that run secure assessments every day.
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Active Sessions", value: activeExams.toLocaleString() },
                  { label: "Total Users", value: totalUsers.toLocaleString() },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-900">{metric.label}</p>
                    <p className="mt-2 font-display text-lg font-semibold text-slate-900">{metric.value}</p>
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
