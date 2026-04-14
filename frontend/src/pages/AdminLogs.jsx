import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Monitor, Users, FileText, LogOut, AlertTriangle, Clock,
  Filter, Image, Menu, X
} from "lucide-react";
import { fetchLogs } from "../services/api";
import useProctoringSocket from "../hooks/useProctoringSocket";
import Logo from "../assets/TRINETRA.png";

export default function AdminLogs({ user, onLogout }) {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
    return "border-slate-200 bg-slate-50";
  };

  const getEventTextColor = (event) => {
    if (event?.includes("Multiple Faces")) return "text-rose-400";
    if (event?.includes("Face Not")) return "text-amber-400";
    if (event?.includes("Tab Switch")) return "text-purple-400";
    if (event?.includes("Movement")) return "text-orange-400";
    return "text-slate-600";
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col border-r border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl">
              <img src={Logo} alt="Trinetra logo" className="h-8 w-8 object-contain" />
            </div>
            <div>
                <p className="font-display text-base font-bold text-slate-900">
                  <span className="text-[#6B2BD9]">T</span>RI<span className="text-[#6B2BD9]">N</span>ETRA
                </p>
              <p className="text-xs text-slate-600">Admin Panel</p>
            </div>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link to="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition" onClick={() => setSidebarOpen(false)}>
            <Monitor size={18} />
            Dashboard
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition" onClick={() => setSidebarOpen(false)}>
            <Users size={18} />
            User Management
          </Link>
          <Link to="/admin/logs" className="flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 text-base font-medium text-slate-900" onClick={() => setSidebarOpen(false)}>
            <FileText size={18} className="text-blue-600" />
            Alert Logs
          </Link>
        </nav>

        <div className="border-t border-slate-200 px-3 py-4">
          <button onClick={() => { onLogout(); navigate("/"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-red-500/10 hover:text-red-600 transition">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 lg:ml-[240px]">
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
              <h1 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">Alert Logs</h1>
              <p className="text-sm text-slate-600 sm:text-sm">Complete history of all proctoring events</p>
            </div>
          </div>
          <span className="text-sm text-slate-600 sm:text-sm">{filtered.length} events</span>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-1.5 animate-fadeInUp sm:mb-6 sm:gap-2">
            <Filter size={14} className="text-slate-600" />
            {[
              { key: "all", label: "All" },
              { key: "face", label: "Face" },
              { key: "multi", label: "Multi-face" },
              { key: "tab", label: "Tab" },
              { key: "movement", label: "Movement" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition sm:px-3 sm:py-1.5 sm:text-xs ${
                  filter === f.key
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200 hover:text-slate-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Logs */}
          <div className="space-y-2 animate-fadeInUp stagger-1 sm:space-y-2.5">
            {loading ? (
              <div className="glass-card rounded-2xl p-10 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center text-sm text-slate-600">
                No events found for this filter.
              </div>
            ) : (
              filtered.map((log) => (
                <div
                  key={log.id}
                  className={`glass-card rounded-xl p-3 border sm:p-4 ${getEventColor(log.event)}`}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <div className="flex items-start gap-2 min-w-0 sm:gap-3">
                      <span className="text-base sm:text-lg">{getEventIcon(log.event)}</span>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold sm:text-sm ${getEventTextColor(log.event)}`}>
                          {log.event}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-600 truncate sm:text-xs">
                          {log.username || log.user_id || "—"}
                          {log.email ? ` · ${log.email}` : ""}
                          {" · Risk: "}
                          <span className="text-slate-700 font-medium">{log.risk_score}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 sm:flex-row sm:items-center sm:gap-3">
                      {log.image_url && (
                        <a
                          href={log.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] text-blue-600 hover:bg-blue-100 transition sm:text-xs"
                        >
                          <Image size={11} /> View
                        </a>
                      )}
                      <span className="flex items-center gap-1 text-[9px] text-slate-600 sm:text-[11px]">
                        <Clock size={10} className="sm:hidden" />
                        <Clock size={11} className="hidden sm:block" />
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                  {log.image_url && (
                    <div className="mt-2 sm:mt-3">
                      <div className="cursor-pointer group relative inline-block w-full max-w-sm" onClick={() => setSelectedImage(log.image_url)}>
                        <img
                          src={log.image_url}
                          alt="Suspicious activity snapshot"
                          className="w-full rounded-lg border border-slate-200 transition duration-200 group-hover:opacity-80"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/60 text-white text-[10px] px-2 py-1 rounded border border-white/20 backdrop-blur-sm flex items-center gap-1 sm:text-xs">
                            <Image size={12} /> Click to expand
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 p-3 sm:p-4 bg-slate-50">
              <h3 className="font-display text-slate-900 text-sm sm:text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="text-amber-600" size={16} /> Alert Snapshot
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-2 sm:p-4 flex justify-center bg-slate-50">
              <img src={selectedImage} alt="Expanded Alert" className="max-h-[60vh] sm:max-h-[75vh] w-auto object-contain rounded-lg shadow-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
