import { Link, useNavigate } from "react-router-dom";
import { FilePlus, View, Users, LogOut, ShieldCheck } from "lucide-react";
import Logo from "../assets/TRINETRA.png";

export default function ExaminerDashboard({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      <div className="ambient-bg" />

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-xl px-4 py-3 sm:px-8 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl">
            <img src={Logo} alt="Trinetra logo" className="h-8 w-8 object-contain" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">Examiner Dashboard</h1>
            <p className="text-sm text-slate-600">Limited access for subject monitoring</p>
          </div>
        </div>
        <button
          onClick={() => {
            onLogout();
            navigate("/");
          }}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-red-500/10 hover:text-red-600 transition"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">Welcome, {user?.username || "Examiner"}</h2>
              <p className="text-sm text-slate-600">Subject access: {user?.subject || "Not assigned"}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Link
            to="/examiner/create-exam"
            className="glass-card rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <FilePlus size={18} />
              </span>
              <div>
                <p className="text-base font-semibold text-slate-900">Upload Exam</p>
                <p className="text-sm text-slate-600">Create exams for your subject</p>
              </div>
            </div>
          </Link>

          <Link
            to="/examiner/live"
            className="glass-card rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <View size={18} />
              </span>
              <div>
                <p className="text-base font-semibold text-slate-900">Live Monitoring</p>
                <p className="text-sm text-slate-600">Watch active student sessions</p>
              </div>
            </div>
          </Link>

          <Link
            to="/examiner/users"
            className="glass-card rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Users size={18} />
              </span>
              <div>
                <p className="text-base font-semibold text-slate-900">Student List</p>
                <p className="text-sm text-slate-600">View student profiles</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
