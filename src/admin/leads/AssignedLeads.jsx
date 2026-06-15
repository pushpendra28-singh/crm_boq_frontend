// src/components/leads/AssignedLeads.jsx
// Production-level assigned leads CRM with followups, reminders, status tracking

import { useEffect, useState, useCallback } from "react";
import API_BASE_URL from "../../config/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Phone, Mail, MessageSquare, Clock, Calendar, ChevronDown, ChevronUp,
  Search, Filter, Plus, X, Check, AlertCircle, Bell, RefreshCw,
  User, Building, Tag, Loader2, Edit2, PhoneCall, PhoneMissed,
  PhoneOff, CheckCircle2, Circle, ArrowRight, Zap, MoreHorizontal,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAD_STATUSES = [
  { key: "new",           label: "New",            color: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "contacted",     label: "Contacted",      color: "bg-violet-50 text-violet-700 border-violet-200" },
  { key: "interested",    label: "Interested",     color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "not_interested",label: "Not Interested", color: "bg-red-50 text-red-700 border-red-200" },
  { key: "callback",      label: "Call Back",      color: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "converted",     label: "Converted",      color: "bg-teal-50 text-teal-700 border-teal-200" },
  { key: "closed",        label: "Closed",         color: "bg-gray-100 text-gray-600 border-gray-200" },
];

const FOLLOWUP_TYPES = [
  { key: "call",     label: "Phone Call",  icon: Phone },
  { key: "whatsapp", label: "WhatsApp",    icon: MessageSquare },
  { key: "email",    label: "Email",       icon: Mail },
  { key: "meeting",  label: "Meeting",     icon: User },
];

const CALL_OUTCOMES = [
  { key: "answered",     label: "Answered",       icon: PhoneCall,   color: "text-emerald-600" },
  { key: "not_answered", label: "Not Answered",   icon: PhoneMissed, color: "text-amber-600"   },
  { key: "busy",         label: "Busy",           icon: PhoneOff,    color: "text-red-500"     },
  { key: "callback",     label: "Asked Callback", icon: Clock,       color: "text-violet-600"  },
];

const statusConfig = (key) =>
  LEAD_STATUSES.find((s) => s.key === key) || LEAD_STATUSES[0];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem("adminToken");

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
};

const isOverdue = (date) => date && new Date(date) < new Date();

const isPending = (date) => {
  if (!date) return false;
  const diff = new Date(date) - new Date();
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const cfg = statusConfig(status);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

// ─── ReminderBell ─────────────────────────────────────────────────────────────

const ReminderBell = ({ date }) => {
  if (!date) return null;
  const over = isOverdue(date);
  const soon = isPending(date);
  if (!over && !soon) return null;
  return (
    <span title={over ? "Overdue!" : "Due soon"}>
      <Bell size={13} className={over ? "text-red-500 animate-pulse" : "text-amber-500"} />
    </span>
  );
};

// ─── FollowUpModal ────────────────────────────────────────────────────────────

const FollowUpModal = ({ lead, onClose, onSave }) => {
  const [type, setType]           = useState("call");
  const [outcome, setOutcome]     = useState("");
  const [notes, setNotes]         = useState("");
  const [nextFollowUp, setNext]   = useState("");
  const [newStatus, setNewStatus] = useState(lead?.assignedLeadStatus || "new");
  const [saving, setSaving]       = useState(false);

  const handleSave = async () => {
    if (!notes.trim()) { toast.error("Add a note about this followup"); return; }
    setSaving(true);
    await onSave({ type, outcome, notes, nextFollowUp, newStatus });
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
        className="bg-white border border-gray-100 rounded-2xl w-full max-w-lg shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-[14px] font-bold text-gray-800">Log Follow-up</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{lead?.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Type */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Contact Type</label>
            <div className="grid grid-cols-4 gap-2">
              {FOLLOWUP_TYPES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key} onClick={() => setType(key)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl text-[11px] font-medium border transition-all
                    ${type === key
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Call Outcome (only for call type) */}
          {type === "call" && (
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Call Outcome</label>
              <div className="grid grid-cols-2 gap-2">
                {CALL_OUTCOMES.map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key} onClick={() => setOutcome(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium border transition-all
                      ${outcome === key
                        ? "bg-gray-100 border-gray-300 text-gray-800"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    <Icon size={13} className={outcome === key ? color : ""} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Notes *</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened in this followup?"
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition resize-none"
            />
          </div>

          {/* Update Status */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Update Lead Status</label>
            <select
              value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-emerald-400 transition"
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s.key} value={s.key} className="bg-white">{s.label}</option>
              ))}
            </select>
          </div>

          {/* Next Follow-up */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              Schedule Next Follow-up
            </label>
            <input
              type="datetime-local"
              value={nextFollowUp} onChange={(e) => setNext(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-emerald-400 transition"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-emerald-500 hover:bg-emerald-400 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            {saving ? "Saving..." : "Log Follow-up"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── ReminderModal ────────────────────────────────────────────────────────────

const ReminderModal = ({ lead, onClose, onSave }) => {
  const [reminderDate, setReminderDate] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!reminderDate) { toast.error("Select a reminder date/time"); return; }
    setSaving(true);
    await onSave({ reminderDate, reminderNote });
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
        className="bg-white border border-gray-100 rounded-2xl w-full max-w-sm shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Bell size={14} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-gray-800">Set Reminder</h3>
              <p className="text-[11px] text-gray-400">{lead?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Remind At</label>
            <input
              type="datetime-local"
              value={reminderDate} onChange={(e) => setReminderDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-amber-400 transition"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Note (optional)</label>
            <input
              value={reminderNote} onChange={(e) => setReminderNote(e.target.value)}
              placeholder="e.g. Call after 3pm"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-amber-400 transition"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-amber-500 hover:bg-amber-400 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
            {saving ? "Saving..." : "Set Reminder"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── ReassignModal ────────────────────────────────────────────────────────────

const ReassignModal = ({ lead, onClose, onSave }) => {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [note, setNote]           = useState("");
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/my-leads/employees`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(r => r.json())
      .then(d => setEmployees(d.employees || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!selected) { toast.error("Select an employee"); return; }
    setSaving(true);
    await onSave({ targetEmployeeId: selected._id, note });
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
        className="bg-white border border-gray-100 rounded-2xl w-full max-w-md shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center">
              <ArrowRight size={14} className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-gray-800">Reassign Lead</h3>
              <p className="text-[11px] text-gray-400">{lead?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Search employees */}
          <div className="relative">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-violet-400 transition"
            />
          </div>

          {/* Employee list */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="text-violet-500 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center py-6 italic">No employees found</p>
            ) : (
              filtered.map((emp) => (
                <button
                  key={emp._id}
                  onClick={() => setSelected(emp)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all
                    ${selected?._id === emp._id
                      ? "bg-violet-50 border-violet-200 text-gray-800"
                      : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center text-[12px] font-bold text-violet-700 flex-shrink-0">
                    {emp.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate">{emp.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{emp.email}</p>
                  </div>
                  {selected?._id === emp._id && (
                    <Check size={13} className="text-violet-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Note */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              Note (optional)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Handover — client prefers evening calls"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-violet-400 transition"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={saving || !selected}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-violet-500 hover:bg-violet-400 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
            {saving ? "Reassigning..." : "Reassign Lead"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── LeadCard ─────────────────────────────────────────────────────────────────

const LeadCard = ({ lead, onFollowUp, onReminder, onStatusChange, onReassign, idx }) => {
  const [expanded, setExpanded] = useState(false);
  const hasReminder = lead.reminder?.date;
  const over        = isOverdue(lead.reminder?.date);
  const soon        = isPending(lead.reminder?.date);
  const lastFU      = lead.followUps?.[lead.followUps.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className={`bg-white border rounded-2xl overflow-hidden transition-all shadow-sm
        ${over ? "border-red-200" : soon ? "border-amber-200" : "border-gray-100 hover:border-gray-200"}`}
    >
      {/* Main row */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[14px] font-bold text-emerald-700 flex-shrink-0">
          {lead.name?.[0]?.toUpperCase() || "?"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-bold text-gray-800 truncate">{lead.name}</span>
            <StatusBadge status={lead.assignedLeadStatus} />
            <ReminderBell date={lead.reminder?.date} />
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {lead.whatsapp && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Phone size={10} /> {lead.whatsapp}
              </span>
            )}
            {lead.companyName && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Building size={10} /> {lead.companyName}
              </span>
            )}
            {lead.category && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Tag size={10} /> {lead.category}
              </span>
            )}
          </div>
          {lastFU && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              Last: {lastFU.type} · {fmtDateTime(lastFU.createdAt)}
            </p>
          )}

          {/* Show who assigned this lead to current employee */}
          {lead.assignmentHistory?.length > 0 && (
            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
              <User size={9} />
              Assigned by:{" "}
              {lead.assignmentHistory[lead.assignmentHistory.length - 1].assignedByName || "Admin"}
            </p>
          )}
          {lead.reminder?.date && (
            <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${over ? "text-red-500" : soon ? "text-amber-600" : "text-gray-400"}`}>
              <Bell size={9} />
              {over ? "Overdue: " : "Reminder: "}{fmtDateTime(lead.reminder.date)}
              {lead.reminder.note && ` · ${lead.reminder.note}`}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onFollowUp(lead)}
            title="Log Follow-up"
            className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => onReminder(lead)}
            title="Set Reminder"
            className={`p-2 rounded-lg transition ${hasReminder ? "text-amber-500 hover:bg-amber-50" : "text-gray-400 hover:text-amber-500 hover:bg-amber-50"}`}
          >
            <Bell size={14} />
          </button>
          <button
            onClick={() => onReassign(lead)}
            title="Reassign to another employee"
            className="p-2 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition"
          >
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded: followups + status changer */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
              {/* Quick status change */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Update Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {LEAD_STATUSES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => onStatusChange(lead._id, s.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all
                        ${lead.assignedLeadStatus === s.key
                          ? s.color
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      {lead.assignedLeadStatus === s.key && <Check size={9} className="inline mr-1" />}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact info */}
              {(lead.email || lead.whatsapp) && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Contact</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.whatsapp && (
                      <a
                        href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-medium hover:bg-emerald-100 transition"
                      >
                        <MessageSquare size={12} /> WhatsApp
                      </a>
                    )}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[12px] font-medium hover:bg-blue-100 transition"
                      >
                        <Mail size={12} /> Email
                      </a>
                    )}
                    {lead.whatsapp && (
                      <a
                        href={`tel:${lead.whatsapp}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[12px] font-medium hover:bg-indigo-100 transition"
                      >
                        <Phone size={12} /> Call
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Follow-ups timeline */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Follow-up History ({lead.followUps?.length || 0})
                </p>
                {!lead.followUps?.length ? (
                  <p className="text-[12px] text-gray-400 italic">No follow-ups logged yet.</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {[...lead.followUps].reverse().map((fu, i) => {
                      const TypeIcon = FOLLOWUP_TYPES.find((t) => t.key === fu.type)?.icon || Phone;
                      return (
                        <div key={fu._id || i} className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <TypeIcon size={11} className="text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[12px] font-semibold text-gray-700 capitalize">{fu.type}</span>
                              {fu.outcome && (
                                <span className="text-[10px] text-gray-400 capitalize">{fu.outcome.replace(/_/g, " ")}</span>
                              )}
                              <span className="text-[10px] text-gray-400 ml-auto">{fmtDateTime(fu.createdAt)}</span>
                            </div>
                            <p className="text-[12px] text-gray-500 mt-0.5 truncate">{fu.notes}</p>
                            {fu.nextFollowUp && (
                              <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1">
                                <ArrowRight size={9} /> Next: {fmtDateTime(fu.nextFollowUp)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AssignedLeads = () => {
  const [leads, setLeads]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState({});
  const [followUpTarget, setFollowUp]   = useState(null);
  const [reminderTarget, setReminder]   = useState(null);
  const [refreshing, setRefreshing]     = useState(false);
  const [reassignTarget, setReassign]   = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({
        page,
        limit: 15,
        ...(search       && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res  = await fetch(`${API_BASE_URL}/my-leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setLeads(data.leads || []);
      setPagination(data.pagination || {});
    } catch (err) {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Poll for reminders every 60s
  useEffect(() => {
    const t = setInterval(() => fetchLeads(true), 60_000);
    return () => clearInterval(t);
  }, [fetchLeads]);

  const handleReassign = async (payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/my-leads/${reassignTarget._id}/reassign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message);
      setReassign(null);
      fetchLeads(true);
    } catch (err) {
      toast.error(err.message || "Failed to reassign");
    }
  };

  // ── Log follow-up ──────────────────────────────────────────────────────────
  const handleFollowUp = async (payload) => {
    try {
      const token = getToken();
      const res   = await fetch(`${API_BASE_URL}/my-leads/${followUpTarget._id}/followup`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Follow-up logged!");
      setFollowUp(null);
      fetchLeads(true);
    } catch (err) {
      toast.error(err.message || "Failed to log follow-up");
    }
  };

  // ── Set reminder ───────────────────────────────────────────────────────────
  const handleReminder = async (payload) => {
    try {
      const token = getToken();
      const res   = await fetch(`${API_BASE_URL}/my-leads/${reminderTarget._id}/reminder`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Reminder set!");
      setReminder(null);
      fetchLeads(true);
    } catch (err) {
      toast.error(err.message || "Failed to set reminder");
    }
  };

  // ── Quick status change ────────────────────────────────────────────────────
  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const token = getToken();
      const res   = await fetch(`${API_BASE_URL}/my-leads/${leadId}/status`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ assignedLeadStatus: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, assignedLeadStatus: newStatus } : l))
      );
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const overdueCount = leads.filter((l) => isOverdue(l.reminder?.date)).length;
  const pendingCount = leads.filter((l) => isPending(l.reminder?.date)).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-800">My Assigned Leads</h2>
          <p className="text-gray-400 text-[13px] mt-0.5">
            {pagination.total ?? leads.length} leads assigned · manage follow-ups &amp; reminders
          </p>
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[12px] font-semibold">
              <AlertCircle size={13} /> {overdueCount} overdue
            </span>
          )}
          {pendingCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-semibold">
              <Bell size={13} /> {pendingCount} due soon
            </span>
          )}
          <button
            onClick={() => fetchLeads(true)}
            disabled={refreshing}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search leads..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-emerald-400 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-emerald-400 transition min-w-[140px]"
        >
          <option value="" className="bg-white">All Statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s.key} value={s.key} className="bg-white">{s.label}</option>
          ))}
        </select>
      </div>

      {/* Status pills */}
      <div className="flex gap-1.5 flex-wrap">
        {["", ...LEAD_STATUSES.map((s) => s.key)].map((key) => {
          const cfg = key ? statusConfig(key) : null;
          const count = key
            ? leads.filter((l) => l.assignedLeadStatus === key).length
            : leads.length;
          return (
            <button
              key={key || "all"}
              onClick={() => { setStatusFilter(key); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all
                ${statusFilter === key
                  ? cfg ? cfg.color : "bg-gray-200 text-gray-800 border-gray-300"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700"
                }`}
            >
              {key ? cfg?.label : "All"} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={22} className="text-emerald-500 animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
            <Zap size={22} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-semibold">No leads found</p>
          <p className="text-gray-400 text-[13px] mt-1">
            {statusFilter || search ? "Try adjusting your filters" : "No leads are assigned to you yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead, idx) => (
            <LeadCard
              key={lead._id}
              lead={lead}
              idx={idx}
              onFollowUp={setFollowUp}
              onReminder={setReminder}
              onStatusChange={handleStatusChange}
              onReassign={setReassign}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-[13px] text-gray-400">
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {followUpTarget && (
          <FollowUpModal
            lead={followUpTarget}
            onClose={() => setFollowUp(null)}
            onSave={handleFollowUp}
          />
        )}
        {reminderTarget && (
          <ReminderModal
            lead={reminderTarget}
            onClose={() => setReminder(null)}
            onSave={handleReminder}
          />
        )}
        {reassignTarget && (
          <ReassignModal
            lead={reassignTarget}
            onClose={() => setReassign(null)}
            onSave={handleReassign}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssignedLeads;