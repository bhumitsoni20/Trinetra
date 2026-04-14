const LEVEL_STYLES = {
  LOW: {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    bar: "from-emerald-400 to-emerald-500",
  },
  MEDIUM: {
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    bar: "from-amber-400 to-orange-500",
  },
  HIGH: {
    chip: "border-rose-200 bg-rose-50 text-rose-700",
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
        <span className="text-xs uppercase tracking-[0.28em] text-slate-700">Cheating Risk Score</span>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${LEVEL_STYLES[safeLevel].chip}`}
        >
          {safeLevel}
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${LEVEL_STYLES[safeLevel].bar}`}
          style={{ width: percent }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Score: {normalizedScore.toFixed(1)} / 10</span>
        <span>Realtime AI assessment</span>
      </div>
    </div>
  );
}
