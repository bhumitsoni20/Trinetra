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
      if (!screenshot) return;

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
          <p className="text-slate-400">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Disqualified state
  if (examStatus === "disqualified") {
    return (
      <div className="disqualified-overlay">
        <div className="animate-fadeInUp text-center max-w-md px-6">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 border border-red-400/30">
            <XCircle size={40} className="text-red-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-red-400">Disqualified</h1>
          <p className="mt-3 text-slate-400 leading-relaxed">
            You have been disqualified from this exam due to repeated tab switching violations.
            This incident has been recorded.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Tab switches: {tabSwitchCount}/3
          </p>
          <button
            onClick={() => { onLogout(); navigate("/"); }}
            className="btn-ghost mt-8"
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
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-400/30">
            <Send size={36} className="text-emerald-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-emerald-400">Exam Submitted</h1>
          <div className="mt-6 glass-card rounded-2xl p-6">
            <div className="text-5xl font-bold text-white">{showResult.percentage}%</div>
            <p className="mt-2 text-slate-400">
              {showResult.score} / {showResult.total} correct answers
            </p>
          </div>
          <button
            onClick={() => { onLogout(); navigate("/"); }}
            className="btn-primary mt-8"
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
      {/* Hidden webcam for detection — not visible to student */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.6}
          videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
        />
      </div>

      {/* Warning Toast */}
      {warningMessage && (
        <div className="warning-toast flex items-center gap-3 text-sm text-red-300">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-slate-800/60 bg-[#0a0e1a]/90 backdrop-blur-xl px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-dot" />
          <span className="font-display text-sm font-semibold text-white">Trinetra Exam</span>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs text-slate-400">{user.username}</span>
        </div>

        <div className="flex items-center gap-5">
          {/* Timer */}
          <div className={`flex items-center gap-2 rounded-xl px-4 py-2 ${
            timeRemaining < 300
              ? "bg-red-500/15 border border-red-400/30"
              : "bg-slate-800/60 border border-slate-700/60"
          }`}>
            <Clock size={16} className={timeRemaining < 300 ? "text-red-400 timer-critical" : "text-cyan-400"} />
            <span className={`font-mono text-lg font-bold ${timeRemaining < 300 ? "text-red-400 timer-critical" : "text-white"}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Question Counter */}
          <span className="text-sm text-slate-400">
            Q {currentQ + 1} / {questions.length}
          </span>
        </div>
      </header>

      {/* Question Area */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        {q && (
          <div className="animate-fadeIn">
            {/* Question Number */}
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 px-3 py-1 text-xs text-cyan-300">
              Question {currentQ + 1}
            </div>

            {/* Question Text */}
            <h2 className="font-display text-xl font-semibold text-white leading-relaxed sm:text-2xl">
              {q.question}
            </h2>

            {/* Options */}
            <div className="mt-8 space-y-3">
              {q.options.map((option, idx) => {
                const isSelected = answers[q.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(q.id, idx)}
                    className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                      isSelected
                        ? "border-cyan-400/50 bg-cyan-500/10 text-white shadow-lg shadow-cyan-500/10"
                        : "border-slate-700/60 bg-slate-900/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                        isSelected
                          ? "bg-cyan-500 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-sm sm:text-base">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
            disabled={currentQ === 0}
            className="btn-ghost disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <div className="flex items-center gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  i === currentQ
                    ? "bg-cyan-400 scale-125"
                    : answers[questions[i]?.id] !== undefined
                    ? "bg-emerald-500/60"
                    : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((p) => Math.min(questions.length - 1, p + 1))}
              className="btn-ghost"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <><Send size={16} /> Submit Exam</>
              )}
            </button>
          )}
        </div>

        {/* Question Grid */}
        <div className="mt-10 glass-card-static rounded-2xl p-5">
          <p className="mb-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Question Navigator</p>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQ(i)}
                className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                  i === currentQ
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                    : answers[q.id] !== undefined
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/25"
                    : "bg-slate-800/60 text-slate-500 border border-slate-700/40 hover:bg-slate-700/60"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-cyan-500" /> Current
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500/40" /> Answered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-slate-700" /> Unanswered
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
