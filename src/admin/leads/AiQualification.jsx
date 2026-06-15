import { Brain, TrendingUp, Users, Target, Zap, CheckCircle2, AlertCircle, Clock } from "lucide-react";

/**
 * AI_SCORE_THRESHOLDS
 * Define thresholds and labels for each dimension.
 */
const DIMENSIONS = [
  { key: "intentScore",       label: "Intent",       icon: Target,     color: "bg-violet-500",  trackColor: "bg-violet-500/15" },
  { key: "behaviorScore",     label: "Behavior",     icon: TrendingUp, color: "bg-blue-500",    trackColor: "bg-blue-500/15" },
  { key: "demographicScore",  label: "Demographics", icon: Users,      color: "bg-emerald-500", trackColor: "bg-emerald-500/15" },
  { key: "engagementScore",   label: "Engagement",   icon: Zap,        color: "bg-amber-500",   trackColor: "bg-amber-500/15" },
];

const qualificationLabel = (score) => {
  if (score >= 70) return { label: "Hot Lead",      color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25", icon: CheckCircle2 };
  if (score >= 40) return { label: "Warm Lead",     color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/25",   icon: Clock };
  return             { label: "Cold Lead",     color: "text-slate-400",   bg: "bg-slate-500/10 border-slate-500/25",   icon: AlertCircle };
};

/**
 * AIQualificationPanel
 * Full qualification breakdown — used inside LeadDrawer details tab.
 *
 * Props:
 *  score          : number (0–100) overall AI score
 *  scoreBreakdown : object | null  { intentScore, behaviorScore, ... }
 */
export const AIQualificationPanel = ({ score = 0, scoreBreakdown = null }) => {
  const { label, color, bg, icon: QIcon } = qualificationLabel(score);

  // Build dimension rows from scoreBreakdown if present
  const dimensions = DIMENSIONS.map((d) => ({
    ...d,
    value: scoreBreakdown?.[d.key] ?? null,
  })).filter((d) => d.value !== null);

  return (
    <div className="bg-[#0d0d20] border border-white/8 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-500/15 border border-violet-500/20">
            <Brain size={13} className="text-violet-400" />
          </div>
          <span className="text-[12px] font-bold text-white">AI Qualification</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${bg} ${color}`}>
          <QIcon size={9} />
          {label}
        </span>
      </div>

      {/* Overall score */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Overall Score</span>
          <span className={`text-[13px] font-black tabular-nums ${color}`}>{score}<span className="text-slate-600 text-[10px] font-normal">/100</span></span>
        </div>
        <div className="w-full h-2 bg-white/6 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              score >= 70 ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
              score >= 40 ? "bg-gradient-to-r from-amber-500 to-orange-400" :
                            "bg-gradient-to-r from-slate-600 to-slate-500"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Dimension breakdown */}
      {dimensions.length > 0 && (
        <div className="px-4 pb-3 space-y-2.5 border-t border-white/5 pt-3">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Score Breakdown</p>
          {dimensions.map(({ key, label, icon: Icon, color: barColor, trackColor, value }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={10} className="text-slate-500" />
                  <span className="text-[11px] text-slate-400">{label}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-300 tabular-nums">{value}</span>
              </div>
              <div className={`w-full h-1 ${trackColor} rounded-full overflow-hidden`}>
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-500`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Insights row */}
      <div className="px-4 py-3 bg-violet-500/5 border-t border-violet-500/10">
        <p className="text-[10px] text-violet-400 font-medium flex items-center gap-1">
          <Brain size={9} />
          {score >= 70
            ? "High buying intent detected. Prioritize outreach."
            : score >= 40
            ? "Moderate interest signals. Nurturing recommended."
            : "Low engagement. Add to drip campaign."}
        </p>
      </div>
    </div>
  );
};

/**
 * AIQualificationBadge
 * Compact inline badge for table rows — shows score + hot/warm/cold label.
 */
export const AIQualificationBadge = ({ score = 0 }) => {
  const { label, color, bg } = qualificationLabel(score);
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${bg} ${color}`}>
        <Brain size={8} />
        {label}
      </span>
      <span className={`text-[10px] font-black tabular-nums ${color} pl-0.5`}>{score}<span className="text-slate-600 font-normal text-[9px]">/100</span></span>
    </div>
  );
};