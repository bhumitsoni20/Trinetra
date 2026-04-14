const LEVEL_STYLES = {
  LOW: {
    chip: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    bar: "from-emerald-400 to-emerald-500",
  },
  MEDIUM: {
    chip: "border-amber-300/30 bg-amber-500/12 text-amber-200",
    bar: "from-amber-400 to-orange-500",
  },
  HIGH: {
    chip: "border-rose-300/35 bg-rose-500/15 text-rose-200",
    bar: "from-rose-400 to-red-500",
  },
};

export default function RiskMeter({ score, level }) {
  const safeLevel = LEVEL_STYLES[level] ? level : "LOW";
  const normalizedScore = Math.max(0, Math.min(10, Number(score || 0)));
  const percent = `${(normalizedScore / 10) * 100}%`;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.28em] text-slate-300">Cheating Risk Score</span>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${LEVEL_STYLES[safeLevel].chip}`}
        >
          {safeLevel}
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800/80">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${LEVEL_STYLES[safeLevel].bar}`}
          style={{ width: percent }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>Score: {normalizedScore.toFixed(1)} / 10</span>
        <span>Realtime AI assessment</span>
      </div>
    </div>
  );
}
