import { useEffect, useState, useCallback } from "react";
import API_BASE_URL from "../../config/api";
import ViewProposal from "./ViewProposal";

// ── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16, className = "" }) => {
  const icons = {
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    filter: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
      </svg>
    ),
    plus: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    eye: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
      </svg>
    ),
    trash: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    ),
    chevronLeft: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="15,18 9,12 15,6" />
      </svg>
    ),
    chevronRight: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="9,18 15,12 9,6" />
      </svg>
    ),
    refresh: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="23,4 23,10 17,10" /><polyline points="1,20 1,14 7,14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    ),
    file: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" />
      </svg>
    ),
    x: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    arrowLeft: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12,19 5,12 12,5" />
      </svg>
    ),
    edit: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  };
  return icons[name] || null;
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:     { label: "Draft",     bg: "bg-gray-100",   text: "text-gray-600",   dot: "bg-gray-400"   },
  generated: { label: "Generated", bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-500"   },
  sent:      { label: "Sent",      bg: "bg-indigo-50",  text: "text-indigo-700", dot: "bg-indigo-500" },
  viewed:    { label: "Viewed",    bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-500"  },
  accepted:  { label: "Accepted",  bg: "bg-green-50",   text: "text-green-700",  dot: "bg-green-500"  },
  rejected:  { label: "Rejected",  bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-400"    },
  expired:   { label: "Expired",   bg: "bg-orange-50",  text: "text-orange-700", dot: "bg-orange-400" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── Currency formatter ────────────────────────────────────────────────────────
const formatCurrency = (proposal) => {
  const currency = proposal.currency || "USD";
  const subtotal = (proposal.lineItems || []).reduce(
    (sum, item) => sum + (parseFloat(item.unitPrice) || 0) * (parseFloat(item.qty) || 0), 0
  );
  const discountAmt = (subtotal * (parseFloat(proposal.discount) || 0)) / 100;
  const taxAmt = ((subtotal - discountAmt) * (parseFloat(proposal.taxRate) || 0)) / 100;
  const total = subtotal - discountAmt + taxAmt;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(total);
};

// ── Date formatter ────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="border-b border-gray-100 animate-pulse">
    {[70, 40, 30, 25, 20, 15].map((w, i) => (
      <td key={i} className="px-4 py-4">
        <div className={`h-3.5 bg-gray-100 rounded-full w-${w === 70 ? "3/4" : w === 40 ? "2/4" : w === 30 ? "1/3" : w === 25 ? "1/4" : "1/5"}`} />
        {i === 0 && <div className="h-3 bg-gray-100 rounded-full w-1/2 mt-2" />}
      </td>
    ))}
  </tr>
);

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteModal = ({ proposal, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon name="trash" size={20} className="text-red-500" />
      </div>
      <h3 className="text-base font-bold text-gray-900 text-center mb-2">Delete Proposal?</h3>
      <p className="text-sm text-gray-500 text-center mb-1">
        <span className="font-semibold text-gray-700">{proposal?.proposalTitle}</span>
      </p>
      <p className="text-xs text-gray-400 text-center mb-6">
        This action cannot be undone. The proposal and all generated content will be permanently removed.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={loading}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Status Update Dropdown ────────────────────────────────────────────────────
const StatusDropdown = ({ currentStatus, proposalId, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = async (newStatus) => {
    if (newStatus === currentStatus) { setOpen(false); return; }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/new-proposals/${proposalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdate(proposalId, newStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        disabled={loading}
        className="flex items-center gap-1 hover:opacity-80 transition disabled:opacity-50"
      >
        <StatusBadge status={currentStatus} />
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
            {ALL_STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button key={s} onClick={() => handleChange(s)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition hover:bg-gray-50 ${s === currentStatus ? "bg-gray-50" : ""}`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className={cfg.text}>{cfg.label}</span>
                  {s === currentStatus && (
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-green-500">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ hasFilters, onClear, onCreateNew }) => (
  <tr>
    <td colSpan={6}>
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Icon name="file" size={28} className="text-gray-300" />
        </div>
        <h3 className="text-base font-semibold text-gray-700 mb-1">
          {hasFilters ? "No proposals match your filters" : "No proposals yet"}
        </h3>
        <p className="text-sm text-gray-400 mb-5 max-w-xs">
          {hasFilters
            ? "Try adjusting your search query or status filter."
            : "Create your first AI-powered proposal to get started."}
        </p>
        {hasFilters ? (
          <button onClick={onClear}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Clear filters
          </button>
        ) : (
          <button onClick={onCreateNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition">
            <Icon name="plus" size={14} className="text-white" />
            Create Proposal
          </button>
        )}
      </div>
    </td>
  </tr>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProposalsListing({ onBack, onCreateNew }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewId, setViewId] = useState(null);

  const LIMIT = 10;
  const totalPages = Math.ceil(total / LIMIT);
  const hasFilters = search || statusFilter;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`${API_BASE_URL}/new-proposals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setProposals(data.proposals || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Debounce search
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/new-proposals/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteTarget(null);
      fetchProposals();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Status update ─────────────────────────────────────────────────────────
  const handleStatusUpdate = (id, newStatus) => {
    setProposals((prev) =>
      prev.map((p) => (p._id === id ? { ...p, status: newStatus } : p))
    );
  };

  // ── View proposal ─────────────────────────────────────────────────────────
  if (viewId) {
    return <ViewProposal proposalId={viewId} onClose={() => setViewId(null)} />;
  }

  // ── Stats bar ─────────────────────────────────────────────────────────────
  const statusCounts = proposals.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
            <Icon name="arrowLeft" size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">All Proposals</h1>
            <p className="text-xs text-gray-400">
              {loading ? "Loading..." : `${total} proposal${total !== 1 ? "s" : ""} total`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProposals}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">
            <Icon name="refresh" size={15} />
          </button>
          <button onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition">
            <Icon name="plus" size={15} className="text-white" />
            New Proposal
          </button>
        </div>
      </div>

      {/* Status quick-filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
            ${!statusFilter ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"}`}
        >
          All
          <span className="ml-1.5 opacity-60">{total}</span>
        </button>
        {ALL_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const isActive = statusFilter === s;
          return (
            <button key={s}
              onClick={() => { setStatusFilter(isActive ? "" : s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                ${isActive ? `${cfg.bg} ${cfg.text} border-current` : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"}`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon name="search" size={15} />
          </span>
          <input
            type="text"
            placeholder="Search by client name or proposal title..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 transition"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Proposal</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Value</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Created</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : proposals.length === 0 ? (
                <EmptyState
                  hasFilters={hasFilters}
                  onClear={() => { setSearch(""); setStatusFilter(""); }}
                  onCreateNew={onCreateNew}
                />
              ) : (
                proposals.map((proposal) => (
                  <tr
                    key={proposal._id}
                    className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors group cursor-pointer"
                    onClick={() => setViewId(proposal._id)}
                  >
                    {/* Proposal title & number */}
                    <td className="px-4 py-4 max-w-[260px]">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mt-0.5">
                          <Icon name="file" size={14} className="text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                            {proposal.proposalTitle || "Untitled Proposal"}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">
                            {proposal.proposalNumber}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {proposal.businessType && (
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                                {proposal.businessType}
                              </span>
                            )}
                            {proposal.proposalType && (
                              <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-medium">
                                {proposal.proposalType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-800">{proposal.clientName || "—"}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{proposal.clientEmail}</p>
                      {proposal.clientCompany && (
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">{proposal.clientCompany}</p>
                      )}
                    </td>

                    {/* Value */}
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(proposal)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{proposal.currency || "USD"} · {proposal.paymentTerms || "—"}</p>
                    </td>

                    {/* Status — clickable dropdown, stop propagation inside */}
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown
                        currentStatus={proposal.status}
                        proposalId={proposal._id}
                        onUpdate={handleStatusUpdate}
                      />
                    </td>

                    {/* Created date */}
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600">{formatDate(proposal.createdAt)}</p>
                      {proposal.validUntil && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Valid: {formatDate(proposal.validUntil)}
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewId(proposal._id)}
                          title="View proposal"
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Icon name="eye" size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(proposal)}
                          title="Delete proposal"
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && proposals.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3.5 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-700">{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}</span> of{" "}
              <span className="font-semibold text-gray-700">{total}</span> proposals
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Icon name="chevronLeft" size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pg;
                if (totalPages <= 5) {
                  pg = i + 1;
                } else if (page <= 3) {
                  pg = i + 1;
                } else if (page >= totalPages - 2) {
                  pg = totalPages - 4 + i;
                } else {
                  pg = page - 2 + i;
                }
                return (
                  <button key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition
                      ${pg === page ? "bg-green-600 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Icon name="chevronRight" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          proposal={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}