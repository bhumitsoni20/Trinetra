import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Mic, ShieldCheck, AlertTriangle, PlayCircle, LogOut } from "lucide-react";

import Logo from "../assets/TRINETRA.png";

export default function ExamGate({ user, onLogout }) {
  const [cameraOk, setCameraOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const checkPermissions = useCallback(async () => {
    setChecking(true);
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      setCameraOk(!!videoTrack);
      setMicOk(!!audioTrack);

      // Stop tracks after checking
      stream.getTracks().forEach((t) => t.stop());

      if (!videoTrack || !audioTrack) {
        setError("Both camera and microphone are required to proceed.");
      }
    } catch (err) {
      setError("Camera and microphone permissions are required. Please allow access and try again.");
      setCameraOk(false);
      setMicOk(false);
    } finally {
      setChecking(false);
    }
  }, []);

  const canStart = cameraOk && micOk;

  const startExam = () => {
    navigate("/exam");
  };

  return (
    <div className="relative min-h-screen">
      <div className="ambient-bg" />
      <div className="ambient-grid" />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl">
            <img src={Logo} alt="Trinetra logo" className="h-8 w-8 object-contain" />
          </div>
          <span className="font-display text-lg font-bold text-slate-900">
            <span className="text-[#6B2BD9]">T</span>RI<span className="text-[#6B2BD9]">N</span>ETRA
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            Welcome, <span className="text-blue-600 font-medium">{user.username}</span>
          </span>
          <button onClick={onLogout} className="btn-ghost text-xs py-1.5 px-3">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-16 pb-20">
        <div className="w-full max-w-lg">
          <div className="animate-fadeInUp mb-8 text-center">
            <h1 className="font-display text-3xl font-bold text-slate-900">Exam Pre-Check</h1>
            <p className="mt-2 text-sm text-slate-600">
              Before entering the exam, we need to verify your camera and microphone access.
            </p>
          </div>

          {/* Permission Cards */}
          <div className="animate-fadeInUp stagger-1 space-y-4">
            {/* Camera Check */}
            <div className={`glass-card rounded-2xl p-5 ${cameraOk ? "border-emerald-400/30" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    cameraOk ? "bg-emerald-500/15 text-emerald-600" : "bg-slate-100 text-slate-600"
                  }`}>
                    <Camera size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Camera Access</p>
                    <p className="text-xs text-slate-600">Required for proctoring monitoring</p>
                  </div>
                </div>
                {cameraOk ? (
                  <span className="badge badge-active">✓ Granted</span>
                ) : (
                  <span className="badge" style={{ color: "#475569", background: "rgba(148, 163, 200, 0.15)", border: "1px solid rgba(148, 163, 200, 0.3)" }}>
                    Pending
                  </span>
                )}
              </div>
            </div>

            {/* Mic Check */}
            <div className={`glass-card rounded-2xl p-5 ${micOk ? "border-emerald-400/30" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    micOk ? "bg-emerald-500/15 text-emerald-600" : "bg-slate-100 text-slate-600"
                  }`}>
                    <Mic size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Microphone Access</p>
                    <p className="text-xs text-slate-600">Required for audio monitoring</p>
                  </div>
                </div>
                {micOk ? (
                  <span className="badge badge-active">✓ Granted</span>
                ) : (
                  <span className="badge" style={{ color: "#475569", background: "rgba(148, 163, 200, 0.15)", border: "1px solid rgba(148, 163, 200, 0.3)" }}>
                    Pending
                  </span>
                )}
              </div>
            </div>

            {/* Rules */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-blue-600" />
                <div className="space-y-2 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">Exam Rules</p>
                  <ul className="space-y-1.5 text-slate-600">
                    <li>• Your webcam will be monitored throughout the exam (hidden)</li>
                    <li>• Tab switching will deduct 10 minutes from your time</li>
                    <li>• 3 tab switches will result in automatic disqualification</li>
                    <li>• AI will detect suspicious activities in real-time</li>
                    <li>• You have 60 minutes to complete 15 questions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="animate-fadeIn mt-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="animate-fadeInUp stagger-3 mt-6 flex flex-col gap-3">
            {!canStart && (
              <button
                onClick={checkPermissions}
                disabled={checking}
                className="btn-primary w-full justify-center py-3"
              >
                {checking ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <Camera size={16} />
                    Grant Camera & Mic Access
                  </>
                )}
              </button>
            )}

            {canStart && (
              <button
                onClick={startExam}
                className="btn-primary w-full justify-center py-3.5 text-base"
              >
                <PlayCircle size={20} />
                Start Exam
              </button>
            )}
          </div>

          {/* Consent Notice */}
          <p className="mt-6 text-center text-xs text-slate-600">
            By starting the exam, you consent to camera and microphone monitoring
            for exam integrity purposes. No continuous video is stored.
          </p>
        </div>
      </div>
    </div>
  );
}
