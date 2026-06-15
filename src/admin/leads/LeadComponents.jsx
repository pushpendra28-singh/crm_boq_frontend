import { Star } from "lucide-react";
import { SOURCE_CONFIG, STATUS_CONFIG, STATUSES } from "./Constants";

// ─── Score Badge ──────────────────────────────────────────────────────────────
export const ScoreBadge = ({ score }) => {
  const color =
    score >= 70 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
    score >= 40 ? "text-amber-700 bg-amber-50 border-amber-200" :
                  "text-red-700 bg-red-50 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      <Star size={9} className="fill-current" />
      {score}
    </span>
  );
};

// ─── Source Chip ──────────────────────────────────────────────────────────────
export const SourceChip = ({ source, compact = false }) => {
  const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG["Other"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.color} ${cfg.bg}`}>
      <Icon size={9} />
      {!compact && source}
    </span>
  );
};

// ─── Status Select ────────────────────────────────────────────────────────────
export const StatusSelect = ({ value, onChange, small = false }) => {
  const cfg = STATUS_CONFIG[value] || STATUS_CONFIG["Pending"];

  // Map dark-mode token classes → Dasher light equivalents
  const lightTheme = {
    Active:   { color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200" },
    Pending:  { color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200"   },
    Inactive: { color: "text-orange-600",  bg: "bg-orange-50",   border: "border-orange-200"  },
    Closed:   { color: "text-red-700",     bg: "bg-red-50",      border: "border-red-200"     },
  };
  const lt = lightTheme[value] || lightTheme["Pending"];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none cursor-pointer rounded-full font-semibold border transition focus:outline-none focus:ring-2 focus:ring-emerald-400/40
        ${small ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]"}
        ${lt.color} ${lt.bg} ${lt.border}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="bg-white text-gray-800">{s}</option>
      ))}
    </select>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, icon: Icon, gradient, loading }) => (
  <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
    {/* subtle tinted wash — keeps brand colour without going dark */}
    <div className={`absolute inset-0 opacity-[0.04] ${gradient}`} />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-2">{label}</p>
        {loading ? (
          <div className="h-8 w-16 bg-gray-100 animate-pulse rounded-lg" />
        ) : (
          <p className="text-3xl font-black text-gray-800 tabular-nums">{value}</p>
        )}
        {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
      </div>
      {/* icon container uses a soft green tint matching Dasher's accent */}
      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
        <Icon size={18} className="text-emerald-600" strokeWidth={1.8} />
      </div>
    </div>
  </div>
);