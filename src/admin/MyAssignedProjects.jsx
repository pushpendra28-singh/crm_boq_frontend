import { useState, useEffect, useCallback, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import API_BASE_URL from "../config/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FolderKanban, Search, RefreshCw, X, ChevronDown,
  CheckCircle2, AlertCircle, Activity, TrendingUp,
  Layers, User, Sun,
} from "lucide-react";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 *  MY ASSIGNED PROJECTS
 *  ───────────────────────────────────────────────────────────────────────────
 *  Completely separate from ViewProjects.
 *  Uses its own API endpoint:  /api/my-projects
 *  Uses its own permissions:
 *    view_assigned_projects   → access this module
 *    edit_assigned_projects   → show edit button inside cards / detail
 *    delete_assigned_projects → show delete button inside cards / detail
 *
 *  These are DIFFERENT from view_projects / edit_projects / delete_projects
 *  so the two modules are fully permission-isolated.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  StatusBadge,
  PriorityBadge,
  ProgressBar,
  STATUS_META,
  PRIORITY_META,
  ProjectCard,
} from "./projects/ProjectHelpers";

import ProjectDetail from "./projects/ProjectDetail";

/* ─── STATUS_META keys for filter dropdown ─── */
const VALID_STATUSES   = Object.keys(STATUS_META);
const VALID_PRIORITIES = Object.keys(PRIORITY_META);

/* ═══════════════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════════════ */
const StatCard = ({ label, value, icon: Icon, color, loading }) => (
  <div className="bg-[#141428] border border-white/5 rounded-xl p-4 flex items-center gap-3">
    <div
      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color
        .replace("text-", "bg-")
        .replace("-400", "-500/15")}`}
    >
      <Icon size={16} className={color} />
    </div>
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      {loading ? (
        <div className="h-5 w-10 bg-white/10 animate-pulse rounded mt-0.5" />
      ) : (
        <p className="text-[18px] font-black text-white">{value}</p>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   FILTER BAR
═══════════════════════════════════════════════════════════ */
const FilterBar = ({
  search, setSearch,
  status, setStatus,
  priority, setPriority,
  onClear,
}) => {
  const hasFilters = search || status || priority;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects, customers…"
          className="w-full bg-[#141428] border border-white/8 rounded-xl pl-9 pr-3 py-2 text-[13px] text-white
            placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1
            focus:ring-indigo-500/20 transition"
        />
      </div>

      {/* Status */}
      <div className="relative">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-[#141428] border border-white/8 rounded-xl px-3 py-2 text-[13px] text-slate-300
            appearance-none focus:outline-none focus:border-indigo-500/60 transition pr-7"
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
      </div>

      {/* Priority */}
      <div className="relative">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="bg-[#141428] border border-white/8 rounded-xl px-3 py-2 text-[13px] text-slate-300
            appearance-none focus:outline-none focus:border-indigo-500/60 transition pr-7"
        >
          <option value="">All Priority</option>
          {Object.entries(PRIORITY_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
      </div>

      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-[12px] text-slate-400
            hover:text-white bg-white/5 hover:bg-white/8 transition"
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
export default function MyAssignedProjects() {
  const { hasPermission } = useContext(AuthContext);
  const token   = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  /* ── View ── */
  const [view, setView]             = useState("list"); // "list" | "detail"
  const [selectedId, setSelectedId] = useState(null);

  /* ── Data ── */
  const [projects, setProjects]         = useState([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [stats, setStats]               = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage]                 = useState(1);
  const [pages, setPages]               = useState(1);

  /* ── Filters ── */
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  /*
   * Permission flags — use the ASSIGNED PROJECT permissions, not the
   * generic project permissions.  This is the key change: previously
   * hasEdit came from "edit_projects"; now it comes from
   * "edit_assigned_projects" so the two modules are fully isolated.
   */
  const hasEdit   = hasPermission("edit_assigned_projects");
  const hasDelete = hasPermission("delete_assigned_projects");

  /* ── Fetch assigned projects from the SEPARATE endpoint ── */
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search)         params.set("search",   search);
      if (statusFilter)   params.set("status",   statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);

      const r = await fetch(`${API_BASE_URL}/my-projects?${params}`, { headers });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);

      setProjects(d.projects);
      setTotal(d.total);
      setPages(d.pages);
    } catch (e) {
      toast.error(e.message || "Failed to load assigned projects");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, page]);

  /* ── Fetch stats from the SEPARATE endpoint ── */
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/my-projects/stats`, { headers });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setStats(d);
    } catch (e) {
      console.error("Assigned stats error:", e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /* ── Reset page when filters change ── */
  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter]);

  /* ── Initial load ── */
  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadProjects(); }, [loadProjects]);

  /* ── Computed stats ── */
  const statusMap = {};
  (stats?.byStatus || []).forEach((s) => { statusMap[s._id] = s.count; });

  const overviewStats = [
    {
      label: "Assigned to Me",
      value: stats?.totalProjects ?? "—",
      icon:  Layers,
      color: "text-indigo-400",
    },
    {
      label: "In Progress",
      value: (statusMap["installation"] || 0) +
             (statusMap["site_survey"]  || 0) +
             (statusMap["design"]       || 0),
      icon:  Activity,
      color: "text-blue-400",
    },
    {
      label: "Completed",
      value: statusMap["completed"] || 0,
      icon:  CheckCircle2,
      color: "text-green-400",
    },
    {
      label: "Overdue",
      value: stats?.overdueProjects ?? "—",
      icon:  AlertCircle,
      color: "text-red-400",
    },
    {
      label: "Avg Progress",
      value: stats?.avgProgress !== undefined ? `${stats.avgProgress}%` : "—",
      icon:  TrendingUp,
      color: "text-emerald-400",
    },
  ];

  /* ── Detail view ── */
  if (view === "detail" && selectedId) {
    return (
      <ProjectDetail
        projectId={selectedId}
        goBack={() => { setView("list"); setSelectedId(null); }}
        onEdit={() => {}}
        hasEdit={hasEdit}
        token={token}
        apiBase="/my-projects"
      />
    );
  }

  /* ────────────────────────────────────────────────────────
     LIST VIEW
  ──────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <FolderKanban size={14} className="text-indigo-400" />
            </div>
            <h2 className="text-xl font-black text-white">My Assigned Projects</h2>
          </div>
          <p className="text-[13px] text-slate-500">
            {total} project{total !== 1 ? "s" : ""} assigned to you
          </p>
        </div>

        {/* Refresh */}
        <button
          onClick={() => { loadProjects(); loadStats(); }}
          className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {overviewStats.map((s) => (
          <StatCard key={s.label} {...s} loading={statsLoading} />
        ))}
      </div>

      {/* ── Status distribution bar ── */}
      {stats && !statsLoading && stats.totalProjects > 0 && (
        <div className="bg-[#141428] border border-white/5 rounded-xl p-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-3">
            Status Distribution
          </p>
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden w-full mb-3">
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const count = statusMap[key] || 0;
              if (!count) return null;
              const pct = (count / stats.totalProjects) * 100;
              return (
                <div
                  key={key}
                  className={`${meta.dot} h-full transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${meta.label}: ${count}`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const count = statusMap[key] || 0;
              if (!count) return null;
              return (
                <span key={key} className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  {meta.label}: {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <FilterBar
        search={search}           setSearch={setSearch}
        status={statusFilter}     setStatus={setStatusFilter}
        priority={priorityFilter} setPriority={setPriorityFilter}
        onClear={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); }}
      />

      {/* ── Grid ── */}
      {loading ? (
        /* Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#141428] border border-white/5 rounded-2xl p-5 animate-pulse h-48"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* Empty state */
        <div className="bg-[#141428] border border-white/5 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={24} className="text-indigo-400" />
          </div>
          <h3 className="text-[15px] font-bold text-white mb-2">No Assigned Projects Found</h3>
          <p className="text-slate-500 text-[13px]">
            {search || statusFilter || priorityFilter
              ? "Try adjusting your filters"
              : "You have no projects assigned to you yet"}
          </p>
        </div>
      ) : (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onClick={() => { setSelectedId(project._id); setView("detail"); }}
                  onEdit={() => { setSelectedId(project._id); setView("detail"); }}
                  onDelete={() => {}}
                  /*
                   * hasEdit / hasDelete now come from edit_assigned_projects /
                   * delete_assigned_projects — completely separate from the
                   * edit_projects / delete_projects used in ViewProjects.
                   */
                  hasEdit={hasEdit}
                  hasDelete={hasDelete}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-[12px] text-slate-400 hover:text-white
                  bg-white/5 hover:bg-white/8 disabled:opacity-30 transition"
              >
                ← Prev
              </button>

              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-semibold transition
                    ${p === page
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/8"
                    }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 rounded-lg text-[12px] text-slate-400 hover:text-white
                  bg-white/5 hover:bg-white/8 disabled:opacity-30 transition"
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