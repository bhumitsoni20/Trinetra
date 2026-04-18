import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, AlertTriangle, Activity, Users, Monitor, ShieldCheck, 
  UserX, Camera, Clock, CheckCircle2, ScanFace, X, Maximize2,
  Bell, Eye, Zap, Target, Wifi, WifiOff, LogOut, FileText, View, Menu, Loader2, VideoOff,
  RefreshCw
} from "lucide-react";
import Logo from "../assets/TRINETRA.png";
import { fetchSessions, fetchLogs, postWebRTCOffer, getWebRTCAnswer } from "../services/api";
import useProctoringSocket from "../hooks/useProctoringSocket";

/* 
 * ---------------------------------------------------------
 *  WebRTC Live Monitoring (REST-based Signaling)
 *  Admin creates an SDP offer, posts to REST API.
 *  Student polls, responds with an SDP answer.
 *  Stream connects directly peer-to-peer to <video> tags!
 * ---------------------------------------------------------
 *  No <img> tags used. Real live video feeds.
 * ---------------------------------------------------------
 */

const WEBRTC_POLL_MS = 2000;
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const StudentStreamCard = ({ session, isSuspicious, status, onClick }) => {
  const [streamActive, setStreamActive] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    let pc = null;
    let pollInterval = null;
    let isActive = true;

    const startWebRTC = async () => {
      pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      
      // Handle incoming video track from student
      pc.ontrack = (event) => {
        console.log("Admin received track!", event.streams);
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setStreamActive(true);
          setConnecting(false);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("Admin ICE state:", pc.iceConnectionState);
      };

      // Create dummy audio/video transceivers to force receiving media
      pc.addTransceiver('video', { direction: 'recvonly' });

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Wait for ICE candidates to be gathered into the SDP
        if (pc.iceGatheringState !== "complete") {
          await new Promise((resolve) => {
            const check = () => { if (pc.iceGatheringState === "complete") resolve(); };
            pc.addEventListener("icegatheringstatechange", check);
            setTimeout(resolve, 5000);
          });
        }

        // Send offer to server
        await postWebRTCOffer(session.id, pc.localDescription.sdp);

        // Poll for answer
        pollInterval = setInterval(async () => {
          if (!isActive) return;
          try {
            const data = await getWebRTCAnswer(session.id);
            if (data?.sdp) {
              clearInterval(pollInterval);
              await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.sdp }));
            }
          } catch (err) { /* ignore */ }
        }, WEBRTC_POLL_MS);

      } catch (err) {
        console.error("WebRTC Error:", err);
        setConnecting(false);
      }
    };

    if (status.text === "Active" || status.text === "Suspicious") {
       startWebRTC();
    } else {
       setConnecting(false); // don't stream for completed/disqualified
    }

    return () => {
      isActive = false;
      if (pollInterval) clearInterval(pollInterval);
      if (pc) pc.close();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [session.id, status.text]);

  return (
    <div 
      className="group relative rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-cyan-300 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 cursor-pointer animate-scaleIn shadow-sm"
      onClick={() => onClick(session)}
    >
      <div className="aspect-video bg-slate-900 relative overflow-hidden flex items-center justify-center">
         
         {/* Live Video Element */}
         <video 
           ref={videoRef}
           autoPlay 
           playsInline 
           muted
           className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 ${streamActive ? 'block' : 'hidden'}`}
         />

         {/* Connecting Placeholder */}
         {!streamActive && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-50">
             <div className="relative">
               <Camera size={32} className="text-slate-300 mb-2" />
               <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] ${connecting ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
             </div>
             <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                {connecting ? "Connecting to stream..." : "Stream Unavailable"}
             </span>
             {connecting && <Loader2 size={14} className="text-cyan-500 animate-spin mt-2" />}
           </div>
         )}
         
         {/* Decorative Scanner Array — only when streaming */}
         {streamActive && (
           <div className="absolute top-0 inset-x-0 h-[2px] bg-cyan-400 shadow-[0_0_20px_#22d3ee] animate-[float_4s_linear_infinite] z-10 pointer-events-none" />
         )}

         {/* Top HUD */}
         <div className="absolute top-0 inset-x-0 p-3 flex justify-between bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none">
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono border ${status.color}`}>
              {status.text}
            </span>
            {streamActive ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-black/50 border border-black backdrop-blur-md rounded-full text-[9px] font-bold text-red-500 uppercase tracking-widest font-mono">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_#ef4444]" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-black/50 border border-amber-500/30 backdrop-blur-md rounded-full text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_5px_#f59e0b]" /> Pending
              </span>
            )}
         </div>

         {/* AI Bounding Box Mock */}
         {!isSuspicious && streamActive && (
           <div className="absolute inset-10 border border-cyan-400/50 rounded flex items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
             <span className="bg-cyan-400 text-black text-[8px] font-mono px-1 font-bold m-[-1px]">DETECTION ACTIVE</span>
           </div>
         )}

         {/* Suspicious Red Alert Outline */}
         {isSuspicious && (
           <div className="absolute inset-0 border-2 border-red-500/70 shadow-[inset_0_0_40px_rgba(239,68,68,0.4)] animate-pulse z-20 pointer-events-none" />
         )}

         {/* Click to expand overlay */}
         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/20 backdrop-blur-sm transition-all z-30">
            <Maximize2 size={24} className="text-white drop-shadow-md scale-75 group-hover:scale-100 transition-transform" />
         </div>
      </div>
      
      {/* Bottom Details outside video frame */}
      <div className="p-3 bg-white flex items-end justify-between z-20 border-t border-slate-100">
         <div>
            <p className="text-sm font-semibold text-slate-900 truncate">{session.username}</p>
            <p className="text-[10px] text-slate-500 font-mono uppercase">ID: {String(session.id).substring(0,8)}</p>
         </div>
         <div className="flex gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500" title="Tab Switches">
              <Activity size={12} />
              <span className="ml-[1px] text-[9px] font-mono font-semibold">{session.tab_switch_count}</span>
            </div>
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[9px] font-mono font-semibold ${session.violations_count > 0 ? 'bg-red-50 border-red-100 text-red-500' : 'bg-emerald-50 border-emerald-100 text-emerald-500'}`} title="Violations">
              <AlertTriangle size={12} />
              <span className="ml-[1px]">{session.violations_count}</span>
            </div>
         </div>
      </div>
    </div>
  );
};


/* Expanded Modal with live frame WebRTC */
const ExpandedFrameView = ({ session, onClose }) => {
  const [streamActive, setStreamActive] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    let pc = null;
    let pollInterval = null;
    let isActive = true;

    const startWebRTC = async () => {
      pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      
      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setStreamActive(true);
        }
      };

      pc.addTransceiver('video', { direction: 'recvonly' });

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (pc.iceGatheringState !== "complete") {
          await new Promise((resolve) => {
            const check = () => { if (pc.iceGatheringState === "complete") resolve(); };
            pc.addEventListener("icegatheringstatechange", check);
            setTimeout(resolve, 5000);
          });
        }

        await postWebRTCOffer(session.id, pc.localDescription.sdp);

        pollInterval = setInterval(async () => {
          if (!isActive) return;
          try {
            const data = await getWebRTCAnswer(session.id);
            if (data?.sdp) {
              clearInterval(pollInterval);
              await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.sdp }));
            }
          } catch (err) {}
        }, WEBRTC_POLL_MS);

      } catch (err) {}
    };

    startWebRTC();

    return () => {
      isActive = false;
      if (pollInterval) clearInterval(pollInterval);
      if (pc) pc.close();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [session.id]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 lg:p-10 animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-6xl bg-[#050810] border border-cyan-500/30 rounded-2xl shadow-[0_0_80px_rgba(34,211,238,0.15)] overflow-hidden flex flex-col animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-5 bg-[#0B101E] border-b border-white/10">
           <div className="flex items-center gap-4 shrink-0">
             <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-xl shadow-[inset_0_0_20px_rgba(34,211,238,0.2)] border border-cyan-500/30">
               {(session.username || 'S').charAt(0).toUpperCase()}
             </div>
             <div className="min-w-0 flex flex-col justify-center">
               <h2 className="text-xl font-display font-bold text-white truncate drop-shadow-md">{session.username || 'System Feed'}</h2>
               <div className="flex items-center gap-3 mt-0.5">
                 <p className="text-xs text-cyan-400 font-mono uppercase tracking-widest truncate">ID: {String(session.id).substring(0,8)}</p>
                 <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded text-[9px] font-bold text-red-500 uppercase tracking-widest font-mono shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                   <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_#ef4444]" /> LIVE FEED
                 </span>
               </div>
             </div>
           </div>
           <button onClick={onClose} className="p-2 sm:p-2.5 bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 border border-transparent hover:border-cyan-500/30 rounded-xl text-slate-400 transition-all">
             <X size={24} />
           </button>
        </div>

        <div className="relative aspect-video bg-black flex justify-center overflow-hidden">
           {streamActive ? (
             <>
               <video 
                 ref={videoRef}
                 autoPlay playsInline muted
                 className="absolute inset-0 w-full h-full object-contain opacity-90"
               />
               
               {/* HUD */}
               <div className="absolute inset-0 pointer-events-none p-6 sm:p-10">
                 <div className="w-full h-full border border-white/10 flex items-center justify-center relative">
                    <div className="w-2/3 h-3/4 border-2 border-cyan-500/10 relative">
                       <div className="absolute -top-[2px] -left-[2px] w-12 h-12 border-t-4 border-l-4 border-cyan-400 shadow-[0_0_20px_#22d3ee]" />
                       <div className="absolute -top-[2px] -right-[2px] w-12 h-12 border-t-4 border-r-4 border-cyan-400 shadow-[0_0_20px_#22d3ee]" />
                       <div className="absolute -bottom-[2px] -left-[2px] w-12 h-12 border-b-4 border-l-4 border-cyan-400 shadow-[0_0_20px_#22d3ee]" />
                       <div className="absolute -bottom-[2px] -right-[2px] w-12 h-12 border-b-4 border-r-4 border-cyan-400 shadow-[0_0_20px_#22d3ee]" />
                    </div>
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-3 rounded-lg text-xs font-mono text-cyan-400 flex flex-col gap-2 border border-cyan-500/30 shadow-lg">
                       <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_#22d3ee]"/> RES: 640×480</span>
                       <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_#22d3ee]"/> REFRESH: 2s</span>
                       <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_#34d399]"/> STATUS: Online</span>
                    </div>
                 </div>
               </div>
             </>
           ) : (
             <div className="flex flex-col items-center justify-center text-slate-600 bg-[#050810] w-full h-full">
                <VideoOff size={64} className="mb-6 opacity-40" />
                <span className="text-xl font-display uppercase tracking-widest text-slate-400">Waiting for Student Feed...</span>
                <Loader2 size={24} className="text-cyan-500/40 animate-spin mt-4" />
             </div>
           )}
        </div>
      </div>
    </div>
  );
};


export default function LiveMonitoring({ user, onLogout }) {
  const navigate = useNavigate();
  const isExaminer = user?.role === "examiner";
  const dashboardPath = isExaminer ? "/examiner-dashboard" : "/admin";
  const livePath = isExaminer ? "/examiner/live" : "/admin/live";
  const usersPath = isExaminer ? "/examiner/users" : "/admin/users";
  const [sessions, setSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize unified socket architecture for real-time alerts
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
      setSessions(sessData || []);
      
      if (logData && logData.length > 0) {
        setAlerts((prev) => {
          // Create a map of existing IDs to avoid duplicates
          const existingIds = new Set(prev.map(a => a.id));
          
          // Map new logs, assigning ID if missing
          const incoming = logData.map(l => ({
            ...l,
            id: l.id || `${l.timestamp}-${Math.random().toString(16).slice(2, 8)}`
          }));
          
          // Filter out ones we already have
          const newAlerts = incoming.filter(a => !existingIds.has(a.id));
          
          if (newAlerts.length === 0 && prev.length > 0) {
             // If we just started, prev might be from a socket but we want the history
             if (prev.length < 5) {
                 return [...incoming.slice(0, 30)];
             }
             return prev;
          }
          
          // Merge and sort new alerts at top
          return [...newAlerts, ...prev].slice(0, 50);
        });
      }
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


  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery.toLowerCase());
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Show ONLY active exam sessions based on status
      const isActive = s.status === "active";
      if (!isActive) return false;

      if (!activeSearch) return true;
      const strId = String(s.id).toLowerCase();
      const strName = (s.username || "").toLowerCase();
      return strId.includes(activeSearch) || strName.includes(activeSearch);
    });
  }, [sessions, activeSearch]);

  const getEventColor = (event) => {
    if (event?.includes("Multiple Faces")) return "text-rose-400";
    if (event?.includes("Face Not")) return "text-amber-400";
    if (event?.includes("Tab Switch")) return "text-purple-400";
    if (event?.includes("Movement")) return "text-orange-400";
    return "text-slate-400";
  };

  const getStatusDisplay = (s) => {
    if (s.status === "disqualified") return { text: "Disqualified", color: "bg-red-500/30 text-red-300 border-red-500/50" };
    if (s.violations_count > 2) return { text: "Suspicious", color: "bg-amber-500/30 text-amber-300 border-amber-500/50" };
    if (s.status === "completed") return { text: "Completed", color: "bg-blue-500/30 text-blue-300 border-blue-500/50" };
    return { text: "Active", color: "bg-emerald-500/30 text-emerald-300 border-emerald-500/50" };
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cyan-500/30 flex overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute -left-36 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px] sm:h-96 sm:w-96" />
        <div className="absolute -right-20 top-32 h-60 w-60 rounded-full bg-indigo-500/20 blur-[110px] sm:h-80 sm:w-80" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-violet-500/15 blur-[100px] sm:h-72 sm:w-72" />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Left Sidebar */}
      <aside className={`fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col border-r border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
              <img src={Logo} alt="Trinetra" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-slate-900">Trinetra</p>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">
                {isExaminer ? "Examiner Central" : "Admin Central"}
              </p>
            </div>
          </div>
          <button className="lg:hidden p-1 text-slate-400" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link to={dashboardPath} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition" onClick={() => setSidebarOpen(false)}>
            <Monitor size={16} /> Dashboard
          </Link>
          <Link to={livePath} className="flex items-center gap-3 rounded-xl bg-cyan-50 border border-cyan-100 px-3 py-2.5 text-sm font-medium text-cyan-700 transition" onClick={() => setSidebarOpen(false)}>
            <View size={16} className="text-cyan-600" /> Live Monitoring
          </Link>
          <Link to={usersPath} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition" onClick={() => setSidebarOpen(false)}>
            <Users size={16} /> User Management
          </Link>
          {!isExaminer && (
            <Link to="/admin/logs" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition" onClick={() => setSidebarOpen(false)}>
              <FileText size={16} /> Alert Logs
            </Link>
          )}
        </nav>

        <div className="border-t border-slate-200 px-3 py-4">
          <div className="mb-3 flex items-center gap-2 px-3 text-xs text-slate-500">
            {connected ? (
              <><Wifi size={12} className="text-emerald-500" /> Live Connected</>
            ) : (
              <><RefreshCw size={12} className="text-amber-500 animate-spin" /> Connecting...</>
            )}
          </div>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2 bg-slate-50 mb-2 border border-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-xs font-bold text-cyan-700">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">{user.username}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={() => { onLogout(); navigate("/"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-600 hover:bg-red-50 hover:text-red-600 transition">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col lg:ml-[240px] lg:flex-row overflow-hidden w-full h-full">
        
        {/* Center: Top Bar + Grid */}
        <section className="flex-1 flex flex-col min-w-0">
          <header className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-4 sm:mb-0 w-full sm:w-auto">
              <button className="lg:hidden p-1.5 rounded-lg border border-slate-200 bg-slate-50" onClick={() => setSidebarOpen(true)}>
                <Menu size={18} />
              </button>
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Control Room
                </h1>
                <p className="text-[10px] sm:text-xs font-mono text-cyan-600 uppercase tracking-widest mt-0.5 opacity-80">
                  Live Webcam Surveillance
                </p>
              </div>
            </div>

            {/* Global Search Bar */}
            <form onSubmit={handleSearch} className="relative w-full sm:max-w-[320px] group">
              <div className="absolute inset-0 bg-cyan-200 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-cyan-300 focus-within:shadow-sm transition-all">
                <Search size={16} className="absolute left-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search Active Feeds..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent py-2.5 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                />
                <button type="submit" className="absolute right-1.5 p-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 rounded-lg transition-all">
                  <Target size={14} />
                </button>
              </div>
            </form>
          </header>

          {/* Webcam Grid Rendering */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
             {loading ? (
               <div className="flex items-center justify-center h-full">
                 <div className="w-12 h-12 rounded-full border-4 border-cyan-100 border-t-cyan-500 animate-spin" />
               </div>
             ) : filteredSessions.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full opacity-60 animate-fadeIn">
                  <VideoOff size={56} className="text-slate-300 mb-4" />
                  <p className="text-slate-600 text-lg font-display tracking-wide">No active exam sessions</p>
                  <p className="text-slate-400 font-mono text-xs uppercase tracking-widest mt-2">{searchQuery ? "No matches found" : "Waiting for students to start their exams..."}</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {filteredSessions.map((session) => (
                      <StudentStreamCard 
                        key={session.id} 
                        session={session}
                        isSuspicious={session.violations_count >= 2}
                        status={getStatusDisplay(session)}
                        onClick={setExpandedStudent}
                      />
                  ))}
               </div>
             )}
          </div>
        </section>

        {/* Right Side: Alerts Panel */}
        <aside className="w-full lg:w-[320px] bg-white/60 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col backdrop-blur-xl h-64 lg:h-full">
           <div className="p-4 border-b border-slate-200 bg-white/90">
             <h3 className="font-display text-sm font-bold flex items-center gap-2 text-slate-900">
               <AlertTriangle size={16} className="text-red-500" /> Action Logs
             </h3>
             <p className="text-[10px] text-cyan-600 font-mono mt-1 uppercase tracking-widest">A.I. Triggered Violations</p>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
             {alerts.length === 0 ? (
               <div className="text-center py-10 opacity-60">
                 <ShieldCheck size={32} className="mx-auto mb-3 text-emerald-500" />
                 <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">All systems nominal</p>
               </div>
             ) : (
               alerts.map((alert) => (
                 <div key={alert.id} className="bg-white border border-slate-100 shadow-sm rounded-lg p-3 animate-slideInRight hover:shadow-md transition-shadow">
                   <div className="flex items-start gap-3">
                      <div className={`shrink-0 p-2 rounded-lg bg-slate-50 ${getEventColor(alert.event)}`}>
                        {alert.event.includes('Tab') ? <Monitor size={14} /> : 
                         alert.event.includes('Face') ? <ScanFace size={14} /> : 
                         <AlertTriangle size={14} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold ${getEventColor(alert.event)} truncate pr-2 tracking-wide`}>{alert.event}</p>
                          <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap pt-0.5">
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono truncate mt-1 bg-slate-50 px-1.5 py-0.5 inline-block rounded border border-slate-100">ID: {String(alert.username || alert.user_id).substring(0,8).toUpperCase()}</p>
                      </div>
                   </div>
                 </div>
               ))
             )}
           </div>
        </aside>
      </main>

      {/* Expanded Stream Modal */}
      {expandedStudent && (
        <ExpandedFrameView session={expandedStudent} onClose={() => setExpandedStudent(null)} />
      )}

      {/* Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34,211,238,0.4); }
        @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
      `}} />
    </div>
  );
}