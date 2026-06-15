import { useState, useEffect } from "react";
import {
  Sun, User, FileText, Users, Calendar,
  Plus, Trash2, X,
} from "lucide-react";
import {
  Modal, InputField, SelectField, TextareaField, SectionHeader,
  STATUS_META, PRIORITY_META,
} from "./ProjectHelpers";

const EMPTY_PROJECT = {
  title: "",
  description: "",
  customer: { name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" },
  installation: {
    systemCapacity: "", panelCount: "", panelModel: "", inverterModel: "",
    inverterCapacity: "", mountingType: "rooftop", installationAddress: "",
    expectedOutput: "", subsidyAmount: "", totalCost: "", quotationNumber: "",
  },
  status: "enquiry",
  priority: "medium",
  startDate: "",
  expectedCompletionDate: "",
  assignedEngineers: [],
  projectManager: "",
  milestones: [],
  tags: [],
  notes: "",
};

const MOUNTING_TYPES = [
  { value: "rooftop", label: "Rooftop" },
  { value: "ground", label: "Ground Mount" },
  { value: "carport", label: "Carport" },
  { value: "other", label: "Other" },
];

const DEFAULT_MILESTONES = [
  "Site Survey Complete",
  "Design Approved",
  "Permits Obtained",
  "Materials Procured",
  "Installation Complete",
  "Inspection Passed",
  "Grid Connection Done",
  "Handover Complete",
];

/* ─── Inline primitive components (light theme) ─── */

function LightModal({ open, onClose, title, subtitle, width = "max-w-3xl", children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.35)", backdropFilter: "blur(6px)" }}
    >
      <div
        className={`relative w-full ${width} rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]`}
        style={{ boxShadow: "0 24px 60px -8px rgba(0,0,0,0.18), 0 4px 16px -4px rgba(0,0,0,0.08)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
            >
              <Sun size={16} color="#fff" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900 leading-tight">{title}</h2>
              {subtitle && <p className="text-[12px] text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-green-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-800 placeholder-gray-300 bg-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition";

function LightInput({ label, type = "text", value, onChange, placeholder, required }) {
  return (
    <Field label={label} required={required}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </Field>
  );
}

function LightSelect({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls + " appearance-none bg-white cursor-pointer"}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

function LightTextarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={inputCls + " resize-none"}
      />
    </Field>
  );
}

/* ─── Main component ─── */

export default function ProjectFormModal({ open, onClose, onSave, editData, engineers }) {
  const [form, setForm] = useState(EMPTY_PROJECT);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("basic");
  const [tagInput, setTagInput] = useState("");
  const [newMilestone, setNewMilestone] = useState({ title: "", dueDate: "" });

  useEffect(() => {
    if (editData) {
      setForm({
        ...EMPTY_PROJECT,
        ...editData,
        customer: { ...EMPTY_PROJECT.customer, ...editData.customer },
        installation: { ...EMPTY_PROJECT.installation, ...editData.installation },
        startDate: editData.startDate ? editData.startDate.split("T")[0] : "",
        expectedCompletionDate: editData.expectedCompletionDate
          ? editData.expectedCompletionDate.split("T")[0]
          : "",
        assignedEngineers: (editData.assignedEngineers || []).map((e) => e._id || e),
        projectManager: editData.projectManager?._id || editData.projectManager || "",
        milestones: (editData.milestones || []).map((m) => ({
          ...m,
          dueDate: m.dueDate ? m.dueDate.split("T")[0] : "",
        })),
      });
    } else {
      setForm(EMPTY_PROJECT);
    }
    setSection("basic");
    setTagInput("");
  }, [editData, open]);

  const set = (path, value) => {
    setForm((prev) => {
      const parts = path.split(".");
      if (parts.length === 1) return { ...prev, [path]: value };
      const [top, ...rest] = parts;
      return { ...prev, [top]: { ...prev[top], [rest.join(".")]: value } };
    });
  };

  const setNested = (sec, field, value) => {
    setForm((prev) => ({ ...prev, [sec]: { ...prev[sec], [field]: value } }));
  };

  const toggleEngineer = (id) => {
    setForm((prev) => ({
      ...prev,
      assignedEngineers: prev.assignedEngineers.includes(id)
        ? prev.assignedEngineers.filter((e) => e !== id)
        : [...prev.assignedEngineers, id],
    }));
  };

  const addMilestone = () => {
    if (!newMilestone.title.trim()) return;
    setForm((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { ...newMilestone, status: "pending", order: prev.milestones.length }],
    }));
    setNewMilestone({ title: "", dueDate: "" });
  };

  const addDefaultMilestones = () => {
    const today = new Date();
    const defaults = DEFAULT_MILESTONES.map((title, i) => ({
      title,
      dueDate: new Date(today.getTime() + (i + 1) * 7 * 86400000).toISOString().split("T")[0],
      status: "pending",
      order: i,
    }));
    setForm((prev) => ({ ...prev, milestones: defaults }));
  };

  const removeMilestone = (idx) => {
    setForm((prev) => ({ ...prev, milestones: prev.milestones.filter((_, i) => i !== idx) }));
  };

  const addTag = () => {
    if (!tagInput.trim() || form.tags.includes(tagInput.trim())) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
    setTagInput("");
  };

  const removeTag = (t) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((x) => x !== t) }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.customer.name.trim()) {
      alert("Project title and customer name are required");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: "basic",      label: "Basic Info",   icon: FileText },
    { key: "customer",   label: "Customer",     icon: User },
    { key: "solar",      label: "Solar Details",icon: Sun },
    { key: "team",       label: "Team & Dates", icon: Users },
    { key: "milestones", label: "Milestones",   icon: Calendar },
  ];

  return (
    <LightModal
      open={open}
      onClose={onClose}
      title={editData ? `Edit Project — ${editData.projectId}` : "New Solar Project"}
      subtitle={editData ? "Update project details" : "Create a new installation project"}
      width="max-w-3xl"
    >
      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSection(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all
              ${section === t.key
                ? "bg-white text-green-700 shadow-sm border border-gray-200"
                : "text-gray-400 hover:text-gray-600"}`}
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BASIC INFO ── */}
      {section === "basic" && (
        <div className="space-y-4">
          <LightInput label="Project Title" value={form.title} onChange={(v) => set("title", v)} placeholder="e.g. Sharma Residence 5kW Rooftop" required />
          <LightTextarea label="Description" value={form.description} onChange={(v) => set("description", v)} placeholder="Brief project overview..." />
          <div className="grid grid-cols-2 gap-3">
            <LightSelect
              label="Status" value={form.status} onChange={(v) => set("status", v)}
              options={Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))}
            />
            <LightSelect
              label="Priority" value={form.priority} onChange={(v) => set("priority", v)}
              options={Object.entries(PRIORITY_META).map(([k, v]) => ({ value: k, label: v.label }))}
            />
          </div>
          <LightTextarea label="Internal Notes" value={form.notes} onChange={(v) => set("notes", v)} placeholder="Internal team notes..." rows={2} />

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tags</label>
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {form.tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                  style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}
                >
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-red-400 transition leading-none">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                placeholder="Add tag..."
                className={inputCls + " flex-1"}
              />
              <button
                onClick={addTag}
                className="px-4 py-2 rounded-xl text-[12px] font-medium text-white transition"
                style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMER ── */}
      {section === "customer" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <LightInput label="Customer Name" value={form.customer.name} onChange={(v) => setNested("customer", "name", v)} placeholder="Full name" required />
            <LightInput label="Phone" value={form.customer.phone} onChange={(v) => setNested("customer", "phone", v)} placeholder="+91 XXXXX XXXXX" />
          </div>
          <LightInput label="Email" type="email" value={form.customer.email} onChange={(v) => setNested("customer", "email", v)} placeholder="customer@email.com" />
          <LightInput label="Installation Address" value={form.customer.address} onChange={(v) => setNested("customer", "address", v)} placeholder="Street address" />
          <div className="grid grid-cols-3 gap-3">
            <LightInput label="City" value={form.customer.city} onChange={(v) => setNested("customer", "city", v)} placeholder="City" />
            <LightInput label="State" value={form.customer.state} onChange={(v) => setNested("customer", "state", v)} placeholder="State" />
            <LightInput label="Pincode" value={form.customer.pincode} onChange={(v) => setNested("customer", "pincode", v)} placeholder="000000" />
          </div>
        </div>
      )}

      {/* ── SOLAR DETAILS ── */}
      {section === "solar" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <LightInput label="System Capacity (kW)" type="number" value={form.installation.systemCapacity} onChange={(v) => setNested("installation", "systemCapacity", v)} placeholder="e.g. 5" />
            <LightInput label="Panel Count" type="number" value={form.installation.panelCount} onChange={(v) => setNested("installation", "panelCount", v)} placeholder="e.g. 15" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LightInput label="Panel Model" value={form.installation.panelModel} onChange={(v) => setNested("installation", "panelModel", v)} placeholder="e.g. Tata Power 360W" />
            <LightInput label="Inverter Model" value={form.installation.inverterModel} onChange={(v) => setNested("installation", "inverterModel", v)} placeholder="e.g. Growatt 5KTL" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LightInput label="Inverter Capacity (kW)" type="number" value={form.installation.inverterCapacity} onChange={(v) => setNested("installation", "inverterCapacity", v)} placeholder="e.g. 5" />
            <LightSelect
              label="Mounting Type" value={form.installation.mountingType}
              onChange={(v) => setNested("installation", "mountingType", v)}
              options={MOUNTING_TYPES}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <LightInput label="Expected Output (kWh/yr)" type="number" value={form.installation.expectedOutput} onChange={(v) => setNested("installation", "expectedOutput", v)} placeholder="e.g. 7000" />
            <LightInput label="Subsidy Amount (₹)" type="number" value={form.installation.subsidyAmount} onChange={(v) => setNested("installation", "subsidyAmount", v)} placeholder="e.g. 45000" />
            <LightInput label="Total Cost (₹)" type="number" value={form.installation.totalCost} onChange={(v) => setNested("installation", "totalCost", v)} placeholder="e.g. 250000" />
          </div>
          <LightInput label="Quotation Number" value={form.installation.quotationNumber} onChange={(v) => setNested("installation", "quotationNumber", v)} placeholder="e.g. QT-2024-001" />
        </div>
      )}

      {/* ── TEAM & DATES ── */}
      {section === "team" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <LightInput label="Start Date" type="date" value={form.startDate} onChange={(v) => set("startDate", v)} />
            <LightInput label="Expected Completion" type="date" value={form.expectedCompletionDate} onChange={(v) => set("expectedCompletionDate", v)} />
          </div>

          {/* Project Manager */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Project Manager</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => set("projectManager", "")}
                className={`px-3 py-2 rounded-xl text-[12px] border transition font-medium
                  ${!form.projectManager
                    ? "border-green-400 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"}`}
              >
                None
              </button>
              {engineers.map((eng) => (
                <button
                  key={eng._id}
                  onClick={() => set("projectManager", eng._id)}
                  className={`px-3 py-2 rounded-xl text-[12px] border transition flex items-center gap-2
                    ${form.projectManager === eng._id
                      ? "border-green-400 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"}`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
                  >
                    {eng.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="truncate font-medium">{eng.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Engineers */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Assign Engineers</label>
            {engineers.length === 0 ? (
              <p className="text-[12px] text-gray-400">No engineers available</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {engineers.map((eng) => {
                  const selected = form.assignedEngineers.includes(eng._id);
                  return (
                    <button
                      key={eng._id}
                      onClick={() => toggleEngineer(eng._id)}
                      className={`px-3 py-2 rounded-xl text-[12px] border transition flex items-center gap-2
                        ${selected
                          ? "border-green-400 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"}`}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0"
                        style={{ background: selected ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#94a3b8,#64748b)" }}
                      >
                        {eng.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="truncate font-medium">{eng.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{eng.role}</p>
                      </div>
                      {selected && (
                        <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-100 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MILESTONES ── */}
      {section === "milestones" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-gray-400">
              <span className="font-semibold text-gray-700">{form.milestones.length}</span> milestone{form.milestones.length !== 1 ? "s" : ""} defined
            </p>
            <button
              onClick={addDefaultMilestones}
              className="text-[12px] font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition"
            >
              + Load Defaults
            </button>
          </div>

          {/* Add new */}
          <div className="flex gap-2">
            <input
              value={newMilestone.title}
              onChange={(e) => setNewMilestone((p) => ({ ...p, title: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addMilestone()}
              placeholder="Milestone title..."
              className={inputCls + " flex-1"}
            />
            <input
              type="date"
              value={newMilestone.dueDate}
              onChange={(e) => setNewMilestone((p) => ({ ...p, dueDate: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-[12px] text-gray-700 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition bg-white"
            />
            <button
              onClick={addMilestone}
              className="px-3 py-2 rounded-xl text-white transition flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
            >
              <Plus size={14} />
            </button>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {form.milestones.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white"
                  style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-800 font-medium truncate">{m.title}</p>
                  {m.dueDate && <p className="text-[11px] text-gray-400 mt-0.5">Due: {m.dueDate}</p>}
                </div>
                <button
                  onClick={() => removeMilestone(i)}
                  className="text-gray-300 hover:text-red-400 transition flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {form.milestones.length === 0 && (
              <div className="text-center text-gray-400 text-[12px] py-8 border border-dashed border-gray-200 rounded-xl">
                No milestones yet — add one above or load defaults
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
          }}
        >
          {saving ? "Saving..." : editData ? "Save Changes" : "Create Project"}
        </button>
      </div>
    </LightModal>
  );
}




// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import {
//   Sun, User, MapPin, Cpu, Calendar, Users, Tag,
//   ChevronDown, Plus, Trash2, FileText,
// } from "lucide-react";
// import {
//   Modal, InputField, SelectField, TextareaField, SectionHeader,
//   STATUS_META, PRIORITY_META,
// } from "./ProjectHelpers";

// const EMPTY_PROJECT = {
//   title: "",
//   description: "",
//   customer: { name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" },
//   installation: {
//     systemCapacity: "", panelCount: "", panelModel: "", inverterModel: "",
//     inverterCapacity: "", mountingType: "rooftop", installationAddress: "",
//     expectedOutput: "", subsidyAmount: "", totalCost: "", quotationNumber: "",
//   },
//   status: "enquiry",
//   priority: "medium",
//   startDate: "",
//   expectedCompletionDate: "",
//   assignedEngineers: [],
//   projectManager: "",
//   milestones: [],
//   tags: [],
//   notes: "",
// };

// const MOUNTING_TYPES = [
//   { value: "rooftop", label: "Rooftop" },
//   { value: "ground", label: "Ground Mount" },
//   { value: "carport", label: "Carport" },
//   { value: "other", label: "Other" },
// ];

// const DEFAULT_MILESTONES = [
//   "Site Survey Complete",
//   "Design Approved",
//   "Permits Obtained",
//   "Materials Procured",
//   "Installation Complete",
//   "Inspection Passed",
//   "Grid Connection Done",
//   "Handover Complete",
// ];

// export default function ProjectFormModal({ open, onClose, onSave, editData, engineers }) {
//   const [form, setForm] = useState(EMPTY_PROJECT);
//   const [saving, setSaving] = useState(false);
//   const [section, setSection] = useState("basic");
//   const [tagInput, setTagInput] = useState("");
//   const [newMilestone, setNewMilestone] = useState({ title: "", dueDate: "" });

//   useEffect(() => {
//     if (editData) {
//       setForm({
//         ...EMPTY_PROJECT,
//         ...editData,
//         customer: { ...EMPTY_PROJECT.customer, ...editData.customer },
//         installation: { ...EMPTY_PROJECT.installation, ...editData.installation },
//         startDate: editData.startDate ? editData.startDate.split("T")[0] : "",
//         expectedCompletionDate: editData.expectedCompletionDate
//           ? editData.expectedCompletionDate.split("T")[0]
//           : "",
//         assignedEngineers: (editData.assignedEngineers || []).map((e) => e._id || e),
//         projectManager: editData.projectManager?._id || editData.projectManager || "",
//         milestones: (editData.milestones || []).map((m) => ({
//           ...m,
//           dueDate: m.dueDate ? m.dueDate.split("T")[0] : "",
//         })),
//       });
//     } else {
//       setForm(EMPTY_PROJECT);
//     }
//     setSection("basic");
//     setTagInput("");
//   }, [editData, open]);

//   const set = (path, value) => {
//     setForm((prev) => {
//       const parts = path.split(".");
//       if (parts.length === 1) return { ...prev, [path]: value };
//       const [top, ...rest] = parts;
//       return { ...prev, [top]: { ...prev[top], [rest.join(".")]: value } };
//     });
//   };

//   const setNested = (section, field, value) => {
//     setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
//   };

//   const toggleEngineer = (id) => {
//     setForm((prev) => ({
//       ...prev,
//       assignedEngineers: prev.assignedEngineers.includes(id)
//         ? prev.assignedEngineers.filter((e) => e !== id)
//         : [...prev.assignedEngineers, id],
//     }));
//   };

//   const addMilestone = () => {
//     if (!newMilestone.title.trim()) return;
//     setForm((prev) => ({
//       ...prev,
//       milestones: [...prev.milestones, { ...newMilestone, status: "pending", order: prev.milestones.length }],
//     }));
//     setNewMilestone({ title: "", dueDate: "" });
//   };

//   const addDefaultMilestones = () => {
//     const today = new Date();
//     const defaults = DEFAULT_MILESTONES.map((title, i) => ({
//       title,
//       dueDate: new Date(today.getTime() + (i + 1) * 7 * 86400000).toISOString().split("T")[0],
//       status: "pending",
//       order: i,
//     }));
//     setForm((prev) => ({ ...prev, milestones: defaults }));
//   };

//   const removeMilestone = (idx) => {
//     setForm((prev) => ({ ...prev, milestones: prev.milestones.filter((_, i) => i !== idx) }));
//   };

//   const addTag = () => {
//     if (!tagInput.trim() || form.tags.includes(tagInput.trim())) return;
//     setForm((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
//     setTagInput("");
//   };

//   const removeTag = (t) => {
//     setForm((prev) => ({ ...prev, tags: prev.tags.filter((x) => x !== t) }));
//   };

//   const handleSubmit = async () => {
//     if (!form.title.trim() || !form.customer.name.trim()) {
//       alert("Project title and customer name are required");
//       return;
//     }
//     setSaving(true);
//     try {
//       await onSave(form);
//       onClose();
//     } finally {
//       setSaving(false);
//     }
//   };

//   const tabs = [
//     { key: "basic", label: "Basic Info", icon: FileText },
//     { key: "customer", label: "Customer", icon: User },
//     { key: "solar", label: "Solar Details", icon: Sun },
//     { key: "team", label: "Team & Dates", icon: Users },
//     { key: "milestones", label: "Milestones", icon: Calendar },
//   ];

//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       title={editData ? `Edit Project — ${editData.projectId}` : "New Solar Project"}
//       subtitle={editData ? "Update project details" : "Create a new installation project"}
//       width="max-w-3xl"
//     >
//       {/* Tab bar */}
//       <div className="flex gap-1 bg-white/4 rounded-xl p-1 mb-6 flex-wrap">
//         {tabs.map((t) => (
//           <button
//             key={t.key}
//             onClick={() => setSection(t.key)}
//             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all
//               ${section === t.key
//                 ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
//                 : "text-slate-400 hover:text-white"}`}
//           >
//             <t.icon size={12} /> {t.label}
//           </button>
//         ))}
//       </div>

//       {/* ── BASIC INFO ── */}
//       {section === "basic" && (
//         <div className="space-y-4">
//           <InputField label="Project Title" value={form.title} onChange={(v) => set("title", v)} placeholder="e.g. Sharma Residence 5kW Rooftop" required />
//           <TextareaField label="Description" value={form.description} onChange={(v) => set("description", v)} placeholder="Brief project overview..." />
//           <div className="grid grid-cols-2 gap-3">
//             <SelectField
//               label="Status" value={form.status} onChange={(v) => set("status", v)}
//               options={Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))}
//             />
//             <SelectField
//               label="Priority" value={form.priority} onChange={(v) => set("priority", v)}
//               options={Object.entries(PRIORITY_META).map(([k, v]) => ({ value: k, label: v.label }))}
//             />
//           </div>
//           <TextareaField label="Internal Notes" value={form.notes} onChange={(v) => set("notes", v)} placeholder="Internal team notes..." rows={2} />
//           {/* Tags */}
//           <div>
//             <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tags</label>
//             <div className="flex gap-2 mb-2 flex-wrap">
//               {form.tags.map((t) => (
//                 <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-[11px] font-medium">
//                   {t}
//                   <button onClick={() => removeTag(t)} className="hover:text-white"><span>×</span></button>
//                 </span>
//               ))}
//             </div>
//             <div className="flex gap-2">
//               <input
//                 value={tagInput}
//                 onChange={(e) => setTagInput(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && addTag()}
//                 placeholder="Add tag..."
//                 className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60"
//               />
//               <button onClick={addTag} className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-[12px] text-white transition">
//                 Add
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── CUSTOMER ── */}
//       {section === "customer" && (
//         <div className="space-y-4">
//           <div className="grid grid-cols-2 gap-3">
//             <InputField label="Customer Name" value={form.customer.name} onChange={(v) => setNested("customer", "name", v)} placeholder="Full name" required />
//             <InputField label="Phone" value={form.customer.phone} onChange={(v) => setNested("customer", "phone", v)} placeholder="+91 XXXXX XXXXX" />
//           </div>
//           <InputField label="Email" type="email" value={form.customer.email} onChange={(v) => setNested("customer", "email", v)} placeholder="customer@email.com" />
//           <InputField label="Installation Address" value={form.customer.address} onChange={(v) => setNested("customer", "address", v)} placeholder="Street address" />
//           <div className="grid grid-cols-3 gap-3">
//             <InputField label="City" value={form.customer.city} onChange={(v) => setNested("customer", "city", v)} placeholder="City" />
//             <InputField label="State" value={form.customer.state} onChange={(v) => setNested("customer", "state", v)} placeholder="State" />
//             <InputField label="Pincode" value={form.customer.pincode} onChange={(v) => setNested("customer", "pincode", v)} placeholder="000000" />
//           </div>
//         </div>
//       )}

//       {/* ── SOLAR DETAILS ── */}
//       {section === "solar" && (
//         <div className="space-y-4">
//           <div className="grid grid-cols-2 gap-3">
//             <InputField label="System Capacity (kW)" type="number" value={form.installation.systemCapacity} onChange={(v) => setNested("installation", "systemCapacity", v)} placeholder="e.g. 5" />
//             <InputField label="Panel Count" type="number" value={form.installation.panelCount} onChange={(v) => setNested("installation", "panelCount", v)} placeholder="e.g. 15" />
//           </div>
//           <div className="grid grid-cols-2 gap-3">
//             <InputField label="Panel Model" value={form.installation.panelModel} onChange={(v) => setNested("installation", "panelModel", v)} placeholder="e.g. Tata Power 360W" />
//             <InputField label="Inverter Model" value={form.installation.inverterModel} onChange={(v) => setNested("installation", "inverterModel", v)} placeholder="e.g. Growatt 5KTL" />
//           </div>
//           <div className="grid grid-cols-2 gap-3">
//             <InputField label="Inverter Capacity (kW)" type="number" value={form.installation.inverterCapacity} onChange={(v) => setNested("installation", "inverterCapacity", v)} placeholder="e.g. 5" />
//             <SelectField
//               label="Mounting Type" value={form.installation.mountingType}
//               onChange={(v) => setNested("installation", "mountingType", v)}
//               options={MOUNTING_TYPES}
//             />
//           </div>
//           <div className="grid grid-cols-3 gap-3">
//             <InputField label="Expected Output (kWh/yr)" type="number" value={form.installation.expectedOutput} onChange={(v) => setNested("installation", "expectedOutput", v)} placeholder="e.g. 7000" />
//             <InputField label="Subsidy Amount (₹)" type="number" value={form.installation.subsidyAmount} onChange={(v) => setNested("installation", "subsidyAmount", v)} placeholder="e.g. 45000" />
//             <InputField label="Total Cost (₹)" type="number" value={form.installation.totalCost} onChange={(v) => setNested("installation", "totalCost", v)} placeholder="e.g. 250000" />
//           </div>
//           <InputField label="Quotation Number" value={form.installation.quotationNumber} onChange={(v) => setNested("installation", "quotationNumber", v)} placeholder="e.g. QT-2024-001" />
//         </div>
//       )}

//       {/* ── TEAM & DATES ── */}
//       {section === "team" && (
//         <div className="space-y-5">
//           <div className="grid grid-cols-2 gap-3">
//             <InputField label="Start Date" type="date" value={form.startDate} onChange={(v) => set("startDate", v)} />
//             <InputField label="Expected Completion" type="date" value={form.expectedCompletionDate} onChange={(v) => set("expectedCompletionDate", v)} />
//           </div>

//           {/* Project Manager */}
//           <div>
//             <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Project Manager</label>
//             <div className="grid grid-cols-2 gap-2">
//               <button
//                 onClick={() => set("projectManager", "")}
//                 className={`px-3 py-2 rounded-xl text-[12px] border transition ${!form.projectManager ? "border-indigo-500 bg-indigo-500/15 text-indigo-300" : "border-white/8 text-slate-400 hover:border-white/20"}`}
//               >
//                 None
//               </button>
//               {engineers.map((eng) => (
//                 <button
//                   key={eng._id}
//                   onClick={() => set("projectManager", eng._id)}
//                   className={`px-3 py-2 rounded-xl text-[12px] border transition flex items-center gap-2
//                     ${form.projectManager === eng._id ? "border-indigo-500 bg-indigo-500/15 text-indigo-300" : "border-white/8 text-slate-400 hover:border-white/20"}`}
//                 >
//                   <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] text-white font-bold flex-shrink-0">
//                     {eng.name?.[0]?.toUpperCase()}
//                   </div>
//                   <span className="truncate">{eng.name}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Engineers */}
//           <div>
//             <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Assign Engineers</label>
//             {engineers.length === 0 ? (
//               <p className="text-[12px] text-slate-600">No engineers available</p>
//             ) : (
//               <div className="grid grid-cols-2 gap-2">
//                 {engineers.map((eng) => {
//                   const selected = form.assignedEngineers.includes(eng._id);
//                   return (
//                     <button
//                       key={eng._id}
//                       onClick={() => toggleEngineer(eng._id)}
//                       className={`px-3 py-2 rounded-xl text-[12px] border transition flex items-center gap-2
//                         ${selected ? "border-cyan-500 bg-cyan-500/10 text-cyan-300" : "border-white/8 text-slate-400 hover:border-white/20"}`}
//                     >
//                       <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[9px] text-white font-bold flex-shrink-0">
//                         {eng.name?.[0]?.toUpperCase()}
//                       </div>
//                       <div className="text-left min-w-0">
//                         <p className="truncate">{eng.name}</p>
//                         <p className="text-[10px] text-slate-600 truncate">{eng.role}</p>
//                       </div>
//                       {selected && <span className="ml-auto text-cyan-400">✓</span>}
//                     </button>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* ── MILESTONES ── */}
//       {section === "milestones" && (
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <p className="text-[12px] text-slate-400">{form.milestones.length} milestone{form.milestones.length !== 1 ? "s" : ""} defined</p>
//             <button
//               onClick={addDefaultMilestones}
//               className="text-[12px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/15 px-3 py-1.5 rounded-lg transition"
//             >
//               + Load Defaults
//             </button>
//           </div>

//           {/* Add new */}
//           <div className="flex gap-2">
//             <input
//               value={newMilestone.title}
//               onChange={(e) => setNewMilestone((p) => ({ ...p, title: e.target.value }))}
//               onKeyDown={(e) => e.key === "Enter" && addMilestone()}
//               placeholder="Milestone title..."
//               className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60"
//             />
//             <input
//               type="date"
//               value={newMilestone.dueDate}
//               onChange={(e) => setNewMilestone((p) => ({ ...p, dueDate: e.target.value }))}
//               className="bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-[12px] text-slate-300 focus:outline-none focus:border-indigo-500/60"
//             />
//             <button
//               onClick={addMilestone}
//               className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-[12px] text-white transition"
//             >
//               <Plus size={14} />
//             </button>
//           </div>

//           {/* List */}
//           <div className="space-y-2 max-h-64 overflow-y-auto">
//             {form.milestones.map((m, i) => (
//               <div key={i} className="flex items-center gap-3 bg-white/3 border border-white/6 rounded-xl px-3 py-2">
//                 <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-slate-400 font-bold flex-shrink-0">{i + 1}</span>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-[12px] text-white font-medium truncate">{m.title}</p>
//                   {m.dueDate && <p className="text-[10px] text-slate-500">Due: {m.dueDate}</p>}
//                 </div>
//                 <button onClick={() => removeMilestone(i)} className="text-slate-600 hover:text-red-400 transition flex-shrink-0">
//                   <Trash2 size={13} />
//                 </button>
//               </div>
//             ))}
//             {form.milestones.length === 0 && (
//               <p className="text-center text-slate-600 text-[12px] py-4">No milestones yet</p>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Footer */}
//       <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/6">
//         <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-slate-400 hover:text-white hover:bg-white/5 transition">
//           Cancel
//         </button>
//         <button
//           onClick={handleSubmit}
//           disabled={saving}
//           className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
//         >
//           {saving ? "Saving..." : editData ? "Save Changes" : "Create Project"}
//         </button>
//       </div>
//     </Modal>
//   );
// }