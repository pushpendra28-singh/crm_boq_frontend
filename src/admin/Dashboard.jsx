import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
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

/* ─── tiny stat badge ─── */
const CountBadge = ({ count, color }) => (
  <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
    {count}
  </span>
);

/* ─── sidebar nav item — Dasher style ─── */
const NavItem = ({ icon: Icon, label, active, onClick, badge, badgeColor, collapsed }) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`relative flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
      ${active
        ? "bg-green-100 text-green-700"
        : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
      }`}
  >
    <span className={`flex-shrink-0 ${active ? "text-green-600" : "text-gray-400"}`}>
      <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
    </span>
    {!collapsed && (
      <>
        <span className="truncate">{label}</span>
        {badge !== undefined && (
          <CountBadge
            count={badge}
            color={active ? "bg-green-200 text-green-700" : badgeColor}
          />
        )}
      </>
    )}
    {collapsed && badge > 0 && (
      <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
    )}
  </motion.button>
);

/* ─── Metric card — Dasher tinted style ─── */
const MetricCard = ({ label, value, icon: Icon, tint, iconColor, subLabel, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative rounded-2xl p-5 ${tint}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-[12px] font-medium mb-3">{label}</p>
        {loading ? (
          <div className="h-9 w-20 bg-white/60 animate-pulse rounded-lg" />
        ) : (
          <h3 className="text-[36px] font-black text-gray-800 tabular-nums leading-none">{value}</h3>
        )}
        <p className={`text-[12px] font-medium mt-2 ${iconColor}`}>{subLabel}</p>
      </div>
      <div className={`p-2.5 rounded-xl ${iconColor} bg-white/50`}>
        <Icon size={20} strokeWidth={1.8} />
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
    <h3 className="text-[16px] font-bold text-gray-800 mb-2">Access Denied</h3>
    <p className="text-gray-400 text-[13px] mb-5">You don't have permission to view this section.</p>
    <button
      onClick={goBack}
      className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition border border-gray-200"
    >
      ← Go back
    </button>
  </motion.div>
);

/* ─── main component ─── */
const Dashboard = () => {
  const { admin, logout, hasPermission } = useContext(AuthContext);
  const navigate = useNavigate();

  const [time, setTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [page, setPage] = useState("dashboard");
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

  const handleLogout = () => {
    logout();
    navigate("/admin");
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
    {
      icon: FileText, label: "Leads", key: "leads",
      badge: leadCount, badgeColor: "bg-blue-100 text-blue-600",
      show: hasPermission("view_leads"),
    },
    {
      icon: Users, label: "Newsletter", key: "newsletters",
      badge: newsletterCount, badgeColor: "bg-green-100 text-green-600",
      show: hasPermission("view_newsletters"),
    },
    {
      icon: Mail, label: "Contact Leads", key: "contacts",
      badge: contactCount, badgeColor: "bg-violet-100 text-violet-600",
      show: hasPermission("view_contacts"),
    },
    {
      icon: MessageSquareText, label: "Comments", key: "comments",
      badge: commentCount, badgeColor: "bg-amber-100 text-amber-600",
      show: hasPermission("view_comments"),
    },
  ].filter((n) => n.show);

  const managementNav = [
    {
      icon: UserCog, label: "Users", key: "users",
      show: hasPermission("view_users"),
    },
    {
      icon: BarChart3, label: "Analytics", key: "analytics",
      show: hasPermission("view_analytics"),
    },
    {
      icon: FolderKanban, label: "Projects", key: "projects",
      show: hasPermission("view_projects"),
    },
    {
      icon: Sun, label: "Proposals", key: "proposals",
      show: hasPermission("view_proposals"),
    },

    {
      icon: Sun, label: " Create Proposals", key: "create-proposals",
      show: hasPermission("create_proposals"),
    },

    {
      icon: FolderKanban,
      label: "My Projects",
      key: "my-projects",
      badge: assignedProjectCount,
      badgeColor: "bg-indigo-100 text-indigo-600",
      show: hasPermission("view_assigned_projects") && assignedProjectCount > 0,
    },
    {
  icon: Briefcase,
  label: "Tender Management",
  key: "tenders",
  show: true, // or wrap with: hasPermission("view_tenders")
},
    {
      icon: FileText,
      label: "My Leads",
      key: "my-leads",
      badge: assignedLeadCount,
      badgeColor: "bg-cyan-100 text-cyan-600",
      show: hasPermission("view_assigned_leads") && assignedLeadCount > 0,
    },
  ].filter((n) => n.show);

  const systemNav = [
    {
      icon: Settings, label: "Settings", key: "settings",
      show: hasPermission("view_settings") || hasPermission("view_roles"),
    },
  ].filter((n) => n.show);

  const pageTitle = {
    dashboard: "Overview",
    leads: "Leads",
    newsletters: "Newsletter Subscribers",
    contacts: "Contact Leads",
    comments: "Comments",
    users: "Users",
    analytics: "Analytics",
    projects: "Projects",
    settings: "Settings",
    proposals: "Proposal Generation",
    "create-proposals": "Create Proposals",
    "my-projects": "My Assigned Projects",
    "my-leads": "My Assigned Leads",
    "tenders": "Tender Management",
  }[page] || "Dashboard";

  const navigateTo = (key) => {
    setPage(key);
    setSidebarOpen(false);
  };

  /* ── Settings tabs ── */
  const settingsTabs = [
    hasPermission("view_users") && { key: "users", icon: UserCog, label: "Users" },
    hasPermission("view_roles") && { key: "roles", icon: Shield, label: "Roles & Permissions" },
    hasPermission("view_settings") && { key: "general", icon: Settings, label: "General" },
  ].filter(Boolean);

  return (
    <div className="flex min-h-screen bg-white text-gray-800 font-sans">
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

      {/* ── mobile backdrop ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ────────────────────── SIDEBAR ────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col
          bg-white border-r border-gray-100
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? "w-[72px]" : "w-[240px]"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        {/* logo — Dasher style */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-100">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
            <Zap size={15} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <p className="text-[17px] font-black tracking-tight text-green-600">Savorka</p>
          )}
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {/* main */}
          <div className="space-y-0.5">
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">Main</p>
            )}
            {mainNav.map((item) => (
              <NavItem
                key={item.key} {...item}
                active={page === item.key}
                onClick={() => navigateTo(item.key)}
                collapsed={sidebarCollapsed}
              />
            ))}
          </div>

          {/* data */}
          {dataNav.length > 0 && (
            <div className="space-y-0.5">
              {!sidebarCollapsed && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">Data</p>
              )}
              {dataNav.map((item) => (
                <NavItem
                  key={item.key} {...item}
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
              {!sidebarCollapsed && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">Management</p>
              )}
              {managementNav.map((item) => (
                <NavItem
                  key={item.key} {...item}
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
              {!sidebarCollapsed && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">System</p>
              )}
              {systemNav.map((item) => (
                <NavItem
                  key={item.key} {...item}
                  active={page === item.key}
                  onClick={() => navigateTo(item.key)}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </div>
          )}
        </nav>

        {/* admin footer — Dasher: avatar + name at bottom */}
        <div className="px-3 py-4 border-t border-gray-100">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                {admin?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-[13px] font-semibold text-gray-800 truncate">{admin?.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{roleInfo.label}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-[13px] font-medium"
          >
            <LogOut size={16} strokeWidth={1.8} />
            {!sidebarCollapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* ────────────────────── MAIN AREA ────────────────────── */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300
          ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[240px]"}`}
      >
        {/* ── TOPBAR ── */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-green-500" />
              <h1 className="font-semibold text-[15px] text-gray-700">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Role badge */}
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${roleInfo.bg} border border-gray-200`}>
              <Shield size={11} className="text-gray-500" />
              <span className="text-[11px] font-semibold text-gray-600">{roleInfo.label}</span>
            </div>

            {/* clock */}
            <div className="hidden md:flex flex-col items-end mr-1">
              <p className="text-[11px] text-gray-400">{formatDate}</p>
              <p className="text-[13px] font-semibold text-gray-600 tabular-nums">{formatTime}</p>
            </div>

            {/* notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
              >
                <Bell size={18} strokeWidth={1.8} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full ring-2 ring-white" />
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-xl shadow-gray-100 rounded-2xl p-4 z-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-sm text-gray-800">Notifications</p>
                      {notifications.length > 0 && (
                        <span className="text-[11px] text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full font-medium">
                          {notifications.length} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1.5">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6">
                          <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-sm text-gray-400">All caught up</p>
                        </div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition">
                            <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 flex-shrink-0" />
                            <div>
                              <p className="text-[13px] text-gray-700">{n.message}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{new Date(n.time).toLocaleTimeString()}</p>
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
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">
                  {admin?.name?.[0]?.toUpperCase() || "A"}
                </div>
                <span className="hidden md:block text-[13px] font-medium text-gray-700">{admin?.name}</span>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 shadow-xl shadow-gray-100 rounded-2xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-[13px] font-semibold text-gray-800">{admin?.name}</p>
                      <p className="text-[11px] font-medium mt-0.5 text-green-600">{roleInfo.label}</p>
                      <p className="text-[10px] text-gray-400 truncate">{admin?.email}</p>
                    </div>
                    <button className="w-full px-4 py-2.5 text-left text-[13px] text-gray-500 hover:text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition">
                      <User size={13} /> Profile
                    </button>
                    {(hasPermission("view_settings") || hasPermission("view_roles") || hasPermission("view_users")) && (
                      <button
                        onClick={() => { setPage("settings"); setProfileOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-[13px] text-gray-500 hover:text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition"
                      >
                        <Settings size={13} /> Settings
                      </button>
                    )}
                    <div className="border-t border-gray-100" />
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
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
          <AnimatePresence mode="wait">

            {/* ── DASHBOARD ── */}
            {page === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-800">
                    Good{" "}
                    {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},
                    {" "}{admin?.name?.split(" ")[0]} 👋
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Here's what's happening in your CRM today.</p>
                </div>

                {/* metric cards — Dasher tinted style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {hasPermission("view_leads") && (
                    <MetricCard
                      label="Total Leads"
                      value={leadCount}
                      icon={FileText}
                      tint="bg-blue-50"
                      iconColor="text-blue-500"
                      subLabel="All time"
                      loading={loading}
                    />
                  )}
                  {hasPermission("view_newsletters") && (
                    <MetricCard
                      label="Newsletter Subscribers"
                      value={newsletterCount}
                      icon={Users}
                      tint="bg-green-50"
                      iconColor="text-green-500"
                      subLabel="All time"
                      loading={loading}
                    />
                  )}
                  {hasPermission("view_contacts") && (
                    <MetricCard
                      label="Contact Leads"
                      value={contactCount}
                      icon={Mail}
                      tint="bg-violet-50"
                      iconColor="text-violet-500"
                      subLabel="All time"
                      loading={loading}
                    />
                  )}
                  {hasPermission("view_comments") && (
                    <MetricCard
                      label="Comments"
                      value={commentCount}
                      icon={MessageSquareText}
                      tint="bg-amber-50"
                      iconColor="text-amber-500"
                      subLabel="All time"
                      loading={loading}
                    />
                  )}
                </div>

                {/* quick access */}
                {dataNav.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Access</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                      {dataNav.map((item) => (
                        <motion.button
                          key={item.key}
                          whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                          onClick={() => setPage(item.key)}
                          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50/40 transition-all group text-left"
                        >
                          <div className="p-2 rounded-xl bg-gray-100 group-hover:bg-green-100 transition">
                            <item.icon size={18} className="text-gray-500 group-hover:text-green-600 transition" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-600 group-hover:text-gray-800 transition truncate">{item.label}</p>
                            <p className="text-[11px] text-gray-400">{item.badge} records</p>
                          </div>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-green-500 transition flex-shrink-0" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
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
                  <h2 className="text-xl font-black text-gray-800">Settings</h2>
                  <p className="text-gray-400 text-[13px] mt-0.5">Manage system configuration, users, and access control.</p>
                </div>

                {settingsTabs.length > 0 && (
                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap border border-gray-200">
                    {settingsTabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setSettingsSubPage(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all
                          ${settingsSubPage === tab.key
                            ? "bg-green-500 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-800 hover:bg-white"
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
                      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                        <Settings size={32} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-400 text-[13px]">General settings component — add your settings here</p>
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
// import { useNavigate } from "react-router-dom";
// import ViewLeads from "./leads/ViewLeads";
// import ViewNewsletters from "./ViewNewsletters";
// import ViewContactLeads from "./ViewContactLeads";
// import ViewComments from "./ViewComments";
// import ViewRoles from "./ViewRoles";
// import ViewUsers from "./ViewUsers"; // ← NEW
// import API_BASE_URL from "../config/api";
// import ViewProjects from "./projects/ViewProjects";
// import MessageSquareText from "lucide-react/dist/esm/icons/message-square-text";
// import ViewProposals from "./proposal/ViewProposals"; // adjust path if needed
// import { Sun } from "lucide-react";
// import MyAssignedProjects from "./MyAssignedProjects";
// import AssignedLeads from "./leads/AssignedLeads";
// import ViewAnalytics from "./ViewAnalytics"; // ← NEW

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
// } from "lucide-react";

// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// /* ─── Role badge config ─────────────────────────────────────────────────────── */
// const ROLE_CONFIG = {
//   superadmin: { label: "Super Admin", color: "text-red-400", bg: "bg-red-500/15" },
//   admin: { label: "Admin", color: "text-orange-400", bg: "bg-orange-500/15" },
//   manager: { label: "Manager", color: "text-violet-400", bg: "bg-violet-500/15" },
//   hr: { label: "HR", color: "text-cyan-400", bg: "bg-cyan-500/15" },
//   sales: { label: "Sales", color: "text-emerald-400", bg: "bg-emerald-500/15" },
//   project_manager: { label: "Project Manager", color: "text-amber-400", bg: "bg-amber-500/15" },
//   employee: { label: "Employee", color: "text-indigo-400", bg: "bg-indigo-500/15" },
// };

// /* ─── tiny stat badge ─── */
// const CountBadge = ({ count, color }) => (
//   <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${color}`}>
//     {count}
//   </span>
// );

// /* ─── sidebar nav item ─── */
// const NavItem = ({ icon: Icon, label, active, onClick, badge, badgeColor, collapsed }) => (
//   <motion.button
//     whileHover={{ x: collapsed ? 0 : 3 }}
//     whileTap={{ scale: 0.97 }}
//     onClick={onClick}
//     className={`relative flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200
//       ${active
//         ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25"
//         : "text-slate-400 hover:text-white hover:bg-white/5"
//       }`}
//   >
//     <span className={`flex-shrink-0 ${active ? "text-white" : "text-slate-400"}`}>
//       <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
//     </span>
//     {!collapsed && (
//       <>
//         <span className="truncate">{label}</span>
//         {badge !== undefined && (
//           <CountBadge count={badge} color={active ? "bg-white/20 text-white" : badgeColor} />
//         )}
//         {active && <ChevronRight size={14} className="ml-auto opacity-60 flex-shrink-0" />}
//       </>
//     )}
//     {collapsed && badge > 0 && (
//       <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-400 rounded-full" />
//     )}
//   </motion.button>
// );

// /* ─── overview metric card ─── */
// const MetricCard = ({ label, value, icon: Icon, gradient, loading, trend }) => (
//   <motion.div
//     initial={{ opacity: 0, y: 16 }}
//     animate={{ opacity: 1, y: 0 }}
//     className="relative overflow-hidden bg-[#141428] border border-white/5 rounded-2xl p-5 group"
//   >
//     <div className={`absolute inset-0 opacity-10 ${gradient}`} />
//     <div className="relative z-10 flex items-start justify-between">
//       <div>
//         <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-3">{label}</p>
//         {loading ? (
//           <div className="h-9 w-20 bg-white/10 animate-pulse rounded-lg" />
//         ) : (
//           <h3 className="text-4xl font-black text-white tabular-nums">{value}</h3>
//         )}
//         <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
//           <TrendingUp size={11} className="text-emerald-400" />
//           <span className="text-emerald-400">{trend}</span>
//         </p>
//       </div>
//       <div className={`p-3 rounded-xl ${gradient} bg-opacity-20 border border-white/10`}>
//         <Icon size={22} className="text-white" strokeWidth={1.8} />
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
//     <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
//       <Lock size={24} className="text-red-400" />
//     </div>
//     <h3 className="text-[16px] font-bold text-white mb-2">Access Denied</h3>
//     <p className="text-slate-500 text-[13px] mb-5">You don't have permission to view this section.</p>
//     <button
//       onClick={goBack}
//       className="px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-white/8 hover:bg-white/12 transition"
//     >
//       ← Go back
//     </button>
//   </motion.div>
// );

// /* ─── main component ─── */
// const Dashboard = () => {
//   const { admin, logout, hasPermission } = useContext(AuthContext);
//   const navigate = useNavigate();

//   const [time, setTime] = useState(new Date());
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [notifOpen, setNotifOpen] = useState(false);
//   const [profileOpen, setProfileOpen] = useState(false);
//   const [page, setPage] = useState("dashboard");
//   const [settingsSubPage, setSettingsSubPage] = useState("users"); // ← default to users
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
//   ? {
//       label: roleConfig[admin?.role].label,
//       color: "text-white",
//       bg: "bg-white/10",
//     }
//   : {
//       label: admin?.role || "User",
//       color: "text-slate-400",
//       bg: "bg-slate-500/15",
//     };

//   const handleLogout = () => {
//     logout();
//     navigate("/admin");
//   };

//   /* ── clock ── */
//   useEffect(() => {
//     const timer = setInterval(() => setTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);



//   useEffect(() => {
//   const token = localStorage.getItem("adminToken");

//   fetch(`${API_BASE_URL}/roles`, {
//     headers: { Authorization: `Bearer ${token}` },
//   })
//     .then((r) => r.json())
//     .then((data) => {
//       const allRoles =
//         data.roles ||
//         [...(data.systemRoles || []), ...(data.customRoles || [])];

//       const cfg = {};
//       allRoles.forEach((r) => {
//         cfg[r.slug] = {
//           label: r.name,
//           hex: r.color || "#6366f1",
//         };
//       });

//       setRoleConfig(cfg);
//     })
//     .catch(console.error);
// }, []);


// /* ── Fetch assigned-project count once on mount ────────────────────────────
//      Changed: now checks view_assigned_projects (NOT view_projects) so that
//      users with only "view_assigned_projects" see their sidebar item, and
//      users with only "view_projects" (managers) do NOT see the My Projects
//      item unless they also have view_assigned_projects.
//   ─────────────────────────────────────────────────────────────────────────── */
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



  
// useEffect(() => {
//   if (!admin) return;

//   const token = localStorage.getItem("adminToken");

//   fetch(`${API_BASE_URL}/my-leads/count`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   })
//     .then((r) => r.json())
//     .then((d) => {
//       console.log("MY LEADS COUNT RESPONSE =>", d);

//       if (d.success !== false) {
//         setAssignedLeadCount(d.count || 0);
//       }
//     })
//     .catch((err) => {
//       console.log(err);
//       setAssignedLeadCount(0);
//     });
// }, [admin]);

// //   useEffect(() => {
// //   if (!hasPermission("view_assigned_leads")) return;

// //   const token = localStorage.getItem("adminToken");

// //   fetch(`${API_BASE_URL}/my-leads/count`, {
// //     headers: {
// //       Authorization: `Bearer ${token}`,
// //     },
// //   })
// //     .then((r) => r.json())
// //     .then((d) => setAssignedLeadCount(d.count || 0))
// //     .catch(() => setAssignedLeadCount(0));
// // }, []);

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

//   /* ── sidebar nav groups (role-aware) ── */
//   const mainNav = [
//     { icon: LayoutDashboard, label: "Overview", key: "dashboard", show: true },
//   ];

//   const dataNav = [
//     {
//       icon: FileText, label: "Leads", key: "leads",
//       badge: leadCount, badgeColor: "bg-blue-500/20 text-blue-400",
//       show: hasPermission("view_leads"),
//     },
//     {
//       icon: Users, label: "Newsletter", key: "newsletters",
//       badge: newsletterCount, badgeColor: "bg-emerald-500/20 text-emerald-400",
//       show: hasPermission("view_newsletters"),
//     },
//     {
//       icon: Mail, label: "Contact Leads", key: "contacts",
//       badge: contactCount, badgeColor: "bg-violet-500/20 text-violet-400",
//       show: hasPermission("view_contacts"),
//     },
//     {
//       icon: MessageSquareText, label: "Comments", key: "comments",
//       badge: commentCount, badgeColor: "bg-amber-500/20 text-amber-400",
//       show: hasPermission("view_comments"),
//     },
//   ].filter((n) => n.show);

//   const managementNav = [
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
//      {
//     icon: Sun, label: "Proposals", key: "proposals",
//     show: hasPermission("view_proposals"),
//   },

//     /*
//      * ── "My Projects" sidebar item ──────────────────────────────────────────
//      * Requires view_assigned_projects (separate permission from view_projects).
//      * Also only shown when the user actually has ≥1 project assigned to them.
//      * ────────────────────────────────────────────────────────────────────────
//      */
//     {
//       icon: FolderKanban,
//       label: "My Projects",
//       key:   "my-projects",
//       badge: assignedProjectCount,
//       badgeColor: "bg-indigo-500/20 text-indigo-400",
//       show:  hasPermission("view_assigned_projects") && assignedProjectCount > 0,
//     },

//     {
//   icon: FileText,
//   label: "My Leads",
//   key: "my-leads",
//   badge: assignedLeadCount,
//   badgeColor: "bg-cyan-500/20 text-cyan-400",
//   show: hasPermission("view_assigned_leads") && assignedLeadCount > 0,
// },

//   ].filter((n) => n.show);

//   const systemNav = [
//     {
//       icon: Settings, label: "Settings", key: "settings",
//       show: hasPermission("view_settings") || hasPermission("view_roles"),
//     },
//   ].filter((n) => n.show);

//   const pageTitle = {
//     dashboard: "Overview",
//     leads: "Leads",
//     newsletters: "Newsletter Subscribers",
//     contacts: "Contact Leads",
//     comments: "Comments",
//     users: "Users",
//     analytics: "Analytics",
//     projects: "Projects",
//     settings: "Settings",
//      proposals: "Proposal Generation", 
//       "my-projects": "My Assigned Projects",  /* ── NEW ── */
//       "my-leads": "My Assigned Leads",
//   }[page] || "Dashboard";

//   const navigateTo = (key) => {
//     setPage(key);
//     setSidebarOpen(false);
//   };

//   /* ── Settings tabs: build from permissions ── */
//   const settingsTabs = [
//     hasPermission("view_users") && { key: "users", icon: UserCog, label: "Users" },
//     hasPermission("view_roles") && { key: "roles", icon: Shield, label: "Roles & Permissions" },
//     hasPermission("view_settings") && { key: "general", icon: Settings, label: "General" },
//   ].filter(Boolean);

//   return (
//     <div className="flex min-h-screen bg-[#0b0b1a] text-white font-sans">
//       <Toaster
//         position="top-right"
//         toastOptions={{
//           style: {
//             background: "#1a1a35", color: "#fff",
//             border: "1px solid rgba(255,255,255,0.08)",
//             borderRadius: "12px", fontSize: "13px",
//           },
//         }}
//       />

//       {/* ── mobile backdrop ── */}
//       <AnimatePresence>
//         {sidebarOpen && (
//           <motion.div
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             onClick={() => setSidebarOpen(false)}
//             className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
//           />
//         )}
//       </AnimatePresence>

//       {/* ────────────────────── SIDEBAR ────────────────────── */}
//       <aside
//         className={`fixed top-0 left-0 h-full z-40 flex flex-col
//           bg-[#0f0f24] border-r border-white/5
//           transition-all duration-300 ease-in-out
//           ${sidebarCollapsed ? "w-[72px]" : "w-[240px]"}
//           ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
//           lg:translate-x-0`}
//       >
//         {/* logo */}
//         <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
//           <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
//             <Zap size={15} className="text-white" />
//           </div>
//           {!sidebarCollapsed && (
//             <div>
//               <p className="text-[15px] font-black tracking-tight text-white">Savorka</p>
//               <p className="text-[10px] text-slate-500 font-medium">CRM Dashboard</p>
//             </div>
//           )}
//         </div>

//         {/* nav */}
//         <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
//           {/* main */}
//           <div className="space-y-0.5">
//             {!sidebarCollapsed && (
//               <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Main</p>
//             )}
//             {mainNav.map((item) => (
//               <NavItem key={item.key} {...item} active={page === item.key} onClick={() => navigateTo(item.key)} collapsed={sidebarCollapsed} />
//             ))}
//           </div>

//           {/* data */}
//           {dataNav.length > 0 && (
//             <div className="space-y-0.5">
//               {!sidebarCollapsed && (
//                 <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Data</p>
//               )}
//               {dataNav.map((item) => (
//                 <NavItem key={item.key} {...item} active={page === item.key} onClick={() => navigateTo(item.key)} collapsed={sidebarCollapsed} />
//               ))}
//             </div>
//           )}

//           {/* management */}
//           {managementNav.length > 0 && (
//             <div className="space-y-0.5">
//               {!sidebarCollapsed && (
//                 <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Management</p>
//               )}
//               {managementNav.map((item) => (
//                 <NavItem key={item.key} {...item} active={page === item.key} onClick={() => navigateTo(item.key)} collapsed={sidebarCollapsed} />
//               ))}
//             </div>
//           )}

//           {/* system */}
//           {systemNav.length > 0 && (
//             <div className="space-y-0.5">
//               {!sidebarCollapsed && (
//                 <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">System</p>
//               )}
//               {systemNav.map((item) => (
//                 <NavItem key={item.key} {...item} active={page === item.key} onClick={() => navigateTo(item.key)} collapsed={sidebarCollapsed} />
//               ))}
//             </div>
//           )}
//         </nav>

//         {/* admin footer */}
//         <div className="px-2 py-3 border-t border-white/5 space-y-1">
//           {!sidebarCollapsed && (
//             <div className="flex items-center gap-2 px-3 py-2 mb-1">
//               <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
//                 {admin?.name?.[0]?.toUpperCase() || "A"}
//               </div>
//               <div className="overflow-hidden">
//                 <p className="text-[12px] font-semibold text-white truncate">{admin?.name}</p>
//                 <p className={`text-[10px] font-medium ${roleInfo.color}`}>{roleInfo.label}</p>
//               </div>
//             </div>
//           )}
//           <button
//             onClick={handleLogout}
//             className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-[13px] font-medium"
//           >
//             <LogOut size={17} strokeWidth={1.8} />
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
//         <header className="sticky top-0 z-30 bg-[#0b0b1a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3.5 flex justify-between items-center">
//           <div className="flex items-center gap-3">
//             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition">
//               {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
//             </button>
//             <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition">
//               <Menu size={18} />
//             </button>
//             <div className="flex items-center gap-2">
//               <Activity size={15} className="text-indigo-400" />
//               <h1 className="font-semibold text-[15px] text-white">{pageTitle}</h1>
//             </div>
//           </div>

//           <div className="flex items-center gap-2">
//             {/* Role badge */}
//             <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${roleInfo.bg}`}>
//               <Shield size={11} className={roleInfo.color} />
//               <span className={`text-[11px] font-semibold ${roleInfo.color}`}>{roleInfo.label}</span>
//             </div>

//             {/* clock */}
//             <div className="hidden md:flex flex-col items-end mr-1">
//               <p className="text-[11px] text-slate-500">{formatDate}</p>
//               <p className="text-[13px] font-semibold text-slate-300 tabular-nums">{formatTime}</p>
//             </div>

//             {/* notifications */}
//             <div className="relative">
//               <button
//                 onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
//                 className="relative p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition"
//               >
//                 <Bell size={18} strokeWidth={1.8} />
//                 {notifications.length > 0 && (
//                   <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-[#0b0b1a]" />
//                 )}
//               </button>
//               <AnimatePresence>
//                 {notifOpen && (
//                   <motion.div
//                     initial={{ opacity: 0, y: -8, scale: 0.96 }}
//                     animate={{ opacity: 1, y: 0, scale: 1 }}
//                     exit={{ opacity: 0, y: -8, scale: 0.96 }}
//                     transition={{ duration: 0.15 }}
//                     className="absolute right-0 mt-2 w-80 bg-[#141428] border border-white/8 shadow-2xl rounded-2xl p-4 z-50"
//                   >
//                     <div className="flex items-center justify-between mb-3">
//                       <p className="font-semibold text-sm text-white">Notifications</p>
//                       {notifications.length > 0 && (
//                         <span className="text-[11px] text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded-full font-medium">
//                           {notifications.length} new
//                         </span>
//                       )}
//                     </div>
//                     <div className="max-h-64 overflow-y-auto space-y-1.5">
//                       {notifications.length === 0 ? (
//                         <div className="text-center py-6">
//                           <Bell size={24} className="mx-auto text-slate-600 mb-2" />
//                           <p className="text-sm text-slate-500">All caught up</p>
//                         </div>
//                       ) : (
//                         notifications.map((n, i) => (
//                           <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition">
//                             <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
//                             <div>
//                               <p className="text-[13px] text-slate-200">{n.message}</p>
//                               <p className="text-[11px] text-slate-500 mt-0.5">{new Date(n.time).toLocaleTimeString()}</p>
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
//                 className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/5 transition"
//               >
//                 <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
//                   {admin?.name?.[0]?.toUpperCase() || "A"}
//                 </div>
//                 <span className="hidden md:block text-[13px] font-medium text-slate-300">{admin?.name}</span>
//               </button>
//               <AnimatePresence>
//                 {profileOpen && (
//                   <motion.div
//                     initial={{ opacity: 0, y: -8, scale: 0.96 }}
//                     animate={{ opacity: 1, y: 0, scale: 1 }}
//                     exit={{ opacity: 0, y: -8, scale: 0.96 }}
//                     transition={{ duration: 0.15 }}
//                     className="absolute right-0 mt-2 w-52 bg-[#141428] border border-white/8 shadow-2xl rounded-2xl overflow-hidden z-50"
//                   >
//                     <div className="px-4 py-3 border-b border-white/5">
//                       <p className="text-[13px] font-semibold text-white">{admin?.name}</p>
//                       <p className={`text-[11px] font-medium mt-0.5 ${roleInfo.color}`}>{roleInfo.label}</p>
//                       <p className="text-[10px] text-slate-600 truncate">{admin?.email}</p>
//                     </div>
//                     <button className="w-full px-4 py-2.5 text-left text-[13px] text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-2 transition">
//                       <User size={13} /> Profile
//                     </button>
//                     {(hasPermission("view_settings") || hasPermission("view_roles") || hasPermission("view_users")) && (
//                       <button
//                         onClick={() => { setPage("settings"); setProfileOpen(false); }}
//                         className="w-full px-4 py-2.5 text-left text-[13px] text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-2 transition"
//                       >
//                         <Settings size={13} /> Settings
//                       </button>
//                     )}
//                     <div className="border-t border-white/5" />
//                     <button
//                       onClick={handleLogout}
//                       className="w-full px-4 py-2.5 text-left text-[13px] text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition"
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
//         <main className="flex-1 p-6 overflow-y-auto">
//           <AnimatePresence mode="wait">

//             {/* ── DASHBOARD ── */}
//             {page === "dashboard" && (
//               <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
//                 <div>
//                   <h2 className="text-2xl font-black text-white">
//                     Good{" "}
//                     {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},
//                     {" "}{admin?.name?.split(" ")[0]} 👋
//                   </h2>
//                   <p className="text-slate-500 text-sm mt-1">Here's what's happening in your CRM today.</p>
//                 </div>

//                 {/* metric cards - only show what user has access to */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
//                   {hasPermission("view_leads") && (
//                     <MetricCard label="Total Leads" value={leadCount} icon={FileText} gradient="bg-gradient-to-br from-blue-600 to-cyan-500" loading={loading} trend="All time" />
//                   )}
//                   {hasPermission("view_newsletters") && (
//                     <MetricCard label="Newsletter Subscribers" value={newsletterCount} icon={Users} gradient="bg-gradient-to-br from-emerald-600 to-teal-500" loading={loading} trend="All time" />
//                   )}
//                   {hasPermission("view_contacts") && (
//                     <MetricCard label="Contact Leads" value={contactCount} icon={Mail} gradient="bg-gradient-to-br from-violet-600 to-purple-500" loading={loading} trend="All time" />
//                   )}
//                   {hasPermission("view_comments") && (
//                     <MetricCard label="Comments" value={commentCount} icon={MessageSquareText} gradient="bg-gradient-to-br from-amber-500 to-orange-500" loading={loading} trend="All time" />
//                   )}
//                 </div>

//                 {/* quick access - only visible sections */}
//                 {dataNav.length > 0 && (
//                   <div>
//                     <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Quick Access</p>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
//                       {dataNav.map((item) => (
//                         <motion.button
//                           key={item.key}
//                           whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
//                           onClick={() => setPage(item.key)}
//                           className="flex items-center gap-3 p-4 bg-[#141428] border border-white/5 rounded-2xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group text-left"
//                         >
//                           <div className="p-2 rounded-xl bg-white/5 group-hover:bg-indigo-500/15 transition">
//                             <item.icon size={18} className="text-slate-400 group-hover:text-indigo-400 transition" />
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="text-[13px] font-semibold text-slate-300 group-hover:text-white transition truncate">{item.label}</p>
//                             <p className="text-[11px] text-slate-600">{item.badge} records</p>
//                           </div>
//                           <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition flex-shrink-0" />
//                         </motion.button>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </motion.div>
//             )}

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

//             {/* ── USERS (standalone page from sidebar) ── */}
//             {page === "users" && (
//               <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 {hasPermission("view_users")
//                   ? <ViewUsers />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}



//               {page === "analytics" && (
//   <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//     {hasPermission("view_analytics")
//       ? <ViewAnalytics />
//       : <AccessDenied goBack={() => setPage("dashboard")} />}
//   </motion.div>
// )}

//             {page === "projects" && (
//   <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//     {hasPermission("view_projects")
//       ? <ViewProjects />
//       : <AccessDenied goBack={() => setPage("dashboard")} />}
//   </motion.div>
// )}

// {page === "proposals" && (
//   <motion.div key="proposals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//     {hasPermission("view_proposals")
//       ? <ViewProposals />
//       : <AccessDenied goBack={() => setPage("dashboard")} />}
//   </motion.div>
// )}


//             {/* ── MY ASSIGNED PROJECTS PAGE ──────────────────────────────────────
//                 Guard: view_assigned_projects  (NOT view_projects)
//                 This ensures the two modules are fully permission-isolated.
//             ─────────────────────────────────────────────────────────────────── */}
//             {page === "my-projects" && (
//               <motion.div key="my-projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 {hasPermission("view_assigned_projects") && assignedProjectCount > 0
//                   ? <MyAssignedProjects />
//                   : <AccessDenied goBack={() => setPage("dashboard")} />}
//               </motion.div>
//             )}

//             {page === "my-leads" && (
//   <motion.div
//     key="my-leads"
//     initial={{ opacity: 0 }}
//     animate={{ opacity: 1 }}
//     exit={{ opacity: 0 }}
//   >
//     {hasPermission("view_assigned_leads") && assignedLeadCount > 0
//       ? <AssignedLeads />
//       : <AccessDenied goBack={() => setPage("dashboard")} />}
//   </motion.div>
// )}
            

//             {/* ── SETTINGS ── */}
//             {page === "settings" && (
//               <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
//                 <div>
//                   <h2 className="text-xl font-black text-white">Settings</h2>
//                   <p className="text-slate-500 text-[13px] mt-0.5">Manage system configuration, users, and access control.</p>
//                 </div>

//                 {/* Settings sub-nav — dynamically built from permissions */}
//                 {settingsTabs.length > 0 && (
//                   <div className="flex gap-1 bg-white/4 rounded-xl p-1 w-fit flex-wrap">
//                     {settingsTabs.map((tab) => (
//                       <button
//                         key={tab.key}
//                         onClick={() => setSettingsSubPage(tab.key)}
//                         className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all
//                           ${settingsSubPage === tab.key
//                             ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
//                             : "text-slate-400 hover:text-white"
//                           }`}
//                       >
//                         <tab.icon size={14} />
//                         {tab.label}
//                       </button>
//                     ))}
//                   </div>
//                 )}

//                 {/* ── Users sub-page ── */}
//                 {settingsSubPage === "users" && (
//                   hasPermission("view_users")
//                     ? <ViewUsers />
//                     : <AccessDenied goBack={() => setPage("dashboard")} />
//                 )}

//                 {/* ── Roles sub-page ── */}
//                 {settingsSubPage === "roles" && (
//                   hasPermission("view_roles")
//                     ? <ViewRoles />
//                     : <AccessDenied goBack={() => setPage("dashboard")} />
//                 )}

//                 {/* ── General settings ── */}
//                 {settingsSubPage === "general" && (
//                   hasPermission("view_settings")
//                     ? (
//                       <div className="bg-[#141428] border border-white/5 rounded-2xl p-8 text-center">
//                         <Settings size={32} className="mx-auto text-slate-600 mb-3" />
//                         <p className="text-slate-400 text-[13px]">General settings component — add your settings here</p>
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