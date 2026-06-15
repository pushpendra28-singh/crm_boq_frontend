import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, FolderOpen, Search, Clock,
  CheckCircle2, XCircle, AlertCircle, FileText,
  Calendar, RefreshCw, Loader2,
} from "lucide-react";
import API_BASE_URL from "../../config/api";

const STATUS_CFG = {
  in_progress: { label: "In Progress", icon: Loader2,     color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200" },
  draft:       { label: "Draft",       icon: AlertCircle,  color: "text-gray-500",   bg: "bg-gray-50",   border: "border-gray-200" },
  pending:     { label: "Pending",     icon: Clock,        color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200" },
  approved:    { label: "Approved",    icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200" },
  rejected:    { label: "Rejected",    icon: XCircle,      color: "text-red-500",    bg: "bg-red-50",    border: "border-red-200" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
};

const TenderCard = ({ tender, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all"
  >
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          <FileText size={15} className="text-gray-500" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-gray-800 leading-tight line-clamp-1">
            {tender.title || "Untitled Tender"}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
            {String(tender._id).slice(-8).toUpperCase()}
          </p>
        </div>
      </div>
      <StatusBadge status={tender.status} />
    </div>

    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
        <Calendar size={11} />
        {new Date(tender.createdAt).toLocaleDateString()}
      </div>
      {tender.docFileName && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 border border-indigo-100">
          Doc Upload
        </span>
      )}
    </div>
  </motion.div>
);

const FILTERS = ["all", "in_progress", "draft", "pending", "approved", "rejected"];

const ViewTenders = ({ onBack }) => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedTender, setSelectedTender] = useState(null);
const [proposalLoading, setProposalLoading] = useState(false);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tender`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      const data = await res.json();
      if (data.success) setTenders(data.tenders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenders(); }, []);


  const fetchProposal = async (id) => {
  try {
    setProposalLoading(true);

    const res = await fetch(
      `${API_BASE_URL}/tender/${id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      }
    );

    const data = await res.json();

    if (data.success) {
      setSelectedTender(data.tender);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setProposalLoading(false);
  }
};

  const filtered = tenders.filter((t) => {
    const matchSearch = (t.title || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || t.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-black text-gray-800">All Proposals</h2>
          <p className="text-gray-400 text-[12px]">{tenders.length} total</p>
        </div>
        <button
          onClick={fetchTenders}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-green-400 transition-colors">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="flex-1 text-[13px] outline-none bg-transparent text-gray-700 placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 border border-gray-200 flex-wrap">
          {FILTERS.map((s) => {
            const count = s === "all" ? tenders.length : tenders.filter((t) => t.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all
                  ${filter === s ? "bg-green-500 text-white" : "text-gray-500 hover:text-gray-700 hover:bg-white"}`}
              >
                {s === "in_progress" ? "Active" : s === "all" ? "All" : s} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={22} className="animate-spin text-green-500" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => <TenderCard key={t._id} tender={t}  onClick={() => fetchProposal(t._id)}/>)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <FolderOpen size={22} className="text-gray-300" />
          </div>
          <p className="text-[14px] font-semibold text-gray-600">No proposals found</p>
          <p className="text-[12px] text-gray-400 mt-1">Try adjusting your search or filter.</p>
        </div>
      )}


      {selectedTender && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl max-h-[90vh] overflow-hidden">

      <div className="flex items-center justify-between p-5 border-b">
        <h3 className="font-bold text-lg">
          {selectedTender.title}
        </h3>

        <button
          onClick={() => setSelectedTender(null)}
          className="text-gray-500 hover:text-black"
        >
          ✕
        </button>
      </div>

      <div className="p-6 overflow-y-auto max-h-[75vh]">

        {proposalLoading ? (
          <Loader2
            size={24}
            className="animate-spin"
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm">
            {selectedTender.generatedProposal}
          </pre>
        )}

      </div>
    </div>
  </div>
)}
    </motion.div>
  );
};

export default ViewTenders;