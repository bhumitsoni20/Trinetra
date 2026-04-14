import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield, Monitor, Users, FileText, LogOut, Edit3, Trash2, Save, X,
  Search, UserPlus, Wifi, WifiOff
} from "lucide-react";
import { fetchUsers, updateUser, deleteUser, registerUser } from "../services/api";

export default function AdminUsers({ user, onLogout }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", first_name: "", last_name: "", role: "student" });
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleEdit = (u) => {
    setEditingId(u.id);
    setEditData({
      username: u.username,
      email: u.email,
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      role: u.role || "student",
    });
  };

  const handleSave = async () => {
    try {
      await updateUser(editingId, editData);
      setEditingId(null);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await registerUser(newUser);
      setShowCreate(false);
      setNewUser({ username: "", email: "", password: "", first_name: "", last_name: "", role: "student" });
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

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
          <Link to="/admin/users" className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-medium text-white">
            <Users size={16} className="text-cyan-400" />
            User Management
          </Link>
          <Link to="/admin/logs" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition">
            <FileText size={16} />
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
            <h1 className="font-display text-xl font-bold text-white">User Management</h1>
            <p className="text-xs text-slate-500">View, edit, and manage all users</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary text-xs"
          >
            <UserPlus size={14} /> Create User
          </button>
        </header>

        <div className="p-8">
          {error && (
            <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 animate-fadeIn">
              {error}
              <button onClick={() => setError("")} className="float-right text-red-400 hover:text-red-300">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Create User Form */}
          {showCreate && (
            <div className="mb-6 glass-card rounded-2xl p-6 animate-fadeInUp">
              <h3 className="font-display text-lg font-semibold text-white mb-4">Create New User</h3>
              <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <input className="input-field" placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required />
                <input className="input-field" placeholder="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
                <input className="input-field" placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required minLength={6} />
                <input className="input-field" placeholder="First Name" value={newUser.first_name} onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} />
                <input className="input-field" placeholder="Last Name" value={newUser.last_name} onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} />
                <select
                  className="input-field"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
                  <button type="submit" className="btn-primary"><Save size={14} /> Create</button>
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost"><X size={14} /> Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="mb-6 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input-field pl-10"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Users Table */}
          <div className="glass-card-static rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">User</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Email</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Role</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center">
                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr key={u.id} className="border-b border-slate-800/40 hover:bg-white/[0.02] transition">
                        <td className="px-5 py-4">
                          {editingId === u.id ? (
                            <input className="input-field text-xs py-1.5" value={editData.username} onChange={(e) => setEditData({ ...editData, username: e.target.value })} />
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-300">
                                {u.username?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-white">{u.username}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {editingId === u.id ? (
                            <input className="input-field text-xs py-1.5" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                          ) : (
                            <span className="text-sm text-slate-400">{u.email}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {editingId === u.id ? (
                            <select className="input-field text-xs py-1.5" value={editData.role} onChange={(e) => setEditData({ ...editData, role: e.target.value })}>
                              <option value="student">Student</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className={`badge ${u.role === "admin" ? "badge-suspicious" : "badge-active"}`}>
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`badge ${u.is_active ? "badge-active" : "badge-disqualified"}`}>
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {editingId === u.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={handleSave} className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400 hover:bg-emerald-500/25 transition">
                                <Save size={14} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="rounded-lg bg-slate-700/50 p-2 text-slate-400 hover:bg-slate-700 transition">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleEdit(u)} className="rounded-lg bg-blue-500/10 p-2 text-blue-400 hover:bg-blue-500/20 transition">
                                <Edit3 size={14} />
                              </button>
                              <button onClick={() => handleDelete(u.id)} className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
