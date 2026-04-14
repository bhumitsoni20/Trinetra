import { LogIn, Eye, AlertTriangle } from "lucide-react";

const STEPS = [
  {
    id: "01",
    title: "Login and start",
    description:
      "Verify the session and start the exam in the approved flow.",
    icon: LogIn,
  },
  {
    id: "02",
    title: "AI monitoring",
    description:
      "Live frames are checked for face visibility, multiple faces, and unusual movement.",
    icon: Eye,
  },
  {
    id: "03",
    title: "Alerts and logging",
    description:
      "Suspicious events trigger alerts, and metadata logs are stored for review.",
    icon: AlertTriangle,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mt-4 pb-20 sm:mt-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">How It Works</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
            A simple flow for reliable proctoring.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-900">
            A three-step flow that keeps exams secure and the experience predictable.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <article
              key={step.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-blue-300"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/10 blur-2xl" />
              <p className="font-display text-sm font-semibold tracking-[0.2em] text-slate-900">STEP {step.id}</p>
              <div className="mt-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50">
                <step.icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-900">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
