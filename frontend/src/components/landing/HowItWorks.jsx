import { LogIn, Eye, AlertTriangle } from "lucide-react";

const STEPS = [
  {
    id: "01",
    title: "Login & Start Exam",
    description:
      "Authenticate the session and begin the exam workflow through a secure admin-controlled flow.",
    icon: LogIn,
  },
  {
    id: "02",
    title: "AI Monitoring",
    description:
      "Live webcam frames are analyzed for face visibility, multiple faces, and suspicious movement in realtime.",
    icon: Eye,
  },
  {
    id: "03",
    title: "Alerts & Logging",
    description:
      "Suspicious events trigger instant alerts while metadata logs are stored for audit-ready exam governance.",
    icon: AlertTriangle,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mt-4 pb-20 sm:mt-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">How It Works</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-3xl font-semibold text-white sm:text-4xl">
            Simple flow, enterprise-grade proctoring.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
            A clean 3-step pipeline that keeps exams secure while maintaining a fast and reliable invigilation
            experience.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <article
              key={step.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/10 blur-2xl" />
              <p className="font-display text-sm font-semibold tracking-[0.2em] text-cyan-300">STEP {step.id}</p>
              <div className="mt-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-400/10">
                <step.icon className="h-5 w-5 text-cyan-200" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
