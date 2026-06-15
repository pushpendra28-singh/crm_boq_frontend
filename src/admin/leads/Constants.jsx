import {
  Target, Megaphone, FileText, Globe, Link2, Users,
  MessageSquare, TrendingUp, User, Zap,
  Clock, CheckCircle2, XCircle, Activity,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

export const STATUS_CONFIG = {
  Pending:    { color: "text-amber-400",   bg: "bg-amber-500/12",   border: "border-amber-500/25",  icon: Clock,         dot: "bg-amber-400" },
  Connected:  { color: "text-emerald-400", bg: "bg-emerald-500/12", border: "border-emerald-500/25",icon: CheckCircle2,  dot: "bg-emerald-400" },
  Rejected:   { color: "text-red-400",     bg: "bg-red-500/12",     border: "border-red-500/25",    icon: XCircle,       dot: "bg-red-400" },
  "In Progress": { color: "text-blue-400", bg: "bg-blue-500/12",    border: "border-blue-500/25",   icon: Activity,      dot: "bg-blue-400" },
  Converted:  { color: "text-violet-400",  bg: "bg-violet-500/12",  border: "border-violet-500/25", icon: CheckCircle2,  dot: "bg-violet-400" },
};

export const SOURCE_CONFIG = {
  "Google Ads":    { icon: Target,        color: "text-blue-400",    bg: "bg-blue-500/10" },
  "Meta Ads":      { icon: Megaphone,     color: "text-indigo-400",  bg: "bg-indigo-500/10" },
  "Landing Page":  { icon: FileText,      color: "text-cyan-400",    bg: "bg-cyan-500/10" },
  "Website Form":  { icon: Globe,         color: "text-teal-400",    bg: "bg-teal-500/10" },
  "Webhook":       { icon: Link2,         color: "text-violet-400",  bg: "bg-violet-500/10" },
  "Referral":      { icon: Users,         color: "text-amber-400",   bg: "bg-amber-500/10" },
  "WhatsApp":      { icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  "Organic":       { icon: TrendingUp,    color: "text-green-400",   bg: "bg-green-500/10" },
  "Manual":        { icon: User,          color: "text-slate-400",   bg: "bg-slate-500/10" },
  "Other":         { icon: Zap,           color: "text-slate-400",   bg: "bg-slate-500/10" },
};

export const CATEGORIES = ["Residential", "Housing Society", "Commercial"];
export const STATUSES   = ["Pending", "In Progress", "Connected", "Converted", "Rejected"];
export const SOURCES    = Object.keys(SOURCE_CONFIG);