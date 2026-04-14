import { Clock3, ListFilter } from "lucide-react";

function formatDateTime(timestamp) {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown time";
  }
  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function LogsTimeline({ logs }) {
  return (
    <section className="glass-card animate-fade-in-up rounded-3xl border border-slate-700/80 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock3 size={18} className="text-cyan-300" />
          <h2 className="font-display text-xl font-semibold text-slate-100">Event Timeline</h2>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/65 px-3 py-1 text-xs text-slate-300">
          <ListFilter size={14} />
          Metadata only
        </span>
      </div>

      <div className="max-h-[280px] overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <p className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
            No events logged yet. Timeline populates after suspicious detections.
          </p>
        ) : (
          <ul className="space-y-3">
            {logs.map((item) => (
              <li key={item.id} className="relative rounded-2xl border border-slate-700/70 bg-slate-900/55 p-3.5">
                <span className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl bg-gradient-to-b from-cyan-400 to-teal-400" />
                <div className="flex flex-wrap items-center justify-between gap-2 pl-2">
                  <p className="text-sm font-medium text-slate-100">{item.event}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(item.timestamp)}</p>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 pl-2 text-xs text-slate-300">
                  <span>User: {item.user_id}</span>
                  <span>Risk: {item.risk_score}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
