const TONE_STYLES = {
  cyan: {
    border: "group-hover:border-cyan-300/35",
    iconWrap: "border-cyan-300/25 bg-cyan-400/10",
    icon: "text-blue-600",
    glow: "from-cyan-400/30 to-blue-500/10",
  },
  violet: {
    border: "group-hover:border-violet-300/35",
    iconWrap: "border-violet-300/25 bg-violet-400/10",
    icon: "text-violet-600",
    glow: "from-violet-400/30 to-indigo-500/10",
  },
  emerald: {
    border: "group-hover:border-emerald-300/35",
    iconWrap: "border-emerald-300/25 bg-emerald-400/10",
    icon: "text-emerald-600",
    glow: "from-emerald-400/30 to-cyan-500/10",
  },
};

export default function FeatureCard({ icon: Icon, title, description, tone = "cyan", tag }) {
  const toneStyle = TONE_STYLES[tone] || TONE_STYLES.cyan;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:scale-[1.01] sm:p-6 ${toneStyle.border}`}
    >
      <div
        className={`pointer-events-none absolute -right-14 -top-14 h-28 w-28 rounded-full bg-gradient-to-br ${toneStyle.glow} opacity-35 blur-3xl transition duration-300 group-hover:opacity-60 sm:h-36 sm:w-36`}
      />

      {tag ? (
        <span className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-900 sm:mb-4 sm:py-1 sm:text-[11px]">
          {tag}
        </span>
      ) : null}

      <div className="relative z-10">
        <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border sm:mb-5 sm:h-12 sm:w-12 ${toneStyle.iconWrap}`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${toneStyle.icon}`} />
        </div>

        <h3 className="font-display text-lg font-semibold text-slate-900 sm:text-xl">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-900 sm:mt-3 sm:text-sm">{description}</p>
      </div>
    </article>
  );
}
