import { useEffect, useState } from "react";
import {
  ArrowLeft, Trash2, Mail, CheckCircle2, Clock, XCircle,
  Loader2, Search, X, RefreshCw,
} from "lucide-react";
import API_BASE_URL from "../config/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG = {
  Pending:   { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25",  icon: Clock },
  Connected: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", icon: CheckCircle2 },
  Rejected:  { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/25",     icon: XCircle },
};

const StatusSelect = ({ value, onChange, disabled }) => {
  const cfg = STATUS_CONFIG[value] || STATUS_CONFIG["Pending"];
  return (
    <select
      value={value || "Pending"}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`appearance-none cursor-pointer rounded-full font-semibold border transition focus:outline-none focus:ring-1 focus:ring-indigo-500/30 px-2.5 py-1 text-[10px]
        bg-transparent ${cfg.color} ${cfg.bg} ${cfg.border} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <option value="Pending"   className="bg-[#141428] text-white">Pending</option>
      <option value="Connected" className="bg-[#141428] text-white">Connected</option>
      <option value="Rejected"  className="bg-[#141428] text-white">Rejected</option>
    </select>
  );
};

const ViewNewsletters = ({ goBack }) => {
  const [newsletters, setNewsletters]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_BASE_URL}/newsletters`);
      const data = await res.json();
      setNewsletters(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch newsletters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNewsletters(); }, []);

  const filtered = newsletters.filter(
    (n) =>
      n.name?.toLowerCase().includes(search.toLowerCase()) ||
      n.email?.toLowerCase().includes(search.toLowerCase())
  );

  const deleteNewsletter = async (id) => {
    const confirmDelete = window.confirm("Delete this newsletter subscriber?");
    if (!confirmDelete) return;
    try {
      setActionLoadingId(id);
      await fetch(`${API_BASE_URL}/newsletters/${id}`, { method: "DELETE" });
      setNewsletters((prev) => prev.filter((n) => n._id !== id));
      toast.success("Subscriber deleted.");
    } catch {
      toast.error("Failed to delete subscriber.");
    } finally {
      setActionLoadingId("");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      setActionLoadingId(id);
      await fetch(`${API_BASE_URL}/newsletters/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setNewsletters((prev) =>
        prev.map((n) => (n._id === id ? { ...n, status } : n))
      );
      toast.success("Status updated.");
    } catch (err) {
      console.log(err);
      toast.error("Failed to update status.");
    } finally {
      setActionLoadingId("");
    }
  };

  // Count by status
  const counts = newsletters.reduce((acc, n) => {
    const s = n.status || "Pending";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

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
            <h1 className="text-xl font-black text-white tracking-tight">Newsletter Subscribers</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              <span className="text-indigo-400 font-semibold">{newsletters.length}</span> total subscribers
            </p>
          </div>
        </div>

        <button
          onClick={fetchNewsletters}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/8 text-slate-400 hover:text-white transition border border-white/5"
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── Mini stat cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending",   value: counts.Pending   || 0, color: "text-amber-400",   bg: "bg-amber-500/8",   border: "border-amber-500/15" },
          { label: "Connected", value: counts.Connected || 0, color: "text-emerald-400", bg: "bg-emerald-500/8", border: "border-emerald-500/15" },
          { label: "Rejected",  value: counts.Rejected  || 0, color: "text-red-400",     bg: "bg-red-500/8",     border: "border-red-500/15" },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl px-4 py-3`}>
            <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search name or email…"
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

      {/* ── Table ── */}
      <div className="bg-[#141428] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.015]">
                {["Subscriber", "Email", "Status", "Action"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-white/5 rounded-full animate-pulse" style={{ width: `${40 + Math.random() * 50}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-20">
                    <Mail size={28} className="mx-auto text-slate-700 mb-3" />
                    <p className="text-slate-500 text-[13px]">No subscribers found</p>
                    {search && (
                      <button onClick={() => setSearch("")} className="mt-2 text-[12px] text-indigo-400 hover:text-indigo-300 transition">
                        Clear search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filtered.map((n, idx) => {
                    const isLoading = actionLoadingId === n._id;
                    return (
                      <motion.tr
                        key={n._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-t border-white/5 hover:bg-white/[0.018] transition-colors group"
                      >
                        {/* Subscriber */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/15 flex items-center justify-center text-[11px] font-black text-indigo-300 flex-shrink-0">
                              {n.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="text-[13px] font-semibold text-white">{n.name}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-3.5">
                          <span className="text-[12px] text-slate-400">{n.email}</span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          {isLoading ? (
                            <Loader2 size={14} className="text-indigo-400 animate-spin" />
                          ) : (
                            <StatusSelect
                              value={n.status}
                              onChange={(v) => updateStatus(n._id, v)}
                              disabled={isLoading}
                            />
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => deleteNewsletter(n._id)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                            title="Delete subscriber"
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

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-white/5">
            <p className="text-[12px] text-slate-500">
              Showing <span className="text-slate-300 font-medium">{filtered.length}</span> of{" "}
              <span className="text-slate-300 font-medium">{newsletters.length}</span> subscribers
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ViewNewsletters;