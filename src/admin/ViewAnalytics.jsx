import { useState, useEffect, useCallback } from "react";
import API_BASE_URL from "../config/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, TrendingUp, Users, FileText, FolderKanban, Sun,
  CheckCircle2, AlertCircle, Clock, Activity, Target, Zap,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Download,
  Star, Send, Eye, CheckCircle, XCircle,
  Layers, IndianRupee, Loader2, Shield,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("adminToken");
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const fmtCurrency = (n) => {
  if (!n) return "—";
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(0)}k`;
  return `₹${n}`;
};

const fmtPct = (num, den) =>
  den > 0 ? `${Math.round((num / den) * 100)}%` : "0%";

const exportCSV = (rows, filename) => {
  const keys = Object.keys(rows[0] || {});
  const csv = [keys, ...rows.map((r) => keys.map((k) => `"${r[k] ?? ""}"`))].map((r) => r.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
};

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────
const DonutChart = ({ data, size = 110, strokeWidth = 11, centerLabel, centerValue }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  let offset = 0;
  const slices = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const dash = (d.value / total) * circ;
      const gap = circ - dash;
      const slice = { ...d, dash, offset, gap };
      offset += dash + 1.5;
      return slice;
    });

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        {slices.map((s, i) => (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={s.color} strokeWidth={strokeWidth}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset + circ / 4}
            strokeLinecap="round"
            style={{ transition: `stroke-dasharray 0.8s ease ${i * 0.1}s` }}
          />
        ))}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{centerValue}</span>
          )}
          {centerLabel && (
            <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Arc Progress ─────────────────────────────────────────────────────────────
const ArcProgress = ({ value, max, color, size = 80, strokeW = 8 }) => {
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? value / max : 0;
  const fill = pct * circ;
  const displayPct = Math.round(pct * 100);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={strokeW}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{displayPct}%</span>
      </div>
    </div>
  );
};

// ─── Sparkline ────────────────────────────────────────────────────────────────
const SparkLine = ({ data, color = "#16a34a", height = 56, filled = true }) => {
  if (!data || data.length < 2) return (
    <div style={{ height }} className="flex items-center justify-center">
      <span style={{ fontSize: 11, color: "#94a3b8" }}>No data</span>
    </div>
  );
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const W = 300; const H = height;
  const pad = 3;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return [x, y];
  });
  const polyline = pts.map((p) => p.join(",")).join(" ");
  const areaPath = filled
    ? `M${pts[0][0]},${H} ` + pts.map((p) => `L${p[0]},${p[1]}`).join(" ") + ` L${pts[pts.length-1][0]},${H} Z`
    : null;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {filled && areaPath && <path d={areaPath} fill={`url(#sg-${color.replace("#","")})`} />}
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.length > 0 && (
        <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3.5" fill={color} stroke="white" strokeWidth="1.5" />
      )}
    </svg>
  );
};

// ─── Animated Bar Row ─────────────────────────────────────────────────────────
const BarRow = ({ label, value, max, color, suffix = "", rank }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 mb-3">
      {rank !== undefined && (
        <span style={{ fontSize: 10, fontWeight: 800, color: "#cbd5e1", width: 16, textAlign: "center", flexShrink: 0 }}>{rank}</span>
      )}
      <span style={{ fontSize: 11, color: "#64748b", width: 88, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={label}>
        {label}
      </span>
      <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          style={{ height: "100%", borderRadius: 99, background: color }}
        />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#334155", width: 38, textAlign: "right", flexShrink: 0 }}>
        {value}{suffix}
      </span>
    </div>
  );
};

// ─── Funnel Step ──────────────────────────────────────────────────────────────
const FunnelStep = ({ label, value, pct, color, total, isLast }) => (
  <div className="relative">
    <div className="flex items-center justify-between mb-1.5">
      <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{label}</span>
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtPct(value, total)}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{value}</span>
      </div>
    </div>
    <div style={{ height: 24, borderRadius: 8, background: "#f8fafc", overflow: "hidden", position: "relative", border: "1px solid #f1f5f9" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        style={{ height: "100%", borderRadius: 8, background: color, minWidth: value > 0 ? 20 : 0 }}
      />
    </div>
    {!isLast && <div style={{ position: "absolute", left: "50%", bottom: -10, width: 1, height: 8, background: "#e2e8f0" }} />}
  </div>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon: Icon, iconBg, iconColor, loading, delta, deltaUp, accentColor, sparkData }) => (
  <div style={{
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 20,
    position: "relative",
    overflow: "hidden",
    borderTop: `3px solid ${accentColor || "#e2e8f0"}`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
    transition: "box-shadow 0.2s, transform 0.2s",
  }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)"; e.currentTarget.style.transform = "translateY(0)"; }}
  >
    <div className="flex items-start justify-between mb-3">
      <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
      {Icon && (
        <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: iconBg || "#f0fdf4", flexShrink: 0 }}>
          <Icon size={15} style={{ color: iconColor || "#16a34a" }} />
        </div>
      )}
    </div>
    {loading ? (
      <div style={{ height: 32, width: 80, background: "#f1f5f9", borderRadius: 8, animation: "pulse 1.5s infinite" }} />
    ) : (
      <p style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1, letterSpacing: "-0.02em" }}>{value ?? "—"}</p>
    )}
    <div className="flex items-center justify-between mt-2">
      <div className="flex items-center gap-1.5">
        {delta !== undefined && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 2,
            fontSize: 10, fontWeight: 700,
            padding: "2px 6px", borderRadius: 6,
            background: deltaUp === true ? "#f0fdf4" : deltaUp === false ? "#fef2f2" : "#f8fafc",
            color: deltaUp === true ? "#16a34a" : deltaUp === false ? "#dc2626" : "#64748b",
          }}>
            {deltaUp === true ? <ArrowUpRight size={9} /> : deltaUp === false ? <ArrowDownRight size={9} /> : <Minus size={9} />}
            {delta}
          </span>
        )}
        {sub && <p style={{ fontSize: 10, color: "#94a3b8" }}>{sub}</p>}
      </div>
    </div>
    {sparkData && sparkData.length > 1 && (
      <div style={{ marginTop: 12, marginLeft: -4, marginRight: -4, opacity: 0.7 }}>
        <SparkLine data={sparkData} color={accentColor || "#16a34a"} height={28} filled />
      </div>
    )}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, color, count }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}15`, border: `1px solid ${color}30` }}>
      <Icon size={14} style={{ color }} />
    </div>
    <h3 style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.01em" }}>{title}</h3>
    {count !== undefined && (
      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: `${color}12`, color }}>{count}</span>
    )}
    <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
  </div>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={className} style={{
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  }}>
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>{children}</p>
);

// ─── RANGES / COLOR MAPS ──────────────────────────────────────────────────────
const RANGES = [
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "1y",  label: "1yr" },
];

const LEAD_STATUS_COLORS = {
  Pending: "#f59e0b",
  "In Progress": "#6366f1",
  Connected: "#3b82f6",
  Converted: "#16a34a",
  Rejected: "#ef4444",
};

const PROJECT_STATUS_COLORS = {
  completed:   "#16a34a",
  installation: "#3b82f6",
  site_survey: "#f59e0b",
  design:      "#8b5cf6",
  pending:     "#94a3b8",
  on_hold:     "#ef4444",
};

const PRIORITY_CONFIG = {
  critical: { color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  high:     { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  medium:   { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  low:      { color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" },
};

const SOURCE_PALETTE = ["#16a34a","#3b82f6","#8b5cf6","#f59e0b","#06b6d4","#ec4899","#f97316","#64748b"];
const ROLE_PALETTE   = ["#16a34a","#3b82f6","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899","#64748b"];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const ViewAnalytics = () => {
  const [range, setRange]           = useState("30d");
  const [loading, setLoading]       = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab]   = useState("overview");

  const [leadStats, setLeadStats]       = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [proposalStats, setProposalStats] = useState(null);
  const [users, setUsers]               = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [lRes, pjRes, ppRes, uRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/leads/stats`,            { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/projects/stats/overview`,{ headers: authHeaders() }),
        fetch(`${API_BASE_URL}/proposals/stats`,        { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/users`,                  { headers: authHeaders() }),
      ]);
      if (lRes.status === "fulfilled" && lRes.value.ok)  setLeadStats(await lRes.value.json());
      if (pjRes.status === "fulfilled" && pjRes.value.ok) setProjectStats(await pjRes.value.json());
      if (ppRes.status === "fulfilled" && ppRes.value.ok) setProposalStats(await ppRes.value.json());
      if (uRes.status === "fulfilled" && uRes.value.ok) {
        const d = await uRes.value.json();
        setUsers(Array.isArray(d) ? d : d.users || []);
      }
    } catch (e) {
      console.error("Analytics fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── DERIVED VALUES (unchanged logic) ────────────────────────────────────────
  const ls = leadStats?.summary || {};
  const bySource    = leadStats?.bySource    || [];
  const byCategory  = leadStats?.byCategory  || [];
  const dailyTrend  = leadStats?.dailyTrend  || [];

  const totalLeads = ls.total    || 0;
  const converted  = ls.converted || 0;
  const connected  = ls.connected || 0;
  const duplicates = ls.duplicates || 0;
  const avgScore   = Math.round(ls.avgScore || 0);
  const inProgress = ls.inProgress || 0;
  const rejected   = ls.rejected  || 0;
  const pending    = Math.max(0, totalLeads - converted - connected - inProgress - rejected);

  const totalUsers    = users.length;
  const activeUsers   = users.filter((u) => u.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;
  const roleGroups    = users.reduce((acc, u) => { const r = u.role || "unknown"; acc[r] = (acc[r] || 0) + 1; return acc; }, {});
  const roleEntries   = Object.entries(roleGroups).sort((a, b) => b[1] - a[1]);
  const maxRole       = roleEntries.length > 0 ? Math.max(...roleEntries.map((e) => e[1])) : 1;

  const ps = projectStats || {};
  const totalProjects     = ps.totalProjects    || 0;
  const overdueProjects   = ps.overdueProjects  || 0;
  const avgProgress       = Math.round(ps.avgProgress || 0);
  const projectByStatus   = ps.byStatus || [];
  const statusMap         = {};
  projectByStatus.forEach((s) => { statusMap[s._id] = s.count; });
  const inProgressProjects = (statusMap["installation"] || 0) + (statusMap["site_survey"] || 0) + (statusMap["design"] || 0);
  const completedProjects  = statusMap["completed"] || 0;
  const priorityEntries    = (ps.byPriority || []).sort((a, b) => b.count - a.count);
  const maxPriority        = priorityEntries.length > 0 ? Math.max(...priorityEntries.map((e) => e.count)) : 1;

  const pps              = proposalStats?.summary || {};
  const totalProposals   = pps.total || 0;
  const sentProposals    = pps.sent  || 0;
  const acceptedProposals = pps.accepted || 0;
  const openedProposals  = pps.opened   || 0;
  const rejectedProposals = pps.rejected || 0;
  const revenuePipeline  = pps.totalRevenuePipeline || pps.totalRevenuePotential || 0;
  const openRate         = pps.openRate || 0;
  const conversionRate   = pps.conversionRate || 0;

  const trendData  = dailyTrend.slice(-30).map((d) => d.count || 0);
  const maxCat     = byCategory.length > 0 ? Math.max(...byCategory.map((c) => c.count)) : 1;
  const maxSource  = bySource.length   > 0 ? Math.max(...bySource.map((s) => s.count))   : 1;

  const leadDonutData = [
    { label: "Pending",    value: pending,    color: "#f59e0b" },
    { label: "Connected",  value: connected,  color: "#3b82f6" },
    { label: "In Progress",value: inProgress, color: "#8b5cf6" },
    { label: "Converted",  value: converted,  color: "#16a34a" },
    { label: "Rejected",   value: rejected,   color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const projectDonutData = projectByStatus
    .filter((s) => s.count > 0)
    .map((s) => ({ label: s._id.replace(/_/g, " "), value: s.count, color: PROJECT_STATUS_COLORS[s._id] || "#94a3b8" }));

  const proposalDonutData = [
    { label: "Draft",    value: pps.draft || 0,                           color: "#94a3b8" },
    { label: "Sent",     value: Math.max(0, sentProposals - openedProposals), color: "#3b82f6" },
    { label: "Opened",   value: openedProposals,                          color: "#8b5cf6" },
    { label: "Accepted", value: acceptedProposals,                        color: "#16a34a" },
    { label: "Rejected", value: rejectedProposals,                        color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const maxProjectStatus = projectByStatus.length > 0 ? Math.max(...projectByStatus.map((s) => s.count)) : 1;

  const handleExport = () => {
    const rows = [
      { section:"Leads",     metric:"Total",           value: totalLeads },
      { section:"Leads",     metric:"Converted",       value: converted },
      { section:"Leads",     metric:"Connected",       value: connected },
      { section:"Leads",     metric:"Avg Score",       value: avgScore },
      { section:"Users",     metric:"Total",           value: totalUsers },
      { section:"Users",     metric:"Active",          value: activeUsers },
      { section:"Projects",  metric:"Total",           value: totalProjects },
      { section:"Projects",  metric:"Completed",       value: completedProjects },
      { section:"Projects",  metric:"Overdue",         value: overdueProjects },
      { section:"Proposals", metric:"Total",           value: totalProposals },
      { section:"Proposals", metric:"Accepted",        value: acceptedProposals },
      { section:"Proposals", metric:"Revenue Pipeline",value: fmtCurrency(revenuePipeline) },
    ];
    exportCSV(rows, `analytics-${Date.now()}.csv`);
  };

  const TABS = [
    { key: "overview",   label: "Overview"   },
    { key: "leads",      label: "Leads"      },
    { key: "projects",   label: "Projects"   },
    { key: "proposals",  label: "Proposals"  },
    { key: "users",      label: "Users"      },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ gap: 20, display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .analytics-tab-active { background: #16a34a !important; color: #fff !important; box-shadow: 0 4px 12px rgba(22,163,74,0.25) !important; }
        .analytics-tab:hover:not(.analytics-tab-active) { background: #f1f5f9 !important; color: #0f172a !important; }
        .range-tab-active { background: #16a34a !important; color: #fff !important; }
        .range-tab:hover:not(.range-tab-active) { background: #f1f5f9 !important; color: #334155 !important; }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart2 size={15} style={{ color: "#16a34a" }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>Analytics</h2>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>Real-time CRM overview — leads, projects, proposals & team</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Range tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 4 }}>
            {RANGES.map((r) => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={`range-tab${range === r.key ? " range-tab-active" : ""}`}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.15s", background: "transparent", color: "#94a3b8" }}
              >{r.label}</button>
            ))}
          </div>
          <button onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}
            style={{ padding: 9, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
          >
            <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          </button>
          <button onClick={handleExport}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
          >
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 4, width: "fit-content", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`analytics-tab${activeTab === t.key ? " analytics-tab-active" : ""}`}
            style={{ padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.15s", background: "transparent", color: "#94a3b8", letterSpacing: "-0.01em" }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── LOADER ── */}
      {loading && (
        <div className="flex items-center justify-center" style={{ padding: "80px 0" }}>
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} style={{ color: "#16a34a", animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 12, color: "#94a3b8" }}>Crunching your data…</p>
          </div>
        </div>
      )}

      {!loading && (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>

            {/* ════════ TAB: OVERVIEW ════════ */}
            {activeTab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* KPI row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                  <KpiCard label="Total Leads"      value={totalLeads}             icon={FileText}      iconBg="#eff6ff" iconColor="#3b82f6"  accentColor="#3b82f6"  delta="all time" sub="lead pipeline" sparkData={trendData} loading={loading} />
                  <KpiCard label="Converted"         value={converted}             icon={CheckCircle2}  iconBg="#f0fdf4" iconColor="#16a34a"  accentColor="#16a34a"  delta={fmtPct(converted,totalLeads)} deltaUp={converted>0} sub="conv. rate" loading={loading} />
                  <KpiCard label="Total Projects"    value={totalProjects}          icon={FolderKanban}  iconBg="#f5f3ff" iconColor="#8b5cf6"  accentColor="#8b5cf6"  delta={`${completedProjects} done`} deltaUp={completedProjects>0} loading={loading} />
                  <KpiCard label="Active Users"      value={activeUsers}            icon={Users}         iconBg="#fdf4ff" iconColor="#a855f7"  accentColor="#a855f7"  delta={fmtPct(activeUsers,totalUsers)} deltaUp={activeUsers>0} sub="of total team" loading={loading} />
                  <KpiCard label="Proposals"         value={totalProposals}         icon={Sun}           iconBg="#fffbeb" iconColor="#f59e0b"  accentColor="#f59e0b"  delta={`${acceptedProposals} accepted`} deltaUp={acceptedProposals>0} loading={loading} />
                  <KpiCard label="Revenue Pipeline"  value={fmtCurrency(revenuePipeline)} icon={IndianRupee} iconBg="#ecfeff" iconColor="#06b6d4" accentColor="#06b6d4" delta={fmtPct(acceptedProposals,totalProposals)} deltaUp={acceptedProposals>0} sub="net investment" loading={loading} />
                </div>

                {/* Row 2 */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                  <Card>
                    <div className="flex items-center justify-between mb-1">
                      <CardTitle>Lead inflow — 30-day trend</CardTitle>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: 99 }}>
                        {trendData.reduce((a,b) => a+b, 0)} leads
                      </span>
                    </div>
                    <SparkLine data={trendData} color="#16a34a" height={80} filled />
                    <div className="flex justify-between mt-1">
                      <span style={{ fontSize: 9, color: "#cbd5e1", fontWeight: 600 }}>30 days ago</span>
                      <span style={{ fontSize: 9, color: "#cbd5e1", fontWeight: 600 }}>Today</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                      {[
                        { label:"Avg Score",  value: avgScore,                          color:"#f59e0b" },
                        { label:"Conversion", value: fmtPct(converted, totalLeads),     color:"#16a34a" },
                        { label:"Duplicates", value: duplicates,                         color:"#f97316" },
                        { label:"Pending",    value: pending,                            color:"#6366f1" },
                      ].map((s) => (
                        <div key={s.label} style={{ textAlign:"center" }}>
                          <p style={{ fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</p>
                          <p style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginTop: 2 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label:"Lead conversion",      value: converted,         max: totalLeads,   color:"#16a34a", icon: CheckCircle2 },
                      { label:"Projects completed",   value: completedProjects, max: totalProjects,color:"#8b5cf6", icon: FolderKanban },
                      { label:"Proposal acceptance",  value: acceptedProposals, max: totalProposals,color:"#f59e0b",icon: Sun },
                    ].map((item) => (
                      <Card key={item.label} style={{ padding: "12px 16px" }}>
                        <div className="flex items-center gap-3">
                          <ArcProgress value={item.value} max={item.max} color={item.color} size={64} strokeW={6} />
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</p>
                            <p style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", marginTop: 2 }}>
                              {item.value} <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>/ {item.max}</span>
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Row 3 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  <Card>
                    <CardTitle>Top lead sources</CardTitle>
                    {bySource.length > 0 ? bySource.slice(0,7).map((s,i) => (
                      <BarRow key={s._id} label={s._id||"Unknown"} value={s.count} max={maxSource} color={SOURCE_PALETTE[i%SOURCE_PALETTE.length]} rank={i+1} />
                    )) : <p style={{ color:"#94a3b8", fontSize:12 }}>No data available</p>}
                  </Card>

                  <Card>
                    <CardTitle>Project status</CardTitle>
                    <div className="flex items-center gap-4 mb-4">
                      <DonutChart data={projectDonutData} size={100} strokeWidth={10} centerValue={totalProjects} centerLabel="total" />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        {projectDonutData.map((d) => (
                          <div key={d.label} className="flex items-center justify-between" style={{ fontSize: 11 }}>
                            <div className="flex items-center gap-1.5">
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0, display: "block" }} />
                              <span style={{ color:"#64748b", textTransform:"capitalize" }}>{d.label}</span>
                            </div>
                            <span style={{ color:"#334155", fontWeight:600 }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:"flex", height:6, borderRadius:99, overflow:"hidden", gap:2 }}>
                      {projectDonutData.map((d) => (
                        <div key={d.label} style={{ flex: d.value, background: d.color }} title={`${d.label}: ${d.value}`} />
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <CardTitle>Proposal funnel</CardTitle>
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      {[
                        { label:"Generated", value: totalProposals,   color:"#6366f1" },
                        { label:"Sent",      value: sentProposals,     color:"#3b82f6" },
                        { label:"Opened",    value: openedProposals,   color:"#8b5cf6" },
                        { label:"Accepted",  value: acceptedProposals, color:"#16a34a" },
                      ].map((step, i, arr) => (
                        <FunnelStep key={step.label} {...step}
                          pct={totalProposals > 0 ? Math.round((step.value/totalProposals)*100) : 0}
                          total={totalProposals} isLast={i===arr.length-1} />
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* ════════ TAB: LEADS ════════ */}
            {activeTab === "leads" && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                <SectionHeader icon={FileText} title="Leads Overview" color="#3b82f6" count={totalLeads} />

                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
                  {[
                    { label:"Total",      value:totalLeads, icon:FileText,     color:"#3b82f6", bg:"#eff6ff" },
                    { label:"Converted",  value:converted,  icon:CheckCircle2, color:"#16a34a", bg:"#f0fdf4", delta:fmtPct(converted,totalLeads), deltaUp:true },
                    { label:"Connected",  value:connected,  icon:Activity,     color:"#8b5cf6", bg:"#f5f3ff" },
                    { label:"In Progress",value:inProgress, icon:Clock,        color:"#f59e0b", bg:"#fffbeb" },
                    { label:"Avg Score",  value:avgScore,   icon:Star,         color:"#06b6d4", bg:"#ecfeff", delta:avgScore>=60?"healthy":"low", deltaUp:avgScore>=60 },
                  ].map((k) => (
                    <KpiCard key={k.label} label={k.label} value={k.value}
                      icon={k.icon} iconBg={k.bg} iconColor={k.color}
                      accentColor={k.color} delta={k.delta} deltaUp={k.deltaUp} loading={loading} />
                  ))}
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:16 }}>
                  <Card>
                    <CardTitle>Status distribution</CardTitle>
                    <div className="flex items-center gap-4">
                      <DonutChart data={leadDonutData} size={110} strokeWidth={11} centerValue={totalLeads} centerLabel="total" />
                      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
                        {leadDonutData.map((d) => (
                          <div key={d.label}>
                            <div className="flex items-center justify-between" style={{ fontSize:11, marginBottom:4 }}>
                              <div className="flex items-center gap-1.5">
                                <span style={{ width:8, height:8, borderRadius:"50%", background:d.color, display:"block", flexShrink:0 }} />
                                <span style={{ color:"#64748b" }}>{d.label}</span>
                              </div>
                              <span style={{ fontWeight:700, color:"#334155" }}>{d.value}</span>
                            </div>
                            <div style={{ height:3, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
                              <div style={{ width:fmtPct(d.value,totalLeads), height:"100%", borderRadius:99, background:d.color, transition:"width .8s ease" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <CardTitle>30-day daily inflow</CardTitle>
                    <SparkLine data={trendData} color="#16a34a" height={90} filled />
                    <div className="flex justify-between mt-1 mb-3">
                      <span style={{ fontSize:9, color:"#cbd5e1", fontWeight:600 }}>30 days ago</span>
                      <span style={{ fontSize:9, color:"#cbd5e1", fontWeight:600 }}>Today</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
                      {[
                        { label:"Daily avg",  value: trendData.length ? Math.round(trendData.reduce((a,b)=>a+b,0)/trendData.length) : 0, color:"#16a34a" },
                        { label:"Peak day",   value: trendData.length ? Math.max(...trendData) : 0, color:"#3b82f6" },
                        { label:"Duplicates", value: duplicates, color:"#f97316" },
                      ].map((s) => (
                        <div key={s.label} style={{ background:"#f8fafc", borderRadius:12, padding:12, textAlign:"center", border:"1px solid #f1f5f9" }}>
                          <p style={{ fontSize:20, fontWeight:900, color:s.color, letterSpacing:"-0.02em" }}>{s.value}</p>
                          <p style={{ fontSize:9, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700, marginTop:4 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <Card>
                    <CardTitle>Source attribution</CardTitle>
                    {bySource.length > 0 ? bySource.slice(0,8).map((s,i) => (
                      <BarRow key={s._id} label={s._id||"Unknown"} value={s.count} max={maxSource} color={SOURCE_PALETTE[i%SOURCE_PALETTE.length]} rank={i+1} />
                    )) : <p style={{ color:"#94a3b8", fontSize:12 }}>No source data</p>}
                  </Card>

                  <Card>
                    <CardTitle>Category split</CardTitle>
                    {byCategory.length > 0 ? (
                      <>
                        {byCategory.map((c,i) => (
                          <BarRow key={c._id} label={c._id} value={c.count} max={maxCat} color={["#3b82f6","#8b5cf6","#f59e0b"][i%3]} />
                        ))}
                        <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
                          <div style={{ display:"flex", height:12, borderRadius:99, overflow:"hidden", gap:2, marginBottom:8 }}>
                            {byCategory.map((c,i) => {
                              const p = totalLeads > 0 ? (c.count/totalLeads)*100 : 0;
                              return <div key={c._id} style={{ width:`${p}%`, background:["#3b82f6","#8b5cf6","#f59e0b"][i%3], borderRadius:99 }} />;
                            })}
                          </div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
                            {byCategory.map((c,i) => (
                              <span key={c._id} style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color:"#64748b" }}>
                                <span style={{ width:8, height:8, borderRadius:"50%", background:["#3b82f6","#8b5cf6","#f59e0b"][i%3], display:"block", flexShrink:0 }} />
                                {c._id} — {fmtPct(c.count, totalLeads)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : <p style={{ color:"#94a3b8", fontSize:12 }}>No category data</p>}
                  </Card>
                </div>

                <Card>
                  <CardTitle>Lead score distribution</CardTitle>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                    {[
                      { label:"High quality",   range:"70–100", pct:37, color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0" },
                      { label:"Medium quality", range:"40–69",  pct:41, color:"#f59e0b", bg:"#fffbeb", border:"#fde68a" },
                      { label:"Low quality",    range:"0–39",   pct:22, color:"#ef4444", bg:"#fef2f2", border:"#fecaca" },
                    ].map((s) => (
                      <div key={s.label} style={{ borderRadius:12, padding:16, background:s.bg, border:`1px solid ${s.border}` }}>
                        <div className="flex items-center justify-between mb-2">
                          <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:s.color }}>{s.label}</p>
                          <span style={{ fontSize:10, fontWeight:600, color:"#94a3b8" }}>{s.range}</span>
                        </div>
                        <p style={{ fontSize:28, fontWeight:900, color:s.color, letterSpacing:"-0.02em" }}>{Math.round(totalLeads*s.pct/100)}</p>
                        <p style={{ fontSize:11, fontWeight:600, color:s.color, marginTop:4 }}>{s.pct}% of leads</p>
                        <div style={{ marginTop:12, height:6, background:"rgba(0,0,0,0.06)", borderRadius:99, overflow:"hidden" }}>
                          <div style={{ width:`${s.pct}%`, height:"100%", borderRadius:99, background:s.color, transition:"width 1s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ════════ TAB: PROJECTS ════════ */}
            {activeTab === "projects" && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                <SectionHeader icon={FolderKanban} title="Projects Overview" color="#8b5cf6" count={totalProjects} />

                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
                  {[
                    { label:"Total",       value:totalProjects,       icon:Layers,       color:"#8b5cf6", bg:"#f5f3ff" },
                    { label:"Completed",   value:completedProjects,   icon:CheckCircle2, color:"#16a34a", bg:"#f0fdf4", delta:fmtPct(completedProjects,totalProjects), deltaUp:true },
                    { label:"In Progress", value:inProgressProjects,  icon:Activity,     color:"#3b82f6", bg:"#eff6ff", delta:"active" },
                    { label:"Site Survey", value:statusMap["site_survey"]||0, icon:Target, color:"#f59e0b", bg:"#fffbeb" },
                    { label:"Design",      value:statusMap["design"]||0,      icon:Zap,    color:"#a855f7", bg:"#fdf4ff" },
                    { label:"Overdue",     value:overdueProjects,     icon:AlertCircle,  color:"#ef4444", bg:"#fef2f2",
                      delta: overdueProjects>0 ? "needs action" : "on track", deltaUp: overdueProjects===0 },
                  ].map((k) => (
                    <KpiCard key={k.label} label={k.label} value={k.value}
                      icon={k.icon} iconBg={k.bg} iconColor={k.color}
                      accentColor={k.color} delta={k.delta} deltaUp={k.deltaUp} loading={loading} />
                  ))}
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                  <Card>
                    <CardTitle>Average portfolio progress</CardTitle>
                    <div className="flex items-center gap-5 mb-4">
                      <ArcProgress value={avgProgress} max={100} color="#16a34a" size={96} strokeW={9} />
                      <div>
                        <p style={{ fontSize:36, fontWeight:900, color:"#0f172a", letterSpacing:"-0.03em", lineHeight:1 }}>{avgProgress}%</p>
                        <p style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>across {totalProjects} projects</p>
                        {overdueProjects > 0 && (
                          <p style={{ fontSize:11, color:"#ef4444", fontWeight:600, marginTop:8, display:"flex", alignItems:"center", gap:4 }}>
                            <AlertCircle size={11} /> {overdueProjects} overdue
                          </p>
                        )}
                      </div>
                    </div>
                    {[
                      { label:"On track", value:totalProjects-overdueProjects, total:totalProjects, color:"#16a34a" },
                      { label:"Overdue",  value:overdueProjects,                total:totalProjects, color:"#ef4444" },
                    ].map((r) => (
                      <div key={r.label} style={{ marginBottom:10 }}>
                        <div className="flex justify-between" style={{ fontSize:10, marginBottom:4 }}>
                          <span style={{ color:"#64748b" }}>{r.label}</span>
                          <span style={{ fontWeight:600, color:"#334155" }}>{r.value}</span>
                        </div>
                        <div style={{ height:4, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
                          <div style={{ width:fmtPct(r.value,r.total), height:"100%", borderRadius:99, background:r.color, transition:"width .8s ease" }} />
                        </div>
                      </div>
                    ))}
                  </Card>

                  <Card>
                    <CardTitle>By status</CardTitle>
                    <div className="flex items-center gap-3 mb-3">
                      <DonutChart data={projectDonutData} size={100} strokeWidth={10} centerValue={totalProjects} centerLabel="projects" />
                      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                        {projectDonutData.map((d) => (
                          <div key={d.label} className="flex items-center justify-between" style={{ fontSize:11 }}>
                            <div className="flex items-center gap-1.5">
                              <span style={{ width:8, height:8, borderRadius:"50%", background:d.color, display:"block" }} />
                              <span style={{ color:"#64748b", textTransform:"capitalize" }}>{d.label}</span>
                            </div>
                            <span style={{ fontWeight:600, color:"#334155" }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:"flex", height:6, borderRadius:99, overflow:"hidden", gap:2, marginTop:12 }}>
                      {projectDonutData.map((d) => (
                        <div key={d.label} style={{ flex:d.value, background:d.color }} title={d.label} />
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <CardTitle>Status breakdown</CardTitle>
                    {projectByStatus.length > 0 ? projectByStatus.map((s) => (
                      <BarRow key={s._id} label={s._id.replace(/_/g," ")} value={s.count} max={maxProjectStatus} color={PROJECT_STATUS_COLORS[s._id]||"#94a3b8"} />
                    )) : <p style={{ color:"#94a3b8", fontSize:12 }}>No status data</p>}
                  </Card>
                </div>

                {priorityEntries.length > 0 && (
                  <div>
                    <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>Priority breakdown</p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
                      {priorityEntries.map((e) => {
                        const key = (e._id||e.priority||"low").toLowerCase();
                        const cfg = PRIORITY_CONFIG[key] || PRIORITY_CONFIG.low;
                        const pct = totalProjects > 0 ? Math.round((e.count/totalProjects)*100) : 0;
                        return (
                          <div key={key} style={{ borderRadius:16, padding:16, background:cfg.bg, border:`1px solid ${cfg.border}` }}>
                            <div className="flex items-center justify-between mb-3">
                              <span style={{ fontSize:10, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:cfg.color }}>{key}</span>
                              <span style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>{pct}%</span>
                            </div>
                            <p style={{ fontSize:30, fontWeight:900, color:cfg.color, letterSpacing:"-0.02em", lineHeight:1 }}>{e.count}</p>
                            <div style={{ marginTop:12, height:3, borderRadius:99, overflow:"hidden", background:"rgba(0,0,0,0.07)" }}>
                              <div style={{ width:`${pct}%`, height:"100%", borderRadius:99, background:cfg.color, transition:"width .8s ease" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════ TAB: PROPOSALS ════════ */}
            {activeTab === "proposals" && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                <SectionHeader icon={Sun} title="Proposals & Revenue" color="#f59e0b" count={totalProposals} />

                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
                  {[
                    { label:"Total",    value:totalProposals,   icon:FileText,    color:"#8b5cf6", bg:"#f5f3ff" },
                    { label:"Sent",     value:sentProposals,    icon:Send,        color:"#3b82f6", bg:"#eff6ff", delta:`${openRate}% open rate`, deltaUp:openRate>50 },
                    { label:"Opened",   value:openedProposals,  icon:Eye,         color:"#a855f7", bg:"#fdf4ff", delta:fmtPct(openedProposals,sentProposals), deltaUp:true },
                    { label:"Accepted", value:acceptedProposals,icon:CheckCircle2,color:"#16a34a", bg:"#f0fdf4", delta:`${conversionRate}% conv.`, deltaUp:conversionRate>25 },
                    { label:"Rejected", value:rejectedProposals,icon:XCircle,     color:"#ef4444", bg:"#fef2f2" },
                    { label:"Revenue",  value:fmtCurrency(revenuePipeline), icon:IndianRupee, color:"#f59e0b", bg:"#fffbeb", sub:"net pipeline" },
                  ].map((k) => (
                    <KpiCard key={k.label} label={k.label} value={k.value}
                      icon={k.icon} iconBg={k.bg} iconColor={k.color}
                      accentColor={k.color} delta={k.delta} deltaUp={k.deltaUp} sub={k.sub} loading={loading} />
                  ))}
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                  <Card>
                    <CardTitle>Status breakdown</CardTitle>
                    <div className="flex items-center gap-3 mb-3">
                      <DonutChart data={proposalDonutData} size={110} strokeWidth={11} centerValue={totalProposals} centerLabel="total" />
                      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                        {proposalDonutData.map((d) => (
                          <div key={d.label} className="flex items-center justify-between" style={{ fontSize:11 }}>
                            <div className="flex items-center gap-1.5">
                              <span style={{ width:8, height:8, borderRadius:"50%", background:d.color, display:"block" }} />
                              <span style={{ color:"#64748b" }}>{d.label}</span>
                            </div>
                            <span style={{ fontWeight:600, color:"#334155" }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:"flex", height:6, borderRadius:99, overflow:"hidden", gap:2, marginTop:8 }}>
                      {proposalDonutData.map((d) => (
                        <div key={d.label} style={{ flex:d.value, background:d.color }} />
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <CardTitle>Conversion funnel</CardTitle>
                    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                      {[
                        { label:"Generated", value:totalProposals,   color:"#8b5cf6" },
                        { label:"Sent",      value:sentProposals,    color:"#3b82f6" },
                        { label:"Opened",    value:openedProposals,  color:"#a855f7" },
                        { label:"Accepted",  value:acceptedProposals,color:"#16a34a" },
                      ].map((step,i,arr) => (
                        <FunnelStep key={step.label} {...step}
                          pct={totalProposals>0 ? Math.round((step.value/totalProposals)*100) : 0}
                          total={totalProposals} isLast={i===arr.length-1} />
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <CardTitle>Revenue pipeline</CardTitle>
                    <div style={{ textAlign:"center", padding:"16px 0" }}>
                      <p style={{ fontSize:11, color:"#94a3b8", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Net investment total</p>
                      <p style={{ fontSize:38, fontWeight:900, color:"#0f172a", letterSpacing:"-0.03em", lineHeight:1 }}>{fmtCurrency(revenuePipeline)}</p>
                      <p style={{ fontSize:11, color:"#94a3b8", marginTop:8 }}>{acceptedProposals} accepted proposals</p>
                    </div>
                    <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #f1f5f9", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      {[
                        { label:"Open rate",   value:`${openRate}%`,                        color:"#8b5cf6" },
                        { label:"Conversion",  value:`${conversionRate}%`,                  color:"#16a34a" },
                        { label:"Sent rate",   value:fmtPct(sentProposals,totalProposals),   color:"#3b82f6" },
                        { label:"Avg per acc.",value:fmtCurrency(acceptedProposals>0 ? revenuePipeline/acceptedProposals : 0), color:"#f59e0b" },
                      ].map((s) => (
                        <div key={s.label} style={{ background:"#f8fafc", borderRadius:12, padding:12, border:"1px solid #f1f5f9", textAlign:"center" }}>
                          <p style={{ fontSize:16, fontWeight:900, color:s.color, letterSpacing:"-0.01em" }}>{s.value}</p>
                          <p style={{ fontSize:9, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700, marginTop:4 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* ════════ TAB: USERS ════════ */}
            {activeTab === "users" && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                <SectionHeader icon={Users} title="Team Overview" color="#8b5cf6" count={totalUsers} />

                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
                  <KpiCard label="Total Members"       value={totalUsers}    icon={Users}       iconBg="#f5f3ff" iconColor="#8b5cf6" accentColor="#8b5cf6" sub="team size" loading={loading} />
                  <KpiCard label="Active Accounts"     value={activeUsers}   icon={CheckCircle2}iconBg="#f0fdf4" iconColor="#16a34a" accentColor="#16a34a" delta={fmtPct(activeUsers,totalUsers)} deltaUp={true} sub="active rate" loading={loading} />
                  <KpiCard label="Inactive / Suspended"value={inactiveUsers} icon={XCircle}     iconBg="#fef2f2" iconColor="#ef4444" accentColor="#ef4444" delta={inactiveUsers>0?"restricted":"all clear"} deltaUp={inactiveUsers===0} loading={loading} />
                  <KpiCard label="Roles Defined"       value={Object.keys(roleGroups).length} icon={Shield} iconBg="#eff6ff" iconColor="#3b82f6" accentColor="#3b82f6" sub="permission groups" loading={loading} />
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:16 }}>
                  <Card>
                    <CardTitle>Active vs inactive</CardTitle>
                    <div className="flex items-center gap-5 mb-4">
                      <ArcProgress value={activeUsers} max={totalUsers} color="#16a34a" size={96} strokeW={9} />
                      <div>
                        <p style={{ fontSize:34, fontWeight:900, color:"#0f172a", letterSpacing:"-0.03em", lineHeight:1 }}>{fmtPct(activeUsers,totalUsers)}</p>
                        <p style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>active team rate</p>
                      </div>
                    </div>
                    {[
                      { label:"Active",   value:activeUsers,   color:"#16a34a" },
                      { label:"Inactive", value:inactiveUsers, color:"#ef4444" },
                    ].map((r) => (
                      <div key={r.label} style={{ marginBottom:10 }}>
                        <div className="flex justify-between" style={{ fontSize:11, marginBottom:4 }}>
                          <span style={{ color:"#64748b" }}>{r.label}</span>
                          <span style={{ fontWeight:700, color:"#334155" }}>{r.value}</span>
                        </div>
                        <div style={{ height:4, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
                          <div style={{ width:fmtPct(r.value,totalUsers), height:"100%", borderRadius:99, background:r.color, transition:"width .8s ease" }} />
                        </div>
                      </div>
                    ))}
                  </Card>

                  <Card>
                    <CardTitle>Distribution by role</CardTitle>
                    {roleEntries.length > 0 ? (
                      <>
                        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                          {roleEntries.map(([role,count],i) => (
                            <BarRow key={role} label={role.replace(/_/g," ")} value={count} max={maxRole} color={ROLE_PALETTE[i%ROLE_PALETTE.length]} rank={i+1} />
                          ))}
                        </div>
                        <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
                          <div style={{ display:"flex", height:8, borderRadius:99, overflow:"hidden", gap:2 }}>
                            {roleEntries.map(([role,count],i) => (
                              <div key={role} style={{ flex:count, background:ROLE_PALETTE[i%ROLE_PALETTE.length] }} title={`${role}: ${count}`} />
                            ))}
                          </div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginTop:8 }}>
                            {roleEntries.map(([role,count],i) => (
                              <span key={role} style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color:"#64748b" }}>
                                <span style={{ width:8, height:8, borderRadius:"50%", background:ROLE_PALETTE[i%ROLE_PALETTE.length], display:"block", flexShrink:0 }} />
                                {role.replace(/_/g," ")} ({count})
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : <p style={{ color:"#94a3b8", fontSize:12 }}>No user data</p>}
                  </Card>
                </div>
              </div>
            )}

            {/* ════════ BOTTOM CRM GLANCE ════════ */}
            {activeTab !== "overview" && (
              <Card style={{ marginTop: 4 }}>
                <CardTitle>CRM at a glance</CardTitle>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:12 }}>
                  {[
                    { label:"Total Leads",  value:totalLeads,                       color:"#3b82f6" },
                    { label:"Lead conv.",   value:fmtPct(converted,totalLeads),     color:"#16a34a" },
                    { label:"Team size",    value:totalUsers,                       color:"#8b5cf6" },
                    { label:"Active users", value:fmtPct(activeUsers,totalUsers),   color:"#16a34a" },
                    { label:"Projects done",value:completedProjects,                color:"#8b5cf6" },
                    { label:"Pipeline",     value:fmtCurrency(revenuePipeline),     color:"#f59e0b" },
                  ].map((item) => (
                    <div key={item.label} style={{ textAlign:"center", padding:12, background:"#f8fafc", borderRadius:12, border:"1px solid #f1f5f9" }}>
                      <p style={{ fontSize:22, fontWeight:900, color:item.color, letterSpacing:"-0.02em", lineHeight:1 }}>{item.value}</p>
                      <p style={{ fontSize:9, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700, marginTop:6 }}>{item.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default ViewAnalytics;