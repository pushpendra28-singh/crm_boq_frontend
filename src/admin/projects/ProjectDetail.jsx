import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL from "../../config/api";
import toast from "react-hot-toast";
import { Users } from "lucide-react";
import {
  ArrowLeft, Sun, MapPin, User, Phone, Mail, Calendar,
  TrendingUp, Camera, Bell, Award, FileText, Edit2,
  CheckCircle2, AlertCircle, Plus, Trash2, Download,
  Zap, Cpu, Layers, Clock, BarChart2, MessageSquare,
  RefreshCw, Activity, Shield, X, Link2, Upload,
} from "lucide-react";
import {
  StatusBadge, PriorityBadge, ProgressBar, Modal,
  STATUS_META, MILESTONE_STATUS_META, CHECKIN_STATUS_META, DOC_TYPE_META,
  fmt, fmtTime, daysLeft, InputField, SelectField, TextareaField,
  SectionHeader, GanttTimeline, LifecycleStepper,
} from "./ProjectHelpers";

/* ─── shared light-theme primitives ─── */

const cardCls = "bg-white border border-gray-200 rounded-2xl";
const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-800 placeholder-gray-300 bg-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition";

function LightInput({ label, type = "text", value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-green-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  );
}

function LightSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls + " appearance-none cursor-pointer"}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function LightTextarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={inputCls + " resize-none"} />
    </div>
  );
}

function LightModal({ open, onClose, title, subtitle, width = "max-w-3xl", children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.35)", backdropFilter: "blur(6px)" }}>
      <div className={`relative w-full ${width} rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]`}
        style={{ boxShadow: "0 24px 60px -8px rgba(0,0,0,0.18), 0 4px 16px -4px rgba(0,0,0,0.08)" }}>
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
              <Sun size={16} color="#fff" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900 leading-tight">{title}</h2>
              {subtitle && <p className="text-[12px] text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── CheckIn Card ─── */
const CheckInCard = ({ ci }) => {
  const m = CHECKIN_STATUS_META[ci.statusUpdate] || CHECKIN_STATUS_META.on_track;
  const Icon = m.icon;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
            {(ci.engineer?.name?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-800">{ci.engineer?.name || "Engineer"}</p>
            <p className="text-[10px] text-gray-400">{fmtTime(ci.createdAt)}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-semibold ${m.color}`}>
          <Icon size={11} /> {m.label}
        </span>
      </div>
      {ci.note && <p className="text-[12px] text-gray-600 mb-2">{ci.note}</p>}
      {ci.location?.address && (
        <p className="text-[11px] text-gray-400 flex items-center gap-1 mb-2">
          <MapPin size={10} /> {ci.location.address}
        </p>
      )}
      {ci.photos?.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-2">
          {ci.photos.map((p, i) => (
            <a key={i} href={p.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg transition">
              <Camera size={10} /> {p.caption || `Photo ${i + 1}`}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Milestone Row ─── */
const MilestoneRow = ({ m, onUpdate, canEdit }) => {
  const meta = MILESTONE_STATUS_META[m.status] || MILESTONE_STATUS_META.pending;
  const [updating, setUpdating] = useState(false);

  const cycleStatus = async () => {
    if (!canEdit) return;
    const cycle = { pending: "in_progress", in_progress: "completed", completed: "pending", delayed: "pending" };
    setUpdating(true);
    try { await onUpdate(m._id, { status: cycle[m.status] || "pending" }); }
    finally { setUpdating(false); }
  };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <button
        onClick={cycleStatus}
        disabled={updating || !canEdit}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition
          ${m.status === "completed" ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-green-400"}`}
      >
        {m.status === "completed" && <CheckCircle2 size={12} className="text-green-500" />}
        {m.status === "in_progress" && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
        {m.status === "delayed" && <AlertCircle size={12} className="text-red-400" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium ${m.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>
          {m.title}
        </p>
        {m.description && <p className="text-[11px] text-gray-400 truncate">{m.description}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {m.dueDate && (
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Calendar size={9} /> {fmt(m.dueDate)}
          </span>
        )}
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.color} ${meta.bg}`}>
          {meta.label}
        </span>
      </div>
    </div>
  );
};

/* ─── Notification Modal ─── */
const NotificationModal = ({ open, onClose, onSend, customer }) => {
  const [form, setForm] = useState({ type: "email", message: "" });
  const [sending, setSending] = useState(false);

  const QUICK_MESSAGES = [
    "Your solar project has been initiated. Our team will contact you for site survey scheduling.",
    "Site survey completed successfully. We are now working on your installation design.",
    "Permits have been obtained. Procurement of materials is underway.",
    "Installation has begun at your site. Our engineers are on-site.",
    "Installation completed! Inspection is scheduled for the next stage.",
    "Your solar system has been connected to the grid. Welcome to clean energy! 🌞",
  ];

  return (
    <LightModal open={open} onClose={onClose} title="Send Customer Notification" subtitle={`To: ${customer?.name}`} width="max-w-lg">
      <div className="space-y-4">
        <LightSelect
          label="Channel"
          value={form.type}
          onChange={(v) => setForm((p) => ({ ...p, type: v }))}
          options={[
            { value: "email", label: "📧 Email" },
            { value: "sms", label: "📱 SMS" },
            { value: "both", label: "📧📱 Email + SMS" },
          ]}
        />
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Templates</label>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {QUICK_MESSAGES.map((msg, i) => (
              <button
                key={i}
                onClick={() => setForm((p) => ({ ...p, message: msg }))}
                className="w-full text-left text-[11px] text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-green-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-green-300 transition"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
        <LightTextarea
          label="Message"
          value={form.message}
          onChange={(v) => setForm((p) => ({ ...p, message: v }))}
          placeholder="Type your message to the customer..."
          rows={4}
        />
        <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition">Cancel</button>
          <button
            disabled={!form.message.trim() || sending}
            onClick={async () => {
              setSending(true);
              try { await onSend(form); onClose(); }
              finally { setSending(false); }
            }}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 4px 14px rgba(34,197,94,0.3)" }}
          >
            {sending ? "Sending..." : "Send Notification"}
          </button>
        </div>
      </div>
    </LightModal>
  );
};

/* ─── CheckIn Modal ─── */
const CheckInModal = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({ note: "", statusUpdate: "on_track", location: { address: "" }, photos: [] });
  const [photoInput, setPhotoInput] = useState({ url: "", caption: "" });
  const [submitting, setSubmitting] = useState(false);

  return (
    <LightModal open={open} onClose={onClose} title="Engineer Check-In" subtitle="Log your on-site progress update" width="max-w-lg">
      <div className="space-y-4">
        <LightSelect
          label="Status Update"
          value={form.statusUpdate}
          onChange={(v) => setForm((p) => ({ ...p, statusUpdate: v }))}
          options={Object.entries(CHECKIN_STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))}
        />
        <LightTextarea label="Notes" value={form.note} onChange={(v) => setForm((p) => ({ ...p, note: v }))} placeholder="Describe work done, issues encountered..." rows={3} />
        <LightInput
          label="Location / Address"
          value={form.location.address}
          onChange={(v) => setForm((p) => ({ ...p, location: { ...p.location, address: v } }))}
          placeholder="Site address or description"
        />
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Photos (URL)</label>
          <div className="flex gap-2 mb-2">
            <input
              value={photoInput.url}
              onChange={(e) => setPhotoInput((p) => ({ ...p, url: e.target.value }))}
              placeholder="Photo URL..."
              className={inputCls + " flex-1"}
            />
            <input
              value={photoInput.caption}
              onChange={(e) => setPhotoInput((p) => ({ ...p, caption: e.target.value }))}
              placeholder="Caption"
              className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-[12px] text-gray-800 placeholder-gray-300 bg-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
            />
            <button
              onClick={() => {
                if (!photoInput.url.trim()) return;
                setForm((p) => ({ ...p, photos: [...p.photos, { ...photoInput }] }));
                setPhotoInput({ url: "", caption: "" });
              }}
              className="px-3 py-2 rounded-xl text-white transition"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
            >
              <Plus size={13} />
            </button>
          </div>
          {form.photos.map((ph, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-gray-500 mb-1">
              <Camera size={10} /> {ph.caption || ph.url.slice(0, 40)}
              <button onClick={() => setForm((p) => ({ ...p, photos: p.photos.filter((_, j) => j !== i) }))} className="text-red-400 ml-auto">
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition">Cancel</button>
          <button
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              try { await onSubmit(form); onClose(); }
              finally { setSubmitting(false); }
            }}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 4px 14px rgba(34,197,94,0.3)" }}
          >
            {submitting ? "Submitting..." : "Submit Check-In"}
          </button>
        </div>
      </div>
    </LightModal>
  );
};

/* ─── Document Modal ─── */
const DocumentModal = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({ name: "", type: "other", url: "", mimeType: "" });
  const [submitting, setSubmitting] = useState(false);

  return (
    <LightModal open={open} onClose={onClose} title="Add Document" subtitle="Upload or link a document" width="max-w-md">
      <div className="space-y-4">
        <LightInput label="Document Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Installation Contract.pdf" required />
        <LightSelect
          label="Type"
          value={form.type}
          onChange={(v) => setForm((p) => ({ ...p, type: v }))}
          options={Object.entries(DOC_TYPE_META).map(([k, v]) => ({ value: k, label: v.label }))}
        />
        <LightInput label="URL / File Path" value={form.url} onChange={(v) => setForm((p) => ({ ...p, url: v }))} placeholder="https://... or /uploads/..." required />
        <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition">Cancel</button>
          <button
            disabled={!form.name || !form.url || submitting}
            onClick={async () => {
              setSubmitting(true);
              try { await onSubmit(form); onClose(); }
              finally { setSubmitting(false); }
            }}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 4px 14px rgba(34,197,94,0.3)" }}
          >
            {submitting ? "Adding..." : "Add Document"}
          </button>
        </div>
      </div>
    </LightModal>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN DETAIL VIEW
═══════════════════════════════════════════════════════════ */
export default function ProjectDetail({ projectId, goBack, onEdit, hasEdit, token, apiBase = "/projects" }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: "", dueDate: "", description: "" });
  const [changingStatus, setChangingStatus] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}`, { headers });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setProject(d.project);
    } catch (e) {
      toast.error(e.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const updateStatus = async (status) => {
    setChangingStatus(true);
    try {
      const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/status`, {
        method: "PUT", headers, body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      toast.success("Status updated");
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setChangingStatus(false);
    }
  };

  const updateMilestone = async (milestoneId, data) => {
    try {
      const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/milestones/${milestoneId}`, {
        method: "PUT", headers, body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      toast.success("Milestone updated");
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const addMilestone = async () => {
    if (!newMilestone.title.trim()) return;
    try {
      const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/milestones`, {
        method: "POST", headers, body: JSON.stringify(newMilestone),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      toast.success("Milestone added");
      setNewMilestone({ title: "", dueDate: "", description: "" });
      setAddMilestoneOpen(false);
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const deleteMilestone = async (milestoneId) => {
    if (!confirm("Delete this milestone?")) return;
    try {
      const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/milestones/${milestoneId}`, {
        method: "DELETE", headers,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      toast.success("Milestone deleted");
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submitCheckIn = async (data) => {
    const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/checkins`, {
      method: "POST", headers, body: JSON.stringify(data),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message);
    toast.success("Check-in submitted");
    await load();
  };

  const addDocument = async (data) => {
    const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/documents`, {
      method: "POST", headers, body: JSON.stringify(data),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message);
    toast.success("Document added");
    await load();
  };

  const deleteDocument = async (docId) => {
    if (!confirm("Delete this document?")) return;
    const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/documents/${docId}`, {
      method: "DELETE", headers,
    });
    const d = await r.json();
    if (!r.ok) { toast.error(d.message); return; }
    toast.success("Document deleted");
    await load();
  };

  const sendNotification = async (data) => {
    const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/notify`, {
      method: "POST", headers, body: JSON.stringify(data),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message);
    toast.success("Notification logged successfully");
    await load();
  };

  const generateCertificate = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/certificate`, {
        method: "POST", headers,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      toast.success("Completion certificate generated!");
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw size={20} className="text-green-500 animate-spin" />
    </div>
  );

  if (!project) return (
    <div className="text-center py-12 text-gray-400">Project not found</div>
  );

  const dl = daysLeft(project.expectedCompletionDate);
  const overdue = dl !== null && dl < 0 && !["completed", "cancelled"].includes(project.status);

  const TABS = [
    { key: "overview",      label: "Overview",                                       icon: Activity },
    { key: "milestones",    label: `Milestones (${project.milestones?.length || 0})`,icon: CheckCircle2 },
    { key: "timeline",      label: "Timeline",                                       icon: BarChart2 },
    { key: "checkins",      label: `Check-Ins (${project.checkIns?.length || 0})`,   icon: Camera },
    { key: "documents",     label: `Documents (${project.documents?.length || 0})`,  icon: FileText },
    { key: "notifications", label: "Notifications",                                  icon: Bell },
  ];

  return (
    <div className="space-y-5">
      {/* Modals */}
      <NotificationModal open={notifOpen} onClose={() => setNotifOpen(false)} onSend={sendNotification} customer={project.customer} />
      <CheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} onSubmit={submitCheckIn} />
      <DocumentModal open={docOpen} onClose={() => setDocOpen(false)} onSubmit={addDocument} />

      {/* Add Milestone Modal */}
      <LightModal open={addMilestoneOpen} onClose={() => setAddMilestoneOpen(false)} title="Add Milestone" width="max-w-md">
        <div className="space-y-4">
          <LightInput label="Title" value={newMilestone.title} onChange={(v) => setNewMilestone((p) => ({ ...p, title: v }))} placeholder="Milestone name" required />
          <LightTextarea label="Description" value={newMilestone.description} onChange={(v) => setNewMilestone((p) => ({ ...p, description: v }))} rows={2} placeholder="Optional details..." />
          <LightInput label="Due Date" type="date" value={newMilestone.dueDate} onChange={(v) => setNewMilestone((p) => ({ ...p, dueDate: v }))} />
          <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
            <button onClick={() => setAddMilestoneOpen(false)} className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition">Cancel</button>
            <button onClick={addMilestone} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>Add</button>
          </div>
        </div>
      </LightModal>

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <button onClick={goBack} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition flex-shrink-0 mt-0.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-bold text-gray-400 font-mono">{project.projectId}</span>
            <StatusBadge status={project.status} size="md" />
            <PriorityBadge priority={project.priority} />
            {overdue && (
              <span className="flex items-center gap-1 text-[11px] text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                <AlertCircle size={10} /> {Math.abs(dl)}d Overdue
              </span>
            )}
          </div>
          <h1 className="text-xl font-black text-gray-900">{project.title}</h1>
          <p className="text-[13px] text-gray-400 flex items-center gap-1.5 mt-0.5">
            <User size={12} /> {project.customer?.name}
            {project.customer?.city && <> · <MapPin size={12} /> {project.customer.city}</>}
          </p>
        </div>
        {hasEdit && (
          <button onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition flex-shrink-0">
            <Edit2 size={14} /> Edit
          </button>
        )}
      </div>

      {/* Lifecycle stepper */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Installation Lifecycle</p>
        <LifecycleStepper currentStatus={project.status} />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Progress",   value: `${project.progressPercent}%`, icon: TrendingUp,   color: "text-green-600",  bg: "bg-green-50"  },
          { label: "Milestones", value: `${project.milestones?.filter((m) => m.status === "completed").length || 0}/${project.milestones?.length || 0}`, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Check-Ins",  value: project.checkIns?.length || 0, icon: Camera,       color: "text-blue-600",   bg: "bg-blue-50"   },
          { label: "Capacity",   value: project.installation?.systemCapacity ? `${project.installation.systemCapacity} kW` : "—", icon: Sun, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.bg}`}>
                <s.icon size={14} className={s.color} />
              </div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{s.label}</span>
            </div>
            <p className="text-xl font-black text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-gray-500 font-medium">Overall Progress</span>
          <span className="text-[13px] font-bold text-gray-800">{project.progressPercent}%</span>
        </div>
        <ProgressBar
          percent={project.progressPercent}
          color={project.status === "completed" ? "from-green-500 to-emerald-500" : "from-green-500 to-emerald-400"}
        />
      </div>

      {/* Status changer */}
      {hasEdit && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => updateStatus(key)}
                disabled={changingStatus || project.status === key}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition
                  ${project.status === key
                    ? `${meta.color} ${meta.bg} border-current`
                    : "text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                  } disabled:opacity-50`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        {hasEdit && (
          <>
            <button onClick={() => setCheckInOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 2px 10px rgba(34,197,94,0.25)" }}>
              <Camera size={14} /> Check-In
            </button>
            <button onClick={() => setNotifOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-violet-500 hover:bg-violet-600 transition">
              <Bell size={14} /> Notify Customer
            </button>
            <button onClick={() => setDocOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-blue-500 hover:bg-blue-600 transition">
              <Upload size={14} /> Add Document
            </button>
            {project.status === "completed" && !project.completionCertificate?.generated && (
              <button onClick={generateCertificate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition"
                style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 4px 14px rgba(34,197,94,0.3)" }}>
                <Award size={14} /> Generate Certificate
              </button>
            )}
          </>
        )}
        {project.completionCertificate?.generated && (
          <a href={project.completionCertificate.url} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 transition">
            <Award size={14} /> View Certificate — {project.completionCertificate.certificateNumber}
          </a>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap flex-shrink-0
              ${tab === t.key
                ? "bg-white text-green-700 shadow-sm border border-gray-200"
                : "text-gray-400 hover:text-gray-600"}`}
          >
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Customer */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <SectionHeader icon={User} title="Customer Details" />
                <div className="space-y-3">
                  {[
                    { icon: User,   label: "Name",    value: project.customer?.name },
                    { icon: Phone,  label: "Phone",   value: project.customer?.phone },
                    { icon: Mail,   label: "Email",   value: project.customer?.email },
                    { icon: MapPin, label: "Address", value: [project.customer?.address, project.customer?.city, project.customer?.state, project.customer?.pincode].filter(Boolean).join(", ") },
                  ].map((r) => r.value && (
                    <div key={r.label} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <r.icon size={13} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{r.label}</p>
                        <p className="text-[13px] text-gray-700">{r.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solar */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <SectionHeader icon={Sun} title="Solar System Details" />
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Zap,    label: "System Capacity",  value: project.installation?.systemCapacity ? `${project.installation.systemCapacity} kW` : null },
                    { icon: Layers, label: "Panel Count",      value: project.installation?.panelCount },
                    { icon: Cpu,    label: "Panel Model",      value: project.installation?.panelModel },
                    { icon: Cpu,    label: "Inverter Model",   value: project.installation?.inverterModel },
                    { icon: Sun,    label: "Expected Output",  value: project.installation?.expectedOutput ? `${project.installation.expectedOutput.toLocaleString()} kWh/yr` : null },
                    { icon: Shield, label: "Mounting",         value: project.installation?.mountingType },
                  ].map((r) => r.value && (
                    <div key={r.label} className="bg-gray-50 border border-gray-200 rounded-xl p-2.5">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <r.icon size={9} /> {r.label}
                      </p>
                      <p className="text-[12px] text-gray-800 font-semibold">{r.value}</p>
                    </div>
                  ))}
                </div>
                {project.installation?.totalCost && (
                  <div className="mt-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                    <span className="text-[12px] text-amber-600 font-medium">Total Project Cost</span>
                    <span className="text-[15px] font-black text-amber-600">₹{project.installation.totalCost.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>

              {/* Team */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <SectionHeader icon={Users} title="Team" />
                {project.projectManager && (
                  <div className="mb-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Project Manager</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
                        {project.projectManager?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] text-gray-800 font-semibold">{project.projectManager?.name}</p>
                        <p className="text-[10px] text-gray-400">{project.projectManager?.email}</p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Engineers</p>
                {project.assignedEngineers?.length === 0
                  ? <p className="text-[12px] text-gray-400">No engineers assigned</p>
                  : (
                    <div className="space-y-2">
                      {project.assignedEngineers?.map((eng) => (
                        <div key={eng._id} className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
                            {eng.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[12px] text-gray-800 font-medium">{eng.name}</p>
                            <p className="text-[10px] text-gray-400">{eng.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Dates */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <SectionHeader icon={Calendar} title="Schedule" />
                <div className="space-y-3">
                  {[
                    { label: "Project Created",      value: fmt(project.createdAt) },
                    { label: "Start Date",            value: fmt(project.startDate) },
                    { label: "Expected Completion",   value: fmt(project.expectedCompletionDate) },
                    { label: "Actual Completion",     value: fmt(project.actualCompletionDate) },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="text-[12px] text-gray-500">{r.label}</span>
                      <span className="text-[12px] text-gray-700 font-medium">{r.value}</span>
                    </div>
                  ))}
                  {dl !== null && !["completed", "cancelled"].includes(project.status) && (
                    <div className={`flex items-center justify-between mt-2 pt-2 border-t border-gray-100 ${overdue ? "text-red-500" : dl <= 7 ? "text-orange-500" : "text-green-600"}`}>
                      <span className="text-[12px] font-semibold">{overdue ? "Days Overdue" : "Days Remaining"}</span>
                      <span className="text-[14px] font-black">{Math.abs(dl)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── MILESTONES ── */}
          {tab === "milestones" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader icon={CheckCircle2} title="Project Milestones" subtitle={`${project.progressPercent}% complete`} />
                {hasEdit && (
                  <button onClick={() => setAddMilestoneOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-green-600 bg-green-50 border border-green-200 hover:bg-green-100 transition">
                    <Plus size={13} /> Add
                  </button>
                )}
              </div>
              {project.milestones?.length === 0
                ? <p className="text-center text-gray-400 text-[13px] py-8">No milestones yet</p>
                : (
                  <div>
                    {project.milestones.map((m) => (
                      <div key={m._id} className="flex items-center gap-2">
                        <div className="flex-1">
                          <MilestoneRow m={m} onUpdate={updateMilestone} canEdit={hasEdit} />
                        </div>
                        {hasEdit && (
                          <button onClick={() => deleteMilestone(m._id)} className="text-gray-300 hover:text-red-400 transition flex-shrink-0 ml-1">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* ── TIMELINE ── */}
          {tab === "timeline" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <SectionHeader icon={BarChart2} title="Gantt Timeline" subtitle="Visual milestone schedule" />
              <GanttTimeline project={project} />
            </div>
          )}

          {/* ── CHECK-INS ── */}
          {tab === "checkins" && (
            <div className="space-y-3">
              {project.checkIns?.length === 0
                ? <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-[13px] shadow-sm">No check-ins yet</div>
                : [...(project.checkIns || [])].reverse().map((ci) => (
                  <CheckInCard key={ci._id} ci={ci} />
                ))}
            </div>
          )}

          {/* ── DOCUMENTS ── */}
          {tab === "documents" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader icon={FileText} title="Documents" />
              </div>
              {project.documents?.length === 0
                ? <p className="text-center text-gray-400 text-[13px] py-8">No documents uploaded</p>
                : (
                  <div className="space-y-2">
                    {project.documents.map((doc) => {
                      const tm = DOC_TYPE_META[doc.type] || DOC_TYPE_META.other;
                      return (
                        <div key={doc._id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                          <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                            <tm.icon size={14} className="text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-gray-800 font-medium truncate">{doc.name}</p>
                            <p className="text-[10px] text-gray-400">
                              {tm.label} · {fmtTime(doc.uploadedAt)} · {doc.uploadedBy?.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <a href={doc.url} target="_blank" rel="noreferrer"
                              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition">
                              <Download size={14} />
                            </a>
                            {hasEdit && (
                              <button onClick={() => deleteDocument(doc._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === "notifications" && (
            <div className="space-y-3">
              {project.notificationLogs?.length === 0
                ? <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-[13px] shadow-sm">No notifications sent yet</div>
                : [...(project.notificationLogs || [])].reverse().map((n) => (
                  <div key={n._id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                          <Bell size={12} className="text-violet-500" />
                        </div>
                        <span className="text-[12px] font-semibold text-gray-800 capitalize">{n.type} Notification</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${n.status === "sent" ? "text-green-600 bg-green-50 border border-green-200" : "text-red-500 bg-red-50 border border-red-200"}`}>
                          {n.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">{fmtTime(n.sentAt)}</span>
                    </div>
                    <p className="text-[12px] text-gray-600 mb-1">{n.message}</p>
                    <p className="text-[10px] text-gray-400">Sent by: {n.sentBy?.name || "System"}</p>
                  </div>
                ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}




// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import API_BASE_URL from "../../config/api";
// import toast from "react-hot-toast";
// import { Users } from "lucide-react";
// import {
//   ArrowLeft, Sun, MapPin, User, Phone, Mail, Calendar,
//   TrendingUp, Camera, Bell, Award, FileText, Edit2,
//   CheckCircle2, AlertCircle, Plus, Trash2, Download,
//   Zap, Cpu, Layers, Clock, BarChart2, MessageSquare,
//   RefreshCw, Activity, Shield, X, Link2, Upload ,
// } from "lucide-react";
// import {
//   StatusBadge, PriorityBadge, ProgressBar, Modal,
//   STATUS_META, MILESTONE_STATUS_META, CHECKIN_STATUS_META, DOC_TYPE_META,
//   fmt, fmtTime, daysLeft, InputField, SelectField, TextareaField,
//   SectionHeader, GanttTimeline, LifecycleStepper,
// } from "./ProjectHelpers";

// /* ─── CheckIn Card ─── */
// const CheckInCard = ({ ci }) => {
//   const m = CHECKIN_STATUS_META[ci.statusUpdate] || CHECKIN_STATUS_META.on_track;
//   const Icon = m.icon;
//   return (
//     <div className="bg-white/3 border border-white/6 rounded-xl p-4">
//       <div className="flex items-start justify-between mb-2">
//         <div className="flex items-center gap-2">
//           <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
//             {(ci.engineer?.name?.[0] || "?").toUpperCase() || "?"}
//           </div>
//           <div>
//             <p className="text-[12px] font-semibold text-white">{ci.engineer?.name || "Engineer"}</p>
//             <p className="text-[10px] text-slate-500">{fmtTime(ci.createdAt)}</p>
//           </div>
//         </div>
//         <span className={`flex items-center gap-1 text-[11px] font-semibold ${m.color}`}>
//           <Icon size={11} /> {m.label}
//         </span>
//       </div>
//       {ci.note && <p className="text-[12px] text-slate-300 mb-2">{ci.note}</p>}
//       {ci.location?.address && (
//         <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
//           <MapPin size={10} /> {ci.location.address}
//         </p>
//       )}
//       {ci.photos?.length > 0 && (
//         <div className="flex gap-2 flex-wrap mt-2">
//           {ci.photos.map((p, i) => (
//             <a key={i} href={p.url} target="_blank" rel="noreferrer"
//               className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded-lg transition">
//               <Camera size={10} /> {p.caption || `Photo ${i + 1}`}
//             </a>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// /* ─── Milestone Row ─── */
// const MilestoneRow = ({ m, onUpdate, canEdit }) => {
//   const meta = MILESTONE_STATUS_META[m.status] || MILESTONE_STATUS_META.pending;
//   const [updating, setUpdating] = useState(false);

//   const cycleStatus = async () => {
//     if (!canEdit) return;
//     const cycle = { pending: "in_progress", in_progress: "completed", completed: "pending", delayed: "pending" };
//     setUpdating(true);
//     try { await onUpdate(m._id, { status: cycle[m.status] || "pending" }); }
//     finally { setUpdating(false); }
//   };

//   return (
//     <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
//       <button
//         onClick={cycleStatus}
//         disabled={updating || !canEdit}
//         className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition
//           ${m.status === "completed" ? "border-green-500 bg-green-500/20" : "border-white/20 hover:border-indigo-500"}`}
//       >
//         {m.status === "completed" && <CheckCircle2 size={12} className="text-green-400" />}
//         {m.status === "in_progress" && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
//         {m.status === "delayed" && <AlertCircle size={12} className="text-red-400" />}
//       </button>
//       <div className="flex-1 min-w-0">
//         <p className={`text-[13px] font-medium ${m.status === "completed" ? "line-through text-slate-500" : "text-white"}`}>
//           {m.title}
//         </p>
//         {m.description && <p className="text-[11px] text-slate-600 truncate">{m.description}</p>}
//       </div>
//       <div className="flex items-center gap-2 flex-shrink-0">
//         {m.dueDate && (
//           <span className="text-[10px] text-slate-500 flex items-center gap-1">
//             <Calendar size={9} /> {fmt(m.dueDate)}
//           </span>
//         )}
//         <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.color} ${meta.bg}`}>
//           {meta.label}
//         </span>
//       </div>
//     </div>
//   );
// };

// /* ─── Notification Form ─── */
// const NotificationModal = ({ open, onClose, onSend, customer }) => {
//   const [form, setForm] = useState({ type: "email", message: "" });
//   const [sending, setSending] = useState(false);

//   const QUICK_MESSAGES = [
//     "Your solar project has been initiated. Our team will contact you for site survey scheduling.",
//     "Site survey completed successfully. We are now working on your installation design.",
//     "Permits have been obtained. Procurement of materials is underway.",
//     "Installation has begun at your site. Our engineers are on-site.",
//     "Installation completed! Inspection is scheduled for the next stage.",
//     "Your solar system has been connected to the grid. Welcome to clean energy! 🌞",
//   ];

//   return (
//     <Modal open={open} onClose={onClose} title="Send Customer Notification" subtitle={`To: ${customer?.name}`} width="max-w-lg">
//       <div className="space-y-4">
//         <SelectField
//           label="Channel"
//           value={form.type}
//           onChange={(v) => setForm((p) => ({ ...p, type: v }))}
//           options={[
//             { value: "email", label: "📧 Email" },
//             { value: "sms", label: "📱 SMS" },
//             { value: "both", label: "📧📱 Email + SMS" },
//           ]}
//         />

//         <div>
//           <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Templates</label>
//           <div className="space-y-1.5 max-h-36 overflow-y-auto">
//             {QUICK_MESSAGES.map((msg, i) => (
//               <button
//                 key={i}
//                 onClick={() => setForm((p) => ({ ...p, message: msg }))}
//                 className="w-full text-left text-[11px] text-slate-400 hover:text-white bg-white/3 hover:bg-white/6 px-3 py-2 rounded-lg border border-white/5 hover:border-indigo-500/30 transition"
//               >
//                 {msg}
//               </button>
//             ))}
//           </div>
//         </div>

//         <TextareaField
//           label="Message"
//           value={form.message}
//           onChange={(v) => setForm((p) => ({ ...p, message: v }))}
//           placeholder="Type your message to the customer..."
//           rows={4}
//         />

//         <div className="flex gap-2 justify-end pt-2 border-t border-white/6">
//           <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-slate-400 hover:text-white hover:bg-white/5 transition">Cancel</button>
//           <button
//             disabled={!form.message.trim() || sending}
//             onClick={async () => {
//               setSending(true);
//               try { await onSend(form); onClose(); }
//               finally { setSending(false); }
//             }}
//             className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition disabled:opacity-50"
//           >
//             {sending ? "Sending..." : "Send Notification"}
//           </button>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// /* ─── Add CheckIn Modal ─── */
// const CheckInModal = ({ open, onClose, onSubmit }) => {
//   const [form, setForm] = useState({ note: "", statusUpdate: "on_track", location: { address: "" }, photos: [] });
//   const [photoInput, setPhotoInput] = useState({ url: "", caption: "" });
//   const [submitting, setSubmitting] = useState(false);

//   return (
//     <Modal open={open} onClose={onClose} title="Engineer Check-In" subtitle="Log your on-site progress update" width="max-w-lg">
//       <div className="space-y-4">
//         <SelectField
//           label="Status Update"
//           value={form.statusUpdate}
//           onChange={(v) => setForm((p) => ({ ...p, statusUpdate: v }))}
//           options={Object.entries(CHECKIN_STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))}
//         />
//         <TextareaField label="Notes" value={form.note} onChange={(v) => setForm((p) => ({ ...p, note: v }))} placeholder="Describe work done, issues encountered..." rows={3} />
//         <InputField
//           label="Location / Address"
//           value={form.location.address}
//           onChange={(v) => setForm((p) => ({ ...p, location: { ...p.location, address: v } }))}
//           placeholder="Site address or description"
//         />
//         {/* Photo URL entry */}
//         <div>
//           <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Photos (URL)</label>
//           <div className="flex gap-2 mb-2">
//             <input
//               value={photoInput.url}
//               onChange={(e) => setPhotoInput((p) => ({ ...p, url: e.target.value }))}
//               placeholder="Photo URL..."
//               className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60"
//             />
//             <input
//               value={photoInput.caption}
//               onChange={(e) => setPhotoInput((p) => ({ ...p, caption: e.target.value }))}
//               placeholder="Caption"
//               className="w-28 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60"
//             />
//             <button
//               onClick={() => {
//                 if (!photoInput.url.trim()) return;
//                 setForm((p) => ({ ...p, photos: [...p.photos, { ...photoInput }] }));
//                 setPhotoInput({ url: "", caption: "" });
//               }}
//               className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-[12px] text-white transition"
//             >
//               <Plus size={13} />
//             </button>
//           </div>
//           {form.photos.map((ph, i) => (
//             <div key={i} className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
//               <Camera size={10} /> {ph.caption || ph.url.slice(0, 40)}
//               <button onClick={() => setForm((p) => ({ ...p, photos: p.photos.filter((_, j) => j !== i) }))} className="text-red-400 ml-auto">
//                 <X size={11} />
//               </button>
//             </div>
//           ))}
//         </div>

//         <div className="flex gap-2 justify-end pt-2 border-t border-white/6">
//           <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-slate-400 hover:text-white hover:bg-white/5 transition">Cancel</button>
//           <button
//             disabled={submitting}
//             onClick={async () => {
//               setSubmitting(true);
//               try { await onSubmit(form); onClose(); }
//               finally { setSubmitting(false); }
//             }}
//             className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition disabled:opacity-50"
//           >
//             {submitting ? "Submitting..." : "Submit Check-In"}
//           </button>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// /* ─── Add Document Modal ─── */
// const DocumentModal = ({ open, onClose, onSubmit }) => {
//   const [form, setForm] = useState({ name: "", type: "other", url: "", mimeType: "" });
//   const [submitting, setSubmitting] = useState(false);

//   return (
//     <Modal open={open} onClose={onClose} title="Add Document" subtitle="Upload or link a document" width="max-w-md">
//       <div className="space-y-4">
//         <InputField label="Document Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Installation Contract.pdf" required />
//         <SelectField
//           label="Type"
//           value={form.type}
//           onChange={(v) => setForm((p) => ({ ...p, type: v }))}
//           options={Object.entries(DOC_TYPE_META).map(([k, v]) => ({ value: k, label: v.label }))}
//         />
//         <InputField label="URL / File Path" value={form.url} onChange={(v) => setForm((p) => ({ ...p, url: v }))} placeholder="https://... or /uploads/..." required />
//         <div className="flex gap-2 justify-end pt-2 border-t border-white/6">
//           <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-slate-400 hover:text-white hover:bg-white/5 transition">Cancel</button>
//           <button
//             disabled={!form.name || !form.url || submitting}
//             onClick={async () => {
//               setSubmitting(true);
//               try { await onSubmit(form); onClose(); }
//               finally { setSubmitting(false); }
//             }}
//             className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition disabled:opacity-50"
//           >
//             {submitting ? "Adding..." : "Add Document"}
//           </button>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// /* ═══════════════════════════════════════════════════════════
//    MAIN DETAIL VIEW
// ═══════════════════════════════════════════════════════════ */
// export default function ProjectDetail({ projectId, goBack, onEdit, hasEdit, token, apiBase = "/projects", }) {
//   const [project, setProject] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [tab, setTab] = useState("overview");
//   const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
//   const [notifOpen, setNotifOpen] = useState(false);
//   const [checkInOpen, setCheckInOpen] = useState(false);
//   const [docOpen, setDocOpen] = useState(false);
//   const [newMilestone, setNewMilestone] = useState({ title: "", dueDate: "", description: "" });
//   const [changingStatus, setChangingStatus] = useState(false);

//   const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

//   const load = async () => {
//     try {
//       setLoading(true);
//       const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}`, { headers });
//       const d = await r.json();
//       if (!r.ok) throw new Error(d.message);
//       setProject(d.project);
//     } catch (e) {
//       toast.error(e.message || "Failed to load project");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { load(); }, [projectId]);

//   const updateStatus = async (status) => {
//     setChangingStatus(true);
//     try {
//       const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/status`, {
//         method: "PUT", headers, body: JSON.stringify({ status }),
//       });
//       const d = await r.json();
//       if (!r.ok) throw new Error(d.message);
//       toast.success("Status updated");
//       await load();
//     } catch (e) {
//       toast.error(e.message);
//     } finally {
//       setChangingStatus(false);
//     }
//   };

//   const updateMilestone = async (milestoneId, data) => {
//     try {
//       const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/milestones/${milestoneId}`, {
//         method: "PUT", headers, body: JSON.stringify(data),
//       });
//       const d = await r.json();
//       if (!r.ok) throw new Error(d.message);
//       toast.success("Milestone updated");
//       await load();
//     } catch (e) {
//       toast.error(e.message);
//     }
//   };

//   const addMilestone = async () => {
//     if (!newMilestone.title.trim()) return;
//     try {
//       const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/milestones`, {
//         method: "POST", headers, body: JSON.stringify(newMilestone),
//       });
//       const d = await r.json();
//       if (!r.ok) throw new Error(d.message);
//       toast.success("Milestone added");
//       setNewMilestone({ title: "", dueDate: "", description: "" });
//       setAddMilestoneOpen(false);
//       await load();
//     } catch (e) {
//       toast.error(e.message);
//     }
//   };

//   const deleteMilestone = async (milestoneId) => {
//     if (!confirm("Delete this milestone?")) return;
//     try {
//       const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/milestones/${milestoneId}`, {
//         method: "DELETE", headers,
//       });
//       const d = await r.json();
//       if (!r.ok) throw new Error(d.message);
//       toast.success("Milestone deleted");
//       await load();
//     } catch (e) {
//       toast.error(e.message);
//     }
//   };

//   const submitCheckIn = async (data) => {
//     const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/checkins`, {
//       method: "POST", headers, body: JSON.stringify(data),
//     });
//     const d = await r.json();
//     if (!r.ok) throw new Error(d.message);
//     toast.success("Check-in submitted");
//     await load();
//   };

//   const addDocument = async (data) => {
//     const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/documents`, {
//       method: "POST", headers, body: JSON.stringify(data),
//     });
//     const d = await r.json();
//     if (!r.ok) throw new Error(d.message);
//     toast.success("Document added");
//     await load();
//   };

//   const deleteDocument = async (docId) => {
//     if (!confirm("Delete this document?")) return;
//     const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/documents/${docId}`, {
//       method: "DELETE", headers,
//     });
//     const d = await r.json();
//     if (!r.ok) { toast.error(d.message); return; }
//     toast.success("Document deleted");
//     await load();
//   };

//   const sendNotification = async (data) => {
//     const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/notify`, {
//       method: "POST", headers, body: JSON.stringify(data),
//     });
//     const d = await r.json();
//     if (!r.ok) throw new Error(d.message);
//     toast.success("Notification logged successfully");
//     await load();
//   };

//   const generateCertificate = async () => {
//     try {
//       const r = await fetch(`${API_BASE_URL}${apiBase}/${projectId}/certificate`, {
//         method: "POST", headers,
//       });
//       const d = await r.json();
//       if (!r.ok) throw new Error(d.message);
//       toast.success("Completion certificate generated!");
//       await load();
//     } catch (e) {
//       toast.error(e.message);
//     }
//   };

//   if (loading) return (
//     <div className="flex items-center justify-center h-64">
//       <RefreshCw size={20} className="text-indigo-400 animate-spin" />
//     </div>
//   );

//   if (!project) return (
//     <div className="text-center py-12 text-slate-500">Project not found</div>
//   );

//   const dl = daysLeft(project.expectedCompletionDate);
//   const overdue = dl !== null && dl < 0 && !["completed", "cancelled"].includes(project.status);

//   const TABS = [
//     { key: "overview", label: "Overview", icon: Activity },
//     { key: "milestones", label: `Milestones (${project.milestones?.length || 0})`, icon: CheckCircle2 },
//     { key: "timeline", label: "Timeline", icon: BarChart2 },
//     { key: "checkins", label: `Check-Ins (${project.checkIns?.length || 0})`, icon: Camera },
//     { key: "documents", label: `Documents (${project.documents?.length || 0})`, icon: FileText },
//     { key: "notifications", label: "Notifications", icon: Bell },
//   ];

//   return (
//     <div className="space-y-5">
//       {/* Modals */}
//       <NotificationModal open={notifOpen} onClose={() => setNotifOpen(false)} onSend={sendNotification} customer={project.customer} />
//       <CheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} onSubmit={submitCheckIn} />
//       <DocumentModal open={docOpen} onClose={() => setDocOpen(false)} onSubmit={addDocument} />

//       {/* Add Milestone Modal */}
//       <Modal open={addMilestoneOpen} onClose={() => setAddMilestoneOpen(false)} title="Add Milestone" width="max-w-md">
//         <div className="space-y-4">
//           <InputField label="Title" value={newMilestone.title} onChange={(v) => setNewMilestone((p) => ({ ...p, title: v }))} placeholder="Milestone name" required />
//           <TextareaField label="Description" value={newMilestone.description} onChange={(v) => setNewMilestone((p) => ({ ...p, description: v }))} rows={2} placeholder="Optional details..." />
//           <InputField label="Due Date" type="date" value={newMilestone.dueDate} onChange={(v) => setNewMilestone((p) => ({ ...p, dueDate: v }))} />
//           <div className="flex gap-2 justify-end pt-2 border-t border-white/6">
//             <button onClick={() => setAddMilestoneOpen(false)} className="px-4 py-2 rounded-xl text-[13px] text-slate-400 hover:text-white hover:bg-white/5 transition">Cancel</button>
//             <button onClick={addMilestone} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 transition">Add</button>
//           </div>
//         </div>
//       </Modal>

//       {/* Header */}
//       <div className="flex items-start gap-4">
//         <button onClick={goBack} className="p-2 rounded-xl hover:bg-white/8 text-slate-400 hover:text-white transition flex-shrink-0 mt-0.5">
//           <ArrowLeft size={18} />
//         </button>
//         <div className="flex-1 min-w-0">
//           <div className="flex items-center gap-2 flex-wrap mb-1">
//             <span className="text-[11px] font-bold text-slate-500 font-mono">{project.projectId}</span>
//             <StatusBadge status={project.status} size="md" />
//             <PriorityBadge priority={project.priority} />
//             {overdue && (
//               <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-semibold">
//                 <AlertCircle size={10} /> {Math.abs(dl)}d Overdue
//               </span>
//             )}
//           </div>
//           <h1 className="text-xl font-black text-white">{project.title}</h1>
//           <p className="text-[13px] text-slate-400 flex items-center gap-1.5 mt-0.5">
//             <User size={12} /> {project.customer?.name}
//             {project.customer?.city && <> · <MapPin size={12} /> {project.customer.city}</>}
//           </p>
//         </div>
//         {hasEdit && (
//           <button
//             onClick={onEdit}
//             className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-white/8 hover:bg-white/12 transition flex-shrink-0"
//           >
//             <Edit2 size={14} /> Edit
//           </button>
//         )}
//       </div>

//       {/* Lifecycle stepper */}
//       <div className="bg-[#141428] border border-white/5 rounded-2xl p-4">
//         <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-3">Installation Lifecycle</p>
//         <LifecycleStepper currentStatus={project.status} />
//       </div>

//       {/* Quick stats row */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//         {[
//           { label: "Progress", value: `${project.progressPercent}%`, icon: TrendingUp, color: "text-indigo-400" },
//           { label: "Milestones", value: `${project.milestones?.filter((m) => m.status === "completed").length || 0}/${project.milestones?.length || 0}`, icon: CheckCircle2, color: "text-green-400" },
//           { label: "Check-Ins", value: project.checkIns?.length || 0, icon: Camera, color: "text-cyan-400" },
//           { label: "Capacity", value: project.installation?.systemCapacity ? `${project.installation.systemCapacity} kW` : "—", icon: Sun, color: "text-amber-400" },
//         ].map((s) => (
//           <div key={s.label} className="bg-[#141428] border border-white/5 rounded-xl p-4">
//             <div className="flex items-center gap-2 mb-1">
//               <s.icon size={14} className={s.color} />
//               <span className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</span>
//             </div>
//             <p className="text-xl font-black text-white">{s.value}</p>
//           </div>
//         ))}
//       </div>

//       {/* Progress bar */}
//       <div className="bg-[#141428] border border-white/5 rounded-xl px-4 py-3">
//         <div className="flex items-center justify-between mb-2">
//           <span className="text-[12px] text-slate-400">Overall Progress</span>
//           <span className="text-[13px] font-bold text-white">{project.progressPercent}%</span>
//         </div>
//         <ProgressBar
//           percent={project.progressPercent}
//           color={project.status === "completed" ? "from-green-500 to-emerald-500" : "from-indigo-500 to-violet-500"}
//         />
//       </div>                    

//       {/* Status changer */}
//       {hasEdit && (
//         <div className="bg-[#141428] border border-white/5 rounded-xl p-4">
//           <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Update Status</p>
//           <div className="flex flex-wrap gap-2">
//             {Object.entries(STATUS_META).map(([key, meta]) => (
//               <button
//                 key={key}
//                 onClick={() => updateStatus(key)}
//                 disabled={changingStatus || project.status === key}
//                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition
//                   ${project.status === key
//                     ? `${meta.color} ${meta.bg} border-current opacity-100`
//                     : "text-slate-500 border-white/8 hover:border-white/20 hover:text-white"
//                   } disabled:opacity-50`}
//               >
//                 <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
//                 {meta.label}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Action buttons */}
//       <div className="flex gap-2 flex-wrap">
//         {hasEdit && (
//           <>
//             <button
//               onClick={() => setCheckInOpen(true)}
//               className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-cyan-600/80 hover:bg-cyan-600 transition"
//             >
//               <Camera size={14} /> Check-In
//             </button>
//             <button
//               onClick={() => setNotifOpen(true)}
//               className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-violet-600/80 hover:bg-violet-600 transition"
//             >
//               <Bell size={14} /> Notify Customer
//             </button>
//             <button
//               onClick={() => setDocOpen(true)}
//               className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-indigo-600/80 hover:bg-indigo-600 transition"
//             >
//               <Upload size={14} /> Add Document
//             </button>
//             {project.status === "completed" && !project.completionCertificate?.generated && (
//               <button
//                 onClick={generateCertificate}
//                 className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 transition shadow-lg shadow-green-500/20"
//               >
//                 <Award size={14} /> Generate Certificate
//               </button>
//             )}
//           </>
//         )}
//         {project.completionCertificate?.generated && (
//           <a
//             href={project.completionCertificate.url}
//             target="_blank"
//             rel="noreferrer"
//             className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
//           >
//             <Award size={14} /> View Certificate — {project.completionCertificate.certificateNumber}
//           </a>
//         )}
//       </div>

//       {/* Tab bar */}
//       <div className="flex gap-1 bg-white/4 rounded-xl p-1 overflow-x-auto">
//         {TABS.map((t) => (
//           <button
//             key={t.key}
//             onClick={() => setTab(t.key)}
//             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap flex-shrink-0
//               ${tab === t.key
//                 ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
//                 : "text-slate-400 hover:text-white"}`}
//           >
//             <t.icon size={12} /> {t.label}
//           </button>
//         ))}
//       </div>

//       {/* Tab content */}
//       <AnimatePresence mode="wait">
//         <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

//           {/* ── OVERVIEW ── */}
//           {tab === "overview" && (
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
//               {/* Customer */}
//               <div className="bg-[#141428] border border-white/5 rounded-2xl p-5">
//                 <SectionHeader icon={User} title="Customer Details" />
//                 <div className="space-y-3">
//                   {[
//                     { icon: User, label: "Name", value: project.customer?.name },
//                     { icon: Phone, label: "Phone", value: project.customer?.phone },
//                     { icon: Mail, label: "Email", value: project.customer?.email },
//                     { icon: MapPin, label: "Address", value: [project.customer?.address, project.customer?.city, project.customer?.state, project.customer?.pincode].filter(Boolean).join(", ") },
//                   ].map((r) => r.value && (
//                     <div key={r.label} className="flex items-start gap-3">
//                       <r.icon size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
//                       <div>
//                         <p className="text-[10px] text-slate-600 uppercase tracking-wider">{r.label}</p>
//                         <p className="text-[13px] text-slate-200">{r.value}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Solar */}
//               <div className="bg-[#141428] border border-white/5 rounded-2xl p-5">
//                 <SectionHeader icon={Sun} title="Solar System Details" />
//                 <div className="grid grid-cols-2 gap-3">
//                   {[
//                     { icon: Zap, label: "System Capacity", value: project.installation?.systemCapacity ? `${project.installation.systemCapacity} kW` : null },
//                     { icon: Layers, label: "Panel Count", value: project.installation?.panelCount },
//                     { icon: Cpu, label: "Panel Model", value: project.installation?.panelModel },
//                     { icon: Cpu, label: "Inverter Model", value: project.installation?.inverterModel },
//                     { icon: Sun, label: "Expected Output", value: project.installation?.expectedOutput ? `${project.installation.expectedOutput.toLocaleString()} kWh/yr` : null },
//                     { icon: Shield, label: "Mounting", value: project.installation?.mountingType },
//                   ].map((r) => r.value && (
//                     <div key={r.label} className="bg-white/3 rounded-xl p-2.5">
//                       <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
//                         <r.icon size={9} /> {r.label}
//                       </p>
//                       <p className="text-[12px] text-slate-200 font-semibold">{r.value}</p>
//                     </div>
//                   ))}
//                 </div>
//                 {project.installation?.totalCost && (
//                   <div className="mt-4 flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
//                     <span className="text-[12px] text-amber-300">Total Project Cost</span>
//                     <span className="text-[15px] font-black text-amber-400">₹{project.installation.totalCost.toLocaleString("en-IN")}</span>
//                   </div>
//                 )}
//               </div>

//               {/* Team */}
//               <div className="bg-[#141428] border border-white/5 rounded-2xl p-5">
//                 <SectionHeader icon={Users} title="Team" />
//                 {project.projectManager && (
//                   <div className="mb-4">
//                     <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Project Manager</p>
//                     <div className="flex items-center gap-2">
//                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white">
//                         {project.projectManager?.name?.[0]?.toUpperCase()}
//                       </div>
//                       <div>
//                         <p className="text-[13px] text-white font-semibold">{project.projectManager?.name}</p>
//                         <p className="text-[10px] text-slate-500">{project.projectManager?.email}</p>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//                 <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Engineers</p>
//                 {project.assignedEngineers?.length === 0
//                   ? <p className="text-[12px] text-slate-600">No engineers assigned</p>
//                   : (
//                     <div className="space-y-2">
//                       {project.assignedEngineers?.map((eng) => (
//                         <div key={eng._id} className="flex items-center gap-2">
//                           <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
//                             {eng.name?.[0]?.toUpperCase()}
//                           </div>
//                           <div>
//                             <p className="text-[12px] text-white font-medium">{eng.name}</p>
//                             <p className="text-[10px] text-slate-500">{eng.role}</p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//               </div>

//               {/* Dates */}
//               <div className="bg-[#141428] border border-white/5 rounded-2xl p-5">
//                 <SectionHeader icon={Calendar} title="Schedule" />
//                 <div className="space-y-3">
//                   {[
//                     { label: "Project Created", value: fmt(project.createdAt) },
//                     { label: "Start Date", value: fmt(project.startDate) },
//                     { label: "Expected Completion", value: fmt(project.expectedCompletionDate) },
//                     { label: "Actual Completion", value: fmt(project.actualCompletionDate) },
//                   ].map((r) => (
//                     <div key={r.label} className="flex items-center justify-between">
//                       <span className="text-[12px] text-slate-500">{r.label}</span>
//                       <span className="text-[12px] text-slate-200 font-medium">{r.value}</span>
//                     </div>
//                   ))}
//                   {dl !== null && !["completed", "cancelled"].includes(project.status) && (
//                     <div className={`flex items-center justify-between mt-2 pt-2 border-t border-white/5 ${overdue ? "text-red-400" : dl <= 7 ? "text-orange-400" : "text-green-400"}`}>
//                       <span className="text-[12px] font-semibold">{overdue ? "Days Overdue" : "Days Remaining"}</span>
//                       <span className="text-[14px] font-black">{Math.abs(dl)}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ── MILESTONES ── */}
//           {tab === "milestones" && (
//             <div className="bg-[#141428] border border-white/5 rounded-2xl p-5">
//               <div className="flex items-center justify-between mb-4">
//                 <SectionHeader icon={CheckCircle2} title="Project Milestones" subtitle={`${project.progressPercent}% complete`} />
//                 {hasEdit && (
//                   <button
//                     onClick={() => setAddMilestoneOpen(true)}
//                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/15 transition"
//                   >
//                     <Plus size={13} /> Add
//                   </button>
//                 )}
//               </div>
//               {project.milestones?.length === 0
//                 ? <p className="text-center text-slate-600 text-[13px] py-8">No milestones yet</p>
//                 : (
//                   <div>
//                     {project.milestones.map((m) => (
//                       <div key={m._id} className="flex items-center gap-2">
//                         <div className="flex-1">
//                           <MilestoneRow m={m} onUpdate={updateMilestone} canEdit={hasEdit} />
//                         </div>
//                         {hasEdit && (
//                           <button onClick={() => deleteMilestone(m._id)} className="text-slate-700 hover:text-red-400 transition flex-shrink-0 ml-1">
//                             <Trash2 size={13} />
//                           </button>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//             </div>
//           )}

//           {/* ── TIMELINE ── */}
//           {tab === "timeline" && (
//             <div className="bg-[#141428] border border-white/5 rounded-2xl p-5">
//               <SectionHeader icon={BarChart2} title="Gantt Timeline" subtitle="Visual milestone schedule" />
//               <GanttTimeline project={project} />
//             </div>
//           )}

//           {/* ── CHECK-INS ── */}
//           {tab === "checkins" && (
//             <div className="space-y-3">
//               {project.checkIns?.length === 0
//                 ? <div className="bg-[#141428] border border-white/5 rounded-2xl p-8 text-center text-slate-600 text-[13px]">No check-ins yet</div>
//                 : [...(project.checkIns || [])].reverse().map((ci) => (
//                   <CheckInCard key={ci._id} ci={ci} />
//                 ))}
//             </div>
//           )}

//           {/* ── DOCUMENTS ── */}
//           {tab === "documents" && (
//             <div className="bg-[#141428] border border-white/5 rounded-2xl p-5">
//               <div className="flex items-center justify-between mb-4">
//                 <SectionHeader icon={FileText} title="Documents" />
//               </div>
//               {project.documents?.length === 0
//                 ? <p className="text-center text-slate-600 text-[13px] py-8">No documents uploaded</p>
//                 : (
//                   <div className="space-y-2">
//                     {project.documents.map((doc) => {
//                       const tm = DOC_TYPE_META[doc.type] || DOC_TYPE_META.other;
//                       return (
//                         <div key={doc._id} className="flex items-center gap-3 bg-white/3 border border-white/6 rounded-xl px-4 py-3">
//                           <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
//                             <tm.icon size={14} className="text-indigo-400" />
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="text-[13px] text-white font-medium truncate">{doc.name}</p>
//                             <p className="text-[10px] text-slate-500">
//                               {tm.label} · {fmtTime(doc.uploadedAt)} · {doc.uploadedBy?.name}
//                             </p>
//                           </div>
//                           <div className="flex items-center gap-2 flex-shrink-0">
//                             <a href={doc.url} target="_blank" rel="noreferrer"
//                               className="p-1.5 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition">
//                               <Download size={14} />
//                             </a>
//                             {hasEdit && (
//                               <button onClick={() => deleteDocument(doc._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition">
//                                 <Trash2 size={14} />
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//             </div>
//           )}

//           {/* ── NOTIFICATIONS ── */}
//           {tab === "notifications" && (
//             <div className="space-y-3">
//               {project.notificationLogs?.length === 0
//                 ? <div className="bg-[#141428] border border-white/5 rounded-2xl p-8 text-center text-slate-600 text-[13px]">No notifications sent yet</div>
//                 : [...(project.notificationLogs || [])].reverse().map((n) => (
//                   <div key={n._id} className="bg-[#141428] border border-white/5 rounded-xl px-4 py-3">
//                     <div className="flex items-center justify-between mb-1">
//                       <div className="flex items-center gap-2">
//                         <Bell size={13} className="text-violet-400" />
//                         <span className="text-[12px] font-semibold text-white capitalize">{n.type} Notification</span>
//                         <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${n.status === "sent" ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>
//                           {n.status}
//                         </span>
//                       </div>
//                       <span className="text-[10px] text-slate-500">{fmtTime(n.sentAt)}</span>
//                     </div>
//                     <p className="text-[12px] text-slate-300 mb-1">{n.message}</p>
//                     <p className="text-[10px] text-slate-500">Sent by: {n.sentBy?.name || "System"}</p>
//                   </div>
//                 ))}
//             </div>
//           )}
//         </motion.div>
//       </AnimatePresence>
//     </div>
//   );
// }