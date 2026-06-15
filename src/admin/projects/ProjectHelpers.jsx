import { useState, useEffect, useCallback, useContext } from "react";
import { AuthContext } from "../../auth/AuthContext";
import API_BASE_URL from "../../config/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Sun, Zap, MapPin, User, Users, Calendar, Clock, ChevronRight,
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, Eye,
  CheckCircle2, Circle, AlertCircle, XCircle, PauseCircle,
  TrendingUp, BarChart2, FileText, Camera, Bell, Award,
  Upload, Download, ArrowLeft, X, ChevronDown, RefreshCw,
  Phone, Mail, Home, Building2, Cpu, Battery, Wind,
  SlidersHorizontal, ClipboardList, Activity, Shield,
  MessageSquare, Link2, AlertTriangle, Layers,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   CONSTANTS
──────────────────────────────────────────────────────────── */
const STATUS_META = {
  enquiry:        { label: "Enquiry",        color: "text-slate-400",   bg: "bg-slate-500/15",  dot: "bg-slate-400",   icon: Circle },
  site_survey:    { label: "Site Survey",    color: "text-blue-400",    bg: "bg-blue-500/15",   dot: "bg-blue-400",    icon: MapPin },
  design:         { label: "Design",         color: "text-violet-400",  bg: "bg-violet-500/15", dot: "bg-violet-400",  icon: Layers },
  permit_pending: { label: "Permit Pending", color: "text-amber-400",   bg: "bg-amber-500/15",  dot: "bg-amber-400",   icon: Clock },
  procurement:    { label: "Procurement",    color: "text-orange-400",  bg: "bg-orange-500/15", dot: "bg-orange-400",  icon: Building2 },
  installation:   { label: "Installation",   color: "text-cyan-400",    bg: "bg-cyan-500/15",   dot: "bg-cyan-400",    icon: Cpu },
  inspection:     { label: "Inspection",     color: "text-indigo-400",  bg: "bg-indigo-500/15", dot: "bg-indigo-400",  icon: Shield },
  grid_connection:{ label: "Grid Connect",   color: "text-emerald-400", bg: "bg-emerald-500/15",dot: "bg-emerald-400", icon: Zap },
  completed:      { label: "Completed",      color: "text-green-400",   bg: "bg-green-500/15",  dot: "bg-green-400",   icon: CheckCircle2 },
  on_hold:        { label: "On Hold",        color: "text-yellow-400",  bg: "bg-yellow-500/15", dot: "bg-yellow-400",  icon: PauseCircle },
  cancelled:      { label: "Cancelled",      color: "text-red-400",     bg: "bg-red-500/15",    dot: "bg-red-400",     icon: XCircle },
};

const PRIORITY_META = {
  low:      { label: "Low",      color: "text-slate-400",   bg: "bg-slate-500/10"  },
  medium:   { label: "Medium",   color: "text-blue-400",    bg: "bg-blue-500/10"   },
  high:     { label: "High",     color: "text-orange-400",  bg: "bg-orange-500/10" },
  critical: { label: "Critical", color: "text-red-400",     bg: "bg-red-500/10"    },
};

const MILESTONE_STATUS_META = {
  pending:     { label: "Pending",     color: "text-slate-400",   bg: "bg-slate-500/15",  dot: "bg-slate-400"   },
  in_progress: { label: "In Progress", color: "text-blue-400",    bg: "bg-blue-500/15",   dot: "bg-blue-400"    },
  completed:   { label: "Done",        color: "text-green-400",   bg: "bg-green-500/15",  dot: "bg-green-400"   },
  delayed:     { label: "Delayed",     color: "text-red-400",     bg: "bg-red-500/15",    dot: "bg-red-400"     },
};

const CHECKIN_STATUS_META = {
  on_track:          { label: "On Track",          color: "text-green-400",   icon: CheckCircle2 },
  delayed:           { label: "Delayed",           color: "text-red-400",     icon: AlertCircle  },
  issue_found:       { label: "Issue Found",       color: "text-orange-400",  icon: AlertTriangle},
  milestone_reached: { label: "Milestone Reached", color: "text-emerald-400", icon: Award        },
};

const DOC_TYPE_META = {
  contract:               { label: "Contract",    icon: FileText      },
  permit:                 { label: "Permit",      icon: Shield        },
  completion_certificate: { label: "Cert",        icon: Award         },
  inspection_report:      { label: "Inspection",  icon: ClipboardList },
  photo:                  { label: "Photo",       icon: Camera        },
  other:                  { label: "Other",       icon: Link2         },
};

const LIFECYCLE_STEPS = [
  "enquiry","site_survey","design","permit_pending",
  "procurement","installation","inspection","grid_connection","completed",
];

/* ────────────────────────────────────────────────────────────
   STATUS / PRIORITY → light-theme hex map
──────────────────────────────────────────────────────────── */
const STATUS_LIGHT = {
  enquiry:        { color: "#64748b", bg: "#f8fafc",  border: "#e2e8f0" },
  site_survey:    { color: "#3b82f6", bg: "#eff6ff",  border: "#bfdbfe" },
  design:         { color: "#8b5cf6", bg: "#f5f3ff",  border: "#ede9fe" },
  permit_pending: { color: "#f59e0b", bg: "#fffbeb",  border: "#fde68a" },
  procurement:    { color: "#f97316", bg: "#fff7ed",  border: "#fed7aa" },
  installation:   { color: "#06b6d4", bg: "#ecfeff",  border: "#a5f3fc" },
  inspection:     { color: "#6366f1", bg: "#eef2ff",  border: "#c7d2fe" },
  grid_connection:{ color: "#10b981", bg: "#ecfdf5",  border: "#a7f3d0" },
  completed:      { color: "#16a34a", bg: "#f0fdf4",  border: "#bbf7d0" },
  on_hold:        { color: "#ca8a04", bg: "#fefce8",  border: "#fef08a" },
  cancelled:      { color: "#ef4444", bg: "#fef2f2",  border: "#fecaca" },
};

const PRIORITY_LIGHT = {
  low:      { color: "#64748b", bg: "#f8fafc",  border: "#e2e8f0" },
  medium:   { color: "#3b82f6", bg: "#eff6ff",  border: "#bfdbfe" },
  high:     { color: "#f97316", bg: "#fff7ed",  border: "#fed7aa" },
  critical: { color: "#ef4444", bg: "#fef2f2",  border: "#fecaca" },
};

const MILESTONE_LIGHT = {
  pending:     { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
  in_progress: { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  completed:   { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  delayed:     { color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
};

/* ────────────────────────────────────────────────────────────
   TINY HELPERS
──────────────────────────────────────────────────────────── */
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "—";
const daysLeft = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d) - Date.now()) / 86400000);
};

/* ── StatusBadge ── */
const StatusBadge = ({ status, size = "sm" }) => {
  const m   = STATUS_META[status] || STATUS_META.enquiry;
  const lm  = STATUS_LIGHT[status] || STATUS_LIGHT.enquiry;
  const Icon = m.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 99,
      fontSize: 11, fontWeight: 600,
      color: lm.color, background: lm.bg, border: `1px solid ${lm.border}`,
    }}>
      <Icon size={size === "sm" ? 10 : 12} style={{ color: lm.color }} />
      {m.label}
    </span>
  );
};

/* ── PriorityBadge ── */
const PriorityBadge = ({ priority }) => {
  const m  = PRIORITY_META[priority] || PRIORITY_META.medium;
  const lm = PRIORITY_LIGHT[priority] || PRIORITY_LIGHT.medium;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 99,
      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
      color: lm.color, background: lm.bg, border: `1px solid ${lm.border}`,
    }}>
      {m.label}
    </span>
  );
};

/* ── ProgressBar ── */
const ProgressBar = ({ percent, color = "from-indigo-500 to-violet-500" }) => {
  // derive a solid color from the gradient class for light theme
  const barColor = color.includes("green") ? "#16a34a" : "#16a34a";
  return (
    <div style={{ width: "100%", background: "#f1f5f9", borderRadius: 99, height: 6, overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          height: "100%", borderRadius: 99,
          background: color.includes("green")
            ? "linear-gradient(90deg,#16a34a,#10b981)"
            : "linear-gradient(90deg,#16a34a,#10b981)",
        }}
      />
    </div>
  );
};

/* ── InputField ── */
const InputField = ({ label, type = "text", value, onChange, placeholder, required, className = "" }) => (
  <div className={className}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
      {label}{required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      style={{
        width: "100%", background: "#ffffff", border: "1px solid #e2e8f0",
        borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#0f172a",
        outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
        boxSizing: "border-box",
      }}
      onFocus={e => { e.target.style.borderColor = "#16a34a"; e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.08)"; }}
      onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
    />
  </div>
);

/* ── SelectField ── */
const SelectField = ({ label, value, onChange, options, required, className = "" }) => (
  <div className={className}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
      {label}{required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      style={{
        width: "100%", background: "#ffffff", border: "1px solid #e2e8f0",
        borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#334155",
        outline: "none", appearance: "none", cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box",
      }}
      onFocus={e => { e.target.style.borderColor = "#16a34a"; e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.08)"; }}
      onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

/* ── TextareaField ── */
const TextareaField = ({ label, value, onChange, placeholder, rows = 3, className = "" }) => (
  <div className={className}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%", background: "#ffffff", border: "1px solid #e2e8f0",
        borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#0f172a",
        outline: "none", resize: "none", transition: "border-color 0.15s, box-shadow 0.15s",
        boxSizing: "border-box",
      }}
      onFocus={e => { e.target.style.borderColor = "#16a34a"; e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.08)"; }}
      onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
    />
  </div>
);

/* ── SectionHeader ── */
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={15} style={{ color: "#16a34a" }} />
    </div>
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{subtitle}</p>}
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────
   LIFECYCLE STEPPER
──────────────────────────────────────────────────────────── */
const LifecycleStepper = ({ currentStatus }) => {
  const currentIdx = LIFECYCLE_STEPS.indexOf(currentStatus);
  return (
    <div style={{ display: "flex", alignItems: "center", overflowX: "auto", paddingBottom: 4 }}>
      {LIFECYCLE_STEPS.map((s, i) => {
        const m      = STATUS_META[s];
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `2px solid ${done ? "#16a34a" : active ? "#16a34a" : "#e2e8f0"}`,
                background: done ? "#f0fdf4" : active ? "#f0fdf4" : "#f8fafc",
                transition: "all 0.2s",
              }}>
                {done
                  ? <CheckCircle2 size={12} style={{ color: "#16a34a" }} />
                  : <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? "#16a34a" : "#cbd5e1", display: "block" }} />
                }
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, whiteSpace: "nowrap", color: active ? "#16a34a" : done ? "#16a34a" : "#94a3b8" }}>
                {m.label}
              </span>
            </div>
            {i < LIFECYCLE_STEPS.length - 1 && (
              <div style={{ height: 1, width: 32, marginTop: -14, marginLeft: 2, marginRight: 2, background: i < currentIdx ? "#bbf7d0" : "#e2e8f0" }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   GANTT-STYLE TIMELINE
──────────────────────────────────────────────────────────── */
const GanttTimeline = ({ project }) => {
  const { milestones, startDate, expectedCompletionDate } = project;
  if (!milestones?.length) return (
    <div style={{ textAlign: "center", padding: "32px 0", fontSize: 13, color: "#94a3b8" }}>No milestones to display</div>
  );

  const start   = new Date(startDate || project.createdAt);
  const end     = new Date(expectedCompletionDate || Date.now() + 30 * 86400000);
  const totalMs = end - start;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#94a3b8", width: 144, flexShrink: 0 }}>Start: {fmt(start)}</span>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>End: {fmt(end)}</span>
        </div>
      </div>
      {milestones.map((m) => {
        const msStart  = new Date(m.dueDate || start);
        const leftPct  = Math.min(100, Math.max(0, ((msStart - start) / totalMs) * 100));
        const lm       = MILESTONE_LIGHT[m.status] || MILESTONE_LIGHT.pending;
        return (
          <div key={m._id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: "#64748b", width: 144, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</span>
            <div style={{ flex: 1, height: 24, background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 8, position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute", top: 4, height: 16, borderRadius: 4,
                background: m.status === "completed" ? "rgba(22,163,74,0.2)" : "rgba(99,102,241,0.2)",
                minWidth: 8, left: `${leftPct}%`, width: 14,
              }} />
              <div style={{ position: "absolute", top: 0, bottom: 0, width: 2, background: lm.color, opacity: 0.5, left: `${leftPct}%` }} />
            </div>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 99, flexShrink: 0,
              color: lm.color, background: lm.bg, border: `1px solid ${lm.border}`,
            }}>
              {MILESTONE_STATUS_META[m.status]?.label || m.status}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   MODAL WRAPPER
──────────────────────────────────────────────────────────── */
const Modal = ({ open, onClose, title, subtitle, children, width = "max-w-2xl" }) => (
  <AnimatePresence>
    {open && (
      <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}
        />
        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "relative", width: "100%", maxWidth: 672,
            background: "#ffffff", border: "1px solid #e2e8f0",
            borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            display: "flex", flexDirection: "column", maxHeight: "90vh",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: 20, borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
              {subtitle && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              style={{ padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#334155"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
            >
              <X size={16} />
            </button>
          </div>
          {/* Body */}
          <div style={{ overflowY: "auto", flex: 1, padding: 20 }}>{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

/* ────────────────────────────────────────────────────────────
   PROJECT CARD
──────────────────────────────────────────────────────────── */
const ProjectCard = ({ project, onClick, onEdit, onDelete, hasEdit, hasDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const dl      = daysLeft(project.expectedCompletionDate);
  const overdue = dl !== null && dl < 0 && project.status !== "completed" && project.status !== "cancelled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 20,
        cursor: "pointer",
        position: "relative",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "#bbf7d0"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", fontFamily: "monospace" }}>{project.projectId}</span>
            <StatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.title}</h3>
          <p style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <User size={10} style={{ color: "#94a3b8" }} />
            {project.customer?.name}
            {project.customer?.city && <span>· {project.customer.city}</span>}
          </p>
        </div>

        {/* Context menu */}
        <div style={{ position: "relative", flexShrink: 0, marginLeft: 8 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#334155"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
          >
            <MoreVertical size={15} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                style={{
                  position: "absolute", right: 0, top: 36, width: 160,
                  background: "#ffffff", border: "1px solid #e2e8f0",
                  borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                  zIndex: 20, padding: "4px 0", overflow: "hidden",
                }}
              >
                <button
                  onClick={() => { onClick(); setMenuOpen(false); }}
                  style={menuItemStyle}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Eye size={13} style={{ color: "#64748b" }} /> View Details
                </button>
                {hasEdit && (
                  <button
                    onClick={() => { onEdit(); setMenuOpen(false); }}
                    style={menuItemStyle}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Edit2 size={13} style={{ color: "#64748b" }} /> Edit Project
                  </button>
                )}
                {hasDelete && (
                  <button
                    onClick={() => { onDelete(); setMenuOpen(false); }}
                    style={{ ...menuItemStyle, color: "#ef4444" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Trash2 size={13} style={{ color: "#ef4444" }} /> Delete
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Solar details */}
      {project.installation?.systemCapacity && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#f59e0b", background: "#fffbeb", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: 99 }}>
            <Sun size={10} /> {project.installation.systemCapacity} kW
          </span>
          {project.installation.panelCount && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#06b6d4", background: "#ecfeff", border: "1px solid #a5f3fc", padding: "2px 8px", borderRadius: 99 }}>
              <Layers size={10} /> {project.installation.panelCount} Panels
            </span>
          )}
          {project.installation.mountingType && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "2px 8px", borderRadius: 99 }}>
              {project.installation.mountingType}
            </span>
          )}
        </div>
      )}

      {/* Progress */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Progress</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{project.progressPercent}%</span>
        </div>
        <ProgressBar
          percent={project.progressPercent}
          color={project.status === "completed" ? "from-green-500 to-emerald-500" : "from-indigo-500 to-violet-500"}
        />
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#94a3b8" }}>
          <Calendar size={10} />
          <span>{fmt(project.expectedCompletionDate)}</span>
        </div>
        {overdue ? (
          <span style={{ color: "#ef4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <AlertCircle size={10} /> {Math.abs(dl)}d overdue
          </span>
        ) : dl !== null && project.status !== "completed" ? (
          <span style={{ fontWeight: 600, color: dl <= 7 ? "#f97316" : "#94a3b8" }}>
            {dl}d left
          </span>
        ) : null}
      </div>

      {/* Engineers avatars */}
      {project.assignedEngineers?.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex" }}>
            {project.assignedEngineers.slice(0, 3).map((eng, i) => (
              <div
                key={eng._id || i}
                title={eng.name}
                style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "linear-gradient(135deg,#16a34a,#10b981)",
                  border: "2px solid #ffffff",
                  marginLeft: i > 0 ? -6 : 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: "#ffffff",
                }}
              >
                {eng.name?.[0]?.toUpperCase()}
              </div>
            ))}
            {project.assignedEngineers.length > 3 && (
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: "#f1f5f9", border: "2px solid #ffffff",
                marginLeft: -6, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "#64748b", fontWeight: 700,
              }}>
                +{project.assignedEngineers.length - 3}
              </div>
            )}
          </div>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>
            {project.assignedEngineers.length} engineer{project.assignedEngineers.length > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </motion.div>
  );
};

/* shared menu item style */
const menuItemStyle = {
  width: "100%", padding: "8px 12px",
  display: "flex", alignItems: "center", gap: 8,
  fontSize: 12, color: "#334155",
  background: "transparent", border: "none",
  cursor: "pointer", textAlign: "left",
  transition: "background 0.15s",
};

export {
  StatusBadge, PriorityBadge, ProgressBar, Modal,
  STATUS_META, PRIORITY_META, MILESTONE_STATUS_META, CHECKIN_STATUS_META, DOC_TYPE_META,
  LIFECYCLE_STEPS, fmt, fmtTime, daysLeft,
  InputField, SelectField, TextareaField, SectionHeader,
  GanttTimeline, LifecycleStepper, ProjectCard,
};



// import { useState, useEffect, useCallback, useContext } from "react";
// import { AuthContext } from "../../auth/AuthContext";
// import API_BASE_URL from "../../config/api";
// import { motion, AnimatePresence } from "framer-motion";
// import toast from "react-hot-toast";
// import {
//   Sun, Zap, MapPin, User, Users, Calendar, Clock, ChevronRight,
//   Plus, Search, Filter, MoreVertical, Edit2, Trash2, Eye,
//   CheckCircle2, Circle, AlertCircle, XCircle, PauseCircle,
//   TrendingUp, BarChart2, FileText, Camera, Bell, Award,
//   Upload, Download, ArrowLeft, X, ChevronDown, RefreshCw,
//   Phone, Mail, Home, Building2, Cpu, Battery, Wind,
//   SlidersHorizontal, ClipboardList, Activity, Shield,
//   MessageSquare, Link2, AlertTriangle, Layers,
// } from "lucide-react";

// /* ────────────────────────────────────────────────────────────
//    CONSTANTS
// ──────────────────────────────────────────────────────────── */
// const STATUS_META = {
//   enquiry:        { label: "Enquiry",        color: "text-slate-400",   bg: "bg-slate-500/15",  dot: "bg-slate-400",   icon: Circle },
//   site_survey:    { label: "Site Survey",    color: "text-blue-400",    bg: "bg-blue-500/15",   dot: "bg-blue-400",    icon: MapPin },
//   design:         { label: "Design",         color: "text-violet-400",  bg: "bg-violet-500/15", dot: "bg-violet-400",  icon: Layers },
//   permit_pending: { label: "Permit Pending", color: "text-amber-400",   bg: "bg-amber-500/15",  dot: "bg-amber-400",   icon: Clock },
//   procurement:    { label: "Procurement",    color: "text-orange-400",  bg: "bg-orange-500/15", dot: "bg-orange-400",  icon: Building2 },
//   installation:   { label: "Installation",   color: "text-cyan-400",    bg: "bg-cyan-500/15",   dot: "bg-cyan-400",    icon: Cpu },
//   inspection:     { label: "Inspection",     color: "text-indigo-400",  bg: "bg-indigo-500/15", dot: "bg-indigo-400",  icon: Shield },
//   grid_connection:{ label: "Grid Connect",   color: "text-emerald-400", bg: "bg-emerald-500/15",dot: "bg-emerald-400", icon: Zap },
//   completed:      { label: "Completed",      color: "text-green-400",   bg: "bg-green-500/15",  dot: "bg-green-400",   icon: CheckCircle2 },
//   on_hold:        { label: "On Hold",        color: "text-yellow-400",  bg: "bg-yellow-500/15", dot: "bg-yellow-400",  icon: PauseCircle },
//   cancelled:      { label: "Cancelled",      color: "text-red-400",     bg: "bg-red-500/15",    dot: "bg-red-400",     icon: XCircle },
// };

// const PRIORITY_META = {
//   low:      { label: "Low",      color: "text-slate-400",   bg: "bg-slate-500/10"  },
//   medium:   { label: "Medium",   color: "text-blue-400",    bg: "bg-blue-500/10"   },
//   high:     { label: "High",     color: "text-orange-400",  bg: "bg-orange-500/10" },
//   critical: { label: "Critical", color: "text-red-400",     bg: "bg-red-500/10"    },
// };

// const MILESTONE_STATUS_META = {
//   pending:     { label: "Pending",     color: "text-slate-400",   bg: "bg-slate-500/15",  dot: "bg-slate-400"   },
//   in_progress: { label: "In Progress", color: "text-blue-400",    bg: "bg-blue-500/15",   dot: "bg-blue-400"    },
//   completed:   { label: "Done",        color: "text-green-400",   bg: "bg-green-500/15",  dot: "bg-green-400"   },
//   delayed:     { label: "Delayed",     color: "text-red-400",     bg: "bg-red-500/15",    dot: "bg-red-400"     },
// };

// const CHECKIN_STATUS_META = {
//   on_track:          { label: "On Track",          color: "text-green-400",   icon: CheckCircle2 },
//   delayed:           { label: "Delayed",           color: "text-red-400",     icon: AlertCircle  },
//   issue_found:       { label: "Issue Found",       color: "text-orange-400",  icon: AlertTriangle},
//   milestone_reached: { label: "Milestone Reached", color: "text-emerald-400", icon: Award        },
// };

// const DOC_TYPE_META = {
//   contract:               { label: "Contract",             icon: FileText  },
//   permit:                 { label: "Permit",               icon: Shield    },
//   completion_certificate: { label: "Cert",                 icon: Award     },
//   inspection_report:      { label: "Inspection",           icon: ClipboardList },
//   photo:                  { label: "Photo",                icon: Camera    },
//   other:                  { label: "Other",                icon: Link2     },
// };

// const LIFECYCLE_STEPS = [
//   "enquiry","site_survey","design","permit_pending",
//   "procurement","installation","inspection","grid_connection","completed",
// ];

// /* ────────────────────────────────────────────────────────────
//    TINY HELPERS
// ──────────────────────────────────────────────────────────── */
// const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
// const fmtTime = (d) => d ? new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "—";
// const daysLeft = (d) => {
//   if (!d) return null;
//   const diff = Math.ceil((new Date(d) - Date.now()) / 86400000);
//   return diff;
// };

// const StatusBadge = ({ status, size = "sm" }) => {
//   const m = STATUS_META[status] || STATUS_META.enquiry;
//   const Icon = m.icon;
//   return (
//     <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.color} ${m.bg}`}>
//       <Icon size={size === "sm" ? 10 : 12} />
//       {m.label}
//     </span>
//   );
// };

// const PriorityBadge = ({ priority }) => {
//   const m = PRIORITY_META[priority] || PRIORITY_META.medium;
//   return (
//     <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${m.color} ${m.bg}`}>
//       {m.label}
//     </span>
//   );
// };

// const ProgressBar = ({ percent, color = "from-indigo-500 to-violet-500" }) => (
//   <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
//     <motion.div
//       initial={{ width: 0 }}
//       animate={{ width: `${percent}%` }}
//       transition={{ duration: 0.6, ease: "easeOut" }}
//       className={`h-full rounded-full bg-gradient-to-r ${color}`}
//     />
//   </div>
// );

// const InputField = ({ label, type = "text", value, onChange, placeholder, required, className = "" }) => (
//   <div className={className}>
//     <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
//       {label}{required && <span className="text-red-400 ml-1">*</span>}
//     </label>
//     <input
//       type={type}
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       placeholder={placeholder}
//       required={required}
//       className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-slate-600
//         focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition"
//     />
//   </div>
// );

// const SelectField = ({ label, value, onChange, options, required, className = "" }) => (
//   <div className={className}>
//     <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
//       {label}{required && <span className="text-red-400 ml-1">*</span>}
//     </label>
//     <select
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       required={required}
//       className="w-full bg-[#1a1a35] border border-white/8 rounded-xl px-3 py-2.5 text-[13px] text-white
//         focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition appearance-none"
//     >
//       {options.map((o) => (
//         <option key={o.value} value={o.value}>{o.label}</option>
//       ))}
//     </select>
//   </div>
// );

// const TextareaField = ({ label, value, onChange, placeholder, rows = 3, className = "" }) => (
//   <div className={className}>
//     <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
//     <textarea
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       placeholder={placeholder}
//       rows={rows}
//       className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-slate-600
//         focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition resize-none"
//     />
//   </div>
// );

// const SectionHeader = ({ icon: Icon, title, subtitle }) => (
//   <div className="flex items-center gap-3 mb-5">
//     <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
//       <Icon size={15} className="text-indigo-400" />
//     </div>
//     <div>
//       <h3 className="text-[14px] font-bold text-white">{title}</h3>
//       {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
//     </div>
//   </div>
// );

// /* ────────────────────────────────────────────────────────────
//    LIFECYCLE STEPPER
// ──────────────────────────────────────────────────────────── */
// const LifecycleStepper = ({ currentStatus }) => {
//   const currentIdx = LIFECYCLE_STEPS.indexOf(currentStatus);
//   return (
//     <div className="flex items-center gap-0 overflow-x-auto pb-1">
//       {LIFECYCLE_STEPS.map((s, i) => {
//         const m = STATUS_META[s];
//         const done = i < currentIdx;
//         const active = i === currentIdx;
//         return (
//           <div key={s} className="flex items-center flex-shrink-0">
//             <div className={`flex flex-col items-center gap-1`}>
//               <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all
//                 ${done ? "border-green-500 bg-green-500/20" : active ? "border-indigo-500 bg-indigo-500/20" : "border-white/10 bg-white/3"}`}>
//                 {done
//                   ? <CheckCircle2 size={12} className="text-green-400" />
//                   : <span className={`w-2 h-2 rounded-full ${active ? "bg-indigo-400" : "bg-white/20"}`} />
//                 }
//               </div>
//               <span className={`text-[9px] font-medium whitespace-nowrap ${active ? "text-indigo-400" : done ? "text-green-400" : "text-slate-600"}`}>
//                 {m.label}
//               </span>
//             </div>
//             {i < LIFECYCLE_STEPS.length - 1 && (
//               <div className={`h-px w-8 mt-[-14px] mx-0.5 ${i < currentIdx ? "bg-green-500/40" : "bg-white/8"}`} />
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// /* ────────────────────────────────────────────────────────────
//    GANTT-STYLE TIMELINE
// ──────────────────────────────────────────────────────────── */
// const GanttTimeline = ({ project }) => {
//   const { milestones, startDate, expectedCompletionDate } = project;
//   if (!milestones?.length) return (
//     <div className="text-center py-8 text-slate-600 text-[13px]">No milestones to display</div>
//   );

//   const start = new Date(startDate || project.createdAt);
//   const end = new Date(expectedCompletionDate || Date.now() + 30 * 86400000);
//   const totalMs = end - start;

//   return (
//     <div className="space-y-2">
//       {/* Header */}
//       <div className="flex gap-3 items-center mb-3">
//         <span className="text-[11px] text-slate-600 w-36 shrink-0">Start: {fmt(start)}</span>
//         <div className="flex-1 flex justify-end">
//           <span className="text-[11px] text-slate-600">End: {fmt(end)}</span>
//         </div>
//       </div>
//       {milestones.map((m) => {
//         const msStart = new Date(m.dueDate || start);
//         const leftPct = Math.min(100, Math.max(0, ((msStart - start) / totalMs) * 100));
//         const m2 = MILESTONE_STATUS_META[m.status] || MILESTONE_STATUS_META.pending;
//         return (
//           <div key={m._id} className="flex items-center gap-3">
//             <span className="text-[11px] text-slate-400 w-36 shrink-0 truncate">{m.title}</span>
//             <div className="flex-1 h-6 bg-white/4 rounded-lg relative overflow-hidden">
//               <div
//                 className={`absolute top-1 h-4 rounded ${m.status === "completed" ? "bg-green-500/40" : "bg-indigo-500/30"} min-w-[8px]`}
//                 style={{ left: `${leftPct}%`, width: "14px" }}
//               />
//               <div
//                 className={`absolute top-0 bottom-0 w-0.5 ${m2.dot.replace("bg-", "bg-")} opacity-60`}
//                 style={{ left: `${leftPct}%` }}
//               />
//             </div>
//             <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${m2.color} ${m2.bg} shrink-0`}>
//               {m2.label}
//             </span>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// /* ────────────────────────────────────────────────────────────
//    MODAL WRAPPER
// ──────────────────────────────────────────────────────────── */
// const Modal = ({ open, onClose, title, subtitle, children, width = "max-w-2xl" }) => (
//   <AnimatePresence>
//     {open && (
//       <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//         <motion.div
//           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//           onClick={onClose}
//           className="absolute inset-0 bg-black/70 backdrop-blur-sm"
//         />
//         <motion.div
//           initial={{ opacity: 0, scale: 0.95, y: 16 }}
//           animate={{ opacity: 1, scale: 1, y: 0 }}
//           exit={{ opacity: 0, scale: 0.95, y: 8 }}
//           transition={{ duration: 0.2 }}
//           className={`relative w-full ${width} bg-[#0f0f24] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]`}
//         >
//           {/* header */}
//           <div className="flex items-start justify-between p-5 border-b border-white/6 flex-shrink-0">
//             <div>
//               <h2 className="text-[15px] font-bold text-white">{title}</h2>
//               {subtitle && <p className="text-[12px] text-slate-500 mt-0.5">{subtitle}</p>}
//             </div>
//             <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-slate-500 hover:text-white transition flex-shrink-0">
//               <X size={16} />
//             </button>
//           </div>
//           {/* scrollable body */}
//           <div className="overflow-y-auto flex-1 p-5">{children}</div>
//         </motion.div>
//       </div>
//     )}
//   </AnimatePresence>
// );

// /* ────────────────────────────────────────────────────────────
//    PROJECT CARD
// ──────────────────────────────────────────────────────────── */
// const ProjectCard = ({ project, onClick, onEdit, onDelete, hasEdit, hasDelete }) => {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const dl = daysLeft(project.expectedCompletionDate);
//   const overdue = dl !== null && dl < 0 && project.status !== "completed" && project.status !== "cancelled";

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 10 }}
//       animate={{ opacity: 1, y: 0 }}
//       whileHover={{ y: -2 }}
//       className="bg-[#141428] border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-indigo-500/20 transition-all group relative"
//       onClick={onClick}
//     >
//       {/* Top row */}
//       <div className="flex items-start justify-between mb-3">
//         <div className="flex-1 min-w-0">
//           <div className="flex items-center gap-2 flex-wrap mb-1">
//             <span className="text-[10px] font-bold text-slate-600 font-mono">{project.projectId}</span>
//             <StatusBadge status={project.status} />
//             <PriorityBadge priority={project.priority} />
//           </div>
//           <h3 className="text-[14px] font-bold text-white truncate group-hover:text-indigo-300 transition">{project.title}</h3>
//           <p className="text-[12px] text-slate-500 flex items-center gap-1 mt-0.5">
//             <User size={10} /> {project.customer?.name}
//             {project.customer?.city && <span>· {project.customer.city}</span>}
//           </p>
//         </div>
//         <div className="relative flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
//           <button
//             onClick={() => setMenuOpen(!menuOpen)}
//             className="p-1.5 rounded-lg hover:bg-white/8 text-slate-600 hover:text-white transition"
//           >
//             <MoreVertical size={15} />
//           </button>
//           <AnimatePresence>
//             {menuOpen && (
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.95, y: -4 }}
//                 animate={{ opacity: 1, scale: 1, y: 0 }}
//                 exit={{ opacity: 0, scale: 0.95, y: -4 }}
//                 className="absolute right-0 top-8 w-40 bg-[#1a1a35] border border-white/10 rounded-xl shadow-2xl z-20 py-1 overflow-hidden"
//               >
//                 <button
//                   onClick={() => { onClick(); setMenuOpen(false); }}
//                   className="w-full px-3 py-2 text-left text-[12px] text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition"
//                 >
//                   <Eye size={13} /> View Details
//                 </button>
//                 {hasEdit && (
//                   <button
//                     onClick={() => { onEdit(); setMenuOpen(false); }}
//                     className="w-full px-3 py-2 text-left text-[12px] text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition"
//                   >
//                     <Edit2 size={13} /> Edit Project
//                   </button>
//                 )}
//                 {hasDelete && (
//                   <button
//                     onClick={() => { onDelete(); setMenuOpen(false); }}
//                     className="w-full px-3 py-2 text-left text-[12px] text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition"
//                   >
//                     <Trash2 size={13} /> Delete
//                   </button>
//                 )}
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </div>

//       {/* Solar details */}
//       {project.installation?.systemCapacity && (
//         <div className="flex items-center gap-3 mb-3 flex-wrap">
//           <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
//             <Sun size={10} /> {project.installation.systemCapacity} kW
//           </span>
//           {project.installation.panelCount && (
//             <span className="flex items-center gap-1 text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
//               <Layers size={10} /> {project.installation.panelCount} Panels
//             </span>
//           )}
//           {project.installation.mountingType && (
//             <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full">
//               {project.installation.mountingType}
//             </span>
//           )}
//         </div>
//       )}

//       {/* Progress */}
//       <div className="mb-3">
//         <div className="flex items-center justify-between mb-1">
//           <span className="text-[10px] text-slate-600">Progress</span>
//           <span className="text-[11px] font-bold text-white">{project.progressPercent}%</span>
//         </div>
//         <ProgressBar
//           percent={project.progressPercent}
//           color={project.status === "completed" ? "from-green-500 to-emerald-500" : "from-indigo-500 to-violet-500"}
//         />
//       </div>

//       {/* Bottom row */}
//       <div className="flex items-center justify-between text-[11px]">
//         <div className="flex items-center gap-1 text-slate-500">
//           <Calendar size={10} />
//           <span>{fmt(project.expectedCompletionDate)}</span>
//         </div>
//         {overdue ? (
//           <span className="text-red-400 font-semibold flex items-center gap-1">
//             <AlertCircle size={10} /> {Math.abs(dl)}d overdue
//           </span>
//         ) : dl !== null && project.status !== "completed" ? (
//           <span className={`font-semibold ${dl <= 7 ? "text-orange-400" : "text-slate-500"}`}>
//             {dl}d left
//           </span>
//         ) : null}
//       </div>

//       {/* Engineers avatars */}
//       {project.assignedEngineers?.length > 0 && (
//         <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/5">
//           <div className="flex -space-x-1.5">
//             {project.assignedEngineers.slice(0, 3).map((eng, i) => (
//               <div
//                 key={eng._id || i}
//                 title={eng.name}
//                 className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 border-2 border-[#141428] flex items-center justify-center text-[9px] font-bold text-white"
//               >
//                 {eng.name?.[0]?.toUpperCase()}
//               </div>
//             ))}
//             {project.assignedEngineers.length > 3 && (
//               <div className="w-6 h-6 rounded-full bg-white/10 border-2 border-[#141428] flex items-center justify-center text-[9px] text-slate-400">
//                 +{project.assignedEngineers.length - 3}
//               </div>
//             )}
//           </div>
//           <span className="text-[10px] text-slate-600 ml-1">{project.assignedEngineers.length} engineer{project.assignedEngineers.length > 1 ? "s" : ""}</span>
//         </div>
//       )}
//     </motion.div>
//   );
// };

// export { StatusBadge, PriorityBadge, ProgressBar, Modal, STATUS_META, PRIORITY_META, MILESTONE_STATUS_META, CHECKIN_STATUS_META, DOC_TYPE_META, LIFECYCLE_STEPS, fmt, fmtTime, daysLeft, InputField, SelectField, TextareaField, SectionHeader, GanttTimeline, LifecycleStepper, ProjectCard };