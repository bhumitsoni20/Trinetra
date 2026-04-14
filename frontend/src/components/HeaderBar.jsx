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
            <h1 className="font-display text-2xl font-semibold text-slate-50 sm:text-3xl">
              Trinetra AI Invigilation
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                monitoringActive
                  ? "bg-cyan-500/15 text-cyan-200 animate-pulseGlow"
                  : "bg-slate-500/15 text-slate-300"
              }`}
            >
              <Activity size={14} />
              {monitoringActive ? "Monitoring Active" : "Monitoring Paused"}
            </span>
          </div>

          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Virtual proctoring with privacy-first AI detection for face absence, multi-face presence, and abnormal
            motion patterns.
          </p>

          <div className="flex flex-wrap gap-3 text-sm text-slate-200">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1.5">
              <ShieldCheck size={14} className="text-emerald-300" />
              No image or video storage
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1.5">
              {socketConnected ? (
                <>
                  <Wifi size={14} className="text-cyan-300" />
                  Realtime stream connected
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-amber-300" />
                  Realtime stream reconnecting
                </>
              )}
            </span>
          </div>

          <p className="text-xs text-slate-400 sm:text-sm">{statusMessage}</p>
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 sm:p-5">
          <RiskMeter score={riskScore} level={riskLevel} />
        </div>
      </div>
    </header>
  );
}
