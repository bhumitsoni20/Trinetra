import { AlertTriangle, MoveRight, UserX, Users } from "lucide-react";

const EVENT_STYLES = {
  "Face Not Visible": {
    icon: UserX,
    frame: "border-amber-200 bg-amber-50",
    text: "text-amber-700",
  },
  "Multiple Faces Detected": {
    icon: Users,
    frame: "border-rose-200 bg-rose-50",
    text: "text-rose-700",
  },
  "Suspicious Movement": {
    icon: MoveRight,
    frame: "border-orange-200 bg-orange-50",
    text: "text-orange-700",
  },
};

function formatTime(timestamp) {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown time";
  }
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AlertsPanel({ alerts }) {
  return (
    <section className="glass-card animate-fade-in-up rounded-3xl border border-slate-200 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="text-amber-600" size={18} />
        <h2 className="font-display text-xl font-semibold text-slate-900">Realtime Alerts</h2>
      </div>

      <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            No suspicious alerts detected. Monitoring stream is stable.
          </div>
        ) : (
          alerts.map((alert, index) => {
            const style = EVENT_STYLES[alert.event] || {
              icon: AlertTriangle,
              frame: "border-slate-200 bg-slate-50",
              text: "text-slate-700",
            };
            const Icon = style.icon;

            return (
              <article
                key={alert.id || `${alert.timestamp}-${index}`}
                className={`rounded-2xl border p-3 transition hover:translate-y-[-1px] hover:bg-opacity-80 ${style.frame}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Icon size={16} className={`mt-0.5 shrink-0 ${style.text}`} />
                    <div>
                      <p className={`text-sm font-semibold ${style.text}`}>{alert.event}</p>
                      <p className="text-xs text-slate-600">Risk +{alert.risk_score}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-600">{formatTime(alert.timestamp)}</span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
