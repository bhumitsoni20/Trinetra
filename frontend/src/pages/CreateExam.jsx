import { useState, useEffect, useMemo } from "react";
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
  Save,
  View
} from "lucide-react";
import Logo from "../assets/TRINETRA.png";
import { createExam, fetchExamAttempts, fetchExams, fetchUsers } from "../services/api";

const OPTION_LABELS = ["A", "B", "C", "D"];

const buildQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  correct: 0,
  marks: 1,
});

function QuestionCard({
  index,
  data,
  onQuestionChange,
  onOptionChange,
  onCorrectChange,
  onMarksChange,
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

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px]">
        <div>
          <label className="text-sm font-medium text-slate-600">Marks</label>
          <p className="text-xs text-slate-500">Score awarded for a correct answer.</p>
        </div>
        <input
          type="number"
          min="1"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          value={data.marks}
          onChange={(e) => onMarksChange(index, e.target.value)}
        />
      </div>
    </article>
  );
}

export default function CreateExam({ user, onLogout }) {
  const navigate = useNavigate();
  const isExaminer = user?.role === "examiner";
  const isAdmin = user?.role === "admin";
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(() => user?.subject || "");
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState([buildQuestion()]);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [exams, setExams] = useState([]);
  const [selectedResultExamId, setSelectedResultExamId] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const dashboardPath = isExaminer ? "/examiner-dashboard" : "/admin";
  const livePath = isExaminer ? "/examiner/live" : "/admin/live";
  const usersPath = isExaminer ? "/examiner/users" : "/admin/users";
  const createExamPath = isExaminer ? "/examiner/create-exam" : "/admin/create-exam";

  const sidebarWidthClass = sidebarCollapsed ? "w-[240px] lg:w-[84px]" : "w-[240px]";
  const mainMarginClass = sidebarCollapsed ? "lg:ml-[84px]" : "lg:ml-[240px]";
  const totalMarks = useMemo(() => questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0), [questions]);

  useEffect(() => {
    let mounted = true;
    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        const data = await fetchUsers();
        if (!mounted) return;
        const onlyStudents = data.filter((u) => u.role === "student");
        setStudents(onlyStudents);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load students.");
      } finally {
        if (mounted) setLoadingStudents(false);
      }
    };
    loadStudents();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadExams = async () => {
      try {
        const data = await fetchExams();
        if (mounted) setExams(data);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load exams.");
      }
    };
    loadExams();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadAttempts = async () => {
      if (!selectedResultExamId) {
        setAttempts([]);
        return;
      }
      setLoadingAttempts(true);
      try {
        const data = await fetchExamAttempts(selectedResultExamId);
        if (mounted) setAttempts(data);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load results.");
      } finally {
        if (mounted) setLoadingAttempts(false);
      }
    };
    loadAttempts();
    return () => { mounted = false; };
  }, [selectedResultExamId]);

  if (!user || (!isAdmin && !isExaminer)) {
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

  const updateMarks = (qIndex, value) => {
    const nextValue = Number(value);
    setQuestions((prev) =>
      prev.map((question, idx) => (idx === qIndex ? { ...question, marks: nextValue } : question))
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, buildQuestion()]);
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const validateExam = () => {
    if (!subject.trim()) return "Subject is required.";
    if (!title.trim()) return "Exam title is required.";
    if (!duration || Number(duration) <= 0) return "Duration must be a positive number.";
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
      if (!question.marks || Number(question.marks) <= 0) {
        return `Question ${i + 1} must have valid marks.`;
      }
    }

    return "";
  };

  const handleSave = async () => {
    if (isExaminer && !user?.subject) {
      setError("Access Denied");
      return;
    }
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
        subject: subject.trim(),
        title: title.trim(),
        duration: Number(duration),
        allowed_students: selectedStudents,
        questions: questions.map((question) => ({
          question_text: question.question.trim(),
          options: question.options.map((opt) => opt.trim()),
          correct_answer: question.correct,
          marks: Number(question.marks) || 1,
        })),
      };
      await createExam(payload);
      setSuccess("Exam saved successfully.");
      try {
        const updated = await fetchExams();
        setExams(updated);
      } catch (err) {
        // ignore refresh errors
      }
      saved = true;
    } catch (err) {
      setError(err.message || "Failed to save exam.");
    } finally {
      setSaving(false);
      if (saved) {
        navigate(isExaminer ? "/examiner-dashboard" : "/admin-dashboard");
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
              <p className="text-xs text-slate-600">{isExaminer ? "Examiner Panel" : "Admin Panel"}</p>
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
            to={dashboardPath}
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
            to={livePath}
            title="Live Monitoring"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition ${
              sidebarCollapsed ? "lg:justify-center" : ""
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <View size={18} />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Live Monitoring</span>
          </Link>
          <Link
            to={usersPath}
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
            to={createExamPath}
            title="Create Exam"
            className={`flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 text-base font-medium text-slate-900 ${
              sidebarCollapsed ? "lg:justify-center" : ""
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <FilePlus size={18} className="text-blue-600" />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Create Exam</span>
          </Link>
          {isAdmin && (
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
          )}
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
              <label className="text-sm font-medium text-slate-600">Subject</label>
              <input
                type="text"
                className={`mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                  isExaminer ? "opacity-70 cursor-not-allowed" : ""
                }`}
                placeholder="e.g. Data Structures"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isExaminer}
              />
              {isExaminer && !user?.subject ? (
                <p className="mt-2 text-xs text-rose-600">Access Denied: No subject assigned to your account.</p>
              ) : null}
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
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px]">
              <div>
                <label className="text-sm font-medium text-slate-600">Duration (minutes)</label>
                <p className="text-xs text-slate-500">Time limit for students to complete the exam.</p>
              </div>
              <input
                type="number"
                min="1"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium">Total Marks: {totalMarks}</span>
              <span className="text-xs text-slate-500">Calculated from question marks</span>
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
                onMarksChange={updateMarks}
                onDelete={removeQuestion}
                canDelete={questions.length > 1}
              />
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">Assign Students</h3>
                <p className="text-xs text-slate-500">Only selected students can access this exam.</p>
              </div>
              <span className="text-xs text-slate-500">Selected: {selectedStudents.length}</span>
            </div>

            {loadingStudents ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                Loading students...
              </div>
            ) : students.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No students available for assignment.</p>
            ) : (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {students.map((student) => {
                  const isSelected = selectedStudents.includes(student.id);
                  return (
                    <label
                      key={student.id}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                        isSelected ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedStudents((prev) =>
                            prev.includes(student.id)
                              ? prev.filter((id) => id !== student.id)
                              : [...prev, student.id]
                          );
                        }}
                        className="h-4 w-4 accent-cyan-600"
                      />
                      <span className="text-slate-700">{student.username}</span>
                      <span className="ml-auto text-xs text-slate-400">{student.email}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">Exam Results</h3>
                <p className="text-xs text-slate-500">Review scores for completed exams.</p>
              </div>
              <select
                className="input-field w-full sm:w-64"
                value={selectedResultExamId}
                onChange={(e) => setSelectedResultExamId(e.target.value)}
              >
                <option value="">Select an exam</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ))}
              </select>
            </div>

            {loadingAttempts ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                Loading results...
              </div>
            ) : attempts.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No attempts to show.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {attempts.map((attempt) => (
                  <div key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{attempt.user_name}</p>
                      <p className="text-xs text-slate-500">{attempt.user}</p>
                    </div>
                    <div className="text-slate-700">Score: {attempt.score}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(attempt.submitted_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
