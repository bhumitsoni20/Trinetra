import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Monitor, Users, FileText, LogOut, Edit3, Trash2, Save, X,
  Search, UserPlus, Menu, ChevronLeft, ChevronRight
} from "lucide-react";
import { fetchUsers, updateUser, deleteUser, registerUser } from "../services/api";
import Logo from "../assets/TRINETRA.png";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sidebarWidthClass = sidebarCollapsed ? "w-[240px] lg:w-[84px]" : "w-[240px]";
  const mainMarginClass = sidebarCollapsed ? "lg:ml-[84px]" : "lg:ml-[240px]";

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
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition ${sidebarCollapsed ? "lg:justify-center" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Monitor size={18} />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Dashboard</span>
          </Link>
          <Link
            to="/admin/users"
            title="User Management"
            className={`flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 text-base font-medium text-slate-900 ${sidebarCollapsed ? "lg:justify-center" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Users size={18} className="text-blue-600" />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>User Management</span>
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
          <button
            onClick={() => { onLogout(); navigate("/"); }}
            title="Sign Out"
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-red-500/10 hover:text-red-600 transition ${sidebarCollapsed ? "lg:justify-center" : ""}`}
          >
            <LogOut size={14} />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
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
              <h1 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">User Management</h1>
              <p className="text-sm text-slate-600 sm:text-sm">View, edit, and manage all users</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary text-xs"
          >
            <UserPlus size={14} />
            <span className="hidden sm:inline">Create User</span>
            <span className="sm:hidden">Add</span>
          </button>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {error && (
            <div className="mb-4 rounded-xl border border-red-400/30 bg-red-50 px-4 py-2.5 text-sm text-red-700 animate-fadeIn">
              {error}
              <button onClick={() => setError("")} className="float-right text-red-600 hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Create User Form */}
          {showCreate && (
            <div className="mb-6 glass-card rounded-2xl p-4 animate-fadeInUp sm:p-6">
              <h3 className="font-display text-base font-semibold text-slate-900 mb-4 sm:text-lg">Create New User</h3>
              <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
          <div className="mb-4 flex items-center gap-3 sm:mb-6">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
              <Search size={16} className="text-slate-600" />
            </span>
            <input
              className="input-field flex-1"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {loading ? (
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center text-sm text-slate-600">
                No users found
              </div>
            ) : (
              filtered.map((u) => (
                <div key={u.id} className="glass-card rounded-xl p-4">
                  {editingId === u.id ? (
                    <div className="space-y-3">
                      <input className="input-field text-xs" placeholder="Username" value={editData.username} onChange={(e) => setEditData({ ...editData, username: e.target.value })} />
                      <input className="input-field text-xs" placeholder="Email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                      <select className="input-field text-xs" value={editData.role} onChange={(e) => setEditData({ ...editData, role: e.target.value })}>
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="flex gap-2">
                        <button onClick={handleSave} className="btn-primary text-xs flex-1"><Save size={13} /> Save</button>
                        <button onClick={() => setEditingId(null)} className="btn-ghost text-xs flex-1"><X size={13} /> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                            {u.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{u.username}</p>
                            <p className="text-[10px] text-slate-600 truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleEdit(u)} className="rounded-lg bg-blue-500/10 p-2 text-blue-400 hover:bg-blue-500/20 transition">
                            <Edit3 size={13} />
                          </button>
                          <button onClick={() => handleDelete(u.id)} className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className={`badge ${u.role === "admin" ? "badge-suspicious" : "badge-active"}`}>
                          {u.role}
                        </span>
                        <span className={`badge ${u.is_active ? "badge-active" : "badge-disqualified"}`}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block glass-card-static rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-600">User</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-600">Email</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-600">Role</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-600">Status</th>
                    <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-slate-600">Actions</th>
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
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-600">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr key={u.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                        <td className="px-5 py-4">
                          {editingId === u.id ? (
                            <input className="input-field text-xs py-1.5" value={editData.username} onChange={(e) => setEditData({ ...editData, username: e.target.value })} />
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                                {u.username?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-slate-900">{u.username}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {editingId === u.id ? (
                            <input className="input-field text-xs py-1.5" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                          ) : (
                            <span className="text-sm text-slate-600">{u.email}</span>
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
                              <button onClick={() => setEditingId(null)} className="rounded-lg bg-slate-200 p-2 text-slate-600 hover:bg-slate-300 transition">
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
