import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye, Users, FileText, LogOut, AlertTriangle, Shield, Activity,
  UserCheck, UserX, Clock, Wifi, WifiOff, Bell, ChevronRight, Monitor
} from "lucide-react";
import { fetchSessions, fetchLogs } from "../services/api";
import useProctoringSocket from "../hooks/useProctoringSocket";

export default function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return "text-slate-400";
  };

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
          <Link to="/admin" className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-medium text-white">
            <Monitor size={16} className="text-cyan-400" />
            Dashboard
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition">
            <Users size={16} />
            User Management
          </Link>
          <Link to="/admin/logs" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition">
            <FileText size={16} />
            Alert Logs
          </Link>
        </nav>

        <div className="border-t border-slate-800/60 px-3 py-4">
          <div className="mb-3 flex items-center gap-2 px-3 text-xs text-slate-500">
            {connected ? (
              <><Wifi size={12} className="text-emerald-400" /> Live Connected</>
            ) : (
              <><WifiOff size={12} className="text-amber-400" /> Reconnecting...</>
            )}
          </div>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-xs font-bold text-purple-300">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.username}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={() => { onLogout(); navigate("/"); }} className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 ml-[240px]">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800/60 bg-[#0a0e1a]/90 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="font-display text-xl font-bold text-white">Live Dashboard</h1>
            <p className="text-xs text-slate-500">Real-time exam monitoring & alerts</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span className="text-xs text-slate-400">Live</span>
          </div>
        </header>

        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fadeInUp">
            {[
              { label: "Total Sessions", value: sessions.length, icon: Activity, color: "from-blue-500 to-blue-600", glow: "shadow-blue-500/15" },
              { label: "Active Now", value: activeSessions.length, icon: UserCheck, color: "from-emerald-500 to-emerald-600", glow: "shadow-emerald-500/15" },
              { label: "Suspicious", value: suspiciousSessions.length, icon: AlertTriangle, color: "from-amber-500 to-amber-600", glow: "shadow-amber-500/15" },
              { label: "Disqualified", value: disqualifiedSessions.length, icon: UserX, color: "from-red-500 to-red-600", glow: "shadow-red-500/15" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className="mt-1 font-display text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg ${stat.glow}`}>
                    <stat.icon size={20} className="text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
            {/* Student Cards */}
            <div className="animate-fadeInUp stagger-1">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                  <Users size={18} className="text-cyan-400" />
                  Student Sessions
                </h2>
                <span className="text-xs text-slate-500">{sessions.length} total</span>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="glass-card rounded-2xl p-6 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="glass-card rounded-2xl p-6 text-center text-sm text-slate-500">
                    No exam sessions yet
                  </div>
                ) : (
                  sessions.map((s) => (
                    <div key={s.id} className="glass-card rounded-2xl p-4 hover:border-slate-600/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${
                            s.status === "disqualified"
                              ? "bg-red-500/15 text-red-400"
                              : s.violations_count > 2
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-emerald-500/15 text-emerald-400"
                          }`}>
                            {s.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{s.username}</p>
                            <p className="text-xs text-slate-500">{s.email}</p>
                          </div>
                        </div>
                        {getStatusBadge(s)}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <AlertTriangle size={11} /> Violations: {s.violations_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Monitor size={11} /> Tab switches: {s.tab_switch_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {formatTime(s.start_time)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Alerts Panel */}
            <div className="animate-fadeInUp stagger-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                  <Bell size={18} className="text-amber-400" />
                  Live Alerts
                </h2>
                <Link to="/admin/logs" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition">
                  View All <ChevronRight size={14} />
                </Link>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {alerts.length === 0 ? (
                  <div className="glass-card rounded-2xl p-6 text-center text-sm text-slate-500">
                    <Bell size={24} className="mx-auto mb-2 text-slate-600" />
                    No alerts yet. Monitoring active...
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="glass-card animate-slideInRight rounded-xl p-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${getEventColor(alert.event)}`} />
                          <div>
                            <p className={`text-sm font-medium ${getEventColor(alert.event)}`}>
                              {alert.event}
                            </p>
                            <p className="text-xs text-slate-500">
                              {alert.username || alert.user_id || "—"}
                              {alert.email ? ` · ${alert.email}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] text-slate-600">
                          {formatTime(alert.timestamp)}
                        </span>
                      </div>
                      {alert.image_url && (
                        <div className="mt-2">
                          <img
                            src={alert.image_url}
                            alt="Snapshot"
                            className="w-full rounded-lg border border-slate-700/50 max-h-32 object-cover"
                          />
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
    </div>
  );
}
