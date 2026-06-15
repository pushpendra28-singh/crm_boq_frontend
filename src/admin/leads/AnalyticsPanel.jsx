import { motion } from "framer-motion";
import { Loader2, User, CheckCircle2, Users, GitMerge, Activity } from "lucide-react";
import { SOURCE_CONFIG, STATUS_CONFIG, STATUSES } from "./Constants";
import { StatCard, ScoreBadge, SourceChip } from "./LeadComponents";

// ─── Analytics Panel ──────────────────────────────────────────────────────────
export const AnalyticsPanel = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 size={22} className="text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const { summary = {}, bySource = [], byCategory = [], dailyTrend = [] } = stats;

  const conversionRate = summary.total > 0
    ? ((summary.converted / summary.total) * 100).toFixed(1)
    : "0.0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Leads"  value={summary.total || 0}      sub={`avg score ${Math.round(summary.avgScore || 0)}`} icon={Users}        gradient="bg-gradient-to-br from-indigo-600 to-violet-600" />
        <StatCard label="Converted"    value={summary.converted || 0}  sub={`${conversionRate}% rate`}                        icon={CheckCircle2} gradient="bg-gradient-to-br from-emerald-600 to-teal-600" />
        <StatCard label="Connected"    value={summary.connected || 0}  sub="awaiting conversion"                               icon={Activity}     gradient="bg-gradient-to-br from-blue-600 to-cyan-600" />
        <StatCard label="Duplicates"   value={summary.duplicates || 0} sub="auto-detected"                                    icon={GitMerge}     gradient="bg-gradient-to-br from-orange-600 to-amber-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Source breakdown */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Source Attribution</p>
          <div className="space-y-3">
            {bySource.slice(0, 6).map((s) => {
              const pct = summary.total ? Math.round((s.count / summary.total) * 100) : 0;
              const cfg = SOURCE_CONFIG[s._id] || SOURCE_CONFIG["Other"];
              const Icon = cfg.icon;
              return (
                <div key={s._id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={12} className={cfg.color} />
                      <span className="text-[12px] text-gray-600">{s._id || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">{s.count}</span>
                      <span className="text-[10px] font-bold text-gray-500">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cfg.bg}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">By Category</p>
          <div className="space-y-3">
            {byCategory.map((c) => {
              const pct = summary.total ? Math.round((c.count / summary.total) * 100) : 0;
              return (
                <div key={c._id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600">{c._id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">{c.count}</span>
                      <span className="text-[10px] font-bold text-emerald-600">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily trend sparkline (last 30 days) */}
          {dailyTrend.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">30-Day Trend</p>
              <div className="flex items-end gap-0.5 h-12">
                {dailyTrend.slice(-30).map((d, i) => {
                  const max = Math.max(...dailyTrend.map((x) => x.count));
                  const h = max > 0 ? Math.max(4, (d.count / max) * 100) : 4;
                  return (
                    <div
                      key={i}
                      title={`${d._id}: ${d.count}`}
                      className="flex-1 bg-emerald-200 hover:bg-emerald-400 rounded-sm transition"
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Kanban Column ────────────────────────────────────────────────────────────
export const KanbanColumn = ({ status, leads, onLeadClick, onStatusChange }) => {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col min-w-[260px] max-w-[280px]">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${cfg.bg} ${cfg.border} mb-3`}>
        <Icon size={13} className={cfg.color} />
        <span className={`text-[12px] font-bold ${cfg.color}`}>{status}</span>
        <span className={`ml-auto text-[11px] font-black px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
          {leads.length}
        </span>
      </div>
      <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] pr-1">
        {leads.map((lead) => (
          <motion.div
            key={lead._id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-100 rounded-xl p-3.5 cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/40 transition group shadow-sm"
            onClick={() => onLeadClick(lead)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 flex-shrink-0">
                  {lead.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-[12px] font-semibold text-gray-800 truncate">{lead.name}</span>
              </div>
              <ScoreBadge score={lead.score || 0} />
            </div>
            <p className="text-[11px] text-gray-400 tabular-nums mb-2">{lead.whatsapp || lead.phone || "—"}</p>
            <div className="flex items-center justify-between">
              <SourceChip source={lead.source} compact />
              <span className="text-[10px] text-gray-400">
                {new Date(lead.createdAt).toLocaleDateString()}
              </span>
            </div>
            {lead.assignedToName && (
              <div className="mt-2 flex items-center gap-1">
                <User size={9} className="text-gray-400" />
                <span className="text-[10px] text-gray-400">{lead.assignedToName}</span>
              </div>
            )}
          </motion.div>
        ))}
        {leads.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-[12px]">No leads</div>
        )}
      </div>
    </div>
  );
};