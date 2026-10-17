import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate,useParams, useSearchParams, } from "react-router-dom";
import ViewLeads from "./leads/ViewLeads";
import ViewNewsletters from "./ViewNewsletters";
import ViewContactLeads from "./ViewContactLeads";
import ViewComments from "./ViewComments";
import ViewRoles from "./ViewRoles";
import ViewUsers from "./ViewUsers";
import API_BASE_URL from "../config/api";
import ViewProjects from "./projects/ViewProjects";
import MessageSquareText from "lucide-react/dist/esm/icons/message-square-text";
import ViewProposals from "./proposal/ViewProposals";
import { Sun } from "lucide-react";
import MyAssignedProjects from "./MyAssignedProjects";
import AssignedLeads from "./leads/AssignedLeads";
import ViewAnalytics from "./ViewAnalytics";
import CreateProposal from "./newproposal/CreateProposal";
import ProposalHub from "./newproposal/ProposalHub";
import TenderManagement from "./tender/TenderManagement";
import InvoiceModule from "./invoices/InvoiceModule";
import AttendanceHome from "./attendance/AttendanceHome";
import HolidaysModule from "./holidays/HolidaysModule";
import LeaveModule from "./leaves/LeaveModule";
import { leaveLinkParams } from "./leaves/leaveLink";
import WorkFromHomeSettings from "./wfh/WorkFromHomeSettings";
import PayrollModule from "./payroll/PayrollModule";


import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  Bell,
  User,
  FileText,
  Mail,
  TrendingUp,
  ChevronRight,
  Activity,
  X,
  Zap,
  Shield,
  FolderKanban,
  BarChart3,
  UserCog,
  Lock,
  Briefcase,
  ReceiptText,
  CalendarCheck,
  WalletCards,
  CalendarDays,
} from "lucide-react";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

/* ─── Role badge config ─────────────────────────────────────────────────────── */
const ROLE_CONFIG = {
  superadmin: { label: "Super Admin", color: "text-red-500", bg: "bg-red-50" },
  admin: { label: "Admin", color: "text-orange-500", bg: "bg-orange-50" },
  manager: { label: "Manager", color: "text-violet-500", bg: "bg-violet-50" },
  hr: { label: "HR", color: "text-cyan-500", bg: "bg-cyan-50" },
  sales: { label: "Sales", color: "text-green-600", bg: "bg-green-50" },
  project_manager: { label: "Project Manager", color: "text-amber-500", bg: "bg-amber-50" },
  employee: { label: "Employee", color: "text-indigo-500", bg: "bg-indigo-50" },
};

/* ─── THEME: colourful icon per sidebar item (full class names so Tailwind keeps them) ─── */
const ICON_TONES = {
  dashboard: "text-sky-400",
  leads: "text-orange-400",
  newsletters: "text-emerald-400",
  contacts: "text-fuchsia-400",
  comments: "text-amber-400",
  leaves: "text-pink-400",
  payroll: "text-cyan-400",
  attendance: "text-lime-400",
  holidays: "text-violet-400",
  "wfh-settings": "text-teal-400",
  users: "text-rose-400",
  analytics: "text-indigo-400",
  projects: "text-yellow-400",
  proposals: "text-orange-300",
  invoices: "text-emerald-300",
  "create-proposals": "text-purple-400",
  "my-projects": "text-blue-400",
  tenders: "text-amber-300",
  "my-leads": "text-cyan-300",
  settings: "text-slate-300",
};

/* ─── THEME: gradients for metric cards ─── */
const METRIC_GRADIENTS = {
  blue: "bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 shadow-indigo-500/30",
  green: "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30",
  violet: "bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-fuchsia-500/30",
  amber: "bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30",
};

/* ─── tiny stat badge ─── */
const CountBadge = ({ count, color }) => (
  <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
    {count}
  </span>
);

/* ─── sidebar nav item — dark navy, coloured icons ─── */
const NavItem = ({ icon: Icon, label, active, onClick, badge, badgeColor, collapsed, itemKey }) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`relative flex w-full items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150
      ${active
        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
        : "text-slate-300 hover:text-white hover:bg-white/10"
      }`}
  >
    <span className={`flex-shrink-0 ${active ? "text-white" : ICON_TONES[itemKey] || "text-sky-400"}`}>
      <Icon size={18} strokeWidth={active ? 2.2 : 2} />
    </span>
    {!collapsed && (
      <>
        <span className="truncate">{label}</span>
        {badge !== undefined && (
          <CountBadge
            count={badge}
            color={active ? "bg-white/25 text-white" : badgeColor}
          />
        )}
      </>
    )}
    {collapsed && badge > 0 && (
      <span className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full" />
    )}
  </motion.button>
);

/* ─── Metric card — vivid gradient style ─── */
const MetricCard = ({ label, value, icon: Icon, tint, iconColor, subLabel, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${tint}`}
  >
    {/* decorative wave */}
    <svg
      aria-hidden="true"
      viewBox="0 0 200 60"
      preserveAspectRatio="none"
      className="pointer-events-none absolute bottom-0 right-0 h-14 w-3/4 opacity-40"
    >
      <path d="M0 50 L25 38 L50 44 L75 26 L100 32 L125 16 L150 24 L175 8 L200 14 L200 60 L0 60 Z" fill="rgba(255,255,255,0.22)" />
      <path d="M0 50 L25 38 L50 44 L75 26 L100 32 L125 16 L150 24 L175 8 L200 14" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
    </svg>

    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-white/85 text-[12px] font-medium mb-3">{label}</p>
        {loading ? (
          <div className="h-9 w-20 bg-white/30 animate-pulse rounded-lg" />
        ) : (
          <h3 className="text-[34px] font-black text-white tabular-nums leading-none">{value}</h3>
        )}
        <p className="text-[12px] font-medium mt-2 text-white/90">{subLabel}</p>
      </div>
      <div className="p-2.5 rounded-xl bg-white/20 text-white backdrop-blur-sm">
        <Icon size={22} strokeWidth={1.8} />
      </div>
    </div>
  </motion.div>
);

/* ─── Access denied component ─── */
const AccessDenied = ({ goBack }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center h-64 text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
      <Lock size={24} className="text-red-400" />
    </div>
    <h3 className="text-[16px] font-bold text-slate-800 mb-2">Access Denied</h3>
    <p className="text-slate-400 text-[13px] mb-5">You don't have permission to view this section.</p>
    <button
      onClick={goBack}
      className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 bg-white hover:bg-slate-50 transition border border-slate-200 shadow-sm"
    >
      ← Go back
    </button>
  </motion.div>
);

/* ─── Logout confirmation modal ─── */
const LogoutConfirmModal = ({ open, onConfirm, onCancel }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-100">
            <LogOut size={24} className="text-red-500" />
          </div>
          <h3 id="logout-title" className="text-[17px] font-bold text-slate-800">
            Logout?
          </h3>
          <p className="mt-1.5 text-[13px] text-slate-500">
            Are you sure you want to logout?
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              No
            </button>
            <button
              onClick={onConfirm}
              autoFocus
              className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-red-500/25 hover:from-red-600 hover:to-red-700 transition"
            >
              Yes, Logout
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ─── main component ─── */
const Dashboard = () => {
  

  const { admin, logout, hasPermission } = useContext(AuthContext);
  const reduceMotion = useReducedMotion();

  const canAccessLeaves = [
  "view_leaves", "apply_leaves", "approve_leaves",
  "view_all_leaves", "manage_leave_settings", "manage_leave_balances",
].some((permission) => hasPermission(permission));

  const canAccessHolidays = [
  "view_holidays",
  "create_holidays",
  "edit_holidays",
  "delete_holidays",
  "manage_weekly_offs",
].some((permission) => hasPermission(permission));
  const navigate = useNavigate();

  const [time, setTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false); 
  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get("module") || "dashboard";
  const [settingsSubPage, setSettingsSubPage] = useState("users");
  const [contactCount, setContactCount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [newsletterCount, setNewsletterCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentCount, setCommentCount] = useState(0);
  const [roleConfig, setRoleConfig] = useState({});

  const [assignedProjectCount, setAssignedProjectCount] = useState(0);
  const [assignedLeadCount, setAssignedLeadCount] = useState(0);

  const roleInfo = roleConfig[admin?.role]
    ? {
        label: roleConfig[admin?.role].label,
        color: "text-gray-600",
        bg: "bg-gray-100",
      }
    : {
        label: admin?.role || "User",
        color: "text-gray-500",
        bg: "bg-gray-100",
      };

 // Logout button dabane par sirf popup khulega
const handleLogout = () => {
  setProfileOpen(false);
  setSidebarOpen(false);
  setLogoutConfirmOpen(true);
};

// "Yes" dabane par asli logout hoga
const confirmLogout = () => {
  setLogoutConfirmOpen(false);
  logout();
  navigate("/");
};

  /* ── clock ── */
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    fetch(`${API_BASE_URL}/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const allRoles =
          data.roles ||
          [...(data.systemRoles || []), ...(data.customRoles || [])];
        const cfg = {};
        allRoles.forEach((r) => {
          cfg[r.slug] = { label: r.name, hex: r.color || "#22c55e" };
        });
        setRoleConfig(cfg);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!hasPermission("view_assigned_projects")) return;
    const token = localStorage.getItem("adminToken");
    fetch(`${API_BASE_URL}/my-projects/count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setAssignedProjectCount(d.count || 0))
      .catch(() => setAssignedProjectCount(0));
  }, []);

  useEffect(() => {
    if (!admin) return;
    const token = localStorage.getItem("adminToken");
    fetch(`${API_BASE_URL}/my-leads/count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        console.log("MY LEADS COUNT RESPONSE =>", d);
        if (d.success !== false) setAssignedLeadCount(d.count || 0);
      })
      .catch((err) => {
        console.log(err);
        setAssignedLeadCount(0);
      });
  }, [admin]);

  /* ── fetch ── */
  const fetchDashboardData = async () => {

    try {
      
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };

      const promises = [];
      if (hasPermission("view_leads")) promises.push(fetch(`${API_BASE_URL}/leads`, { headers }));
      else promises.push(Promise.resolve({ json: () => [] }));

      if (hasPermission("view_contacts")) promises.push(fetch(`${API_BASE_URL}/contact-leads`, { headers }));
      else promises.push(Promise.resolve({ json: () => [] }));

      if (hasPermission("view_newsletters")) promises.push(fetch(`${API_BASE_URL}/newsletters`, { headers }));
      else promises.push(Promise.resolve({ json: () => [] }));

      if (hasPermission("view_comments")) promises.push(fetch(`${API_BASE_URL}/comments/count`, { headers }));
      else promises.push(Promise.resolve({ json: () => ({ total: 0 }) }));

      const [leadsRes, contactsRes, newslettersRes, commentsCountRes] = await Promise.all(promises);

      const leads = await leadsRes.json();
      const contacts = await contactsRes.json();
      const newsletters = await newslettersRes.json();
      const commentsCountData = await commentsCountRes.json();

      if (Array.isArray(leads) && leads.length > leadCount && leadCount !== 0) {
        toast.success("New Lead Received 🚀");
        setNotifications((prev) => [{ message: "New Lead Received", time: new Date() }, ...prev]);
      }
      if (Array.isArray(newsletters) && newsletters.length > newsletterCount && newsletterCount !== 0) {
        toast.success("New Newsletter Subscriber 📩");
        setNotifications((prev) => [{ message: "New Newsletter Subscriber", time: new Date() }, ...prev]);
      }
      if (commentsCountData?.total > commentCount && commentCount !== 0) {
        toast.success("New Comment Received 💬");
        setNotifications((prev) => [{ message: "New Comment Received", time: new Date() }, ...prev]);
      }

      setLeadCount(Array.isArray(leads) ? leads.length : 0);
      setNewsletterCount(Array.isArray(newsletters) ? newsletters.length : 0);
      setContactCount(Array.isArray(contacts) ? contacts.length : 0);
      setCommentCount(commentsCountData?.total || 0);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  /* ── date format ── */
  const formatDate = time.toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const formatTime = time.toLocaleTimeString();

  /* ── sidebar nav groups ── */
  const mainNav = [
    { icon: LayoutDashboard, label: "Overview", key: "dashboard", show: true },
  ];

  const dataNav = [
    // {
    //   icon: FileText, label: "Leads", key: "leads",
    //   badge: leadCount, badgeColor: "bg-blue-500/20 text-blue-300",
    //   show: hasPermission("view_leads"),
    // },
    // {
    //   icon: Users, label: "Newsletter", key: "newsletters",
    //   badge: newsletterCount, badgeColor: "bg-emerald-500/20 text-emerald-300",
    //   show: hasPermission("view_newsletters"),
    // },
    // {
    //   icon: Mail, label: "Contact Leads", key: "contacts",
    //   badge: contactCount, badgeColor: "bg-fuchsia-500/20 text-fuchsia-300",
    //   show: hasPermission("view_contacts"),
    // },
    // {
    //   icon: MessageSquareText, label: "Comments", key: "comments",
    //   badge: commentCount, badgeColor: "bg-amber-500/20 text-amber-300",
    //   show: hasPermission("view_comments"),
    // },
  ].filter((n) => n.show);

  const managementNav = [

    {
  icon: CalendarDays,
  label: "Leave Management",
  key: "leaves",
  show: canAccessLeaves,
},

{
  icon: WalletCards,
  label: "Payroll",
  key: "payroll",
  show: hasPermission("view_payroll"),
},
     {
  icon: CalendarCheck,
  label: "Attendance",
  key: "attendance",
  show: [
    "view_attendance",
    "mark_attendance",
    "view_all_attendance",
    "view_monthly_records",
  ].some((permission) => hasPermission(permission)),
},

{
  icon: CalendarDays,
  label: "Holidays & Weekly Offs",
  key: "holidays",
  show: canAccessHolidays,
},

{
      icon: Settings,
      label: "WFH Settings",
      key: "wfh-settings",
      show: hasPermission("manage_wfh_settings"),
    },

 
    {
      icon: UserCog, label: "Users", key: "users",
      show: hasPermission("view_users"),
    },
    // {
    //   icon: BarChart3, label: "Analytics", key: "analytics",
    //   show: hasPermission("view_analytics"),
    // },
    // {
    //   icon: FolderKanban, label: "Projects", key: "projects",
    //   show: hasPermission("view_projects"),
    // },
    // {
    //   icon: Sun, label: "Proposals", key: "proposals",
    //   show: hasPermission("view_proposals"),
    // },
    {icon: ReceiptText, label: "Invoices", key: "invoices",
      show: hasPermission("view_invoices"),
  },

    // {
    //   icon: Sun, label: " Create Proposals", key: "create-proposals",
    //   show: hasPermission("create_proposals"),
    // },

    {
      icon: FolderKanban,
      label: "My Projects",
      key: "my-projects",
      badge: assignedProjectCount,
      badgeColor: "bg-indigo-500/20 text-indigo-300",
      show: hasPermission("view_assigned_projects") && assignedProjectCount > 0,
    },
    {
  icon: Briefcase,
  label: "Tender Management",
  key: "tenders",
  show: hasPermission("view_tenders"),
},
    {
      icon: FileText,
      label: "My Leads",
      key: "my-leads",
      badge: assignedLeadCount,
      badgeColor: "bg-cyan-500/20 text-cyan-300",
      show: hasPermission("view_assigned_leads") && assignedLeadCount > 0,
    },
  ].filter((n) => n.show);

  const systemNav = [
    {
      icon: Settings, label: "Settings", key: "settings",
      show: hasPermission("view_settings") || hasPermission("view_roles"),
    },
  ].filter((n) => n.show);

  const hasOverviewMetrics = [
    "view_leads",
    "view_newsletters",
    "view_contacts",
    "view_comments",
  ].some((permission) => hasPermission(permission));
  const overviewShortcuts = [...dataNav, ...managementNav, ...systemNav]
    .filter((item, index, items) =>
      items.findIndex((candidate) => candidate.key === item.key) === index
    )
    .slice(0, 4);

  const pageTitle = {
    dashboard: "Overview",
    attendance: "Attendance",
    holidays: "Holidays & Weekly Offs",
    leaves: "Leave Management",
    leads: "Leads",
    newsletters: "Newsletter Subscribers",
    contacts: "Contact Leads",
    comments: "Comments",
    users: "Users",
    analytics: "Analytics",
    projects: "Projects",
    settings: "Settings",
    proposals: "Proposal Generation",
    invoices: "Invoices",
    "create-proposals": "Create Proposals",
    "my-projects": "My Assigned Projects",
    "my-leads": "My Assigned Leads",
    "tenders": "Tender Management",
    
  }[page] || "Dashboard";

  const navigateTo = (key) => {
  setSearchParams(
    (currentParams) => {
      const nextParams = new URLSearchParams(currentParams);

      if (!key || key === "dashboard") {
        nextParams.delete("module");
      } else {
        nextParams.set("module", key);
      }

      return nextParams;
    },
    { replace: true }
  );

  setSidebarOpen(false);
};

  /* setPage was used below but never defined — it now simply routes through navigateTo */
  const setPage = (key) => navigateTo(key);

  /* ── Settings tabs ── */
  const settingsTabs = [
    hasPermission("view_users") && { key: "users", icon: UserCog, label: "Users" },
    hasPermission("view_roles") && { key: "roles", icon: Shield, label: "Roles & Permissions" },
    hasPermission("view_settings") && { key: "general", icon: Settings, label: "General" },
  ].filter(Boolean);

  /* shared sidebar section label + thin scrollbar styles */
  const sectionLabel = "text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2 mb-1.5";
  const thinScroll = "[scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.35)_transparent]";

  return (
    <div className="flex min-h-screen bg-[#eef2f9] text-slate-800 font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#1f2937",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            fontSize: "13px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          },
        }}
      />

      <LogoutConfirmModal
  open={logoutConfirmOpen}
  onConfirm={confirmLogout}
  onCancel={() => setLogoutConfirmOpen(false)}
/>

      {/* ── mobile backdrop ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ────────────────────── SIDEBAR ────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-[100dvh] z-40 flex flex-col
          bg-gradient-to-b from-[#0a1a4f] via-[#07163f] to-[#050f2e]
          border-r border-white/5
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? "w-[72px]" : "w-[240px]"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        {/* logo */}
        <div className="flex shrink-0 items-center gap-2.5 px-4 py-4 border-b border-white/10">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Zap size={17} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <p className="text-[17px] font-black tracking-tight text-white">wheedle Tech</p>
          )}
        </div>

        {/* nav — min-h-0 lets it shrink and scroll so items never get cut at 100% zoom */}
        <nav className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-4 ${thinScroll}`}>
          {/* main */}
          <div className="space-y-0.5">
            {!sidebarCollapsed && <p className={sectionLabel}>Main</p>}
            {mainNav.map((item) => (
              <NavItem
                key={item.key} {...item}
                itemKey={item.key}
                active={page === item.key}
                onClick={() => navigateTo(item.key)}
                collapsed={sidebarCollapsed}
              />
            ))}
          </div>

          {/* data */}
          {dataNav.length > 0 && (
            <div className="space-y-0.5">
              {!sidebarCollapsed && <p className={sectionLabel}>Data</p>}
              {dataNav.map((item) => (
                <NavItem
                  key={item.key} {...item}
                  itemKey={item.key}
                  active={page === item.key}
                  onClick={() => navigateTo(item.key)}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </div>
          )}

          {/* management */}
          {managementNav.length > 0 && (
            <div className="space-y-0.5">
              {!sidebarCollapsed && <p className={sectionLabel}>Management</p>}
              {managementNav.map((item) => (
                <NavItem
                  key={item.key} {...item}
                  itemKey={item.key}
                  active={page === item.key}
                  onClick={() => navigateTo(item.key)}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </div>
          )}

          {/* system */}
          {systemNav.length > 0 && (
            <div className="space-y-0.5">
              {!sidebarCollapsed && <p className={sectionLabel}>System</p>}
              {systemNav.map((item) => (
                <NavItem
                  key={item.key} {...item}
                  itemKey={item.key}
                  active={page === item.key}
                  onClick={() => navigateTo(item.key)}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </div>
          )}
        </nav>

        {/* admin footer — compact so it never pushes nav items out */}
        <div className="shrink-0 px-3 py-3 border-t border-white/10 bg-black/10">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0 ring-2 ring-white/20">
                {admin?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-[13px] font-semibold text-white truncate">{admin?.name}</p>
                <p className="text-[11px] text-emerald-400 truncate">{roleInfo.label}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-2 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-red-500/20 transition-all text-[13px] font-medium"
          >
            <LogOut size={16} strokeWidth={1.8} className="text-red-400" />
            {!sidebarCollapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* ────────────────────── MAIN AREA ────────────────────── */}
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300
          ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[240px]"}`}
      >
        {/* ── TOPBAR ── */}
        <header className="sticky top-0 z-30 bg-gradient-to-r from-[#0a1a4f] to-[#0d2468] border-b border-white/10 px-6 py-3 flex justify-between items-center shadow-lg shadow-slate-900/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-400" />
              <h1 className="font-semibold text-[15px] text-white">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Role badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">
              <Shield size={11} className="text-sky-300" />
              <span className="text-[11px] font-semibold text-slate-100">{roleInfo.label}</span>
            </div>

            {/* clock */}
            <div className="hidden md:flex flex-col items-end mr-1">
              <p className="text-[11px] text-slate-300">{formatDate}</p>
              <p className="text-[13px] font-semibold text-white tabular-nums">{formatTime}</p>
            </div>

            {/* notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
              >
                <Bell size={18} strokeWidth={1.8} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full ring-2 ring-[#0a1a4f]">
                    {notifications.length}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-2xl shadow-slate-900/15 rounded-2xl p-4 z-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-sm text-slate-800">Notifications</p>
                      {notifications.length > 0 && (
                        <span className="text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                          {notifications.length} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1.5">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6">
                          <Bell size={24} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-sm text-slate-400">All caught up</p>
                        </div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition">
                            <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                            <div>
                              <p className="text-[13px] text-slate-700">{n.message}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{new Date(n.time).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* profile */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/10 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/30">
                  {admin?.name?.[0]?.toUpperCase() || "A"}
                </div>
                <span className="hidden md:block text-[13px] font-medium text-white">{admin?.name}</span>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 shadow-2xl shadow-slate-900/15 rounded-2xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                      <p className="text-[13px] font-semibold text-slate-800">{admin?.name}</p>
                      <p className="text-[11px] font-medium mt-0.5 text-blue-600">{roleInfo.label}</p>
                      <p className="text-[10px] text-slate-400 truncate">{admin?.email}</p>
                    </div>
                    <button
                    onClick={() => { navigateTo("profile"); setProfileOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-[13px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-2 transition">
                      <User size={13} /> Profile
                    </button>
                    {(hasPermission("view_settings") || hasPermission("view_roles") || hasPermission("view_users")) && (
                      <button
                        onClick={() => { navigateTo("settings"); setProfileOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-[13px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-2 transition"
                      >
                        <Settings size={13} /> Settings
                      </button>
                    )}
                    <div className="border-t border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-[13px] text-red-500 hover:bg-red-50 flex items-center gap-2 transition"
                    >
                      <LogOut size={13} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main className="flex-1 p-6 overflow-y-auto bg-[#eef2f9]">
          <AnimatePresence mode="wait">

            {/* ── DASHBOARD ── */}
            {page === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[#0a1a4f]">
                    Good{" "}
                    {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},
                    {" "}{admin?.name?.split(" ")[0]} 👋
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">Here's what's happening in your CRM today.</p>
                </div>

                {/* metric cards — vivid gradients */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {hasPermission("view_leads") && (
                    <MetricCard
                      label="Total Leads"
                      value={leadCount}
                      icon={FileText}
                      tint={METRIC_GRADIENTS.blue}
                      iconColor="text-white"
                      subLabel="All time"
                      loading={loading}
                    />
                  )}
                  {hasPermission("view_newsletters") && (
                    <MetricCard
                      label="Newsletter Subscribers"
                      value={newsletterCount}
                      icon={Users}
                      tint={METRIC_GRADIENTS.green}
                      iconColor="text-white"
                      subLabel="All time"
                      loading={loading}
                    />
                  )}
                  {hasPermission("view_contacts") && (
                    <MetricCard
                      label="Contact Leads"
                      value={contactCount}
                      icon={Mail}
                      tint={METRIC_GRADIENTS.violet}
                      iconColor="text-white"
                      subLabel="All time"
                      loading={loading}
                    />
                  )}
                  {hasPermission("view_comments") && (
                    <MetricCard
                      label="Comments"
                      value={commentCount}
                      icon={MessageSquareText}
                      tint={METRIC_GRADIENTS.amber}
                      iconColor="text-white"
                      subLabel="All time"
                      loading={loading}
                    />
                  )}
                </div>

                {/* quick access */}
                {dataNav.length > 0 && (
                  <div className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-900/5 border border-slate-100">
                    <p className="text-[12px] font-bold text-[#0a1a4f] mb-3">Quick Access</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                      {dataNav.map((item) => (
                        <motion.button
                          key={item.key}
                          whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                          onClick={() => setPage(item.key)}
                          className="flex items-center gap-3 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md hover:shadow-blue-500/10 transition-all group text-left"
                        >
                          <div className="p-2 rounded-xl bg-[#0a1a4f] group-hover:bg-blue-600 transition">
                            <item.icon size={18} className={`${ICON_TONES[item.key] || "text-sky-400"} group-hover:text-white transition`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-slate-700 group-hover:text-[#0a1a4f] transition truncate">{item.label}</p>
                            <p className="text-[11px] text-slate-400">{item.badge} records</p>
                          </div>
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition flex-shrink-0" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {!hasOverviewMetrics && dataNav.length === 0 && (
                  <motion.section
                    initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
                    className="relative isolate min-h-[360px] overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50/80 p-6 shadow-sm sm:p-10"
                    aria-labelledby="workspace-welcome-title"
                  >
                    <motion.div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full bg-blue-300/30 blur-2xl"
                      animate={reduceMotion ? { opacity: 0.5 } : { scale: [1, 1.08, 1], opacity: [0.45, 0.7, 0.45] }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-violet-300/30 blur-2xl"
                      animate={reduceMotion ? { opacity: 0.4 } : { y: [0, -12, 0], opacity: [0.35, 0.6, 0.35] }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />

                    <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
                      <motion.div
                        initial={reduceMotion ? false : { scale: 0.8, rotate: -8 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 14, delay: 0.12 }}
                        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                      >
                        <Activity size={28} />
                      </motion.div>
                      <h3 id="workspace-welcome-title" className="text-2xl font-bold tracking-tight text-[#0a1a4f] sm:text-3xl">
                        Your workspace is ready
                      </h3>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                        Welcome, {admin?.name?.split(" ")[0] || "there"}. Use the shortcuts below to get to the tools available to you.
                      </p>

                      {overviewShortcuts.length > 0 ? (
                        <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                          {overviewShortcuts.map((item, index) => (
                            <motion.button
                              key={item.key}
                              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={reduceMotion ? { duration: 0 } : { duration: 0.3, delay: 0.18 + index * 0.07 }}
                              whileHover={reduceMotion ? undefined : { y: -3 }}
                              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                              onClick={() => navigateTo(item.key)}
                              className="group flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0a1a4f] transition group-hover:bg-blue-600">
                                <item.icon size={20} className={`${ICON_TONES[item.key] || "text-sky-400"} group-hover:text-white transition`} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-slate-700">{item.label}</span>
                                <span className="mt-0.5 block text-xs text-slate-400">Open this section</span>
                              </span>
                              <ChevronRight size={16} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                            </motion.button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-7 rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-sm text-slate-500">
                          Ask your administrator to grant access to the sections you need.
                        </p>
                      )}
                    </div>
                  </motion.section>
                )}
              </motion.div>
            )}


            {page === "profile" && (
  <motion.div
    key="profile"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="max-w-2xl space-y-6"
  >
    <div>
      <h2 className="text-xl font-black text-[#0a1a4f]">Profile</h2>
      <p className="text-slate-500 text-[13px] mt-0.5">
        View your account information.
      </p>
    </div>

    <div className="bg-white border border-slate-100 shadow-sm shadow-slate-900/5 rounded-2xl p-6">
      <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/30">
          {admin?.name?.[0]?.toUpperCase() || "A"}
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-800">
            {admin?.name || "Admin"}
          </h3>
          <p className="text-[13px] text-blue-600">
            {roleInfo.label}
          </p>
        </div>
      </div>

      <dl className="grid gap-4 pt-5 sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-semibold uppercase text-slate-400">
            Name
          </dt>
          <dd className="mt-1 text-[13px] text-slate-700">
            {admin?.name || "Not available"}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold uppercase text-slate-400">
            Email
          </dt>
          <dd className="mt-1 text-[13px] text-slate-700 break-words">
            {admin?.email || "Not available"}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold uppercase text-slate-400">
            Role
          </dt>
          <dd className="mt-1 text-[13px] text-slate-700">
            {roleInfo.label}
          </dd>
        </div>

          <div>
    <dt className="text-[11px] font-semibold uppercase text-slate-400">Joining Date</dt>
    <dd className="mt-1 text-[13px] text-slate-700">
      {admin?.employment?.joiningDate
        ? new Date(admin.employment.joiningDate).toLocaleDateString()
        : "Not available"}
    </dd>
  </div>

  <div>
    <dt className="text-[11px] font-semibold uppercase text-slate-400">Employment Status</dt>
    <dd className="mt-1 text-[13px] text-slate-700">
      {admin?.employment?.currentlyWorking ? "Currently Working" : "Not Working"}
    </dd>
  </div>

  {!admin?.employment?.currentlyWorking && (
    <div>
      <dt className="text-[11px] font-semibold uppercase text-slate-400">Exit Date</dt>
      <dd className="mt-1 text-[13px] text-slate-700">
        {admin?.employment?.exitDate
          ? new Date(admin.employment.exitDate).toLocaleDateString()
          : "Not available"}
      </dd>
    </div>
  )}
      </dl>
    </div>

    <button
      onClick={() => navigateTo("dashboard")}
      className="px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-500/25 transition"
    >
      Back to dashboard
    </button>
  </motion.div>
)}

            {/* ── DATA PAGES ── */}
            {page === "leads" && (
              <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {hasPermission("view_leads")
                  ? <ViewLeads goBack={() => setPage("dashboard")} />
                  : <AccessDenied goBack={() => setPage("dashboard")} />}
              </motion.div>
            )}

            {page === "newsletters" && (
              <motion.div key="newsletters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {hasPermission("view_newsletters")
                  ? <ViewNewsletters goBack={() => setPage("dashboard")} />
                  : <AccessDenied goBack={() => setPage("dashboard")} />}
              </motion.div>
            )}

            {page === "contacts" && (
              <motion.div key="contacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {hasPermission("view_contacts")
                  ? <ViewContactLeads goBack={() => setPage("dashboard")} />
                  : <AccessDenied goBack={() => setPage("dashboard")} />}
              </motion.div>
            )}

            {page === "comments" && (
              <motion.div key="comments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {hasPermission("view_comments")
                  ? <ViewComments goBack={() => setPage("dashboard")} />
                  : <AccessDenied goBack={() => setPage("dashboard")} />}
              </motion.div>
            )}

            {page === "users" && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {hasPermission("view_users")
                  ? <ViewUsers />
                  : <AccessDenied goBack={() => setPage("dashboard")} />}
              </motion.div>
            )}

            {page === "analytics" && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {hasPermission("view_analytics")
                  ? <ViewAnalytics />
                  : <AccessDenied goBack={() => setPage("dashboard")} />}
              </motion.div>
            )}

            {page === "projects" && (
              <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {hasPermission("view_projects")
                  ? <ViewProjects />
                  : <AccessDenied goBack={() => setPage("dashboard")} />}
              </motion.div>
            )}



            {page === "payroll" && (
  hasPermission("view_payroll") ? (
    <PayrollModule hasPermission={hasPermission} />
  ) : (
    <AccessDenied goBack={() => setPage("dashboard")} />
  )
)}


              {page === "wfh-settings" && (
  hasPermission("manage_wfh_settings") ? (
    <WorkFromHomeSettings />
  ) : (
    <AccessDenied goBack={() => setPage("dashboard")} />
  )
)}

  {page === "attendance" && (
  [
    "view_attendance",
    "mark_attendance",
    "view_all_attendance",
    "view_monthly_records",
  ].some((permission) => hasPermission(permission)) ? (
    <AttendanceHome
      key={`attendance-${admin?._id || admin?.id || admin?.email}`}
    />
  ) : (
    <AccessDenied goBack={() => setPage("dashboard")} />
  )
)}

{page === "holidays" && (
  canAccessHolidays ? (
    <HolidaysModule
      key={`holidays-${admin?._id || admin?.id || admin?.email}`}
    />
  ) : (
    <AccessDenied goBack={() => setPage("dashboard")} />
  )
)}

{page === "leaves" && (
  canAccessLeaves ? (
    <LeaveModule key={`leaves-${admin?._id || admin?.id || admin?.email}`} />
  ) : (
    <AccessDenied goBack={() => setPage("dashboard")} />
  )
)}

         {page === "invoices" && ( hasPermission("view_invoices") ? (
    <motion.div key="invoices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <InvoiceModule />
    </motion.div>
  ) : (
    <AccessDenied
      goBack={() => setPage("dashboard")}
    />
  )
)}



            {page === "proposals" && (
              <motion.div key="proposals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {hasPermission("view_proposals")
                  ? <ViewProposals />
                  : <AccessDenied goBack={() => setPage("dashboard")} />}
              </motion.div>
            )}

            {page === "create-proposals" && (
              <motion.div key="create-proposals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {hasPermission("create_proposals")
                  ? <ProposalHub />
                  : <AccessDenied goBack={() => setPage("dashboard")} />}
              </motion.div>
            )}

            {page === "tenders" && (
              <motion.div key="tenders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {hasPermission("view_tenders")
                  ? <TenderManagement />
                  : <AccessDenied goBack={() => setPage("dashboard")} />}
              </motion.div>
            )}

            {page === "my-projects" && (
              <motion.div key="my-projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {hasPermission("view_assigned_projects") && assignedProjectCount > 0
                  ? <MyAssignedProjects />
                  : <AccessDenied goBack={() => setPage("dashboard")} />}
              </motion.div>
            )}

            {page === "my-leads" && (
              <motion.div
                key="my-leads"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {hasPermission("view_assigned_leads") && assignedLeadCount > 0
                  ? <AssignedLeads />
                  : <AccessDenied goBack={() => setPage("dashboard")} />}
              </motion.div>
            )}

            {/* ── SETTINGS ── */}
            {page === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-[#0a1a4f]">Settings</h2>
                  <p className="text-slate-500 text-[13px] mt-0.5">Manage system configuration, users, and access control.</p>
                </div>

                {settingsTabs.length > 0 && (
                  <div className="flex gap-1 bg-white rounded-xl p-1 w-fit flex-wrap border border-slate-200 shadow-sm">
                    {settingsTabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setSettingsSubPage(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all
                          ${settingsSubPage === tab.key
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          }`}
                      >
                        <tab.icon size={14} />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                {settingsSubPage === "users" && (
                  hasPermission("view_users")
                    ? <ViewUsers />
                    : <AccessDenied goBack={() => setPage("dashboard")} />
                )}

                {settingsSubPage === "roles" && (
                  hasPermission("view_roles")
                    ? <ViewRoles />
                    : <AccessDenied goBack={() => setPage("dashboard")} />
                )}

                {settingsSubPage === "general" && (
                  hasPermission("view_settings")
                    ? (
                      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-8 text-center">
                        <Settings size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-400 text-[13px]">General settings component — add your settings here</p>
                      </div>
                    )
                    : <AccessDenied goBack={() => setPage("dashboard")} />
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;



// import { useContext, useState, useEffect } from "react";
// import { AuthContext } from "../auth/AuthContext";
// import { useNavigate,useParams, useSearchParams, } from "react-router-dom";
// import ViewLeads from "./leads/ViewLeads";
// import ViewNewsletters from "./ViewNewsletters";
// import ViewContactLeads from "./ViewContactLeads";
// import ViewComments from "./ViewComments";
// import ViewRoles from "./ViewRoles";
// import ViewUsers from "./ViewUsers";
// import API_BASE_URL from "../config/api";
// import ViewProjects from "./projects/ViewProjects";
// import MessageSquareText from "lucide-react/dist/esm/icons/message-square-text";
// import ViewProposals from "./proposal/ViewProposals";
// import { Sun } from "lucide-react";
// import MyAssignedProjects from "./MyAssignedProjects";
// import AssignedLeads from "./leads/AssignedLeads";
// import ViewAnalytics from "./ViewAnalytics";
// import CreateProposal from "./newproposal/CreateProposal";
// import ProposalHub from "./newproposal/ProposalHub";
// import TenderManagement from "./tender/TenderManagement";
// import InvoiceModule from "./invoices/InvoiceModule";
// import AttendanceHome from "./attendance/AttendanceHome";
// import HolidaysModule from "./holidays/HolidaysModule";
// import LeaveModule from "./leaves/LeaveModule";
// import { leaveLinkParams } from "./leaves/leaveLink";
// import WorkFromHomeSettings from "./wfh/WorkFromHomeSettings";
// import PayrollModule from "./payroll/PayrollModule";


// import {
//   LayoutDashboard,
//   Users,
//   Settings,
//   LogOut,
//   Menu,
//   Bell,
//   User,
//   FileText,
//   Mail,
//   TrendingUp,
//   ChevronRight,
//   Activity,
//   X,
//   Zap,
//   Shield,
//   FolderKanban,
//   BarChart3,
//   UserCog,
//   Lock,
//   Briefcase,
//   ReceiptText,
//   CalendarCheck,
//   WalletCards,
//   CalendarDays,
// } from "lucide-react";

// import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// /* ─── Role badge config ─────────────────────────────────────────────────────── */
// const ROLE_CONFIG = {
//   superadmin: { label: "Super Admin", color: "text-red-500", bg: "bg-red-50" },
//   admin: { label: "Admin", color: "text-orange-500", bg: "bg-orange-50" },
//   manager: { label: "Manager", color: "text-violet-500", bg: "bg-violet-50" },
//   hr: { label: "HR", color: "text-cyan-500", bg: "bg-cyan-50" },
//   sales: { label: "Sales", color: "text-green-600", bg: "bg-green-50" },
//   project_manager: { label: "Project Manager", color: "text-amber-500", bg: "bg-amber-50" },
//   employee: { label: "Employee", color: "text-indigo-500", bg: "bg-indigo-50" },
// };

// /* ─── tiny stat badge ─── */
// const CountBadge = ({ count, color }) => (
//   <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
//     {count}
//   </span>
// );

// /* ─── sidebar nav item — Dasher style ─── */
// const NavItem = ({ icon: Icon, label, active, onClick, badge, badgeColor, collapsed }) => (
//   <motion.button
//     whileTap={{ scale: 0.97 }}
//     onClick={onClick}
//     className={`relative flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
//       ${active
//         ? "bg-green-100 text-green-700"
//         : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
//       }`}
//   >
//     <span className={`flex-shrink-0 ${active ? "text-green-600" : "text-gray-400"}`}>
//       <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
//     </span>
//     {!collapsed && (
//       <>
//         <span className="truncate">{label}</span>
//         {badge !== undefined && (
//           <CountBadge
//             count={badge}
//             color={active ? "bg-green-200 text-green-700" : badgeColor}
//           />
//         )}
//       </>
//     )}
//     {collapsed && badge > 0 && (
//       <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
//     )}
//   </motion.button>
// );

// /* ─── Metric card — Dasher tinted style ─── */
// const MetricCard = ({ label, value, icon: Icon, tint, iconColor, subLabel, loading }) => (
//   <motion.div
//     initial={{ opacity: 0, y: 14 }}
//     animate={{ opacity: 1, y: 0 }}
//     className={`relative rounded-2xl p-5 ${tint}`}
//   >
//     <div className="flex items-start justify-between">
//       <div>
//         <p className="text-gray-500 text-[12px] font-medium mb-3">{label}</p>
//         {loading ? (
//           <div className="h-9 w-20 bg-white/60 animate-pulse rounded-lg" />
//         ) : (
//           <h3 className="text-[36px] font-black text-gray-800 tabular-nums leading-none">{value}</h3>
//         )}
//         <p className={`text-[12px] font-medium mt-2 ${iconColor}`}>{subLabel}</p>
//       </div>
//       <div className={`p-2.5 rounded-xl ${iconColor} bg-white/50`}>
//         <Icon size={20} strokeWidth={1.8} />
//       </div>
//     </div>
//   </motion.div>
// );

// /* ─── Access denied component ─── */
// const AccessDenied = ({ goBack }) => (
//   <motion.div
//     initial={{ opacity: 0, y: 10 }}
//     animate={{ opacity: 1, y: 0 }}
//     className="flex flex-col items-center justify-center h-64 text-center"
//   >
//     <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
//       <Lock size={24} className="text-red-400" />
//     </div>
//     <h3 className="text-[16px] font-bold text-gray-800 mb-2">Access Denied</h3>
//     <p className="text-gray-400 text-[13px] mb-5">You don't have permission to view this section.</p>
//     <button
//       onClick={goBack}
//       className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition border border-gray-200"
//     >
//       ← Go back
//     </button>
//   </motion.div>
// );

// /* ─── main component ─── */
// const Dashboard = () => {
  

//   const { admin, logout, hasPermission } = useContext(AuthContext);
//   const reduceMotion = useReducedMotion();

//   const canAccessLeaves = [
//   "view_leaves", "apply_leaves", "approve_leaves",
//   "view_all_leaves", "manage_leave_settings", "manage_leave_balances",
// ].some((permission) => hasPermission(permission));

//   const canAccessHolidays = [
//   "view_holidays",
//   "create_holidays",
//   "edit_holidays",
//   "delete_holidays",
//   "manage_weekly_offs",
// ].some((permission) => hasPermission(permission));
//   const navigate = useNavigate();

//   const [time, setTime] = useState(new Date());
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [notifOpen, setNotifOpen] = useState(false);
//   const [profileOpen, setProfileOpen] = useState(false);
//   const [searchParams, setSearchParams] = useSearchParams();
//   const page = searchParams.get("module") || "dashboard";
//   const [settingsSubPage, setSettingsSubPage] = useState("users");
//   const [contactCount, setContactCount] = useState(0);
//   const [leadCount, setLeadCount] = useState(0);
//   const [newsletterCount, setNewsletterCount] = useState(0);
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [commentCount, setCommentCount] = useState(0);
//   const [roleConfig, setRoleConfig] = useState({});

//   const [assignedProjectCount, setAssignedProjectCount] = useState(0);
//   const [assignedLeadCount, setAssignedLeadCount] = useState(0);

//   const roleInfo = roleConfig[admin?.role]
//     ? {
//         label: roleConfig[admin?.role].label,
//         color: "text-gray-600",
//         bg: "bg-gray-100",
//       }
//     : {
//         label: admin?.role || "User",
//         color: "text-gray-500",
//         bg: "bg-gray-100",
//       };

//   const handleLogout = () => {
//     logout();
//     navigate("/",);
//   };

//   /* ── clock ── */
//   useEffect(() => {
//     const timer = setInterval(() => setTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   useEffect(() => {
//     const token = localStorage.getItem("adminToken");
//     fetch(`${API_BASE_URL}/roles`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((r) => r.json())
//       .then((data) => {
//         const allRoles =
//           data.roles ||
//           [...(data.systemRoles || []), ...(data.customRoles || [])];
//         const cfg = {};
//         allRoles.forEach((r) => {
//           cfg[r.slug] = { label: r.name, hex: r.color || "#22c55e" };
//         });
//         setRoleConfig(cfg);
//       })
//       .catch(console.error);
//   }, []);

//   useEffect(() => {
//     if (!hasPermission("view_assigned_projects")) return;
//     const token = localStorage.getItem("adminToken");
//     fetch(`${API_BASE_URL}/my-projects/count`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((r) => r.json())
//       .then((d) => setAssignedProjectCount(d.count || 0))
//       .catch(() => setAssignedProjectCount(0));
//   }, []);

//   useEffect(() => {
//     if (!admin) return;
//     const token = localStorage.getItem("adminToken");
//     fetch(`${API_BASE_URL}/my-leads/count`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((r) => r.json())
//       .then((d) => {
//         console.log("MY LEADS COUNT RESPONSE =>", d);
//         if (d.success !== false) setAssignedLeadCount(d.count || 0);
//       })
//       .catch((err) => {
//         console.log(err);
//         setAssignedLeadCount(0);
//       });
//   }, [admin]);

//   /* ── fetch ── */
//   const fetchDashboardData = async () => {

//     try {
      
//       const token = localStorage.getItem("adminToken");
//       const headers = { Authorization: `Bearer ${token}` };

//       const promises = [];
//       if (hasPermission("view_leads")) promises.push(fetch(`${API_BASE_URL}/leads`, { headers }));
//       else promises.push(Promise.resolve({ json: () => [] }));

//       if (hasPermission("view_contacts")) promises.push(fetch(`${API_BASE_URL}/contact-leads`, { headers }));
//       else promises.push(Promise.resolve({ json: () => [] }));

//       if (hasPermission("view_newsletters")) promises.push(fetch(`${API_BASE_URL}/newsletters`, { headers }));
//       else promises.push(Promise.resolve({ json: () => [] }));

//       if (hasPermission("view_comments")) promises.push(fetch(`${API_BASE_URL}/comments/count`, { headers }));
//       else promises.push(Promise.resolve({ json: () => ({ total: 0 }) }));

//       const [leadsRes, contactsRes, newslettersRes, commentsCountRes] = await Promise.all(promises);

//       const leads = await leadsRes.json();
//       const contacts = await contactsRes.json();
//       const newsletters = await newslettersRes.json();
//       const commentsCountData = await commentsCountRes.json();

//       if (Array.isArray(leads) && leads.length > leadCount && leadCount !== 0) {
//         toast.success("New Lead Received 🚀");
//         setNotifications((prev) => [{ message: "New Lead Received", time: new Date() }, ...prev]);
//       }
//       if (Array.isArray(newsletters) && newsletters.length > newsletterCount && newsletterCount !== 0) {
//         toast.success("New Newsletter Subscriber 📩");
//         setNotifications((prev) => [{ message: "New Newsletter Subscriber", time: new Date() }, ...prev]);
//       }
//       if (commentsCountData?.total > commentCount && commentCount !== 0) {
//         toast.success("New Comment Received 💬");
//         setNotifications((prev) => [{ message: "New Comment Received", time: new Date() }, ...prev]);
//       }

//       setLeadCount(Array.isArray(leads) ? leads.length : 0);
//       setNewsletterCount(Array.isArray(newsletters) ? newsletters.length : 0);
//       setContactCount(Array.isArray(contacts) ? contacts.length : 0);
//       setCommentCount(commentsCountData?.total || 0);
//       setLoading(false);
//     } catch (err) {
//       console.error(err);
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboardData();
//     const interval = setInterval(fetchDashboardData, 10000);
//     return () => clearInterval(interval);
//   }, []);

//   /* ── date format ── */
//   const formatDate = time.toLocaleDateString(undefined, {
//     weekday: "long", year: "numeric", month: "long", day: "numeric",
//   });
//   const formatTime = time.toLocaleTimeString();

//   /* ── sidebar nav groups ── */
//   const mainNav = [
//     { icon: LayoutDashboard, label: "Overview", key: "dashboard", show: true },
//   ];

//   const dataNav = [
//     {
//       icon: FileText, label: "Leads", key: "leads",
//       badge: leadCount, badgeColor: "bg-blue-100 text-blue-600",
//       show: hasPermission("view_leads"),
//     },
//     {
//       icon: Users, label: "Newsletter", key: "newsletters",
//       badge: newsletterCount, badgeColor: "bg-green-100 text-green-600",
//       show: hasPermission("view_newsletters"),
//     },
//     {
//       icon: Mail, label: "Contact Leads", key: "contacts",
//       badge: contactCount, badgeColor: "bg-violet-100 text-violet-600",
//       show: hasPermission("view_contacts"),
//     },
//     {
//       icon: MessageSquareText, label: "Comments", key: "comments",
//       badge: commentCount, badgeColor: "bg-amber-100 text-amber-600",
//       show: hasPermission("view_comments"),
//     },
//   ].filter((n) => n.show);

//   const managementNav = [

//     {
//   icon: CalendarDays,
//   label: "Leave Management",
//   key: "leaves",
//   show: canAccessLeaves,
// },

// {
//   icon: WalletCards,
//   label: "Payroll",
//   key: "payroll",
//   show: hasPermission("view_payroll"),
// },
//      {
//   icon: CalendarCheck,
//   label: "Attendance",
//   key: "attendance",
//   show: [
//     "view_attendance",
//     "mark_attendance",
//     "view_all_attendance",
//     "view_monthly_records",
//   ].some((permission) => hasPermission(permission)),
// },

// {
//   icon: CalendarDays,
//   label: "Holidays & Weekly Offs",
//   key: "holidays",
//   show: canAccessHolidays,
// },

// {
//       icon: Settings,
//       label: "WFH Settings",
//       key: "wfh-settings",
//       show: hasPermission("manage_wfh_settings"),
//     },

 
//     {
//       icon: UserCog, label: "Users", key: "users",
//       show: hasPermission("view_users"),
//     },
//     {
//       icon: BarChart3, label: "Analytics", key: "analytics",
//       show: hasPermission("view_analytics"),
//     },
//     {
//       icon: FolderKanban, label: "Projects", key: "projects",
//       show: hasPermission("view_projects"),
//     },
//     {
//       icon: Sun, label: "Proposals", key: "proposals",
//       show: hasPermission("view_proposals"),
//     },
//     {icon: ReceiptText, label: "Invoices", key: "invoices",
//       show: hasPermission("view_invoices"),
//   },

//     {
//       icon: Sun, label: " Create Proposals", key: "create-proposals",
//       show: hasPermission("create_proposals"),
//     },

//     {
//       icon: FolderKanban,
//       label: "My Projects",
//       key: "my-projects",
//       badge: assignedProjectCount,
//       badgeColor: "bg-indigo-100 text-indigo-600",
//       show: hasPermission("view_assigned_projects") && assignedProjectCount > 0,
//     },
//     {
//   icon: Briefcase,
//   label: "Tender Management",
//   key: "tenders",
//   show: true, // or wrap with: hasPermission("view_tenders")
// },
//     {
//       icon: FileText,
//       label: "My Leads",
//       key: "my-leads",
//       badge: assignedLeadCount,
//       badgeColor: "bg-cyan-100 text-cyan-600",
//       show: hasPermission("view_assigned_leads") && assignedLeadCount > 0,
//     },
//   ].filter((n) => n.show);

//   const systemNav = [
//     {
//       icon: Settings, label: "Settings", key: "settings",
//       show: hasPermission("view_settings") || hasPermission("view_roles"),
//     },
//   ].filter((n) => n.show);

//   const hasOverviewMetrics = [
//     "view_leads",
//     "view_newsletters",
//     "view_contacts",
//     "view_comments",
//   ].some((permission) => hasPermission(permission));
//   const overviewShortcuts = [...dataNav, ...managementNav, ...systemNav]
//     .filter((item, index, items) =>
//       items.findIndex((candidate) => candidate.key === item.key) === index
//     )
//     .slice(0, 4);

//   const pageTitle = {
//     dashboard: "Overview",
//     attendance: "Attendance",
//     holidays: "Holidays & Weekly Offs",
//     leaves: "Leave Management",
//     leads: "Leads",
//     newsletters: "Newsletter Subscribers",
//     contacts: "Contact Leads",
//     comments: "Comments",
//     users: "Users",
//     analytics: "Analytics",
//     projects: "Projects",
//     settings: "Settings",
//     proposals: "Proposal Generation",
//     invoices: "Invoices",
//     "create-proposals": "Create Proposals",
//     "my-projects": "My Assigned Projects",
//     "my-leads": "My Assigned Leads",
//     "tenders": "Tender Management",
    
//   }[page] || "Dashboard";

//   const navigateTo = (key) => {
//   setSearchParams(
//     (currentParams) => {
//       const nextParams = new URLSearchParams(currentParams);

//       if (!key || key === "dashboard") {
//         nextParams.delete("module");
//       } else {
//         nextParams.set("module", key);
//       }

//       return nextParams;
//     },
//     { replace: true }
//   );

//   setSidebarOpen(false);
// };

//   /* ── Settings tabs ── */
//   const settingsTabs = [
//     hasPermission("view_users") && { key: "users", icon: UserCog, label: "Users" },
//     hasPermission("view_roles") && { key: "roles", icon: Shield, label: "Roles & Permissions" },
//     hasPermission("view_settings") && { key: "general", icon: Settings, label: "General" },
//   ].filter(Boolean);

//   return (
//     <div className="flex min-h-screen bg-white text-gray-800 font-sans">
//       <Toaster
//         position="top-right"
//         toastOptions={{
//           style: {
//             background: "#ffffff",
//             color: "#1f2937",
//             border: "1px solid #e5e7eb",
//             borderRadius: "12px",
//             fontSize: "13px",
//             boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
//           },
//         }}
//       />

//       {/* ── mobile backdrop ── */}
//       <AnimatePresence>
//         {sidebarOpen && (
//           <motion.div
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             onClick={() => setSidebarOpen(false)}
//             className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 lg:hidden"
//           />
//         )}
//       </AnimatePresence>

//       {/* ────────────────────── SIDEBAR ────────────────────── */}
//       <aside
//         className={`fixed top-0 left-0 h-full z-40 flex flex-col
//           bg-white border-r border-gray-100
//           transition-all duration-300 ease-in-out
//           ${sidebarCollapsed ? "w-[72px]" : "w-[240px]"}
//           ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
//           lg:translate-x-0`}
//       >
//         {/* logo — Dasher style */}
//         <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-100">
//           <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
//             <Zap size={15} className="text-white" />
//           </div>
//           {!sidebarCollapsed && (
//             <p className="text-[17px] font-black tracking-tight text-green-600">wheedle Tech</p>
//           )}
//         </div>

//         {/* nav */}
//         <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
//           {/* main */}
//           <div className="space-y-0.5">
//             {!sidebarCollapsed && (
//               <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">Main</p>
//             )}
//             {mainNav.map((item) => (
//               <NavItem
//                 key={item.key} {...item}
//                 active={page === item.key}
//                 onClick={() => navigateTo(item.key)}
//                 collapsed={sidebarCollapsed}
//               />
//             ))}
//           </div>

//           {/* data */}
//           {dataNav.length > 0 && (
//             <div className="space-y-0.5">
//               {!sidebarCollapsed && (
//                 <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">Data</p>
//               )}
//               {dataNav.map((item) => (
//                 <NavItem
//                   key={item.key} {...item}
//                   active={page === item.key}
//                   onClick={() => navigateTo(item.key)}
//                   collapsed={sidebarCollapsed}
//                 />
//               ))}
//             </div>
//           )}

//           {/* management */}
//           {managementNav.length > 0 && (
//             <div className="space-y-0.5">
//               {!sidebarCollapsed && (
//                 <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">Management</p>
//               )}
//               {managementNav.map((item) => (
//                 <NavItem
//                   key={item.key} {...item}
//                   active={page === item.key}
//                   onClick={() => navigateTo(item.key)}
//                   collapsed={sidebarCollapsed}
//                 />
//               ))}
//             </div>
//           )}

//           {/* system */}
//           {systemNav.length > 0 && (
//             <div className="space-y-0.5">
//               {!sidebarCollapsed && (
//                 <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">System</p>
//               )}
//               {systemNav.map((item) => (
//                 <NavItem
//                   key={item.key} {...item}
//                   active={page === item.key}
//                   onClick={() => navigateTo(item.key)}
//                   collapsed={sidebarCollapsed}
//                 />
//               ))}
//             </div>
//           )}
//         </nav>

//         {/* admin footer — Dasher: avatar + name at bottom */}
//         <div className="px-3 py-4 border-t border-gray-100">
//           {!sidebarCollapsed && (
//             <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
//               <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
//                 {admin?.name?.[0]?.toUpperCase() || "A"}
//               </div>
//               <div className="overflow-hidden">
//                 <p className="text-[13px] font-semibold text-gray-800 truncate">{admin?.name}</p>
//                 <p className="text-[11px] text-gray-400 truncate">{roleInfo.label}</p>
//               </div>
//             </div>
//           )}
//           <button
//             onClick={handleLogout}
//             className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-[13px] font-medium"
//           >
//             <LogOut size={16} strokeWidth={1.8} />
//             {!sidebarCollapsed && "Logout"}
//           </button>
//         </div>
//       </aside>

//       {/* ────────────────────── MAIN AREA ────────────────────── */}
//       <div
//         className={`flex-1 flex flex-col min-h-screen transition-all duration-300
//           ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[240px]"}`}
//       >
//         {/* ── TOPBAR ── */}
//         <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-3.5 flex justify-between items-center">
//           <div className="flex items-center gap-3">
//             <button
//               onClick={() => setSidebarOpen(!sidebarOpen)}
//               className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
//             >
//               {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
//             </button>
//             <button
//               onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
//               className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
//             >
//               <Menu size={18} />
//             </button>
//             <div className="flex items-center gap-2">
//               <Activity size={14} className="text-green-500" />
//               <h1 className="font-semibold text-[15px] text-gray-700">{pageTitle}</h1>
//             </div>
//           </div>

//           <div className="flex items-center gap-2">
//             {/* Role badge */}
//             <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${roleInfo.bg} border border-gray-200`}>
//               <Shield size={11} className="text-gray-500" />
//               <span className="text-[11px] font-semibold text-gray-600">{roleInfo.label}</span>
//             </div>

//             {/* clock */}
//             <div className="hidden md:flex flex-col items-end mr-1">
//               <p className="text-[11px] text-gray-400">{formatDate}</p>
//               <p className="text-[13px] font-semibold text-gray-600 tabular-nums">{formatTime}</p>
//             </div>

//             {/* notifications */}
//             <div className="relative">
//               <button
//                 onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
//                 className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
//               >
//                 <Bell size={18} strokeWidth={1.8} />
//                 {notifications.length > 0 && (
//                   <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full ring-2 ring-white" />
//                 )}
//               </button>
//               <AnimatePresence>
//                 {notifOpen && (
//                   <motion.div
//                     initial={{ opacity: 0, y: -8, scale: 0.96 }}
//                     animate={{ opacity: 1, y: 0, scale: 1 }}
//                     exit={{ opacity: 0, y: -8, scale: 0.96 }}
//                     transition={{ duration: 0.15 }}
//                     className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-xl shadow-gray-100 rounded-2xl p-4 z-50"
//                   >
//                     <div className="flex items-center justify-between mb-3">
//                       <p className="font-semibold text-sm text-gray-800">Notifications</p>
//                       {notifications.length > 0 && (
//                         <span className="text-[11px] text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full font-medium">
//                           {notifications.length} new
//                         </span>
//                       )}
//                     </div>
//                     <div className="max-h-64 overflow-y-auto space-y-1.5">
//                       {notifications.length === 0 ? (
//                         <div className="text-center py-6">
//                           <Bell size={24} className="mx-auto text-gray-300 mb-2" />
//                           <p className="text-sm text-gray-400">All caught up</p>
//                         </div>
//                       ) : (
//                         notifications.map((n, i) => (
//                           <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition">
//                             <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 flex-shrink-0" />
//                             <div>
//                               <p className="text-[13px] text-gray-700">{n.message}</p>
//                               <p className="text-[11px] text-gray-400 mt-0.5">{new Date(n.time).toLocaleTimeString()}</p>
//                             </div>
//                           </div>
//                         ))
//                       )}
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>

//             {/* profile */}
//             <div className="relative">
//               <button
//                 onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
//                 className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition"
//               >
//                 <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">
//                   {admin?.name?.[0]?.toUpperCase() || "A"}
//                 </div>
//                 <span className="hidden md:block text-[13px] font-medium text-gray-700">{admin?.name}</span>
//               </button>
//               <AnimatePresence>
//                 {profileOpen && (
//                   <motion.div
//                     initial={{ opacity: 0, y: -8, scale: 0.96 }}
//                     animate={{ opacity: 1, y: 0, scale: 1 }}
//                     exit={{ opacity: 0, y: -8, scale: 0.96 }}
//                     transition={{ duration: 0.15 }}
//                     className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 shadow-xl shadow-gray-100 rounded-2xl overflow-hidden z-50"
//                   >
//                     <div className="px-4 py-3 border-b border-gray-100">
//                       <p className="text-[13px] font-semibold text-gray-800">{admin?.name}</p>
//                       <p className="text-[11px] font-medium mt-0.5 text-green-600">{roleInfo.label}</p>
//                       <p className="text-[10px] text-gray-400 truncate">{admin?.email}</p>
//                     </div>
//                     <button
//                     onClick={() => { navigateTo("profile"); setProfileOpen(false); }}
//                     className="w-full px-4 py-2.5 text-left text-[13px] text-gray-500 hover:text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition">
//                       <User size={13} /> Profile
//                     </button>
//                     {(hasPermission("view_settings") || hasPermission("view_roles") || hasPermission("view_users")) && (
//                       <button
//                         onClick={() => { navigateTo("settings"); setProfileOpen(false); }}
//                         className="w-full px-4 py-2.5 text-left text-[13px] text-gray-500 hover:text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition"
//                       >
//                         <Settings size={13} /> Settings
//                       </button>
//                     )}
//                     <div className="border-t border-gray-100" />
//                     <button
//                       onClick={handleLogout}
//                       className="w-full px-4 py-2.5 text-left text-[13px] text-red-500 hover:bg-red-50 flex items-center gap-2 transition"
//                     >
//                       <LogOut size={13} /> Logout
//                     </button>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           </div>
//         </header>

//         {/* ── CONTENT ── */}
//         <main className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
//           <AnimatePresence mode="wait">

//             {/* ── DASHBOARD ── */}
//             {page === "dashboard" && (
//               <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
//                 <div>
//                   <h2 className="text-2xl font-black text-gray-800">
//                     Good{" "}
//                     {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},
//                     {" "}{admin?.name?.split(" ")[0]} 👋
//                   </h2>
//                   <p className="text-gray-400 text-sm mt-1">Here's what's happening in your CRM today.</p>
//                 </div>

//                 {/* metric cards — Dasher tinted style */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
//                   {hasPermission("view_leads") && (
//                     <MetricCard
//                       label="Total Leads"
//                       value={leadCount}
//                       icon={FileText}
//                       tint="bg-blue-50"
//                       iconColor="text-blue-500"
//                       subLabel="All time"
//                       loading={loading}
//                     />
//                   )}
//                   {hasPermission("view_newsletters") && (
//                     <MetricCard
//                       label="Newsletter Subscribers"
//                       value={newsletterCount}
//                       icon={Users}
//                       tint="bg-green-50"
//                       iconColor="text-green-500"
//                       subLabel="All time"
//                       loading={loading}
//                     />
//                   )}
//                   {hasPermission("view_contacts") && (
//                     <MetricCard
//                       label="Contact Leads"
//                       value={contactCount}
//                       icon={Mail}
//                       tint="bg-violet-50"
//                       iconColor="text-violet-500"
//                       subLabel="All time"
//                       loading={loading}
//                     />
//                   )}
//                   {hasPermission("view_comments") && (
//                     <MetricCard
//                       label="Comments"
//                       value={commentCount}
//                       icon={MessageSquareText}
//                       tint="bg-amber-50"
//                       iconColor="text-amber-500"
//                       subLabel="All time"
//                       loading={loading}
//                     />
//                   )}
//                 </div>

//                 {/* quick access */}
//                 {dataNav.length > 0 && (
//                   <div>
//                     <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Access</p>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
//                       {dataNav.map((item) => (
//                         <motion.button
//                           key={item.key}
//                           whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
//                           onClick={() => setPage(item.key)}
//                           className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50/40 transition-all group text-left"
//                         >
//                           <div className="p-2 rounded-xl bg-gray-100 group-hover:bg-green-100 transition">
//                             <item.icon size={18} className="text-gray-500 group-hover:text-green-600 transition" />
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="text-[13px] font-semibold text-gray-600 group-hover:text-gray-800 transition truncate">{item.label}</p>
//                             <p className="text-[11px] text-gray-400">{item.badge} records</p>
//                           </div>
//                           <ChevronRight size={14} className="text-gray-300 group-hover:text-green-500 transition flex-shrink-0" />
//                         </motion.button>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {!hasOverviewMetrics && dataNav.length === 0 && (
//                   <motion.section
//                     initial={reduceMotion ? false : { opacity: 0, y: 18 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
//                     className="relative isolate min-h-[360px] overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-teal-50/80 p-6 shadow-sm sm:p-10"
//                     aria-labelledby="workspace-welcome-title"
//                   >
//                     <motion.div
//                       aria-hidden="true"
//                       className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full bg-emerald-200/30 blur-2xl"
//                       animate={reduceMotion ? { opacity: 0.5 } : { scale: [1, 1.08, 1], opacity: [0.45, 0.7, 0.45] }}
//                       transition={reduceMotion ? { duration: 0 } : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
//                     />
//                     <motion.div
//                       aria-hidden="true"
//                       className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-teal-200/30 blur-2xl"
//                       animate={reduceMotion ? { opacity: 0.4 } : { y: [0, -12, 0], opacity: [0.35, 0.6, 0.35] }}
//                       transition={reduceMotion ? { duration: 0 } : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
//                     />

//                     <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
//                       <motion.div
//                         initial={reduceMotion ? false : { scale: 0.8, rotate: -8 }}
//                         animate={{ scale: 1, rotate: 0 }}
//                         transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 14, delay: 0.12 }}
//                         className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-600 shadow-sm"
//                       >
//                         <Activity size={28} />
//                       </motion.div>
//                       <h3 id="workspace-welcome-title" className="text-2xl font-bold tracking-tight text-gray-800 sm:text-3xl">
//                         Your workspace is ready
//                       </h3>
//                       <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
//                         Welcome, {admin?.name?.split(" ")[0] || "there"}. Use the shortcuts below to get to the tools available to you.
//                       </p>

//                       {overviewShortcuts.length > 0 ? (
//                         <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
//                           {overviewShortcuts.map((item, index) => (
//                             <motion.button
//                               key={item.key}
//                               initial={reduceMotion ? false : { opacity: 0, y: 10 }}
//                               animate={{ opacity: 1, y: 0 }}
//                               transition={reduceMotion ? { duration: 0 } : { duration: 0.3, delay: 0.18 + index * 0.07 }}
//                               whileHover={reduceMotion ? undefined : { y: -3 }}
//                               whileTap={reduceMotion ? undefined : { scale: 0.98 }}
//                               onClick={() => navigateTo(item.key)}
//                               className="group flex items-center gap-3 rounded-2xl border border-white/80 bg-white/85 p-4 text-left shadow-sm transition hover:border-emerald-200 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
//                             >
//                               <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
//                                 <item.icon size={20} />
//                               </span>
//                               <span className="min-w-0 flex-1">
//                                 <span className="block truncate text-sm font-semibold text-gray-700">{item.label}</span>
//                                 <span className="mt-0.5 block text-xs text-gray-400">Open this section</span>
//                               </span>
//                               <ChevronRight size={16} className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
//                             </motion.button>
//                           ))}
//                         </div>
//                       ) : (
//                         <p className="mt-7 rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-sm text-gray-500">
//                           Ask your administrator to grant access to the sections you need.
//                         </p>
//                       )}
//                     </div>
//                   </motion.section>
//                 )}
//               </motion.div>
//             )}


//             {page === "profile" && (
//   <motion.div
//     key="profile"
//     initial={{ opacity: 0, y: 10 }}
//     animate={{ opacity: 1, y: 0 }}
//     exit={{ opacity: 0 }}
//     className="max-w-2xl space-y-6"
//   >
//     <div>
//       <h2 className="text-xl font-black text-gray-800">Profile</h2>
//       <p className="text-gray-400 text-[13px] mt-0.5">
//         View your account information.
//       </p>
//     </div>

//     <div className="bg-white border border-gray-200 rounded-2xl p-6">
//       <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
//         <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-xl font-bold text-white">
//           {admin?.name?.[0]?.toUpperCase() || "A"}
//         </div>

//         <div>
//           <h3 className="text-base font-bold text-gray-800">
//             {admin?.name || "Admin"}
//           </h3>
//           <p className="text-[13px] text-green-600">
//             {roleInfo.label}
//           </p>
//         </div>
//       </div>

//       <dl className="grid gap-4 pt-5 sm:grid-cols-2">
//         <div>
//           <dt className="text-[11px] font-semibold uppercase text-gray-400">
//             Name
//           </dt>
//           <dd className="mt-1 text-[13px] text-gray-700">
//             {admin?.name || "Not available"}
//           </dd>
//         </div>

//         <div>
//           <dt className="text-[11px] font-semibold uppercase text-gray-400">
//             Email
//           </dt>
//           <dd className="mt-1 text-[13px] text-gray-700 break-words">
//             {admin?.email || "Not available"}
//           </dd>
//         </div>

//         <div>
//           <dt className="text-[11px] font-semibold uppercase text-gray-400">
//             Role
//           </dt>
//           <dd className="mt-1 text-[13px] text-gray-700">
//             {roleInfo.label}
//           </dd>
//         </div>

//           <div>
//     <dt className="text-[11px] font-semibold uppercase text-gray-400">Joining Date</dt>
//     <dd className="mt-1 text-[13px] text-gray-700">
//       {admin?.employment?.joiningDate
//         ? new Date(admin.employment.joiningDate).toLocaleDateString()
//         : "Not available"}
//     </dd>
//   </div>

//   <div>
//     <dt className="text-[11px] font-semibold uppercase text-gray-400">Employment Status</dt>
//     <dd className="mt-1 text-[13px] text-gray-700">
//       {admin?.employment?.currentlyWorking ? "Currently Working" : "Not Working"}
//     </dd>
//   </div>

//   {!admin?.employment?.currentlyWorking && (
//     <div>
//       <dt className="text-[11px] font-semibold uppercase text-gray-400">Exit Date</dt>
//       <dd className="mt-1 text-[13px] text-gray-700">
//         {admin?.employment?.exitDate
//           ? new Date(admin.employment.exitDate).toLocaleDateString()
//           : "Not available"}
//       </dd>
//     </div>
//   )}
//       </dl>
//     </div>

//     <button
//       onClick={() => navigateTo("dashboard")}
//       className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition border border-gray-200"
//     >
//       Back to dashboard
//     </button>
//   </motion.div>
// )}

//             {/* ── DATA PAGES ── */}
//             {page === "leads" && (
//               <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 {hasPermission("view_leads")
//                   ? <ViewLeads goBack={() => setPage("dashboard")} />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}

//             {page === "newsletters" && (
//               <motion.div key="newsletters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 {hasPermission("view_newsletters")
//                   ? <ViewNewsletters goBack={() => setPage("dashboard")} />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}

//             {page === "contacts" && (
//               <motion.div key="contacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 {hasPermission("view_contacts")
//                   ? <ViewContactLeads goBack={() => setPage("dashboard")} />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}

//             {page === "comments" && (
//               <motion.div key="comments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 {hasPermission("view_comments")
//                   ? <ViewComments goBack={() => setPage("dashboard")} />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}

//             {page === "users" && (
//               <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 {hasPermission("view_users")
//                   ? <ViewUsers />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}

//             {page === "analytics" && (
//               <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 {hasPermission("view_analytics")
//                   ? <ViewAnalytics />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}

//             {page === "projects" && (
//               <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 {hasPermission("view_projects")
//                   ? <ViewProjects />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}



//             {page === "payroll" && (
//   hasPermission("view_payroll") ? (
//     <PayrollModule hasPermission={hasPermission} />
//   ) : (
//     <AccessDenied goBack={() => setPage("dashboard")} />
//   )
// )}


//               {page === "wfh-settings" && (
//   hasPermission("manage_wfh_settings") ? (
//     <WorkFromHomeSettings />
//   ) : (
//     <AccessDenied goBack={() => setPage("dashboard")} />
//   )
// )}

//   {page === "attendance" && (
//   [
//     "view_attendance",
//     "mark_attendance",
//     "view_all_attendance",
//     "view_monthly_records",
//   ].some((permission) => hasPermission(permission)) ? (
//     <AttendanceHome
//       key={`attendance-${admin?._id || admin?.id || admin?.email}`}
//     />
//   ) : (
//     <AccessDenied goBack={() => setPage("dashboard")} />
//   )
// )}

// {page === "holidays" && (
//   canAccessHolidays ? (
//     <HolidaysModule
//       key={`holidays-${admin?._id || admin?.id || admin?.email}`}
//     />
//   ) : (
//     <AccessDenied goBack={() => setPage("dashboard")} />
//   )
// )}

// {page === "leaves" && (
//   canAccessLeaves ? (
//     <LeaveModule key={`leaves-${admin?._id || admin?.id || admin?.email}`} />
//   ) : (
//     <AccessDenied goBack={() => setPage("dashboard")} />
//   )
// )}

//          {page === "invoices" && ( hasPermission("view_invoices") ? (
//     <motion.div key="invoices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//       <InvoiceModule />
//     </motion.div>
//   ) : (
//     <AccessDenied
//       goBack={() => setPage("dashboard")}
//     />
//   )
// )}



//             {page === "proposals" && (
//               <motion.div key="proposals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 {hasPermission("view_proposals")
//                   ? <ViewProposals />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}

//             {page === "create-proposals" && (
//               <motion.div key="create-proposals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 {hasPermission("create_proposals")
//                   ? <ProposalHub />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}

//             {page === "tenders" && (
//               <motion.div key="tenders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 {hasPermission("view_tenders")
//                   ? <TenderManagement />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}

//             {page === "my-projects" && (
//               <motion.div key="my-projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 {hasPermission("view_assigned_projects") && assignedProjectCount > 0
//                   ? <MyAssignedProjects />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}

//             {page === "my-leads" && (
//               <motion.div
//                 key="my-leads"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//               >
//                 {hasPermission("view_assigned_leads") && assignedLeadCount > 0
//                   ? <AssignedLeads />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}

//             {/* ── SETTINGS ── */}
//             {page === "settings" && (
//               <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
//                 <div>
//                   <h2 className="text-xl font-black text-gray-800">Settings</h2>
//                   <p className="text-gray-400 text-[13px] mt-0.5">Manage system configuration, users, and access control.</p>
//                 </div>

//                 {settingsTabs.length > 0 && (
//                   <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap border border-gray-200">
//                     {settingsTabs.map((tab) => (
//                       <button
//                         key={tab.key}
//                         onClick={() => setSettingsSubPage(tab.key)}
//                         className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all
//                           ${settingsSubPage === tab.key
//                             ? "bg-green-500 text-white shadow-sm"
//                             : "text-gray-500 hover:text-gray-800 hover:bg-white"
//                           }`}
//                       >
//                         <tab.icon size={14} />
//                         {tab.label}
//                       </button>
//                     ))}
//                   </div>
//                 )}

//                 {settingsSubPage === "users" && (
//                   hasPermission("view_users")
//                     ? <ViewUsers />
//                     : <AccessDenied goBack={() => setPage("dashboard")} />
//                 )}

//                 {settingsSubPage === "roles" && (
//                   hasPermission("view_roles")
//                     ? <ViewRoles />
//                     : <AccessDenied goBack={() => setPage("dashboard")} />
//                 )}

//                 {settingsSubPage === "general" && (
//                   hasPermission("view_settings")
//                     ? (
//                       <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
//                         <Settings size={32} className="mx-auto text-gray-300 mb-3" />
//                         <p className="text-gray-400 text-[13px]">General settings component — add your settings here</p>
//                       </div>
//                     )
//                     : <AccessDenied goBack={() => setPage("dashboard")} />
//                 )}
//               </motion.div>
//             )}

//           </AnimatePresence>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;