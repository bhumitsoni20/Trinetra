import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Send, AlertTriangle, XCircle, ChevronLeft, ChevronRight, CameraOff, Monitor, ShieldCheck, Activity } from "lucide-react";
import { startExam, submitExam, reportViolation, postDetectionFrame, uploadFrame, getWebRTCOffer, postWebRTCAnswer } from "../services/api";

const DETECTION_INTERVAL_MS = 3000;
const FRAME_UPLOAD_INTERVAL_MS = 2000;
const WEBRTC_POLL_MS = 2000;
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export default function ExamRoom({ user, onLogout }) {
  const navigate = useNavigate();
  
  // Custom Media References
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [examStatus, setExamStatus] = useState("active");
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState("");
  const [showResult, setShowResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Camera & Streaming State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // 1. Initialize Camera (hidden — no UI shown to student)
  useEffect(() => {
    let localStream = null;
    let cancelled = false;

    const initCamera = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, facingMode: "user" }, 
          audio: false 
        });
        if (cancelled) { localStream.getTracks().forEach(t => t.stop()); return; }
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          setCameraActive(true);
          setCameraError(false);
        }
      } catch (err) {
        console.error("Camera access denied or unavailable:", err);
        setCameraError(true);
        setCameraActive(false);
      }
    };

    initCamera();

    return () => {
      cancelled = true;
      if (localStream) localStream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // 2. WebRTC Signaling — respond to admin offers via REST polling
  useEffect(() => {
    if (!sessionId || !cameraActive || examStatus !== "active") return;

    let pc = null;
    let lastOfferSdp = null;

    const handleOffer = async (offerSdp) => {
      if (offerSdp === lastOfferSdp) return;
      lastOfferSdp = offerSdp;

      // Close any existing connection
      if (pc) { try { pc.close(); } catch(e) {} }

      pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add local camera tracks so admin receives video
      const stream = videoRef.current?.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: offerSdp }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Wait for ICE gathering to complete (bakes candidates into SDP)
        if (pc.iceGatheringState !== "complete") {
          await new Promise((resolve) => {
            const check = () => { if (pc.iceGatheringState === "complete") resolve(); };
            pc.addEventListener("icegatheringstatechange", check);
            setTimeout(resolve, 5000); // timeout safety
          });
        }

        await postWebRTCAnswer(sessionId, pc.localDescription.sdp);
      } catch (err) {
        console.error("WebRTC answer failed:", err);
      }
    };

    const pollInterval = setInterval(async () => {
      try {
        const data = await getWebRTCOffer(sessionId);
        if (data?.sdp) handleOffer(data.sdp);
      } catch (e) { /* silent */ }
    }, WEBRTC_POLL_MS);

    return () => {
      clearInterval(pollInterval);
      if (pc) { try { pc.close(); } catch(e) {} }
    };
  }, [sessionId, cameraActive, examStatus]);

  // Start exam core fetch & Set Security Env
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await startExam(user.id);
        if (cancelled) return;
        setSessionId(data.session_id);
        setQuestions(data.questions || []);
        setTimeRemaining(data.time_remaining || 3600);
        setTabSwitchCount(data.tab_switch_count || 0);
        if (data.status === "disqualified") {
          setExamStatus("disqualified");
        } else {
          // Trigger fullscreen automatically
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        }
      } catch (err) {
        console.error("Failed to start exam:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();

    // Security Listeners
    const blockEvent = (e) => { e.preventDefault(); };
    const blockClipboard = (e) => { 
      e.preventDefault(); 
      setWarningMessage(`⚠️ ${e.type.toUpperCase()} IS DISABLED DURING SECURE EXAM`);
      setTimeout(() => setWarningMessage(""), 4000);
    };

    document.addEventListener("contextmenu", blockEvent);
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("paste", blockClipboard);

    return () => { 
      cancelled = true; 
      document.removeEventListener("contextmenu", blockEvent);
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
    };
  }, [user.id]);

  // Timer countdown
  useEffect(() => {
    if (examStatus !== "active" || loading) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStatus, loading]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Use refs to track latest state so event handlers never have stale closures
  const examStatusRef = useRef(examStatus);
  const sessionIdRef = useRef(sessionId);
  const tabSwitchCountRef = useRef(tabSwitchCount);
  useEffect(() => { examStatusRef.current = examStatus; }, [examStatus]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { tabSwitchCountRef.current = tabSwitchCount; }, [tabSwitchCount]);

  // Tab and App switch detection
  useEffect(() => {
    if (examStatus !== "active" || !sessionId) return;

    let isReporting = false; // debounce flag to prevent duplicate rapid calls
    let blurDebounceTimer = null;

    const handleVisibility = async () => {
      if (!document.hidden) return; // only act when leaving the tab
      if (examStatusRef.current !== "active") return;
      if (isReporting) return;

      isReporting = true;

      // Optimistic local update: immediately increment count & show warning
      const newCount = tabSwitchCountRef.current + 1;
      setTabSwitchCount(newCount);
      tabSwitchCountRef.current = newCount;

      if (newCount >= 3) {
        // Immediately show disqualification — don't wait for API
        setExamStatus("disqualified");
        examStatusRef.current = "disqualified";
        // Exit fullscreen
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      } else {
        setWarningMessage(
          `⚠️ Tab switching is not allowed! (Warning ${newCount}/3) — 10 minutes deducted`
        );
        setTimeout(() => setWarningMessage(""), 5000);
      }

      // Report to backend (fire-and-forget after optimistic update)
      try {
        const result = await reportViolation(sessionIdRef.current, user.id, "Tab Switch");
        // Sync with server values
        setTabSwitchCount(result.tab_switch_count);
        tabSwitchCountRef.current = result.tab_switch_count;
        setTimeRemaining(result.time_remaining);

        if (result.disqualified) {
          setExamStatus("disqualified");
          examStatusRef.current = "disqualified";
        }
      } catch (err) {
        console.error("Tab switch report failed:", err);
      } finally {
        isReporting = false;
      }
    };

    const handleBlur = () => {
      // When the window loses focus, visibilitychange may also fire.
      // Use a short debounce to avoid double-counting — only fire blur handler
      // if visibilitychange didn't handle it (document stays visible = app switch).
      if (blurDebounceTimer) clearTimeout(blurDebounceTimer);
      blurDebounceTimer = setTimeout(async () => {
        if (document.hidden) return; // Already handled by visibilitychange
        if (examStatusRef.current !== "active") return;

        setWarningMessage("⚠️ UNAUTHORIZED APPLICATION DETECTED — Return to exam immediately!");
        setTimeout(() => setWarningMessage(""), 5000);
        try {
          await reportViolation(sessionIdRef.current, user.id, "External Application Detected");
        } catch (err) {
          console.error("App switch report failed", err);
        }
      }, 300); // 300ms delay lets visibilitychange fire first if it's a true tab switch
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    
    return () => {
       document.removeEventListener("visibilitychange", handleVisibility);
       window.removeEventListener("blur", handleBlur);
       if (blurDebounceTimer) clearTimeout(blurDebounceTimer);
    };
  }, [examStatus, sessionId, user.id]);

  // Background AI detection loop using native Canvas screenshotting
  useEffect(() => {
    if (examStatus !== "active" || !sessionId || loading || !cameraActive) return;

    const interval = setInterval(async () => {
      if (detectionRef.current) return;
      
      // Native Video to Base64 Image Conversion
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (video.videoWidth === 0 || video.videoHeight === 0) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const screenshot = canvas.toDataURL("image/jpeg", 0.6);

      if (!screenshot || screenshot === "data:,") return;

      detectionRef.current = true;
      try {
        await postDetectionFrame({
          image: screenshot,
          user_id: String(user.id),
          session_id: sessionId,
        });
      } catch (err) {
        // silently fail detection
      } finally {
        detectionRef.current = false;
      }
    }, DETECTION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [examStatus, sessionId, user.id, loading, cameraActive]);

  // Fast frame upload loop for admin live monitoring (lighter than AI detection)
  useEffect(() => {
    if (examStatus !== "active" || !sessionId || loading || !cameraActive) return;

    const frameInterval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (video.videoWidth === 0 || video.videoHeight === 0) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = canvas.toDataURL("image/jpeg", 0.5);

      if (!frame || frame === "data:,") return;

      try {
        await uploadFrame({ image: frame, session_id: sessionId });
      } catch (err) {
        // silently fail — non-critical
      }
    }, FRAME_UPLOAD_INTERVAL_MS);

    return () => clearInterval(frameInterval);
  }, [examStatus, sessionId, loading, cameraActive]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await submitExam(sessionId, answers);
      setShowResult(result);
      setExamStatus("completed");
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, answers, submitting]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const selectAnswer = (qId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="exam-fullscreen relative flex items-center justify-center overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-36 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px] sm:h-96 sm:w-96" />
          <div className="absolute -right-20 top-32 h-60 w-60 rounded-full bg-indigo-500/20 blur-[110px] sm:h-80 sm:w-80" />
          <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-violet-500/15 blur-[100px] sm:h-72 sm:w-72" />
        </div>
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-3 border-cyan-400/30 border-t-cyan-600" />
          <p className="font-mono text-slate-600">Initializing Trinetra Exam Engine...</p>
        </div>
      </div>
    );
  }

  // Disqualified state
  if (examStatus === "disqualified") {
    return (
      <div className="disqualified-overlay">
        <div className="animate-fadeInUp text-center max-w-md px-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-50 sm:mb-6 sm:h-20 sm:w-20 shadow-[0_12px_30px_rgba(239,68,68,0.15)]">
            <XCircle size={32} className="text-red-600 sm:hidden" />
            <XCircle size={40} className="hidden text-red-600 sm:block" />
          </div>
          <h1 className="font-display text-2xl font-bold text-red-600 sm:text-3xl">Disqualified</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed sm:mt-3 sm:text-base">
            You have been disqualified from this exam due to repeated tab switching violations.
            This incident has been recorded.
          </p>
          <p className="mt-4 text-xs text-slate-500 sm:text-sm font-mono">
            VIOLATIONS: {tabSwitchCount}/3
          </p>
          <button
            onClick={() => { onLogout(); navigate("/"); }}
            className="btn-danger mt-6 w-full sm:mt-8"
          >
            Acknowledge & Exit
          </button>
        </div>
      </div>
    );
  }

  // Completed / Result state
  if (examStatus === "completed" && showResult) {
    return (
      <div className="disqualified-overlay">
        <div className="animate-fadeInUp text-center max-w-md px-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 sm:mb-6 sm:h-20 sm:w-20 shadow-[0_12px_30px_rgba(16,185,129,0.15)]">
            <Send size={28} className="text-emerald-600 sm:hidden" />
            <Send size={36} className="hidden text-emerald-600 sm:block" />
          </div>
          <h1 className="font-display text-2xl font-bold text-emerald-600 sm:text-3xl">Exam Submitted</h1>
          <div className="mt-4 glass-card rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-4 sm:mt-6 sm:p-6">
            <div className="text-4xl font-bold text-slate-900 sm:text-5xl">{showResult.percentage}%</div>
            <p className="mt-2 text-sm font-mono text-emerald-700/80">
              {showResult.score} / {showResult.total} correct answers
            </p>
          </div>
          <button
            onClick={() => { onLogout(); navigate("/"); }}
            className="btn-primary mt-6 w-full sm:mt-8"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Active Exam Loop
  const q = questions[currentQ];

  return (
    <div className={`exam-fullscreen relative overflow-hidden bg-white text-slate-900 transition-colors duration-500 select-none ${warningMessage ? "bg-red-50" : ""}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-36 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px] sm:h-96 sm:w-96" />
        <div className="absolute -right-20 top-32 h-60 w-60 rounded-full bg-indigo-500/20 blur-[110px] sm:h-80 sm:w-80" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-violet-500/15 blur-[100px] sm:h-72 sm:w-72" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Hidden media elements for background stream logic */}
        <video ref={videoRef} autoPlay playsInline muted style={{ opacity: 0, position: "absolute", pointerEvents: "none", width: "1px", height: "1px", zIndex: -100 }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Warning Toast */}
        {warningMessage && (
          <div className="warning-toast flex items-center gap-3 text-red-700">
            <AlertTriangle size={20} className="shrink-0 text-red-600" />
            <span className="tracking-wide uppercase font-semibold text-red-700">{warningMessage}</span>
          </div>
        )}

        {/* Top Bar Navigation */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="hidden text-cyan-600 sm:block" />
              <span className="font-display text-sm font-semibold tracking-wide text-slate-900 uppercase sm:text-base">Trinetra Secure Exam</span>
            </div>
            <span className="hidden text-xs text-slate-600 sm:inline">|</span>
            <div className="flex items-center gap-2">
              <Monitor size={14} className="animate-pulse text-cyan-600" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 sm:text-xs">Screen Monitoring Active</span>
            </div>
          </div>

          <div className="flex items-center gap-4 pr-24 sm:gap-6 sm:pr-44">
            {/* Timer Tool */}
            <div className={`flex items-center gap-1.5 rounded border px-3 py-1.5 shadow-sm transition-colors duration-300 sm:gap-2 sm:rounded-lg sm:px-4 sm:py-2 ${
              timeRemaining < 300
                ? "border-red-200 bg-red-50"
                : "border-slate-200 bg-white/70"
            }`}>
              <Clock size={16} className={`${timeRemaining < 300 ? "text-red-500 timer-critical" : "text-cyan-600"}`} />
              <span className={`font-mono text-sm tracking-widest sm:text-lg ${timeRemaining < 300 ? "text-red-600 timer-critical" : "text-slate-900"}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-wider text-slate-500 sm:text-xs">
              {currentQ + 1} / {questions.length}
            </span>
          </div>
        </header>

      {/* Main Content: Focused Exam Area */}
      <div className="relative flex w-full flex-1 justify-center overflow-hidden">
        {/* Centralized Form Layer */}
        <main className="relative w-full max-w-4xl overflow-y-auto px-4 py-6 sm:px-8 sm:py-10 custom-scrollbar">
          <div className="mx-auto max-w-3xl">
            {q && (
              <div className="glass-card animate-fadeIn rounded-2xl p-6 sm:p-8">
                {/* Subject Tag */}
                <div className="mb-3 inline-flex items-center gap-2 rounded border border-cyan-200 bg-cyan-100 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-cyan-700 shadow-sm">
                  Query Block {currentQ + 1}
                </div>

                {/* Question Text */}
                <h2 className="font-display text-lg font-medium leading-relaxed text-slate-900 sm:text-xl md:text-2xl">
                  {q.question}
                </h2>

                {/* Options List */}
                <div className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
                  {q.options.map((option, idx) => {
                    const isSelected = answers[q.id] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => selectAnswer(q.id, idx)}
                        className={`group w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-cyan-300 bg-cyan-50 text-slate-900 shadow-[0_10px_24px_rgba(59,130,246,0.12)]"
                            : "border-slate-200 bg-white/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border font-mono text-sm transition-colors duration-300 ${
                            isSelected
                              ? "border-cyan-400 bg-cyan-500 text-white shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                              : "border-slate-200 bg-slate-100 text-slate-500 group-hover:border-cyan-200 group-hover:text-cyan-600"
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-sm font-medium leading-snug tracking-wide sm:text-base">{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Form Navigation Ribbon */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
                <button
                  onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
                  disabled={currentQ === 0}
                  className="btn-ghost text-xs disabled:opacity-20 sm:text-sm font-mono tracking-widest uppercase"
                >
                  <ChevronLeft size={16} className="mr-1" /> Prev
                </button>

                <div className="flex items-center gap-1.5">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      title={`Go to query ${i + 1}`}
                      onClick={() => setCurrentQ(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === currentQ
                          ? "w-5 bg-cyan-500 shadow-[0_0_8px_rgba(59,130,246,0.45)]"
                          : answers[questions[i]?.id] !== undefined
                          ? "w-3 bg-emerald-400/70"
                          : "w-3 bg-slate-200"
                      }`}
                    />
                  ))}
                </div>

                {currentQ < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQ((p) => Math.min(questions.length - 1, p + 1))}
                    className="btn-ghost text-xs sm:text-sm font-mono tracking-widest uppercase hover:text-cyan-400"
                  >
                    Next <ChevronRight size={16} className="ml-1" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-primary text-xs sm:text-sm shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                  >
                    {submitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <><Send size={14} className="mr-2" /> SUBMIT EXAM</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </main>


      </div>
    </div>

    <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15,23,42,0.08); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.35); }
        @keyframes scan {
            0% { transform: translateY(-30px); }
            100% { transform: translateY(30px); }
        }
      `}} />
    </div>
  );
}