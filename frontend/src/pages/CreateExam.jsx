import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Monitor,
  Users,
  FileText,
  FilePlus,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save
} from "lucide-react";
import Logo from "../assets/TRINETRA.png";
import { createExam } from "../services/api";

const OPTION_LABELS = ["A", "B", "C", "D"];

const buildQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  correct: 0,
});

function QuestionCard({
  index,
  data,
  onQuestionChange,
  onOptionChange,
  onCorrectChange,
  onDelete,
  canDelete,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question {index + 1}</p>
          <p className="text-base text-slate-600">Select the correct option below.</p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(index)}
          disabled={!canDelete}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
            canDelete
              ? "border-rose-200 text-rose-600 hover:bg-rose-50"
              : "cursor-not-allowed border-slate-200 text-slate-400"
          }`}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-600">Question Text</label>
        <textarea
          rows={3}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          placeholder="Type the question here"
          value={data.question}
          onChange={(e) => onQuestionChange(index, e.target.value)}
        />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-600">Options</label>
          <span className="text-xs text-slate-500">Correct answer is highlighted</span>
        </div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {data.options.map((option, optionIndex) => (
            <label
              key={`${index}-option-${optionIndex}`}
              className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300"
            >
              <input
                type="radio"
                name={`correct-${index}`}
                className="mt-1 h-4 w-4 accent-blue-600"
                checked={data.correct === optionIndex}
                onChange={() => onCorrectChange(index, optionIndex)}
              />
              <div className="flex-1">
                <span className="text-xs font-semibold text-slate-500">Option {OPTION_LABELS[optionIndex]}</span>
                <input
                  type="text"
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-base text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                    data.correct === optionIndex ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-slate-50"
                  }`}
                  placeholder={`Option ${OPTION_LABELS[optionIndex]}`}
                  value={option}
                  onChange={(e) => onOptionChange(index, optionIndex, e.target.value)}
                />
              </div>
            </label>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function CreateExam({ user, onLogout }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([buildQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sidebarWidthClass = sidebarCollapsed ? "w-[240px] lg:w-[84px]" : "w-[240px]";
  const mainMarginClass = sidebarCollapsed ? "lg:ml-[84px]" : "lg:ml-[240px]";

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Access Denied</h1>
          <p className="mt-2 text-base text-slate-600">You do not have permission to view this page.</p>
          <Link
            to="/login"
            className="mt-5 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  const updateQuestion = (index, value) => {
    setQuestions((prev) =>
      prev.map((question, qIndex) => (qIndex === index ? { ...question, question: value } : question))
    );
  };

  const updateOption = (qIndex, optIndex, value) => {
    setQuestions((prev) =>
      prev.map((question, idx) => {
        if (idx !== qIndex) return question;
        const nextOptions = question.options.map((opt, optionIdx) => (optionIdx === optIndex ? value : opt));
        return { ...question, options: nextOptions };
      })
    );
  };

  const updateCorrect = (qIndex, optIndex) => {
    setQuestions((prev) =>
      prev.map((question, idx) => (idx === qIndex ? { ...question, correct: optIndex } : question))
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, buildQuestion()]);
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const validateExam = () => {
    if (!title.trim()) return "Exam title is required.";
    if (questions.length === 0) return "Please add at least one question.";

    for (let i = 0; i < questions.length; i += 1) {
      const question = questions[i];
      if (!question.question.trim()) {
        return `Question ${i + 1} is missing text.`;
      }
      for (let j = 0; j < question.options.length; j += 1) {
        if (!question.options[j].trim()) {
          return `Question ${i + 1} option ${OPTION_LABELS[j]} is required.`;
        }
      }
    }

    return "";
  };

  const handleSave = async () => {
    const validationError = validateExam();
    setError("");
    setSuccess("");

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    let saved = false;
    try {
      const payload = {
        title: title.trim(),
        questions: questions.map((question) => ({
          question: question.question.trim(),
          options: question.options.map((opt) => opt.trim()),
          correct: question.correct,
        })),
      };
      await createExam(payload);
      setSuccess("Exam saved successfully.");
      saved = true;
    } catch (err) {
      setError(err.message || "Failed to save exam.");
    } finally {
      setSaving(false);
      if (saved) {
        navigate("/admin");
      }
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="ambient-bg" />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full ${sidebarWidthClass} flex-col border-r border-slate-200 bg-white/95 backdrop-blur-xl transition-all duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`flex items-center justify-between border-b border-slate-200 py-5 ${sidebarCollapsed ? "px-3" : "px-5"}`}>
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl">
              <img src={Logo} alt="Trinetra logo" className="h-8 w-8 object-contain" />
            </div>
            <div className={sidebarCollapsed ? "lg:hidden" : ""}>
              <p className="font-display text-base font-bold text-slate-900">
                <span className="text-[#6B2BD9]">T</span>RI<span className="text-[#6B2BD9]">N</span>ETRA
              </p>
              <p className="text-xs text-slate-600">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:flex"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link
            to="/admin"
            title="Dashboard"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition ${
              sidebarCollapsed ? "lg:justify-center" : ""
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <Monitor size={18} />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Dashboard</span>
          </Link>
          <Link
            to="/admin/users"
            title="User Management"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition ${
              sidebarCollapsed ? "lg:justify-center" : ""
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <Users size={18} />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>User Management</span>
          </Link>
          <Link
            to="/admin/create-exam"
            title="Create Exam"
            className={`flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 text-base font-medium text-slate-900 ${
              sidebarCollapsed ? "lg:justify-center" : ""
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <FilePlus size={18} className="text-blue-600" />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Create Exam</span>
          </Link>
          <Link
            to="/admin/logs"
            title="Alert Logs"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition ${
              sidebarCollapsed ? "lg:justify-center" : ""
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <FileText size={18} />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Alert Logs</span>
          </Link>
        </nav>

        <div className="border-t border-slate-200 px-3 py-4">
          <div className={`flex items-center gap-3 rounded-xl px-3 py-2 ${sidebarCollapsed ? "lg:justify-center" : ""}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className={`flex-1 min-w-0 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <p className="text-sm font-medium text-slate-900 truncate">{user.username}</p>
              <p className="text-xs text-slate-600 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              onLogout();
              navigate("/");
            }}
            title="Sign Out"
            className={`mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-red-500/10 hover:text-red-600 transition ${
              sidebarCollapsed ? "lg:justify-center" : ""
            }`}
          >
            <LogOut size={14} />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className={`relative z-10 ${mainMarginClass}`}>
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-xl px-4 py-3 sm:px-8 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Create Exam</h1>
              <p className="text-base text-slate-600">Build question sets for AI proctoring</p>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-5 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900">Exam Details</h2>
                <p className="text-base text-slate-600">Add a title and craft each question carefully.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600">
                Questions: {questions.length}
              </span>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-slate-600">Exam Title</label>
              <input
                type="text"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="e.g. Final Assessment - Data Structures"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="space-y-5">
            {questions.map((question, index) => (
              <QuestionCard
                key={`question-${index}`}
                index={index}
                data={question}
                onQuestionChange={updateQuestion}
                onOptionChange={updateOption}
                onCorrectChange={updateCorrect}
                onDelete={removeQuestion}
                canDelete={questions.length > 1}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Plus size={16} />
              Add Question
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-base font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60"
            >
              {saving ? "Saving..." : <><Save size={16} /> Save Exam</>}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
