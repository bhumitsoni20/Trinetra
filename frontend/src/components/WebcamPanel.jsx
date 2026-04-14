import { Camera, PlayCircle, Square, UserRoundSearch } from "lucide-react";
import Webcam from "react-webcam";

export default function WebcamPanel({
  webcamRef,
  monitoringActive,
  onStartMonitoring,
  onStopMonitoring,
  facesDetected,
  movementDistance,
  permissionError,
}) {
  return (
    <section className="glass-card animate-fade-in-up rounded-3xl border border-slate-700/80 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-100">Live Webcam Feed</h2>
          <p className="text-sm text-slate-400">Continuous frame analysis for suspicious behavior detection</p>
        </div>

        {monitoringActive ? (
          <button
            type="button"
            onClick={onStopMonitoring}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-300/35 bg-rose-500/10 px-3.5 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20"
          >
            <Square size={15} />
            Stop Monitoring
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartMonitoring}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-500/10 px-3.5 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
          >
            <PlayCircle size={16} />
            Start Monitoring
          </button>
        )}
      </div>

      {permissionError ? (
        <p className="mb-3 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {permissionError}
        </p>
      ) : null}

      <div className="relative min-h-[340px] overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/70 sm:min-h-[430px]">
        {monitoringActive ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.85}
              mirrored
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: "user",
              }}
              className="h-full w-full object-cover"
            />

            <div className="pointer-events-none absolute inset-0 border-[3px] border-cyan-300/20" />

            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2 text-xs text-slate-100 sm:left-4 sm:top-4">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900/85 px-2.5 py-1.5">
                <Camera size={13} className="text-cyan-300" />
                Candidate View
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900/85 px-2.5 py-1.5">
                <UserRoundSearch size={13} className="text-emerald-300" />
                Faces: {facesDetected}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900/85 px-2.5 py-1.5">
                Movement: {movementDistance.toFixed(1)} px
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[340px] flex-col items-center justify-center px-6 text-center sm:min-h-[430px]">
            <div className="mb-4 rounded-2xl border border-cyan-300/25 bg-cyan-500/10 p-4 text-cyan-200">
              <Camera size={28} />
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-100">Webcam Access Required</h3>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Click Start Monitoring to grant webcam permission and begin privacy-safe realtime exam surveillance.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
