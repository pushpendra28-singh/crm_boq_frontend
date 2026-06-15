import { useState, useEffect, useCallback, useContext } from "react";
import { AuthContext } from "../../auth/AuthContext";
import API_BASE_URL from "../../config/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Sun, Search, Filter, Plus, RefreshCw, BarChart2,
  TrendingUp, AlertCircle, CheckCircle2, Clock, Activity,
  ChevronDown, X, SlidersHorizontal, Layers,
} from "lucide-react";
import {
  StatusBadge, PriorityBadge, ProgressBar,
  STATUS_META, PRIORITY_META,
  ProjectCard,
} from "./ProjectHelpers";
import ProjectDetail from "./ProjectDetail";
import ProjectFormModal from "./ProjectFormModal";

/* ─── Stats bar ─── */
const StatCard = ({ label, value, icon: Icon, color, loading }) => {
  // map dark tailwind color classes → light theme values
  const colorMap = {
    "text-indigo-400": { bg: "#f5f3ff", border: "#ede9fe", icon: "#8b5cf6", accent: "#8b5cf6" },
    "text-blue-400":   { bg: "#eff6ff", border: "#dbeafe", icon: "#3b82f6", accent: "#3b82f6" },
    "text-green-400":  { bg: "#f0fdf4", border: "#bbf7d0", icon: "#16a34a", accent: "#16a34a" },
    "text-red-400":    { bg: "#fef2f2", border: "#fecaca", icon: "#ef4444", accent: "#ef4444" },
    "text-emerald-400":{ bg: "#ecfdf5", border: "#a7f3d0", icon: "#10b981", accent: "#10b981" },
  };
  const c = colorMap[color] || colorMap["text-indigo-400"];

  return (
    <div style={{
      background: "#ffffff",
      border: `1px solid #e2e8f0`,
      borderTop: `3px solid ${c.accent}`,
      borderRadius: 14,
      padding: 16,
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.2s, transform 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: c.bg, border: `1px solid ${c.border}` }}>
        <Icon size={16} style={{ color: c.icon }} />
      </div>
      <div>
        <p style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{label}</p>
        {loading
          ? <div style={{ height: 20, width: 40, background: "#f1f5f9", borderRadius: 6, marginTop: 2, animation: "pulse 1.5s infinite" }} />
          : <p style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{value}</p>}
      </div>
    </div>
  );
};

/* ─── Filter/Search bar ─── */
const FilterBar = ({ search, setSearch, status, setStatus, priority, setPriority, onClear }) => {
  const hasFilters = search || status || priority;

  const inputStyle = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "8px 12px",
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    width: "100%",
  };

  const selectStyle = {
    ...inputStyle,
    width: "auto",
    paddingRight: 28,
    appearance: "none",
    cursor: "pointer",
    color: "#475569",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {/* Search */}
      <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects, customers..."
          style={{ ...inputStyle, paddingLeft: 36 }}
          onFocus={e => { e.target.style.borderColor = "#16a34a"; e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.08)"; }}
          onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      {/* Status filter */}
      <div style={{ position: "relative" }}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={selectStyle}
          onFocus={e => { e.target.style.borderColor = "#16a34a"; e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.08)"; }}
          onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
      </div>

      {/* Priority filter */}
      <div style={{ position: "relative" }}>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={selectStyle}
          onFocus={e => { e.target.style.borderColor = "#16a34a"; e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.08)"; }}
          onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
        >
          <option value="">All Priority</option>
          {Object.entries(PRIORITY_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
      </div>

      {hasFilters && (
        <button
          onClick={onClear}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#334155"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#64748b"; }}
        >
          <X size={12} /> Clear
        </button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function ViewProjects() {
  const { hasPermission } = useContext(AuthContext);
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  /* ── View state ── */
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  /* ── Data ── */
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [engineers, setEngineers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  /* ── Filters ── */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const hasEdit   = hasPermission("edit_projects");
  const hasCreate = hasPermission("create_projects");
  const hasDelete = hasPermission("delete_projects");

  /* ── Fetch projects ── */
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search)         params.set("search",   search);
      if (statusFilter)   params.set("status",   statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);

      const r = await fetch(`${API_BASE_URL}/projects?${params}`, { headers });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setProjects(d.projects);
      setTotal(d.total);
      setPages(d.pages);
    } catch (e) {
      toast.error(e.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, page]);

  /* ── Fetch stats ── */
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/projects/stats/overview`, { headers });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setStats(d);
    } catch (e) {
      console.error("Stats error:", e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /* ── Fetch engineers ── */
  const loadEngineers = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/projects/engineers`, { headers });
      const d = await r.json();
      setEngineers(d.engineers || []);
    } catch (e) {
      console.error("Engineers error:", e);
    }
  }, []);

  useEffect(() => { loadStats(); loadEngineers(); }, []);
  useEffect(() => { loadProjects(); }, [loadProjects]);

  /* ── Debounce search ── */
  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter]);

  /* ── Save project ── */
  const saveProject = async (form) => {
    try {
      const url    = editData ? `${API_BASE_URL}/projects/${editData._id}` : `${API_BASE_URL}/projects`;
      const method = editData ? "PUT" : "POST";
      const r = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      toast.success(editData ? "Project updated successfully" : "Project created successfully 🚀");
      await loadProjects();
      await loadStats();
    } catch (e) {
      toast.error(e.message || "Save failed");
      throw e;
    }
  };

  /* ── Delete project ── */
  const deleteProject = async (id) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    try {
      const r = await fetch(`${API_BASE_URL}/projects/${id}`, { method: "DELETE", headers });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      toast.success("Project deleted");
      await loadProjects();
      await loadStats();
    } catch (e) {
      toast.error(e.message);
    }
  };

  /* ── Computed stats ── */
  const statusMap = {};
  (stats?.byStatus || []).forEach((s) => { statusMap[s._id] = s.count; });

  const overviewStats = [
    { label: "Total Projects", value: stats?.totalProjects ?? "—",                                                                                                      icon: Layers,       color: "text-indigo-400" },
    { label: "In Progress",    value: (statusMap["installation"]||0)+(statusMap["site_survey"]||0)+(statusMap["design"]||0), icon: Activity,     color: "text-blue-400"   },
    { label: "Completed",      value: statusMap["completed"] || 0,                                                                                                       icon: CheckCircle2, color: "text-green-400"  },
    { label: "Overdue",        value: stats?.overdueProjects ?? "—",                                                                                                     icon: AlertCircle,  color: "text-red-400"    },
    { label: "Avg Progress",   value: stats?.avgProgress !== undefined ? `${stats.avgProgress}%` : "—",                                                                 icon: TrendingUp,   color: "text-emerald-400"},
  ];

  /* ── Status dot color map for distribution bar ── */
  const STATUS_COLORS = {
    completed:    "#16a34a",
    installation: "#3b82f6",
    site_survey:  "#f59e0b",
    design:       "#8b5cf6",
    pending:      "#94a3b8",
    on_hold:      "#ef4444",
  };

  /* ── Detail view ── */
  if (view === "detail" && selectedId) {
    return (
      <ProjectDetail
        projectId={selectedId}
        goBack={() => { setView("list"); setSelectedId(null); }}
        onEdit={() => {
          const proj = projects.find((p) => p._id === selectedId);
          if (proj) { setEditData(proj); setFormOpen(true); }
        }}
        hasEdit={hasEdit}
        token={token}
        apiBase="/projects"
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      {/* Form modal */}
      <ProjectFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        onSave={saveProject}
        editData={editData}
        engineers={engineers}
      />

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sun size={14} style={{ color: "#f59e0b" }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>Solar Projects</h2>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>
            {total} project{total !== 1 ? "s" : ""} · Savorka Solar Installation Management
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => { loadProjects(); loadStats(); }}
            style={{ padding: 8, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#334155"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#64748b"; }}
          >
            <RefreshCw size={16} />
          </button>

          {hasCreate && (
            <button
              onClick={() => { setEditData(null); setFormOpen(true); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#ffffff", background: "#16a34a", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(22,163,74,0.25)", transition: "all 0.15s", letterSpacing: "-0.01em" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#15803d"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(22,163,74,0.32)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(22,163,74,0.25)"; }}
            >
              <Plus size={15} /> New Project
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {overviewStats.map((s) => (
          <StatCard key={s.label} {...s} loading={statsLoading} />
        ))}
      </div>

      {/* Status distribution bar */}
      {stats && !statsLoading && stats.totalProjects > 0 && (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 10 }}>
            Status Distribution
          </p>
          <div style={{ display: "flex", gap: 3, height: 8, borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const count = statusMap[key] || 0;
              if (!count) return null;
              const pct = (count / stats.totalProjects) * 100;
              return (
                <div key={key} style={{ width: `${pct}%`, height: "100%", background: STATUS_COLORS[key] || "#94a3b8", transition: "width 0.6s ease" }} title={`${meta.label}: ${count}`} />
              );
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const count = statusMap[key] || 0;
              if (!count) return null;
              return (
                <span key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[key] || "#94a3b8", display: "block", flexShrink: 0 }} />
                  {meta.label}: <strong style={{ color: "#334155" }}>{count}</strong>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <FilterBar
        search={search}         setSearch={setSearch}
        status={statusFilter}   setStatus={setStatusFilter}
        priority={priorityFilter} setPriority={setPriorityFilter}
        onClear={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); }}
      />

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, height: 192, animation: "pulse 1.5s infinite", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "48px 24px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Sun size={24} style={{ color: "#f59e0b" }} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>No Projects Found</h3>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
            {search || statusFilter || priorityFilter
              ? "Try adjusting your filters"
              : "Create your first solar installation project"}
          </p>
          {hasCreate && !search && !statusFilter && !priorityFilter && (
            <button
              onClick={() => { setEditData(null); setFormOpen(true); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#ffffff", background: "#16a34a", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(22,163,74,0.25)", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#15803d"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#16a34a"; }}
            >
              <Plus size={15} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            <AnimatePresence>
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onClick={() => { setSelectedId(project._id); setView("detail"); }}
                  onEdit={() => { setEditData(project); setFormOpen(true); }}
                  onDelete={() => deleteProject(project._id)}
                  hasEdit={hasEdit}
                  hasDelete={hasDelete}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", cursor: page===1?"not-allowed":"pointer", opacity: page===1?0.4:1, transition: "all 0.15s" }}
                onMouseEnter={e => { if(page!==1){ e.currentTarget.style.background="#f1f5f9"; e.currentTarget.style.color="#334155"; }}}
                onMouseLeave={e => { e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.color="#64748b"; }}
              >
                ← Prev
              </button>

              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700,
                    border: "none", cursor: "pointer", transition: "all 0.15s",
                    background: p === page ? "#16a34a" : "#f8fafc",
                    color: p === page ? "#ffffff" : "#64748b",
                    boxShadow: p === page ? "0 4px 10px rgba(22,163,74,0.25)" : "none",
                    border: p === page ? "none" : "1px solid #e2e8f0",
                  }}
                  onMouseEnter={e => { if(p!==page){ e.currentTarget.style.background="#f1f5f9"; e.currentTarget.style.color="#334155"; }}}
                  onMouseLeave={e => { if(p!==page){ e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.color="#64748b"; }}}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", cursor: page===pages?"not-allowed":"pointer", opacity: page===pages?0.4:1, transition: "all 0.15s" }}
                onMouseEnter={e => { if(page!==pages){ e.currentTarget.style.background="#f1f5f9"; e.currentTarget.style.color="#334155"; }}}
                onMouseLeave={e => { e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.color="#64748b"; }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}



// import { useState, useEffect, useCallback, useContext } from "react";
// import { AuthContext } from "../../auth/AuthContext";
// import API_BASE_URL from "../../config/api";
// import { motion, AnimatePresence } from "framer-motion";
// import toast from "react-hot-toast";
// import {
//   Sun, Search, Filter, Plus, RefreshCw, BarChart2,
//   TrendingUp, AlertCircle, CheckCircle2, Clock, Activity,
//   ChevronDown, X, SlidersHorizontal, Layers,
// } from "lucide-react";
// import {
//   StatusBadge, PriorityBadge, ProgressBar,
//   STATUS_META, PRIORITY_META,
//   ProjectCard,
// } from "./ProjectHelpers";
// import ProjectDetail from "./ProjectDetail";
// import ProjectFormModal from "./ProjectFormModal";

// /* ─── Stats bar ─── */
// const StatCard = ({ label, value, icon: Icon, color, loading }) => (
//   <div className="bg-[#141428] border border-white/5 rounded-xl p-4 flex items-center gap-3">
//     <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color.replace("text-", "bg-").replace("-400", "-500/15")}`}>
//       <Icon size={16} className={color} />
//     </div>
//     <div>
//       <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
//       {loading
//         ? <div className="h-5 w-10 bg-white/10 animate-pulse rounded mt-0.5" />
//         : <p className="text-[18px] font-black text-white">{value}</p>}
//     </div>
//   </div>
// );

// /* ─── Filter/Search bar ─── */
// const FilterBar = ({ search, setSearch, status, setStatus, priority, setPriority, onClear }) => {
//   const hasFilters = search || status || priority;
//   return (
//     <div className="flex items-center gap-2 flex-wrap">
//       <div className="relative flex-1 min-w-[200px]">
//         <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
//         <input
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search projects, customers..."
//           className="w-full bg-[#141428] border border-white/8 rounded-xl pl-9 pr-3 py-2 text-[13px] text-white placeholder-slate-600
//             focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition"
//         />
//       </div>

//       {/* Status filter */}
//       <div className="relative">
//         <select
//           value={status}
//           onChange={(e) => setStatus(e.target.value)}
//           className="bg-[#141428] border border-white/8 rounded-xl px-3 py-2 text-[13px] text-slate-300 appearance-none focus:outline-none focus:border-indigo-500/60 transition pr-7"
//         >
//           <option value="">All Status</option>
//           {Object.entries(STATUS_META).map(([k, v]) => (
//             <option key={k} value={k}>{v.label}</option>
//           ))}
//         </select>
//         <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
//       </div>

//       {/* Priority filter */}
//       <div className="relative">
//         <select
//           value={priority}
//           onChange={(e) => setPriority(e.target.value)}
//           className="bg-[#141428] border border-white/8 rounded-xl px-3 py-2 text-[13px] text-slate-300 appearance-none focus:outline-none focus:border-indigo-500/60 transition pr-7"
//         >
//           <option value="">All Priority</option>
//           {Object.entries(PRIORITY_META).map(([k, v]) => (
//             <option key={k} value={k}>{v.label}</option>
//           ))}
//         </select>
//         <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
//       </div>

//       {hasFilters && (
//         <button
//           onClick={onClear}
//           className="flex items-center gap-1 px-3 py-2 rounded-xl text-[12px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/8 transition"
//         >
//           <X size={12} /> Clear
//         </button>
//       )}
//     </div>
//   );
// };

// /* ═══════════════════════════════════════════════════════════
//    MAIN COMPONENT
// ═══════════════════════════════════════════════════════════ */
// export default function ViewProjects() {
//   const { hasPermission } = useContext(AuthContext);
//   const token = localStorage.getItem("adminToken");
//   const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

//   /* ── View state ── */
//   const [view, setView] = useState("list"); // "list" | "detail"
//   const [selectedId, setSelectedId] = useState(null);
//   const [formOpen, setFormOpen] = useState(false);
//   const [editData, setEditData] = useState(null);

//   /* ── Data ── */
//   const [projects, setProjects] = useState([]);
//   const [total, setTotal] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState(null);
//   const [statsLoading, setStatsLoading] = useState(true);
//   const [engineers, setEngineers] = useState([]);
//   const [page, setPage] = useState(1);
//   const [pages, setPages] = useState(1);

//   /* ── Filters ── */
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [priorityFilter, setPriorityFilter] = useState("");

//   const hasEdit = hasPermission("edit_projects");
//   const hasCreate = hasPermission("create_projects");
//   const hasDelete = hasPermission("delete_projects");

//   /* ── Fetch projects ── */
//   const loadProjects = useCallback(async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({ page, limit: 12 });
//       if (search) params.set("search", search);
//       if (statusFilter) params.set("status", statusFilter);
//       if (priorityFilter) params.set("priority", priorityFilter);

//       const r = await fetch(`${API_BASE_URL}/projects?${params}`, { headers });
//       const d = await r.json();
//       if (!r.ok) throw new Error(d.message);
//       setProjects(d.projects);
//       setTotal(d.total);
//       setPages(d.pages);
//     } catch (e) {
//       toast.error(e.message || "Failed to load projects");
//     } finally {
//       setLoading(false);
//     }
//   }, [search, statusFilter, priorityFilter, page]);

//   /* ── Fetch stats ── */
//   const loadStats = useCallback(async () => {
//     setStatsLoading(true);
//     try {
//       const r = await fetch(`${API_BASE_URL}/projects/stats/overview`, { headers });
//       const d = await r.json();
//       if (!r.ok) throw new Error(d.message);
//       setStats(d);
//     } catch (e) {
//       console.error("Stats error:", e);
//     } finally {
//       setStatsLoading(false);
//     }
//   }, []);

//   /* ── Fetch engineers ── */
//   const loadEngineers = useCallback(async () => {
//     try {
//       const r = await fetch(`${API_BASE_URL}/projects/engineers`, { headers });
//       const d = await r.json();
//       setEngineers(d.engineers || []);
//     } catch (e) {
//       console.error("Engineers error:", e);
//     }
//   }, []);

//   useEffect(() => { loadStats(); loadEngineers(); }, []);
//   useEffect(() => { loadProjects(); }, [loadProjects]);

//   /* ── Debounce search ── */
//   useEffect(() => {
//     setPage(1);
//   }, [search, statusFilter, priorityFilter]);

//   /* ── Save project (create/edit) ── */
//   const saveProject = async (form) => {
//     try {
//       const url = editData
//         ? `${API_BASE_URL}/projects/${editData._id}`
//         : `${API_BASE_URL}/projects`;
//       const method = editData ? "PUT" : "POST";

//       const r = await fetch(url, { method, headers, body: JSON.stringify(form) });
//       const d = await r.json();
//       if (!r.ok) throw new Error(d.message);

//       toast.success(editData ? "Project updated successfully" : "Project created successfully 🚀");
//       await loadProjects();
//       await loadStats();
//     } catch (e) {
//       toast.error(e.message || "Save failed");
//       throw e;
//     }
//   };

//   /* ── Delete project ── */
//   const deleteProject = async (id) => {
//     if (!confirm("Delete this project? This cannot be undone.")) return;
//     try {
//       const r = await fetch(`${API_BASE_URL}/projects/${id}`, { method: "DELETE", headers });
//       const d = await r.json();
//       if (!r.ok) throw new Error(d.message);
//       toast.success("Project deleted");
//       await loadProjects();
//       await loadStats();
//     } catch (e) {
//       toast.error(e.message);
//     }
//   };

//   /* ── Computed stats ── */
//   const statusMap = {};
//   (stats?.byStatus || []).forEach((s) => { statusMap[s._id] = s.count; });

//   const overviewStats = [
//     { label: "Total Projects", value: stats?.totalProjects ?? "—", icon: Layers, color: "text-indigo-400" },
//     { label: "In Progress", value: (statusMap["installation"] || 0) + (statusMap["site_survey"] || 0) + (statusMap["design"] || 0), icon: Activity, color: "text-blue-400" },
//     { label: "Completed", value: statusMap["completed"] || 0, icon: CheckCircle2, color: "text-green-400" },
//     { label: "Overdue", value: stats?.overdueProjects ?? "—", icon: AlertCircle, color: "text-red-400" },
//     { label: "Avg Progress", value: stats?.avgProgress !== undefined ? `${stats.avgProgress}%` : "—", icon: TrendingUp, color: "text-emerald-400" },
//   ];

//   /* ── Detail view ── */
//   if (view === "detail" && selectedId) {
//     return (
//       <ProjectDetail
//         projectId={selectedId}
//         goBack={() => { setView("list"); setSelectedId(null); }}
//         onEdit={() => {
//           const proj = projects.find((p) => p._id === selectedId);
//           if (proj) { setEditData(proj); setFormOpen(true); }
//         }}
//         hasEdit={hasEdit}
//         token={token}
//          apiBase="/projects"
//       />
//     );
//   }

//   return (
//     <div className="space-y-5">
//       {/* Form modal */}
//       <ProjectFormModal
//         open={formOpen}
//         onClose={() => { setFormOpen(false); setEditData(null); }}
//         onSave={saveProject}
//         editData={editData}
//         engineers={engineers}
//       />

//       {/* Page header */}
//       <div className="flex items-start justify-between">
//         <div>
//           <div className="flex items-center gap-2 mb-1">
//             <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
//               <Sun size={14} className="text-amber-400" />
//             </div>
//             <h2 className="text-xl font-black text-white">Solar Projects</h2>
//           </div>
//           <p className="text-[13px] text-slate-500">
//             {total} project{total !== 1 ? "s" : ""} · Savorka Solar Installation Management
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => { loadProjects(); loadStats(); }}
//             className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition"
//           >
//             <RefreshCw size={16} />
//           </button>
//           {hasCreate && (
//             <button
//               onClick={() => { setEditData(null); setFormOpen(true); }}
//               className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 transition"
//             >
//               <Plus size={15} /> New Project
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Stats row */}
//       <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
//         {overviewStats.map((s) => (
//           <StatCard key={s.label} {...s} loading={statsLoading} />
//         ))}
//       </div>

//       {/* Status breakdown bar */}
//       {stats && !statsLoading && stats.totalProjects > 0 && (
//         <div className="bg-[#141428] border border-white/5 rounded-xl p-4">
//           <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-3">Status Distribution</p>
//           <div className="flex gap-0.5 h-2 rounded-full overflow-hidden w-full mb-3">
//             {Object.entries(STATUS_META).map(([key, meta]) => {
//               const count = statusMap[key] || 0;
//               if (!count) return null;
//               const pct = (count / stats.totalProjects) * 100;
//               return (
//                 <div key={key} className={`${meta.dot} h-full transition-all`} style={{ width: `${pct}%` }} title={`${meta.label}: ${count}`} />
//               );
//             })}
//           </div>
//           <div className="flex flex-wrap gap-3">
//             {Object.entries(STATUS_META).map(([key, meta]) => {
//               const count = statusMap[key] || 0;
//               if (!count) return null;
//               return (
//                 <span key={key} className="flex items-center gap-1 text-[11px] text-slate-400">
//                   <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
//                   {meta.label}: {count}
//                 </span>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* Filters */}
//       <FilterBar
//         search={search} setSearch={setSearch}
//         status={statusFilter} setStatus={setStatusFilter}
//         priority={priorityFilter} setPriority={setPriorityFilter}
//         onClear={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); }}
//       />

//       {/* Grid */}
//       {loading ? (
//         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
//           {Array.from({ length: 6 }).map((_, i) => (
//             <div key={i} className="bg-[#141428] border border-white/5 rounded-2xl p-5 animate-pulse h-48" />
//           ))}
//         </div>
//       ) : projects.length === 0 ? (
//         <div className="bg-[#141428] border border-white/5 rounded-2xl p-12 text-center">
//           <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
//             <Sun size={24} className="text-amber-400" />
//           </div>
//           <h3 className="text-[15px] font-bold text-white mb-2">No Projects Found</h3>
//           <p className="text-slate-500 text-[13px] mb-4">
//             {search || statusFilter || priorityFilter
//               ? "Try adjusting your filters"
//               : "Create your first solar installation project"}
//           </p>
//           {hasCreate && !search && !statusFilter && !priorityFilter && (
//             <button
//               onClick={() => { setEditData(null); setFormOpen(true); }}
//               className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition shadow-lg shadow-indigo-500/20"
//             >
//               <Plus size={15} /> Create Project
//             </button>
//           )}
//         </div>
//       ) : (
//         <>
//           <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
//             <AnimatePresence>
//               {projects.map((project) => (
//                 <ProjectCard
//                   key={project._id}
//                   project={project}
//                   onClick={() => { setSelectedId(project._id); setView("detail"); }}
//                   onEdit={() => { setEditData(project); setFormOpen(true); }}
//                   onDelete={() => deleteProject(project._id)}
//                   hasEdit={hasEdit}
//                   hasDelete={hasDelete}
//                 />
//               ))}
//             </AnimatePresence>
//           </div>

//           {/* Pagination */}
//           {pages > 1 && (
//             <div className="flex items-center justify-center gap-2">
//               <button
//                 onClick={() => setPage((p) => Math.max(1, p - 1))}
//                 disabled={page === 1}
//                 className="px-3 py-1.5 rounded-lg text-[12px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/8 disabled:opacity-30 transition"
//               >
//                 ← Prev
//               </button>
//               {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
//                 <button
//                   key={p}
//                   onClick={() => setPage(p)}
//                   className={`w-8 h-8 rounded-lg text-[12px] font-semibold transition
//                     ${p === page ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/8"}`}
//                 >
//                   {p}
//                 </button>
//               ))}
//               <button
//                 onClick={() => setPage((p) => Math.min(pages, p + 1))}
//                 disabled={page === pages}
//                 className="px-3 py-1.5 rounded-lg text-[12px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/8 disabled:opacity-30 transition"
//               >
//                 Next →
//               </button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }