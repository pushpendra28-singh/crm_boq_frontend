import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Bell,
  ChevronRight,
  Layers,
  FolderKanban,
  FileText,
  Sparkles,
  User,
  Clock3,
} from "lucide-react";

/* ─── per-module look & copy (full class names so Tailwind keeps them) ─── */
const MODULE_META = {
  leaves: { grad: "from-pink-500 to-rose-600", glow: "shadow-pink-500/30", desc: "Apply, approve and track leave requests" },
  payroll: { grad: "from-cyan-500 to-blue-600", glow: "shadow-cyan-500/30", desc: "Generate salary, review and pay employees" },
  attendance: { grad: "from-lime-500 to-emerald-600", glow: "shadow-emerald-500/30", desc: "Mark and review daily attendance" },
  holidays: { grad: "from-violet-500 to-purple-600", glow: "shadow-violet-500/30", desc: "Manage holidays and weekly offs" },
  "wfh-settings": { grad: "from-teal-500 to-cyan-600", glow: "shadow-teal-500/30", desc: "Configure work-from-home rules" },
  users: { grad: "from-rose-500 to-orange-500", glow: "shadow-rose-500/30", desc: "Manage team members and access" },
  invoices: { grad: "from-emerald-500 to-green-600", glow: "shadow-emerald-500/30", desc: "Create, send and track invoices" },
  tenders: { grad: "from-amber-400 to-orange-500", glow: "shadow-orange-500/30", desc: "Track tenders and submissions" },
  "my-projects": { grad: "from-blue-500 to-indigo-600", glow: "shadow-blue-500/30", desc: "Projects assigned to you" },
  "my-leads": { grad: "from-sky-500 to-cyan-600", glow: "shadow-sky-500/30", desc: "Leads assigned to you" },
  settings: { grad: "from-slate-500 to-slate-700", glow: "shadow-slate-500/30", desc: "Roles, permissions and configuration" },
  leads: { grad: "from-orange-400 to-red-500", glow: "shadow-orange-500/30", desc: "View and manage leads" },
  newsletters: { grad: "from-emerald-500 to-green-600", glow: "shadow-emerald-500/30", desc: "Newsletter subscribers" },
  contacts: { grad: "from-fuchsia-500 to-purple-600", glow: "shadow-fuchsia-500/30", desc: "Contact form enquiries" },
  comments: { grad: "from-amber-400 to-orange-500", glow: "shadow-orange-500/30", desc: "Comments and feedback" },
};

const FALLBACK_META = { grad: "from-blue-500 to-indigo-600", glow: "shadow-blue-500/30", desc: "Open this section" };

const EASE = [0.22, 1, 0.36, 1];

/* ─── small gradient stat card with sparkline ─── */
const StatCard = ({ label, value, sub, icon: Icon, grad, glow, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: EASE, delay: 0.15 + index * 0.08 }}
    whileHover={{ y: -3 }}
    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-5 text-white shadow-lg ${glow}`}
  >
    <svg aria-hidden="true" viewBox="0 0 200 60" preserveAspectRatio="none" className="pointer-events-none absolute bottom-0 right-0 h-12 w-3/4 opacity-40">
      <path d="M0 50 L25 38 L50 44 L75 26 L100 32 L125 16 L150 24 L175 8 L200 14 L200 60 L0 60 Z" fill="rgba(255,255,255,0.22)" />
      <path d="M0 50 L25 38 L50 44 L75 26 L100 32 L125 16 L150 24 L175 8 L200 14" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
    </svg>

    <div className="relative flex items-start justify-between">
      <div>
        <p className="mb-2 text-[12px] font-medium text-white/85">{label}</p>
        <h3 className="text-[32px] font-black leading-none tabular-nums">{value}</h3>
        <p className="mt-2 text-[12px] font-medium text-white/90">{sub}</p>
      </div>
      <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
        <Icon size={22} strokeWidth={1.8} />
      </div>
    </div>
  </motion.div>
);

/* ─── MAIN ─── */
const OverviewHome = ({
  admin,
  roleLabel,
  formatDate,
  formatTime,
  items = [],
  notifications = [],
  assignedProjectCount = 0,
  assignedLeadCount = 0,
  onNavigate,
}) => {
  const reduceMotion = useReducedMotion();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const firstName = admin?.name?.split(" ")[0] || "there";

  /* unique modules (a key can only appear once) */
  const modules = items.filter((item, index, list) => list.findIndex((c) => c.key === item.key) === index);

  const stats = [
    { label: "Modules available", value: modules.length, sub: "Your workspace", icon: Layers, grad: "from-violet-500 via-indigo-500 to-blue-600", glow: "shadow-indigo-500/30" },
    { label: "Notifications", value: notifications.length, sub: notifications.length ? "New activity" : "All caught up", icon: Bell, grad: "from-emerald-500 to-green-600", glow: "shadow-emerald-500/30" },
    ...(assignedProjectCount > 0
      ? [{ label: "My Projects", value: assignedProjectCount, sub: "Assigned to you", icon: FolderKanban, grad: "from-amber-400 to-orange-500", glow: "shadow-orange-500/30" }]
      : []),
    ...(assignedLeadCount > 0
      ? [{ label: "My Leads", value: assignedLeadCount, sub: "Assigned to you", icon: FileText, grad: "from-fuchsia-500 to-purple-600", glow: "shadow-fuchsia-500/30" }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* ───────────── HERO ───────────── */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1230] via-[#0f1d4d] to-[#13287a] p-6 shadow-xl shadow-blue-950/20 sm:p-8"
      >
        <motion.div
          aria-hidden="true"
          animate={reduceMotion ? undefined : { y: [0, -16, 0], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl"
        />
        <motion.div
          aria-hidden="true"
          animate={reduceMotion ? undefined : { y: [0, 14, 0], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl"
        />
        <div className="pointer-events-none absolute right-1/3 top-6 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Workspace overview
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Good {greeting},{" "}
              <span className="bg-gradient-to-r from-amber-200 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                {firstName}
              </span>{" "}
              <motion.span
                className="inline-block origin-[70%_70%]"
                animate={reduceMotion ? undefined : { rotate: [0, 18, -8, 18, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.5 }}
              >
                👋
              </motion.span>
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/75">
              Here's what's happening in your workspace today. Jump straight into any module below.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-semibold text-white backdrop-blur">
                <Sparkles size={13} className="text-amber-300" /> {roleLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-medium text-blue-100/90 backdrop-blur">
                <Layers size={13} className="text-sky-300" /> {modules.length} modules available
              </span>
            </div>
          </div>

          {/* clock card */}
          {/* <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.25 }}
            className="shrink-0 rounded-2xl border border-white/15 bg-white/10 p-5 text-white backdrop-blur-md lg:min-w-[230px]"
          >
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber-200">
              <Clock3 size={13} /> Local time
            </div>
            <p className="mt-2 text-3xl font-black tabular-nums">{formatTime}</p>
            <p className="mt-1 text-[12px] text-blue-100/75">{formatDate}</p>
          </motion.div> */}
        </div>
      </motion.section>

      {/* ───────────── STATS ───────────── */}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${stats.length > 3 ? "xl:grid-cols-4" : stats.length === 3 ? "xl:grid-cols-3" : ""}`}>
        {stats.map((stat, index) => (
          <StatCard key={stat.label} {...stat} index={index} />
        ))}
      </div>

      {/* ───────────── MODULES + SIDE PANELS ───────────── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* modules */}
        <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-9 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-violet-500" />
              <div>
                <h3 className="font-black text-[#0a1a4f]">Your workspace</h3>
                <p className="mt-0.5 text-xs text-slate-400">Modules you have access to</p>
              </div>
            </div>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {modules.length} modules
            </span>
          </div>

          {modules.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {modules.map((item, index) => {
                const meta = MODULE_META[item.key] || FALLBACK_META;
                return (
                  <motion.button
                    key={item.key}
                    type="button"
                    initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: 0.2 + index * 0.05 }}
                    whileHover={reduceMotion ? undefined : { y: -4 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    onClick={() => onNavigate(item.key)}
                    className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-left transition-all duration-300 hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.grad} text-white shadow-lg ${meta.glow} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                      <item.icon size={22} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-[#0a1a4f]">{item.label}</span>
                        {item.badge > 0 && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">{item.badge}</span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-400">{meta.desc}</span>
                    </span>

                    <ChevronRight size={16} className="shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-600" />
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
              Ask your administrator to grant access to the sections you need.
            </p>
          )}
        </section>

        {/* side column */}
        <div className="space-y-6">
          {/* profile card */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
            className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-900/5"
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-100/70 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-blue-500/30">
                {admin?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#0a1a4f]">{admin?.name}</p>
                <p className="truncate text-xs text-slate-400">{admin?.email}</p>
                <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">{roleLabel}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("profile")}
              className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98]"
            >
              <User size={14} /> View profile
            </button>
          </motion.section>

          {/* activity */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.4 }}
            className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-900/5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-emerald-500" />
                <h3 className="text-sm font-black text-[#0a1a4f]">Recent activity</h3>
              </div>
              {notifications.length > 0 && (
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                  {notifications.length} new
                </span>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                  <Bell size={22} />
                </div>
                <p className="text-sm text-slate-400">All caught up</p>
              </div>
            ) : (
              <ul className="max-h-64 space-y-1.5 overflow-y-auto">
                {notifications.slice(0, 8).map((n, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-50"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-[13px] text-slate-700">{n.message}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{new Date(n.time).toLocaleTimeString()}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default OverviewHome;