import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Trash2, Search, X, Filter,
  MessageSquare, CheckCircle2, Clock, XCircle, AlertTriangle,
  Loader2, SlidersHorizontal, ChevronDown,
} from "lucide-react";
import API_BASE_URL from "../config/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Spam"];

const STATUS_CONFIG = {
  Pending:  { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25",  icon: Clock },
  Approved: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", icon: CheckCircle2 },
  Rejected: { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/25",     icon: XCircle },
  Spam:     { color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/25",  icon: AlertTriangle },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Pending"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon size={9} />
      {status}
    </span>
  );
};

const StatusSelect = ({ value, onChange, disabled }) => {
  const cfg = STATUS_CONFIG[value] || STATUS_CONFIG["Pending"];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`appearance-none cursor-pointer rounded-full font-semibold border transition focus:outline-none focus:ring-1 focus:ring-indigo-500/30 px-2.5 py-1 text-[10px]
        bg-transparent ${cfg.color} ${cfg.bg} ${cfg.border} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s} className="bg-[#141428] text-white">{s}</option>
      ))}
    </select>
  );
};

const ViewComments = ({ goBack }) => {
  const [comments, setComments]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedIds, setSelectedIds]       = useState([]);
  const [search, setSearch]                 = useState("");
  const [filterStatus, setFilterStatus]     = useState("All");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [bulkDeleting, setBulkDeleting]     = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_BASE_URL}/comments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch comments.");
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error?.message || "Failed to fetch comments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, []);

  const filteredComments = useMemo(() => {
    return comments.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.email?.toLowerCase().includes(search.toLowerCase()) ||
        item.comment?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "All" ? true : item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [comments, search, filterStatus]);

  const isAllSelected =
    filteredComments.length > 0 &&
    filteredComments.every((item) => selectedIds.includes(item._id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredComments.some((item) => item._id === id))
      );
    } else {
      setSelectedIds((prev) => [
        ...new Set([...prev, ...filteredComments.map((item) => item._id)]),
      ]);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStatusChange = async (id, status) => {
    try {
      setActionLoadingId(id);
      const res  = await fetch(`${API_BASE_URL}/comments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update comment status.");
      setComments((prev) => prev.map((item) => (item._id === id ? { ...item, status } : item)));
      toast.success("Comment status updated.");
    } catch (error) {
      toast.error(error?.message || "Failed to update comment status.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this comment?");
    if (!confirmDelete) return;
    try {
      setActionLoadingId(id);
      const res  = await fetch(`${API_BASE_URL}/comments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to delete comment.");
      setComments((prev) => prev.filter((item) => item._id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      toast.success("Comment deleted successfully.");
    } catch (error) {
      toast.error(error?.message || "Failed to delete comment.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) { toast.error("Please select comments to delete."); return; }
    const confirmDelete = window.confirm(`Delete ${selectedIds.length} selected comment(s)?`);
    if (!confirmDelete) return;
    try {
      setBulkDeleting(true);
      const res  = await fetch(`${API_BASE_URL}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to delete selected comments.");
      setComments((prev) => prev.filter((item) => !selectedIds.includes(item._id)));
      setSelectedIds([]);
      toast.success("Selected comments deleted successfully.");
    } catch (error) {
      toast.error(error?.message || "Failed to delete selected comments.");
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition border border-white/5"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">All Comments</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              <span className="text-indigo-400 font-semibold">{filteredComments.length}</span> comments · Manage all submitted website comments
            </p>
          </div>
        </div>

        {/* Bulk delete */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-[12px] font-semibold transition disabled:opacity-50"
            >
              {bulkDeleting
                ? <Loader2 size={14} className="animate-spin" />
                : <Trash2 size={14} />}
              {bulkDeleting ? "Deleting…" : `Delete (${selectedIds.length})`}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, email, comment…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141428] border border-white/5 rounded-xl pl-9 pr-9 py-2 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-[#141428] border border-white/5 rounded-xl p-1">
          {["All", ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all
                ${filterStatus === s
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-[#141428] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.015]">
                {/* Checkbox */}
                <th className="px-5 py-3.5">
                  <div
                    onClick={toggleSelectAll}
                    className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition
                      ${isAllSelected
                        ? "bg-indigo-600 border-indigo-500"
                        : "border-white/20 hover:border-indigo-500/60"}`}
                  >
                    {isAllSelected && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </th>
                {["Name", "Email", "Comment", "Policy", "Status", "Date", "Action"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-white/5 rounded-full animate-pulse" style={{ width: `${40 + Math.random() * 50}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20">
                    <MessageSquare size={28} className="mx-auto text-slate-700 mb-3" />
                    <p className="text-slate-500 text-[13px]">No comments found</p>
                    {(search || filterStatus !== "All") && (
                      <button
                        onClick={() => { setSearch(""); setFilterStatus("All"); }}
                        className="mt-2 text-[12px] text-indigo-400 hover:text-indigo-300 transition"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredComments.map((item, idx) => {
                    const isSelected = selectedIds.includes(item._id);
                    const isLoading  = actionLoadingId === item._id;
                    return (
                      <motion.tr
                        key={item._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`border-t border-white/5 align-top transition-colors group
                          ${isSelected ? "bg-indigo-500/5" : "hover:bg-white/[0.018]"}`}
                      >
                        {/* Checkbox */}
                        <td className="px-5 py-4">
                          <div
                            onClick={() => toggleSelectOne(item._id)}
                            className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition
                              ${isSelected
                                ? "bg-indigo-600 border-indigo-500"
                                : "border-white/20 hover:border-indigo-500/60"}`}
                          >
                            {isSelected && (
                              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </td>

                        {/* Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/15 flex items-center justify-center text-[10px] font-black text-indigo-300 flex-shrink-0">
                              {item.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-[13px] font-semibold text-white truncate max-w-[100px]">{item.name}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4">
                          <span className="text-[12px] text-slate-400 truncate max-w-[160px] block">{item.email}</span>
                        </td>

                        {/* Comment */}
                        <td className="px-5 py-4 max-w-[320px]">
                          <p className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-wrap break-words line-clamp-3">
                            {item.comment}
                          </p>
                        </td>

                        {/* Policy */}
                        <td className="px-5 py-4">
                          {item.acceptedPolicy ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={9} /> Accepted
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-600">—</span>
                          )}
                        </td>

                        {/* Status select */}
                        <td className="px-5 py-4">
                          {isLoading ? (
                            <Loader2 size={14} className="text-indigo-400 animate-spin" />
                          ) : (
                            <StatusSelect
                              value={item.status}
                              onChange={(v) => handleStatusChange(item._id, v)}
                              disabled={isLoading}
                            />
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4">
                          <span className="text-[11px] text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          <p className="text-[10px] text-slate-600">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                            title="Delete comment"
                          >
                            {isLoading
                              ? <Loader2 size={14} className="animate-spin text-indigo-400" />
                              : <Trash2 size={14} />}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && filteredComments.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/5">
            <p className="text-[12px] text-slate-500">
              Showing <span className="text-slate-300 font-medium">{filteredComments.length}</span> of{" "}
              <span className="text-slate-300 font-medium">{comments.length}</span> comments
            </p>
            {selectedIds.length > 0 && (
              <p className="text-[12px] text-indigo-400 font-medium">
                {selectedIds.length} selected
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ViewComments;