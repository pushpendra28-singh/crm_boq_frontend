import { useEffect, useState } from "react";
import { X, UserPlus, UserCheck, MapPin, CheckCircle2, Loader2, Search as SearchIcon } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import API_BASE_URL from "../../config/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ─── Assign Modal ─────────────────────────────────────────────────────────────
const AssignModal = ({ lead, onClose, onAssigned }) => {
  const [agents, setAgents]         = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [searchQuery, setSearchQuery]     = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [assigning, setAssigning]         = useState(false);

  // Pre-select current agent if any
  useEffect(() => {
    if (lead.assignedTo) {
      setSelectedAgent({ _id: lead.assignedTo, name: lead.assignedToName });
    }
  }, [lead]);

  // Fetch available sales agents
  useEffect(() => {
    const fetchAgents = async () => {
      setAgentsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/admins?role=sales,manager&isActive=true`,
          { headers: getAuthHeaders() }
        );
        if (!res.ok) throw new Error("Failed to fetch agents");
        const data = await res.json();
        setAgents(Array.isArray(data) ? data : data.admins || []);
      } catch (err) {
        toast.error("Could not load agents");
        setAgents([]);
      } finally {
        setAgentsLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const filteredAgents = agents.filter((a) =>
    a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedAgent) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${lead._id}/assign`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          agentId:   selectedAgent._id,
          agentName: selectedAgent.name,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to assign lead");
      }
      const data = await res.json();
      toast.success(`Lead assigned to ${selectedAgent.name}`);
      onAssigned(data.lead);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to assign lead");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!lead.assignedTo) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${lead._id}/assign`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ agentId: null, agentName: null }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to unassign lead");
      }
      const data = await res.json();
      toast.success("Lead unassigned");
      onAssigned(data.lead);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to unassign lead");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-md bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <UserPlus size={16} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-gray-800">Assign Lead</h3>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px]">{lead.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current assignment banner */}
        {lead.assignedToName && (
          <div className="mx-5 mt-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <UserCheck size={13} className="text-emerald-600" />
              <span className="text-[12px] text-emerald-700 font-medium">
                Currently: {lead.assignedToName}
              </span>
            </div>
            <button
              onClick={handleUnassign}
              disabled={assigning}
              className="text-[10px] font-semibold text-red-500 hover:text-red-600 transition px-2 py-1 rounded-lg hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        )}

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <SearchIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search agents by name or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition"
            />
          </div>
        </div>

        {/* Agent list */}
        <div className="px-5 pb-2 max-h-64 overflow-y-auto space-y-1.5">
          {agentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-emerald-500 animate-spin" />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-[13px]">
              {searchQuery ? "No agents match your search" : "No agents available"}
            </div>
          ) : (
            filteredAgents.map((agent) => {
              const isSelected = selectedAgent?._id === agent._id;
              const isCurrent  = lead.assignedTo === agent._id || lead.assignedTo?._id === agent._id;
              return (
                <button
                  key={agent._id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition border
                    ${isSelected
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200"}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-black flex-shrink-0 border
                    ${isSelected
                      ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                      : "bg-gray-200 border-gray-300 text-gray-600"}`}
                  >
                    {agent.name?.[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] font-semibold truncate ${isSelected ? "text-emerald-700" : "text-gray-800"}`}>
                        {agent.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                          CURRENT
                        </span>
                      )}
                    </div>
                    {agent.email && (
                      <p className="text-[11px] text-gray-400 truncate">{agent.email}</p>
                    )}
                    {agent.territory && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        <MapPin size={8} className="inline mr-1" />
                        {agent.territory}
                      </p>
                    )}
                  </div>

                  {/* Role badge */}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize flex-shrink-0
                    ${agent.role === "manager"
                      ? "bg-violet-50 text-violet-700 border border-violet-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"}`}
                  >
                    {agent.role}
                  </span>

                  {isSelected && (
                    <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:text-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedAgent || assigning || selectedAgent._id === (lead.assignedTo?._id || lead.assignedTo)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-emerald-500 hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {assigning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <UserCheck size={14} />
            )}
            {assigning ? "Assigning…" : "Assign Lead"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AssignModal;