import { Activity, ShieldCheck, Wifi, WifiOff } from "lucide-react";

import RiskMeter from "./RiskMeter";

const STATUS_TONES = {
  safe: "border-emerald-400/30",
  medium: "border-amber-300/35",
  high: "border-rose-400/35",
  paused: "border-slate-500/35",
};

export default function HeaderBar({
  monitoringActive,
  socketConnected,
  riskScore,
  riskLevel,
  statusTone,
  statusMessage,
}) {
  const activeTone = STATUS_TONES[statusTone] || STATUS_TONES.safe;

  return (
    <header className={`glass-card animate-fade-in-up rounded-3xl border p-5 sm:p-6 ${activeTone}`}>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
              TRINETRA AI Invigilation
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                monitoringActive
                  ? "bg-blue-100 text-blue-700 animate-pulseGlow"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              <Activity size={14} />
              {monitoringActive ? "Monitoring Active" : "Monitoring Paused"}
            </span>
          </div>

          <p className="max-w-2xl text-sm text-slate-700 sm:text-base">
            Virtual proctoring with privacy-first AI detection for face absence, multi-face presence, and abnormal
            motion patterns.
          </p>

          <div className="flex flex-wrap gap-3 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              No image or video storage
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5">
              {socketConnected ? (
                <>
                  <Wifi size={14} className="text-blue-600" />
                  Realtime stream connected
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-amber-600" />
                  Realtime stream reconnecting
                </>
              )}
            </span>
          </div>

          <p className="text-xs text-slate-600 sm:text-sm">{statusMessage}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <RiskMeter score={riskScore} level={riskLevel} />
        </div>
      </div>
    </header>
  );
}
