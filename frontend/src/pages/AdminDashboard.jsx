import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye, Users, FileText, FilePlus, LogOut, AlertTriangle, Activity,
  UserCheck, UserX, Clock, Wifi, WifiOff, Bell, ChevronRight, ChevronLeft, Monitor,
  Menu, X
} from "lucide-react";
import { fetchSessions, fetchLogs } from "../services/api";
import useProctoringSocket from "../hooks/useProctoringSocket";
import Logo from "../assets/TRINETRA.png";

export default function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const sidebarWidthClass = sidebarCollapsed ? "w-[240px] lg:w-[84px]" : "w-[240px]";
  const mainMarginClass = sidebarCollapsed ? "lg:ml-[84px]" : "lg:ml-[240px]";

  const handleRealtimeAlert = useCallback((payload) => {
    setAlerts((prev) => [
      { ...payload, id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}` },
      ...prev,
    ].slice(0, 50));
  }, []);

  const { connected } = useProctoringSocket(handleRealtimeAlert);

  const loadData = useCallback(async () => {
    try {
      const [sessData, logData] = await Promise.all([fetchSessions(), fetchLogs()]);
      setSessions(sessData);
      setAlerts((prev) => {
        if (prev.length === 0) {
          return logData.slice(0, 30).map((l) => ({
            ...l,
            id: l.id || `${l.timestamp}-${Math.random().toString(16).slice(2, 8)}`,
          }));
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [loadData]);

  const activeSessions = sessions.filter((s) => s.status === "active");
  const suspiciousSessions = sessions.filter((s) => s.violations_count > 2 && s.status === "active");
  const disqualifiedSessions = sessions.filter((s) => s.status === "disqualified");

  const getStatusBadge = (session) => {
    if (session.status === "disqualified") return <span className="badge badge-disqualified">Disqualified</span>;
    if (session.status === "completed") return <span className="badge badge-completed">Completed</span>;
    if (session.violations_count > 2) return <span className="badge badge-suspicious">Suspicious</span>;
    return <span className="badge badge-active">Active</span>;
  };

  const formatTime = (isoStr) => {
    try {
      return new Date(isoStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch { return "—"; }
  };

  const getEventColor = (event) => {
    if (event?.includes("Multiple Faces")) return "text-rose-400";
    if (event?.includes("Face Not")) return "text-amber-400";
    if (event?.includes("Tab Switch")) return "text-purple-400";
    if (event?.includes("Movement")) return "text-orange-400";
    return "text-slate-600";
  };

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
      <aside className={`fixed left-0 top-0 z-50 flex h-full ${sidebarWidthClass} flex-col border-r border-slate-200 bg-white/95 backdrop-blur-xl transition-all duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
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
            className={`flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 text-base font-medium text-slate-900 ${sidebarCollapsed ? "lg:justify-center" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Monitor size={18} className="text-blue-600" />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Dashboard</span>
          </Link>
          <Link
            to="/admin/users"
            title="User Management"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition ${sidebarCollapsed ? "lg:justify-center" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Users size={18} />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>User Management</span>
          </Link>
          <Link
            to="/admin/create-exam"
            title="Create Exam"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition ${sidebarCollapsed ? "lg:justify-center" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FilePlus size={18} />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Create Exam</span>
          </Link>
          <Link
            to="/admin/logs"
            title="Alert Logs"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition ${sidebarCollapsed ? "lg:justify-center" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FileText size={18} />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Alert Logs</span>
          </Link>
        </nav>

        <div className="border-t border-slate-200 px-3 py-4">
          <div className={`mb-3 flex items-center gap-2 px-3 text-sm text-slate-600 ${sidebarCollapsed ? "lg:justify-center" : ""}`}>
            {connected ? (
              <>
                <Wifi size={12} className="text-emerald-600" />
                <span className={sidebarCollapsed ? "lg:hidden" : ""}>Live Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-amber-600" />
                <span className={sidebarCollapsed ? "lg:hidden" : ""}>Reconnecting...</span>
              </>
            )}
          </div>
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
            onClick={() => { onLogout(); navigate("/"); }}
            title="Sign Out"
            className={`mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-red-500/10 hover:text-red-600 transition ${sidebarCollapsed ? "lg:justify-center" : ""}`}
          >
            <LogOut size={14} />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`relative z-10 ${mainMarginClass}`}>
        {/* Top Bar */}
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
              <h1 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">Live Dashboard</h1>
              <p className="text-sm text-slate-600 sm:text-sm">Real-time exam monitoring & alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span className="text-sm text-slate-600">Live</span>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 animate-fadeInUp">
            {[
              { label: "Total Sessions", value: sessions.length, icon: Activity, color: "from-blue-500 to-blue-600", glow: "shadow-blue-500/15" },
              { label: "Active Now", value: activeSessions.length, icon: UserCheck, color: "from-emerald-500 to-emerald-600", glow: "shadow-emerald-500/15" },
              { label: "Suspicious", value: suspiciousSessions.length, icon: AlertTriangle, color: "from-amber-500 to-amber-600", glow: "shadow-amber-500/15" },
              { label: "Disqualified", value: disqualifiedSessions.length, icon: UserX, color: "from-red-500 to-red-600", glow: "shadow-red-500/15" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-3.5 sm:rounded-2xl sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-600 sm:text-xs">{stat.label}</p>
                    <p className="mt-0.5 font-display text-xl font-bold text-slate-900 sm:mt-1 sm:text-2xl">{stat.value}</p>
                  </div>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg ${stat.glow} sm:h-11 sm:w-11`}>
                    <stat.icon size={16} className="text-white sm:hidden" />
                    <stat.icon size={20} className="hidden text-white sm:block" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:mt-8 sm:gap-6 xl:grid-cols-[1.4fr_1fr]">
            {/* Student Cards */}
            <div className="animate-fadeInUp stagger-1">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <h2 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2 sm:text-lg">
                  <Users size={16} className="text-blue-600 sm:hidden" />
                  <Users size={18} className="hidden text-blue-600 sm:block" />
                  Student Sessions
                </h2>
                <span className="text-[10px] text-slate-600 sm:text-xs">{sessions.length} total</span>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 sm:max-h-[600px] sm:space-y-3">
                {loading ? (
                  <div className="glass-card rounded-2xl p-6 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="glass-card rounded-2xl p-6 text-center text-sm text-slate-600">
                    No exam sessions yet
                  </div>
                ) : (
                  sessions.map((s) => (
                    <div key={s.id} className="glass-card rounded-xl p-3 hover:border-slate-300 sm:rounded-2xl sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 sm:gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold sm:h-10 sm:w-10 sm:text-sm ${
                            s.status === "disqualified"
                              ? "bg-red-500/15 text-red-400"
                              : s.violations_count > 2
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-emerald-500/15 text-emerald-400"
                          }`}>
                            {s.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{s.username}</p>
                            <p className="text-[10px] text-slate-600 truncate sm:text-xs">{s.email}</p>
                          </div>
                        </div>
                        {getStatusBadge(s)}
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[10px] text-slate-600 sm:mt-3 sm:gap-4 sm:text-xs">
                        <span className="flex items-center gap-1">
                          <AlertTriangle size={10} className="sm:hidden" />
                          <AlertTriangle size={11} className="hidden sm:block" />
                          Violations: {s.violations_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Monitor size={10} className="sm:hidden" />
                          <Monitor size={11} className="hidden sm:block" />
                          Tabs: {s.tab_switch_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} className="sm:hidden" />
                          <Clock size={11} className="hidden sm:block" />
                          {formatTime(s.start_time)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Alerts Panel */}
            <div className="animate-fadeInUp stagger-2">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <h2 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2 sm:text-lg">
                  <Bell size={16} className="text-amber-600 sm:hidden" />
                  <Bell size={18} className="hidden text-amber-600 sm:block" />
                  Live Alerts
                </h2>
                <Link to="/admin/logs" className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 transition sm:text-xs">
                  View All <ChevronRight size={12} className="sm:hidden" /><ChevronRight size={14} className="hidden sm:block" />
                </Link>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 sm:max-h-[600px] sm:space-y-2.5">
                {alerts.length === 0 ? (
                  <div className="glass-card rounded-2xl p-6 text-center text-sm text-slate-600">
                    <Bell size={24} className="mx-auto mb-2 text-slate-500" />
                    No alerts yet. Monitoring active...
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="glass-card animate-slideInRight rounded-xl p-3 sm:p-3.5"
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex items-start gap-2 min-w-0 sm:gap-2.5">
                          <AlertTriangle size={13} className={`mt-0.5 shrink-0 ${getEventColor(alert.event)} sm:hidden`} />
                          <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${getEventColor(alert.event)} hidden sm:block`} />
                          <div className="min-w-0">
                            <p className={`text-xs font-medium sm:text-sm ${getEventColor(alert.event)}`}>
                              {alert.event}
                            </p>
                            <p className="text-[10px] text-slate-600 truncate sm:text-xs">
                              {alert.username || alert.user_id || "—"}
                              {alert.email ? ` · ${alert.email}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-[9px] text-slate-600 sm:text-[10px]">
                          {formatTime(alert.timestamp)}
                        </span>
                      </div>
                      {alert.image_url && (
                        <div className="mt-2 cursor-pointer group relative" onClick={() => setSelectedImage(alert.image_url)}>
                          <img
                            src={alert.image_url}
                            alt="Snapshot"
                            className="w-full rounded-lg border border-slate-200 max-h-28 object-cover sm:max-h-32 transition duration-200 group-hover:opacity-80"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-black/60 text-white text-[10px] px-2 py-1 rounded border border-white/20 backdrop-blur-sm flex items-center gap-1 sm:text-xs">
                              <Eye size={12} /> Click to expand
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
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
