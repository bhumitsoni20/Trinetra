import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield, Monitor, Users, FileText, LogOut, AlertTriangle, Clock,
  Filter, Image, Eye
} from "lucide-react";
import { fetchLogs } from "../services/api";
import useProctoringSocket from "../hooks/useProctoringSocket";

export default function AdminLogs({ user, onLogout }) {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const handleRealtimeAlert = useCallback((payload) => {
    setLogs((prev) => [
      { ...payload, id: payload.id || `${Date.now()}-${Math.random().toString(16).slice(2, 8)}` },
      ...prev,
    ].slice(0, 200));
  }, []);

  useProctoringSocket(handleRealtimeAlert);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchLogs();
        setLogs(data);
      } catch (err) {
        console.error("Failed to load logs:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getEventIcon = (event) => {
    if (event?.includes("Multiple Faces")) return "👥";
    if (event?.includes("Face Not")) return "🚫";
    if (event?.includes("Tab Switch")) return "🔄";
    if (event?.includes("Movement")) return "📱";
    return "⚠️";
  };

  const getEventColor = (event) => {
    if (event?.includes("Multiple Faces")) return "border-rose-400/30 bg-rose-500/8";
    if (event?.includes("Face Not")) return "border-amber-400/30 bg-amber-500/8";
    if (event?.includes("Tab Switch")) return "border-purple-400/30 bg-purple-500/8";
    if (event?.includes("Movement")) return "border-orange-400/30 bg-orange-500/8";
    return "border-slate-700/40 bg-slate-800/30";
  };

  const getEventTextColor = (event) => {
    if (event?.includes("Multiple Faces")) return "text-rose-400";
    if (event?.includes("Face Not")) return "text-amber-400";
    if (event?.includes("Tab Switch")) return "text-purple-400";
    if (event?.includes("Movement")) return "text-orange-400";
    return "text-slate-400";
  };

  const formatDateTime = (ts) => {
    try {
      return new Date(ts).toLocaleString([], {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });
    } catch { return "—"; }
  };

  const filtered = filter === "all" ? logs : logs.filter((l) => {
    if (filter === "face") return l.event?.includes("Face Not");
    if (filter === "multi") return l.event?.includes("Multiple Faces");
    if (filter === "tab") return l.event?.includes("Tab Switch");
    if (filter === "movement") return l.event?.includes("Movement");
    return true;
  });

  return (
    <div className="relative min-h-screen">
      <div className="ambient-bg" />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-full w-[240px] flex-col border-r border-slate-800/60 bg-[#0a0e1a]/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-slate-800/60 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-white">Trinetra</p>
            <p className="text-[10px] text-slate-500">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link to="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition">
            <Monitor size={16} />
            Dashboard
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition">
            <Users size={16} />
            User Management
          </Link>
          <Link to="/admin/logs" className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-medium text-white">
            <FileText size={16} className="text-cyan-400" />
            Alert Logs
          </Link>
        </nav>

        <div className="border-t border-slate-800/60 px-3 py-4">
          <button onClick={() => { onLogout(); navigate("/"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 ml-[240px]">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800/60 bg-[#0a0e1a]/90 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="font-display text-xl font-bold text-white">Alert Logs</h1>
            <p className="text-xs text-slate-500">Complete history of all proctoring events</p>
          </div>
          <span className="text-xs text-slate-500">{filtered.length} events</span>
        </header>

        <div className="p-8">
          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-2 animate-fadeInUp">
            <Filter size={14} className="text-slate-500" />
            {[
              { key: "all", label: "All Events" },
              { key: "face", label: "Face Not Visible" },
              { key: "multi", label: "Multiple Faces" },
              { key: "tab", label: "Tab Switch" },
              { key: "movement", label: "Movement" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filter === f.key
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/25"
                    : "bg-slate-800/50 text-slate-500 border border-slate-700/40 hover:text-slate-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Logs */}
          <div className="space-y-2.5 animate-fadeInUp stagger-1">
            {loading ? (
              <div className="glass-card rounded-2xl p-10 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center text-sm text-slate-500">
                No events found for this filter.
              </div>
            ) : (
              filtered.map((log) => (
                <div
                  key={log.id}
                  className={`glass-card rounded-xl p-4 border ${getEventColor(log.event)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getEventIcon(log.event)}</span>
                      <div>
                        <p className={`text-sm font-semibold ${getEventTextColor(log.event)}`}>
                          {log.event}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {log.username || log.user_id || "—"}
                          {log.email ? ` · ${log.email}` : ""}
                          {" · Risk: "}
                          <span className="text-slate-400 font-medium">{log.risk_score}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {log.image_url && (
                        <a
                          href={log.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/20 transition"
                        >
                          <Image size={12} /> View
                        </a>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-slate-600">
                        <Clock size={11} />
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                  {log.image_url && (
                    <div className="mt-3">
                      <img
                        src={log.image_url}
                        alt="Suspicious activity snapshot"
                        className="w-full max-w-sm rounded-lg border border-slate-700/50"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
