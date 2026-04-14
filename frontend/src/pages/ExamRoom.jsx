import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Send, AlertTriangle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Webcam from "react-webcam";
import { startExam, submitExam, reportTabSwitch, postDetectionFrame } from "../services/api";

const DETECTION_INTERVAL_MS = 3000;

export default function ExamRoom({ user, onLogout }) {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
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

  // Start exam
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
        }
      } catch (err) {
        console.error("Failed to start exam:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
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
  }, [examStatus, loading]);

  // Tab switch detection
  useEffect(() => {
    if (examStatus !== "active" || !sessionId) return;

    const handleVisibility = async () => {
      if (document.hidden) {
        try {
          const result = await reportTabSwitch(sessionId, user.id);
          setTabSwitchCount(result.tab_switch_count);
          setTimeRemaining(result.time_remaining);

          if (result.disqualified) {
            setExamStatus("disqualified");
          } else {
            setWarningMessage(
              `⚠️ Tab switching is not allowed! (Warning ${result.tab_switch_count}/3) — 10 minutes deducted`
            );
            setTimeout(() => setWarningMessage(""), 5000);
          }
        } catch (err) {
          console.error("Tab switch report failed:", err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [examStatus, sessionId, user.id]);

  // Background AI detection — webcam hidden from student
  useEffect(() => {
    if (examStatus !== "active" || !sessionId || loading) return;

    const interval = setInterval(async () => {
      if (detectionRef.current) return;

      const screenshot = webcamRef.current?.getScreenshot();
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
  }, [examStatus, sessionId, user.id, loading]);

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
      <div className="exam-fullscreen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-3 border-cyan-400/30 border-t-cyan-400" />
          <p className="text-slate-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Disqualified state
  if (examStatus === "disqualified") {
    return (
      <div className="disqualified-overlay">
        <div className="animate-fadeInUp text-center max-w-md px-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 border border-red-400/30 sm:mb-6 sm:h-20 sm:w-20">
            <XCircle size={32} className="text-red-400 sm:hidden" />
            <XCircle size={40} className="hidden text-red-400 sm:block" />
          </div>
          <h1 className="font-display text-2xl font-bold text-red-400 sm:text-3xl">Disqualified</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed sm:mt-3 sm:text-base">
            You have been disqualified from this exam due to repeated tab switching violations.
            This incident has been recorded.
          </p>
          <p className="mt-2 text-xs text-slate-600 sm:text-sm">
            Tab switches: {tabSwitchCount}/3
          </p>
          <button
            onClick={() => { onLogout(); navigate("/"); }}
            className="btn-ghost mt-6 sm:mt-8"
          >
            Return to Home
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-400/30 sm:mb-6 sm:h-20 sm:w-20">
            <Send size={28} className="text-emerald-400 sm:hidden" />
            <Send size={36} className="hidden text-emerald-400 sm:block" />
          </div>
          <h1 className="font-display text-2xl font-bold text-emerald-400 sm:text-3xl">Exam Submitted</h1>
          <div className="mt-4 glass-card rounded-2xl p-4 sm:mt-6 sm:p-6">
            <div className="text-4xl font-bold text-slate-900 sm:text-5xl">{showResult.percentage}%</div>
            <p className="mt-2 text-sm text-slate-600">
              {showResult.score} / {showResult.total} correct answers
            </p>
          </div>
          <button
            onClick={() => { onLogout(); navigate("/"); }}
            className="btn-primary mt-6 sm:mt-8"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Active Exam
  const q = questions[currentQ];

  return (
    <div className="exam-fullscreen">
      {/* Hidden webcam for detection — hidden safely using opacity to prevent browser throttling */}
      <div style={{ position: "absolute", zIndex: -10, opacity: 0.01, pointerEvents: "none" }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.6}
          videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
          onUserMediaError={(err) => console.error("Webcam error:", err)}
        />
      </div>

      {/* Warning Toast */}
      {warningMessage && (
        <div className="warning-toast flex items-center gap-2 text-xs text-red-700 sm:gap-3 sm:text-sm">
          <AlertTriangle size={16} className="text-red-600 shrink-0 sm:hidden" />
          <AlertTriangle size={18} className="hidden text-red-600 shrink-0 sm:block" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-xl px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-dot" />
          <span className="font-display text-xs font-semibold text-slate-900 sm:text-sm">TRINETRA Exam</span>
          <span className="hidden text-xs text-slate-500 sm:inline">|</span>
          <span className="hidden text-xs text-slate-600 sm:inline">{user.username}</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Timer */}
          <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 ${
            timeRemaining < 300
              ? "bg-red-500/15 border border-red-400/30"
              : "bg-slate-100 border border-slate-200"
          }`}>
            <Clock size={14} className={`sm:hidden ${timeRemaining < 300 ? "text-red-400 timer-critical" : "text-blue-600"}`} />
            <Clock size={16} className={`hidden sm:block ${timeRemaining < 300 ? "text-red-400 timer-critical" : "text-blue-600"}`} />
            <span className={`font-mono text-sm font-bold sm:text-lg ${timeRemaining < 300 ? "text-red-400 timer-critical" : "text-slate-900"}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Question Counter */}
          <span className="text-xs text-slate-600 sm:text-sm">
            Q {currentQ + 1}/{questions.length}
          </span>
        </div>
      </header>

      {/* Question Area */}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        {q && (
          <div className="animate-fadeIn">
            {/* Question Number */}
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] text-blue-700 sm:mb-3 sm:px-3 sm:py-1 sm:text-xs">
              Question {currentQ + 1}
            </div>

            {/* Question Text */}
            <h2 className="font-display text-lg font-semibold text-slate-900 leading-relaxed sm:text-xl md:text-2xl">
              {q.question}
            </h2>

            {/* Options */}
            <div className="mt-5 space-y-2.5 sm:mt-8 sm:space-y-3">
              {q.options.map((option, idx) => {
                const isSelected = answers[q.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(q.id, idx)}
                    className={`w-full text-left rounded-xl border p-3 transition-all duration-200 sm:p-4 ${
                      isSelected
                        ? "border-blue-300 bg-blue-50 text-slate-900 shadow-lg shadow-blue-200/60"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold sm:h-8 sm:w-8 sm:text-sm ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-xs sm:text-sm md:text-base">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between sm:mt-10">
          <button
            onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
            disabled={currentQ === 0}
            className="btn-ghost text-xs disabled:opacity-30 sm:text-sm"
          >
            <ChevronLeft size={14} className="sm:hidden" />
            <ChevronLeft size={16} className="hidden sm:block" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`h-2 w-2 rounded-full transition-all sm:h-2.5 sm:w-2.5 ${
                  i === currentQ
                    ? "bg-blue-600 scale-125"
                    : answers[questions[i]?.id] !== undefined
                    ? "bg-emerald-500/60"
                    : "bg-slate-300"
                }`}
              />
            ))}
          </div>

          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((p) => Math.min(questions.length - 1, p + 1))}
              className="btn-ghost text-xs sm:text-sm"
            >
              Next <ChevronRight size={14} className="sm:hidden" /><ChevronRight size={16} className="hidden sm:block" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary text-xs sm:text-sm"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <><Send size={14} className="sm:hidden" /><Send size={16} className="hidden sm:block" /> Submit</>
              )}
            </button>
          )}
        </div>

        {/* Question Grid */}
        <div className="mt-6 glass-card-static rounded-xl p-3 sm:mt-10 sm:rounded-2xl sm:p-5">
          <p className="mb-2 text-[10px] font-medium text-slate-600 uppercase tracking-wider sm:mb-3 sm:text-xs">Question Navigator</p>
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-2">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQ(i)}
                className={`rounded-lg py-1.5 text-[10px] font-semibold transition-all sm:py-2 sm:text-xs ${
                  i === currentQ
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200/60"
                    : answers[q.id] !== undefined
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[9px] text-slate-600 sm:mt-3 sm:gap-4 sm:text-xs">
            <span className="flex items-center gap-1 sm:gap-1.5">
              <span className="h-2 w-2 rounded bg-blue-600 sm:h-2.5 sm:w-2.5" /> Current
            </span>
            <span className="flex items-center gap-1 sm:gap-1.5">
              <span className="h-2 w-2 rounded bg-emerald-500/40 sm:h-2.5 sm:w-2.5" /> Answered
            </span>
            <span className="flex items-center gap-1 sm:gap-1.5">
              <span className="h-2 w-2 rounded bg-slate-300 sm:h-2.5 sm:w-2.5" /> Unanswered
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
