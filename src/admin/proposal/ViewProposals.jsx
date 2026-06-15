import { useState, useEffect, useCallback, useRef } from "react";
import API_BASE_URL from "../../config/api";
import {
  FileText, Send, Eye, CheckCircle, XCircle, Clock, TrendingUp,
  Sun, IndianRupee, BarChart3, Users, X, Loader2, AlertCircle,
  RotateCcw, Layers, Sparkles, RefreshCw, Search, Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import GenerateModal from "./GenerateModal";
import ProposalDetailPanel from "./ProposalDetailPanel";

// ─── Constants ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:     { label: "Draft",     color: "text-slate-500",   bg: "bg-slate-100",      border: "border-slate-200",  icon: FileText },
  generating:{ label: "Generating",color: "text-amber-700",   bg: "bg-amber-50",       border: "border-amber-200",  icon: Loader2 },
  sent:      { label: "Sent",      color: "text-sky-700",     bg: "bg-sky-50",         border: "border-sky-200",    icon: Send },
  opened:    { label: "Opened",    color: "text-violet-700",  bg: "bg-violet-50",      border: "border-violet-200", icon: Eye },
  accepted:  { label: "Accepted",  color: "text-emerald-700", bg: "bg-emerald-50",     border: "border-emerald-200",icon: CheckCircle },
  rejected:  { label: "Rejected",  color: "text-rose-700",    bg: "bg-rose-50",        border: "border-rose-200",   icon: XCircle },
  expired:   { label: "Expired",   color: "text-orange-700",  bg: "bg-orange-50",      border: "border-orange-200", icon: Clock },
  revised:   { label: "Revised",   color: "text-purple-700",  bg: "bg-purple-50",      border: "border-purple-200", icon: RotateCcw },
};

const fmt = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";
const fmtKW = (n) => n ? `${n} kW` : "—";
const fmtYrs = (n) => n ? `${n} yrs` : "—";

// ─── Status Badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status, genStatus }) => {
  const isGenerating = genStatus === "generating" || genStatus === "pending";
  if (isGenerating) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Loader2 size={10} className="animate-spin" /> Generating
      </span>
    );
  }
  if (genStatus === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle size={10} /> Failed
      </span>
    );
  }
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
};

// ─── Metric Card ────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, icon: Icon, accentColor, accentBg, accentBorder, sub, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, type: "spring", stiffness: 260, damping: 22 }}
    className="relative overflow-hidden bg-white rounded-2xl p-5 group hover:-translate-y-0.5 transition-all duration-300"
    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)" }}
  >
    {/* Subtle top accent bar */}
    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor} opacity-60`} />
    {/* Decorative circle */}
    <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full ${accentBg} opacity-40`} />

    <div className="relative flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2.5">{label}</p>
        <h3 className="text-[28px] font-black text-gray-900 tabular-nums leading-none">{value ?? "—"}</h3>
        {sub && <p className="text-[11px] text-gray-400 mt-2 font-medium">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${accentBg} ${accentBorder} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={18} className={accentColor} strokeWidth={1.8} />
      </div>
    </div>
  </motion.div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const ViewProposals = () => {
  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [generateModal, setGenerateModal] = useState(null); // null | "lead" | "manual"
  const [pollingIds, setPollingIds] = useState(new Set());
  const pollRef = useRef({});

  const token = () => localStorage.getItem("adminToken");
  const headers = () => ({ Authorization: `Bearer ${token()}`, "Content-Type": "application/json" });

  // ── Fetch Proposals ──
  const fetchProposals = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page, limit: 15, ...(search && { search }), ...(statusFilter && { status: statusFilter }) });
      const res = await fetch(`${API_BASE_URL}/proposals?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setProposals(data.proposals || []);
      setPagination(data.pagination || {});
    } catch { /* silent */ }
    setLoading(false);
  }, [page, search, statusFilter]);

  // ── Fetch Stats ──
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/proposals/stats`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setStats(data);
    } catch { /* silent */ }
    setStatsLoading(false);
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Poll generating proposals ──
  useEffect(() => {
    const generating = proposals.filter((p) =>
      p.generationStatus === "generating" || p.generationStatus === "pending"
    );
    generating.forEach((p) => {
      if (pollRef.current[p._id]) return;
      pollRef.current[p._id] = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/proposals/${p._id}/status`, { headers: { Authorization: `Bearer ${token()}` } });
          const d = await res.json();
          if (d.generationStatus === "completed" || d.generationStatus === "failed") {
            clearInterval(pollRef.current[p._id]);
            delete pollRef.current[p._id];
            fetchProposals();
            fetchStats();
            if (selectedProposal?._id === p._id) {
              const r = await fetch(`${API_BASE_URL}/proposals/${p._id}`, { headers: { Authorization: `Bearer ${token()}` } });
              setSelectedProposal(await r.json());
            }
          }
        } catch { /* ignore */ }
      }, 2500);
    });
    return () => { Object.values(pollRef.current).forEach(clearInterval); };
  }, [proposals]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchProposals(); }, 350);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  const handleSend = async (id) => {
    await fetch(`${API_BASE_URL}/proposals/${id}/send`, { method: "POST", headers: headers(), body: JSON.stringify({ channels: ["whatsapp", "email"] }) });
    fetchProposals();
    if (selectedProposal?._id === id) {
      const r = await fetch(`${API_BASE_URL}/proposals/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
      setSelectedProposal(await r.json());
    }
  };

  const handleRegenerate = async (id) => {
    await fetch(`${API_BASE_URL}/proposals/${id}/regenerate`, { method: "POST", headers: headers() });
    fetchProposals();
    setSelectedProposal(null);
  };

  const handleStatusChange = async (id, status) => {
    await fetch(`${API_BASE_URL}/proposals/${id}/status`, { method: "PATCH", headers: headers(), body: JSON.stringify({ status }) });
    fetchProposals();
    if (selectedProposal?._id === id) {
      const r = await fetch(`${API_BASE_URL}/proposals/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
      setSelectedProposal(await r.json());
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this proposal?")) return;
    await fetch(`${API_BASE_URL}/proposals/${id}`, { method: "DELETE", headers: headers() });
    fetchProposals();
    if (selectedProposal?._id === id) setSelectedProposal(null);
  };

  const openDetail = async (proposal) => {
    if (proposal.generationStatus === "completed") {
      const res = await fetch(`${API_BASE_URL}/proposals/${proposal._id}`, { headers: { Authorization: `Bearer ${token()}` } });
      setSelectedProposal(await res.json());
    } else {
      setSelectedProposal(proposal);
    }
  };

  const s = stats?.summary;

  // Avatar color palette based on first char
  const avatarColors = [
    { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
    { bg: "bg-sky-100",    text: "text-sky-700",    border: "border-sky-200" },
    { bg: "bg-emerald-100",text: "text-emerald-700",border: "border-emerald-200" },
    { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200" },
    { bg: "bg-rose-100",   text: "text-rose-700",   border: "border-rose-200" },
  ];
  const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="space-y-7 relative">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Sun size={16} className="text-amber-500" strokeWidth={2} />
            </div>
            <h2 className="text-[22px] font-black text-gray-900 tracking-tight">Proposal Generation</h2>
          </div>
          <p className="text-gray-400 text-[13px] ml-10.5">
            AI-powered solar proposals
            <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold">
              {pagination.total || 0} total
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchProposals(); fetchStats(); }}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all duration-200 hover:shadow-sm"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setGenerateModal("lead")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-[13px] font-semibold transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
          >
            <Users size={14} className="text-gray-500" /> From Lead
          </button>
          <button
            onClick={() => setGenerateModal("manual")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
            style={{
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)",
              boxShadow: "0 2px 8px rgba(22,163,74,0.35), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.15)"
            }}
          >
            <Plus size={14} /> New Proposal
          </button>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard index={0} label="Total Proposals" value={s?.total ?? "—"} icon={FileText}
          accentColor="text-violet-500" accentBg="bg-violet-50" accentBorder="border-violet-100"
          sub="All time" />
        <MetricCard index={1} label="Sent" value={s?.sent ?? "—"} icon={Send}
          accentColor="text-sky-500" accentBg="bg-sky-50" accentBorder="border-sky-100"
          sub={`${s?.openRate ?? 0}% open rate`} />
        <MetricCard index={2} label="Accepted" value={s?.accepted ?? "—"} icon={CheckCircle}
          accentColor="text-emerald-500" accentBg="bg-emerald-50" accentBorder="border-emerald-100"
          sub={`${s?.conversionRate ?? 0}% conversion`} />
        <MetricCard index={3}
          label="Revenue Pipeline"
          value={s?.totalRevenuePotential ? `₹${(s.totalRevenuePotential / 100000).toFixed(1)}L` : "—"}
          icon={IndianRupee}
          accentColor="text-amber-500" accentBg="bg-amber-50" accentBorder="border-amber-100"
          sub="Net investment total" />
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all appearance-none cursor-pointer pr-8"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* ── Proposals Table ── */}
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.07)" }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 size={28} className="animate-spin text-green-500" />
            <p className="text-[13px] font-medium">Loading proposals...</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 flex items-center justify-center">
                <Sun size={26} className="text-amber-400" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-100 border-2 border-white flex items-center justify-center">
                <Sparkles size={9} className="text-green-600" />
              </div>
            </div>
            <h3 className="text-[16px] font-black text-gray-900 mb-1.5">No proposals yet</h3>
            <p className="text-gray-400 text-[13px] mb-6 max-w-xs">Generate your first AI-powered solar proposal and start closing deals</p>
            <button
              onClick={() => setGenerateModal("lead")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-all hover:opacity-90 hover:-translate-y-px"
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                boxShadow: "0 2px 8px rgba(22,163,74,0.3), inset 0 1px 0 rgba(255,255,255,0.15)"
              }}
            >
              <Sparkles size={14} /> Generate First Proposal
            </button>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 border-b border-gray-100 bg-gray-50/70">
              {["Customer", "System Size", "Net Cost", "Monthly Savings", "Status", ""].map((h, i) => (
                <p key={i} className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">{h}</p>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {proposals.map((proposal, idx) => {
                const av = getAvatarColor(proposal.customer?.name);
                return (
                  <motion.div
                    key={proposal._id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-6 py-4 hover:bg-gray-50/80 transition-all duration-150 group cursor-pointer relative"
                    onClick={() => openDetail(proposal)}
                  >
                    {/* Left accent on hover */}
                    <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    {/* Customer */}
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black flex-shrink-0 border ${av.bg} ${av.text} ${av.border}`}>
                        {proposal.customer?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-gray-900 truncate">{proposal.customer?.name}</p>
                        <p className="text-[11px] text-gray-400 truncate font-medium">{proposal.customer?.whatsapp}
                          <span className="mx-1 text-gray-300">·</span>
                          <span className="text-gray-400">v{proposal.version}</span>
                        </p>
                      </div>
                    </div>

                    {/* System Size */}
                    <div>
                      <p className="text-[13px] font-bold text-amber-600">{fmtKW(proposal.proposal?.systemSizeKW)}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{proposal.proposal?.panelCount ? `${proposal.proposal.panelCount} panels` : "—"}</p>
                    </div>

                    {/* Net Cost */}
                    <div>
                      <p className="text-[13px] font-bold text-gray-800">{fmt(proposal.proposal?.netCost)}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{fmtYrs(proposal.proposal?.paybackYears)} payback</p>
                    </div>

                    {/* Monthly Savings */}
                    <div>
                      <p className="text-[13px] font-bold text-emerald-600">{fmt(proposal.proposal?.monthlyEnergySavings)}</p>
                      <p className="text-[11px] text-gray-400 font-medium">per month</p>
                    </div>

                    {/* Status */}
                    <div>
                      <StatusBadge status={proposal.status} genStatus={proposal.generationStatus} />
                      <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{new Date(proposal.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDetail(proposal); }}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition"
                        title="View"
                      >
                        <Eye size={13} />
                      </button>
                      {proposal.generationStatus === "completed" && proposal.status === "draft" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSend(proposal._id); }}
                          className="p-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 transition"
                          title="Send"
                        >
                          <Send size={13} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(proposal._id); }}
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 transition"
                        title="Delete"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <p className="text-[12px] text-gray-400 font-medium">
                  Showing <span className="text-gray-700 font-bold">{proposals.length}</span> of <span className="text-gray-700 font-bold">{pagination.total}</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                  >
                    ←
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-[12px] font-bold transition-all ${
                          page === p
                            ? "text-white shadow-sm"
                            : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900"
                        }`}
                        style={page === p ? {
                          background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                          boxShadow: "0 2px 6px rgba(22,163,74,0.3)"
                        } : { boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {generateModal && (
          <GenerateModal
            mode={generateModal}
            onClose={() => setGenerateModal(null)}
            onGenerated={() => {
              setGenerateModal(null);
              fetchProposals();
              fetchStats();
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Proposal Detail Panel ── */}
      <AnimatePresence>
        {selectedProposal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setSelectedProposal(null)}
            />
            <ProposalDetailPanel
              proposal={selectedProposal}
              onClose={() => setSelectedProposal(null)}
              onSend={handleSend}
              onRegenerate={handleRegenerate}
              onStatusChange={handleStatusChange}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewProposals;





// import { useState, useEffect, useCallback, useRef } from "react";
// import API_BASE_URL from "../../config/api";
// import {
//   FileText, Send, Eye, CheckCircle, XCircle, Clock, TrendingUp,
//   Sun, IndianRupee, BarChart3, Users, X, Loader2, AlertCircle,
//   RotateCcw, Layers, Sparkles, RefreshCw, Search, Plus,
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// import GenerateModal from "./GenerateModal";
// import ProposalDetailPanel from "./ProposalDetailPanel";

// // ─── Constants ─────────────────────────────────────────────────────────────
// const STATUS_CONFIG = {
//   draft:     { label: "Draft",     color: "text-slate-400",   bg: "bg-slate-500/15",  icon: FileText },
//   generating:{ label: "Generating",color: "text-amber-400",   bg: "bg-amber-500/15",  icon: Loader2 },
//   sent:      { label: "Sent",      color: "text-blue-400",    bg: "bg-blue-500/15",   icon: Send },
//   opened:    { label: "Opened",    color: "text-indigo-400",  bg: "bg-indigo-500/15", icon: Eye },
//   accepted:  { label: "Accepted",  color: "text-emerald-400", bg: "bg-emerald-500/15",icon: CheckCircle },
//   rejected:  { label: "Rejected",  color: "text-red-400",     bg: "bg-red-500/15",    icon: XCircle },
//   expired:   { label: "Expired",   color: "text-orange-400",  bg: "bg-orange-500/15", icon: Clock },
//   revised:   { label: "Revised",   color: "text-violet-400",  bg: "bg-violet-500/15", icon: RotateCcw },
// };

// const fmt = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";
// const fmtKW = (n) => n ? `${n} kW` : "—";
// const fmtYrs = (n) => n ? `${n} yrs` : "—";

// // ─── Status Badge ───────────────────────────────────────────────────────────
// const StatusBadge = ({ status, genStatus }) => {
//   const isGenerating = genStatus === "generating" || genStatus === "pending";
//   if (isGenerating) {
//     return (
//       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400">
//         <Loader2 size={10} className="animate-spin" /> Generating
//       </span>
//     );
//   }
//   if (genStatus === "failed") {
//     return (
//       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400">
//         <AlertCircle size={10} /> Failed
//       </span>
//     );
//   }
//   const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
//   const Icon = cfg.icon;
//   return (
//     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
//       <Icon size={10} /> {cfg.label}
//     </span>
//   );
// };

// // ─── Metric Card ────────────────────────────────────────────────────────────
// const MetricCard = ({ label, value, icon: Icon, gradient, sub }) => (
//   <div className="relative overflow-hidden bg-[#141428] border border-white/5 rounded-2xl p-5">
//     <div className={`absolute inset-0 opacity-8 ${gradient}`} />
//     <div className="relative z-10 flex items-start justify-between">
//       <div>
//         <p className="text-white text-[10px] font-semibold uppercase tracking-widest mb-2">{label}</p>
//         <h3 className="text-3xl font-black text-white tabular-nums">{value ?? "—"}</h3>
//         {sub && <p className="text-[11px] text-white mt-1">{sub}</p>}
//       </div>
//       <div className={`p-2.5 rounded-xl ${gradient} bg-opacity-20 border border-white/10`}>
//         <Icon size={18} className="text-white" strokeWidth={1.8} />
//       </div>
//     </div>
//   </div>
// );

// // ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
// const ViewProposals = () => {
//   const [proposals, setProposals] = useState([]);
//   const [stats, setStats] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [statsLoading, setStatsLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [page, setPage] = useState(1);
//   const [pagination, setPagination] = useState({});
//   const [selectedProposal, setSelectedProposal] = useState(null);
//   const [generateModal, setGenerateModal] = useState(null); // null | "lead" | "manual"
//   const [pollingIds, setPollingIds] = useState(new Set());
//   const pollRef = useRef({});

//   const token = () => localStorage.getItem("adminToken");
//   const headers = () => ({ Authorization: `Bearer ${token()}`, "Content-Type": "application/json" });

//   // ── Fetch Proposals ──
//   const fetchProposals = useCallback(async () => {
//     try {
//       const params = new URLSearchParams({ page, limit: 15, ...(search && { search }), ...(statusFilter && { status: statusFilter }) });
//       const res = await fetch(`${API_BASE_URL}/proposals?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
//       const data = await res.json();
//       setProposals(data.proposals || []);
//       setPagination(data.pagination || {});
//     } catch { /* silent */ }
//     setLoading(false);
//   }, [page, search, statusFilter]);

//   // ── Fetch Stats ──
//   const fetchStats = useCallback(async () => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/proposals/stats`, { headers: { Authorization: `Bearer ${token()}` } });
//       const data = await res.json();
//       setStats(data);
//     } catch { /* silent */ }
//     setStatsLoading(false);
//   }, []);

//   useEffect(() => { fetchProposals(); }, [fetchProposals]);
//   useEffect(() => { fetchStats(); }, [fetchStats]);

//   // ── Poll generating proposals ──
//   useEffect(() => {
//     const generating = proposals.filter((p) =>
//       p.generationStatus === "generating" || p.generationStatus === "pending"
//     );

//     generating.forEach((p) => {
//       if (pollRef.current[p._id]) return;
//       pollRef.current[p._id] = setInterval(async () => {
//         try {
//           const res = await fetch(`${API_BASE_URL}/proposals/${p._id}/status`, { headers: { Authorization: `Bearer ${token()}` } });
//           const d = await res.json();
//           if (d.generationStatus === "completed" || d.generationStatus === "failed") {
//             clearInterval(pollRef.current[p._id]);
//             delete pollRef.current[p._id];
//             fetchProposals();
//             fetchStats();
//             // Update selected proposal if open
//             if (selectedProposal?._id === p._id) {
//               const r = await fetch(`${API_BASE_URL}/proposals/${p._id}`, { headers: { Authorization: `Bearer ${token()}` } });
//               setSelectedProposal(await r.json());
//             }
//           }
//         } catch { /* ignore */ }
//       }, 2500);
//     });

//     return () => {
//       Object.values(pollRef.current).forEach(clearInterval);
//     };
//   }, [proposals]);

//   // Debounced search
//   useEffect(() => {
//     const t = setTimeout(() => { setPage(1); fetchProposals(); }, 350);
//     return () => clearTimeout(t);
//   }, [search, statusFilter]);

//   const handleSend = async (id) => {
//     await fetch(`${API_BASE_URL}/proposals/${id}/send`, { method: "POST", headers: headers(), body: JSON.stringify({ channels: ["whatsapp", "email"] }) });
//     fetchProposals();
//     if (selectedProposal?._id === id) {
//       const r = await fetch(`${API_BASE_URL}/proposals/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
//       setSelectedProposal(await r.json());
//     }
//   };

//   const handleRegenerate = async (id) => {
//     await fetch(`${API_BASE_URL}/proposals/${id}/regenerate`, { method: "POST", headers: headers() });
//     fetchProposals();
//     setSelectedProposal(null);
//   };

//   const handleStatusChange = async (id, status) => {
//     await fetch(`${API_BASE_URL}/proposals/${id}/status`, { method: "PATCH", headers: headers(), body: JSON.stringify({ status }) });
//     fetchProposals();
//     if (selectedProposal?._id === id) {
//       const r = await fetch(`${API_BASE_URL}/proposals/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
//       setSelectedProposal(await r.json());
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!confirm("Delete this proposal?")) return;
//     await fetch(`${API_BASE_URL}/proposals/${id}`, { method: "DELETE", headers: headers() });
//     fetchProposals();
//     if (selectedProposal?._id === id) setSelectedProposal(null);
//   };

//   const openDetail = async (proposal) => {
//     if (proposal.generationStatus === "completed") {
//       const res = await fetch(`${API_BASE_URL}/proposals/${proposal._id}`, { headers: { Authorization: `Bearer ${token()}` } });
//       setSelectedProposal(await res.json());
//     } else {
//       setSelectedProposal(proposal);
//     }
//   };

//   const s = stats?.summary;

//   return (
//     <div className="space-y-6 relative">
//       {/* ── Header ── */}
//       <div className="flex items-start justify-between gap-4 flex-wrap">
//         <div>
//           <h2 className="text-xl font-black text-white flex items-center gap-2">
//             <Sun size={20} className="text-amber-400" /> Proposal Generation
//           </h2>
//           <p className="text-slate-500 text-[13px] mt-0.5">
//             AI-powered solar proposals · {pagination.total || 0} total
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => { fetchProposals(); fetchStats(); }}
//             className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
//           >
//             <RefreshCw size={15} />
//           </button>
//           <button
//             onClick={() => setGenerateModal("lead")}
//             className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[13px] font-medium transition border border-white/8"
//           >
//             <Users size={14} /> From Lead
//           </button>
//           <button
//             onClick={() => setGenerateModal("manual")}
//             className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-semibold hover:opacity-90 transition shadow-lg shadow-indigo-500/20"
//           >
//             <Plus size={14} /> New Proposal
//           </button>
//         </div>
//       </div>

//       {/* ── Stats ── */}
//       <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
//         <MetricCard label="Total Proposals" value={s?.total ?? "—"} icon={FileText} gradient="bg-gradient-to-br from-indigo-600 to-violet-600" sub="All time" />
//         <MetricCard label="Sent" value={s?.sent ?? "—"} icon={Send} gradient="bg-gradient-to-br from-blue-600 to-cyan-500" sub={`${s?.openRate ?? 0}% open rate`} />
//         <MetricCard label="Accepted" value={s?.accepted ?? "—"} icon={CheckCircle} gradient="bg-gradient-to-br from-emerald-600 to-teal-500" sub={`${s?.conversionRate ?? 0}% conversion`} />
//         <MetricCard
//           label="Revenue Pipeline"
//           value={s?.totalRevenuePotential ? `₹${(s.totalRevenuePotential / 100000).toFixed(1)}L` : "—"}
//           icon={IndianRupee}
//           gradient="bg-gradient-to-br from-amber-500 to-orange-500"
//           sub="Net investment total"
//         />
//       </div>

//       {/* ── Filters ── */}
//       <div className="flex gap-3 flex-wrap">
//         <div className="relative flex-1 min-w-[200px]">
//           <Search size={14} className="absolute left-3 top-3 text-slate-500" />
//           <input
//             type="text"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search by name, phone..."
//             className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition"
//           />
//         </div>
//         <select
//           value={statusFilter}
//           onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
//           className="bg-[#0f0f24] border border-white/8 rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-indigo-500/50 transition appearance-none"
//         >
//           <option value="">All Statuses</option>
//           {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
//             <option key={key} value={key}>{cfg.label}</option>
//           ))}
//         </select>
//       </div>

//       {/* ── Proposals Table ── */}
//       <div className="bg-[#141428] border border-white/5 rounded-2xl overflow-hidden">
//         {loading ? (
//           <div className="flex items-center justify-center py-16 text-slate-500">
//             <Loader2 size={24} className="animate-spin mr-3" /> Loading proposals...
//           </div>
//         ) : proposals.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-16 text-center">
//             <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
//               <Sun size={22} className="text-indigo-400" />
//             </div>
//             <h3 className="text-[15px] font-bold text-white mb-1">No proposals yet</h3>
//             <p className="text-slate-500 text-[13px] mb-5">Generate your first AI-powered solar proposal</p>
//             <button
//               onClick={() => setGenerateModal("lead")}
//               className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-semibold hover:opacity-90 transition"
//             >
//               <Sparkles size={14} /> Generate First Proposal
//             </button>
//           </div>
//         ) : (
//           <>
//             {/* Table Header */}
//             <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/5">
//               {["Customer", "System Size", "Net Cost", "Monthly Savings", "Status", ""].map((h) => (
//                 <p key={h} className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{h}</p>
//               ))}
//             </div>

//             {/* Rows */}
//             <div className="divide-y divide-white/5">
//               {proposals.map((proposal) => (
//                 <motion.div
//                   key={proposal._id}
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-white/2 transition group cursor-pointer"
//                   onClick={() => openDetail(proposal)}
//                 >
//                   {/* Customer */}
//                   <div className="flex items-center gap-3">
//                     <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
//                       {proposal.customer?.name?.[0]?.toUpperCase() || "?"}
//                     </div>
//                     <div className="min-w-0">
//                       <p className="text-[13px] font-semibold text-white truncate">{proposal.customer?.name}</p>
//                       <p className="text-[11px] text-slate-500 truncate">{proposal.customer?.whatsapp} · v{proposal.version}</p>
//                     </div>
//                   </div>

//                   {/* System Size */}
//                   <div>
//                     <p className="text-[13px] font-semibold text-amber-400">{fmtKW(proposal.proposal?.systemSizeKW)}</p>
//                     <p className="text-[11px] text-slate-500">{proposal.proposal?.panelCount ? `${proposal.proposal.panelCount} panels` : "—"}</p>
//                   </div>

//                   {/* Net Cost */}
//                   <div>
//                     <p className="text-[13px] font-semibold text-white">{fmt(proposal.proposal?.netCost)}</p>
//                     <p className="text-[11px] text-slate-500">{fmtYrs(proposal.proposal?.paybackYears)} payback</p>
//                   </div>

//                   {/* Monthly Savings */}
//                   <div>
//                     <p className="text-[13px] font-semibold text-emerald-400">{fmt(proposal.proposal?.monthlyEnergySavings)}</p>
//                     <p className="text-[11px] text-slate-500">per month</p>
//                   </div>

//                   {/* Status */}
//                   <div>
//                     <StatusBadge status={proposal.status} genStatus={proposal.generationStatus} />
//                     <p className="text-[10px] text-slate-600 mt-1">{new Date(proposal.createdAt).toLocaleDateString()}</p>
//                   </div>

//                   {/* Actions */}
//                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
//                     <button
//                       onClick={(e) => { e.stopPropagation(); openDetail(proposal); }}
//                       className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
//                     >
//                       <Eye size={14} />
//                     </button>
//                     {proposal.generationStatus === "completed" && proposal.status === "draft" && (
//                       <button
//                         onClick={(e) => { e.stopPropagation(); handleSend(proposal._id); }}
//                         className="p-2 rounded-lg hover:bg-indigo-500/15 text-slate-400 hover:text-indigo-400 transition"
//                       >
//                         <Send size={14} />
//                       </button>
//                     )}
//                     <button
//                       onClick={(e) => { e.stopPropagation(); handleDelete(proposal._id); }}
//                       className="p-2 rounded-lg hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition"
//                     >
//                       <X size={14} />
//                     </button>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>

//             {/* Pagination */}
//             {pagination.totalPages > 1 && (
//               <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
//                 <p className="text-[12px] text-slate-500">
//                   Showing {proposals.length} of {pagination.total}
//                 </p>
//                 <div className="flex gap-1">
//                   <button
//                     onClick={() => setPage(Math.max(1, page - 1))}
//                     disabled={page === 1}
//                     className="px-3 py-1.5 rounded-lg text-[12px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
//                   >
//                     ←
//                   </button>
//                   <span className="px-3 py-1.5 text-[12px] text-slate-400">{page} / {pagination.totalPages}</span>
//                   <button
//                     onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
//                     disabled={page === pagination.totalPages}
//                     className="px-3 py-1.5 rounded-lg text-[12px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
//                   >
//                     →
//                   </button>
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {/* ── Modals ── */}
//       <AnimatePresence>
//         {generateModal && (
//           <GenerateModal
//             mode={generateModal}
//             onClose={() => setGenerateModal(null)}
//             onGenerated={() => {
//               setGenerateModal(null);
//               fetchProposals();
//               fetchStats();
//             }}
//           />
//         )}
//       </AnimatePresence>

//       {/* ── Proposal Detail Panel ── */}
//       <AnimatePresence>
//         {selectedProposal && (
//           <>
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 0.4 }}
//               exit={{ opacity: 0 }}
//               className="fixed inset-0 bg-black z-40"
//               onClick={() => setSelectedProposal(null)}
//             />
//             <ProposalDetailPanel
//               proposal={selectedProposal}
//               onClose={() => setSelectedProposal(null)}
//               onSend={handleSend}
//               onRegenerate={handleRegenerate}
//               onStatusChange={handleStatusChange}
//             />
//           </>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default ViewProposals;
