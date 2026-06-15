import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../../config/api";
import ViewProposal from "./ViewProposal";

// ── Icons (inline SVG, consistent with Savorka design) ──────────────────────
const Icon = ({ name, size = 18, className = "" }) => {
  const icons = {
    file: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>
      </svg>
    ),
    plus: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    trash: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    ),
    chevronDown: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="6,9 12,15 18,9"/>
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20,6 9,17 4,12"/>
      </svg>
    ),
    eye: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    send: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
      </svg>
    ),
    building: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    user: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    dollar: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    calendar: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    sparkle: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
      </svg>
    ),
    arrow: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
      </svg>
    ),
  };
  return icons[name] || null;
};

// ── Constants ────────────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  "Solar Energy", "Real Estate", "IT Services", "Construction",
  "Healthcare", "Education", "Retail", "Manufacturing",
  "Hospitality", "Finance", "Logistics", "Marketing Agency",
  "Legal Services", "Food & Beverage", "E-commerce", "Other",
];

const PROPOSAL_TYPES = [
  "Sales Proposal", "Project Proposal", "Service Agreement",
  "Partnership Proposal", "Investment Proposal", "Technical Proposal",
  "Maintenance Contract", "Consulting Proposal",
];

const CURRENCIES = ["USD", "INR", "EUR", "GBP", "AED"];

const STEPS = [
  { id: 1, label: "Client Info", icon: "user" },
  { id: 2, label: "Business Details", icon: "building" },
  { id: 3, label: "Scope & Services", icon: "file" },
  { id: 4, label: "Pricing", icon: "dollar" },
  { id: 5, label: "Timeline", icon: "calendar" },
  { id: 6, label: "Review", icon: "eye" },
];

// ── Main Component ───────────────────────────────────────────────────────────
export default function CreateProposal() {

  const navigate = useNavigate();
  const [showProposal, setShowProposal] = useState(false);
  const [generatedProposalId, setGeneratedProposalId] = useState(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [form, setForm] = useState({
    // Step 1 – Client Info
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCompany: "",
    clientAddress: "",

    // Step 2 – Business Details
    businessType: "",
    proposalType: "",
    proposalTitle: "",
    proposalNumber: `PRO-${Date.now().toString().slice(-6)}`,
    issueDate: new Date().toISOString().split("T")[0],
    validUntil: "",

    // Step 3 – Scope
    projectSummary: "",
    services: [{ id: 1, name: "", description: "" }],
    terms: "",
    notes: "",

    // Step 4 – Pricing
    currency: "USD",
    lineItems: [{ id: 1, description: "", qty: 1, unit: "Unit", unitPrice: "" }],
    discount: "",
    taxRate: "",
    paymentTerms: "Net 30",

    // Step 5 – Timeline
    startDate: "",
    endDate: "",
    milestones: [{ id: 1, title: "", dueDate: "", description: "" }],
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));


 const handleGenerate = async () => {
  try {
    setGenerating(true);
    const token = localStorage.getItem("token");

const createRes = await axios.post(
  `${API_BASE_URL}/new-proposals`,
  form,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    const proposalId =
      createRes.data.proposal._id;

   

await axios.post(
  `${API_BASE_URL}/new-proposals/generate/${proposalId}`,
  {},
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
  
);

    setGeneratedProposalId(proposalId);
     setGenerating(false);
    setSubmitted(true);

  } catch (err) {
    console.error(err);
    setGenerating(false);
    alert("Proposal generation failed");
  }
};


  // ── Computed totals ────────────────────────────────────────────────────────
  const subtotal = form.lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.unitPrice) || 0) * (parseFloat(item.qty) || 0);
  }, 0);
  const discountAmt = (subtotal * (parseFloat(form.discount) || 0)) / 100;
  const taxAmt = ((subtotal - discountAmt) * (parseFloat(form.taxRate) || 0)) / 100;
  const total = subtotal - discountAmt + taxAmt;

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: form.currency }).format(n);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const addService = () =>
    update("services", [...form.services, { id: Date.now(), name: "", description: "" }]);
  const removeService = (id) =>
    update("services", form.services.filter((s) => s.id !== id));
  const updateService = (id, field, val) =>
    update("services", form.services.map((s) => (s.id === id ? { ...s, [field]: val } : s)));

  const addLineItem = () =>
    update("lineItems", [...form.lineItems, { id: Date.now(), description: "", qty: 1, unit: "Unit", unitPrice: "" }]);
  const removeLineItem = (id) =>
    update("lineItems", form.lineItems.filter((i) => i.id !== id));
  const updateLineItem = (id, field, val) =>
    update("lineItems", form.lineItems.map((i) => (i.id === id ? { ...i, [field]: val } : i)));

  const addMilestone = () =>
    update("milestones", [...form.milestones, { id: Date.now(), title: "", dueDate: "", description: "" }]);
  const removeMilestone = (id) =>
    update("milestones", form.milestones.filter((m) => m.id !== id));
  const updateMilestone = (id, field, val) =>
    update("milestones", form.milestones.map((m) => (m.id === id ? { ...m, [field]: val } : m)));

  const canProceed = () => {
    if (currentStep === 1) return form.clientName && form.clientEmail;
    if (currentStep === 2) return form.businessType && form.proposalType && form.proposalTitle;
    if (currentStep === 3) return form.projectSummary;
    if (currentStep === 4) return form.lineItems.some((i) => i.description && i.unitPrice);
    if (currentStep === 5) return form.startDate && form.endDate;
    return true;
  };

  // ── Shared input classes ───────────────────────────────────────────────────
  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition placeholder-gray-400";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";
  const selectCls = inputCls + " appearance-none cursor-pointer";

  // ── STEP RENDERS ──────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-500 mb-6">
          Enter the client's contact details. This information will appear on the final proposal document.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Client Name <span className="text-red-400 normal-case">*</span></label>
          <input className={inputCls} placeholder="e.g. Rajesh Kumar" value={form.clientName}
            onChange={(e) => update("clientName", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Email Address <span className="text-red-400 normal-case">*</span></label>
          <input className={inputCls} type="email" placeholder="client@company.com" value={form.clientEmail}
            onChange={(e) => update("clientEmail", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Phone Number</label>
          <input className={inputCls} placeholder="+91 98765 43210" value={form.clientPhone}
            onChange={(e) => update("clientPhone", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Company Name</label>
          <input className={inputCls} placeholder="Client's company" value={form.clientCompany}
            onChange={(e) => update("clientCompany", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Client Address</label>
          <textarea className={inputCls + " resize-none"} rows={3} placeholder="Full address including city, state, pincode..."
            value={form.clientAddress} onChange={(e) => update("clientAddress", e.target.value)} />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 mb-6">
        Specify the type of business and proposal. This helps tailor the structure and language of your document.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Business Type <span className="text-red-400 normal-case">*</span></label>
          <div className="relative">
            <select className={selectCls} value={form.businessType}
              onChange={(e) => update("businessType", e.target.value)}>
              <option value="">Select business type</option>
              {BUSINESS_TYPES.map((b) => <option key={b}>{b}</option>)}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon name="chevronDown" size={16} />
            </div>
          </div>
        </div>
        <div>
          <label className={labelCls}>Proposal Type <span className="text-red-400 normal-case">*</span></label>
          <div className="relative">
            <select className={selectCls} value={form.proposalType}
              onChange={(e) => update("proposalType", e.target.value)}>
              <option value="">Select proposal type</option>
              {PROPOSAL_TYPES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon name="chevronDown" size={16} />
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Proposal Title <span className="text-red-400 normal-case">*</span></label>
          <input className={inputCls} placeholder="e.g. 5kW Rooftop Solar Installation for XYZ Pvt Ltd"
            value={form.proposalTitle} onChange={(e) => update("proposalTitle", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Proposal Number</label>
          <input className={inputCls} value={form.proposalNumber}
            onChange={(e) => update("proposalNumber", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Issue Date</label>
          <input className={inputCls} type="date" value={form.issueDate}
            onChange={(e) => update("issueDate", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Valid Until</label>
          <input className={inputCls} type="date" value={form.validUntil}
            onChange={(e) => update("validUntil", e.target.value)} />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className={labelCls}>Project Summary <span className="text-red-400 normal-case">*</span></label>
        <textarea className={inputCls + " resize-none"} rows={4}
          placeholder="Provide a clear overview of the project — what problem are you solving, what you will deliver, and why the client should choose you..."
          value={form.projectSummary} onChange={(e) => update("projectSummary", e.target.value)} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelCls + " mb-0"}>Services / Deliverables</label>
          <button onClick={addService}
            className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 transition">
            <Icon name="plus" size={14} /> Add Service
          </button>
        </div>
        <div className="space-y-3">
          {form.services.map((svc, idx) => (
            <div key={svc.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <input className={inputCls} placeholder="Service name (e.g. Solar Panel Installation)"
                    value={svc.name} onChange={(e) => updateService(svc.id, "name", e.target.value)} />
                  <textarea className={inputCls + " resize-none"} rows={2}
                    placeholder="Brief description of this service..."
                    value={svc.description} onChange={(e) => updateService(svc.id, "description", e.target.value)} />
                </div>
                {form.services.length > 1 && (
                  <button onClick={() => removeService(svc.id)}
                    className="text-red-400 hover:text-red-600 transition flex-shrink-0 mt-0.5">
                    <Icon name="trash" size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Terms & Conditions</label>
          <textarea className={inputCls + " resize-none"} rows={3}
            placeholder="Any standard terms and conditions..."
            value={form.terms} onChange={(e) => update("terms", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Additional Notes</label>
          <textarea className={inputCls + " resize-none"} rows={3}
            placeholder="Anything else the client should know..."
            value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <label className={labelCls}>Currency</label>
          <div className="relative">
            <select className={selectCls + " pr-8 w-28"} value={form.currency}
              onChange={(e) => update("currency", e.target.value)}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon name="chevronDown" size={14} />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <label className={labelCls}>Payment Terms</label>
          <div className="relative">
            <select className={selectCls + " pr-8 w-36"} value={form.paymentTerms}
              onChange={(e) => update("paymentTerms", e.target.value)}>
              {["Immediate", "Net 15", "Net 30", "Net 45", "Net 60", "50% Advance"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon name="chevronDown" size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelCls + " mb-0"}>Line Items <span className="text-red-400 normal-case">*</span></label>
          <button onClick={addLineItem}
            className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 transition">
            <Icon name="plus" size={14} /> Add Item
          </button>
        </div>

        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-3 pb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <div className="col-span-5">Description</div>
          <div className="col-span-2">Qty</div>
          <div className="col-span-2">Unit</div>
          <div className="col-span-2">Unit Price</div>
          <div className="col-span-1"></div>
        </div>

        <div className="space-y-2">
          {form.lineItems.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 md:col-span-5">
                <input className={inputCls} placeholder="Item description"
                  value={item.description} onChange={(e) => updateLineItem(item.id, "description", e.target.value)} />
              </div>
              <div className="col-span-4 md:col-span-2">
                <input className={inputCls} type="number" min="1" placeholder="1"
                  value={item.qty} onChange={(e) => updateLineItem(item.id, "qty", e.target.value)} />
              </div>
              <div className="col-span-4 md:col-span-2">
                <input className={inputCls} placeholder="Unit"
                  value={item.unit} onChange={(e) => updateLineItem(item.id, "unit", e.target.value)} />
              </div>
              <div className="col-span-3 md:col-span-2">
                <input className={inputCls} type="number" placeholder="0.00"
                  value={item.unitPrice} onChange={(e) => updateLineItem(item.id, "unitPrice", e.target.value)} />
              </div>
              <div className="col-span-1 flex justify-center">
                {form.lineItems.length > 1 && (
                  <button onClick={() => removeLineItem(item.id)}
                    className="text-red-400 hover:text-red-600 transition">
                    <Icon name="trash" size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="ml-auto max-w-xs space-y-2 border border-gray-200 rounded-xl p-4 bg-gray-50">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span><span className="font-medium text-gray-800">{fmt(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600 gap-3">
          <span className="whitespace-nowrap">Discount (%)</span>
          <div className="flex items-center gap-2">
            <input className={inputCls + " w-20 text-right"} type="number" min="0" max="100"
              placeholder="0" value={form.discount} onChange={(e) => update("discount", e.target.value)} />
            <span className="text-gray-500 font-medium">-{fmt(discountAmt)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600 gap-3">
          <span className="whitespace-nowrap">Tax (%)</span>
          <div className="flex items-center gap-2">
            <input className={inputCls + " w-20 text-right"} type="number" min="0"
              placeholder="0" value={form.taxRate} onChange={(e) => update("taxRate", e.target.value)} />
            <span className="text-gray-500 font-medium">+{fmt(taxAmt)}</span>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
          <span>Total</span><span className="text-green-600 text-lg">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Project Start Date <span className="text-red-400 normal-case">*</span></label>
          <input className={inputCls} type="date" value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Project End Date <span className="text-red-400 normal-case">*</span></label>
          <input className={inputCls} type="date" value={form.endDate}
            onChange={(e) => update("endDate", e.target.value)} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelCls + " mb-0"}>Project Milestones</label>
          <button onClick={addMilestone}
            className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 transition">
            <Icon name="plus" size={14} /> Add Milestone
          </button>
        </div>
        <div className="space-y-3">
          {form.milestones.map((m, idx) => (
            <div key={m.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-green-400 bg-green-50 text-green-700 text-xs font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <input className={inputCls} placeholder="Milestone title"
                      value={m.title} onChange={(e) => updateMilestone(m.id, "title", e.target.value)} />
                    <input className={inputCls} type="date" value={m.dueDate}
                      onChange={(e) => updateMilestone(m.id, "dueDate", e.target.value)} />
                  </div>
                  <input className={inputCls} placeholder="Brief description..."
                    value={m.description} onChange={(e) => updateMilestone(m.id, "description", e.target.value)} />
                </div>
                {form.milestones.length > 1 && (
                  <button onClick={() => removeMilestone(m.id)}
                    className="text-red-400 hover:text-red-600 transition flex-shrink-0 mt-1">
                    <Icon name="trash" size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-5">
      {/* Header banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-start gap-3">
        <Icon name="sparkle" size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-800">Review before generating</p>
          <p className="text-xs text-green-600 mt-0.5">
            Your AI-powered proposal will be created based on all the details below. Review carefully before submitting.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Client */}
        <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Client Information</p>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-gray-900">{form.clientName || "—"}</p>
            <p className="text-xs text-gray-500">{form.clientEmail}</p>
            {form.clientPhone && <p className="text-xs text-gray-500">{form.clientPhone}</p>}
            {form.clientCompany && <p className="text-xs text-gray-500">{form.clientCompany}</p>}
          </div>
        </div>

        {/* Proposal */}
        <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Proposal Details</p>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-gray-900">{form.proposalTitle || "—"}</p>
            <div className="flex gap-2 flex-wrap">
              {form.businessType && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {form.businessType}
                </span>
              )}
              {form.proposalType && (
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  {form.proposalType}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{form.proposalNumber} · Valid: {form.validUntil || "N/A"}</p>
          </div>
        </div>

        {/* Scope */}
        <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Services ({form.services.filter((s) => s.name).length})
          </p>
          <ul className="space-y-1">
            {form.services.filter((s) => s.name).map((s) => (
              <li key={s.id} className="text-xs text-gray-700 flex items-start gap-2">
                <Icon name="check" size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                {s.name}
              </li>
            ))}
            {!form.services.some((s) => s.name) && <p className="text-xs text-gray-400">No services added</p>}
          </ul>
        </div>

        {/* Pricing */}
        <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pricing Summary</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            {form.discount && (
              <div className="flex justify-between text-xs text-gray-600">
                <span>Discount ({form.discount}%)</span><span>-{fmt(discountAmt)}</span>
              </div>
            )}
            {form.taxRate && (
              <div className="flex justify-between text-xs text-gray-600">
                <span>Tax ({form.taxRate}%)</span><span>+{fmt(taxAmt)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold text-sm">
              <span>Total</span><span className="text-green-600">{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {(form.startDate || form.endDate) && (
        <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Timeline
          </p>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <span className="font-medium">{form.startDate || "TBD"}</span>
            <Icon name="arrow" size={14} className="text-gray-400" />
            <span className="font-medium">{form.endDate || "TBD"}</span>
          </div>
          {form.milestones.some((m) => m.title) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {form.milestones.filter((m) => m.title).map((m) => (
                <span key={m.id} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {m.title} {m.dueDate && `· ${m.dueDate}`}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const steps = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
    6: renderStep6,
  };


  // ── AI Generating Popup ─────────────────────────────
if (generating) {
  return (
    <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 border border-gray-100">

        <div className="text-center">

          <div className="relative mx-auto w-20 h-20 mb-6">

            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "conic-gradient(#16a34a, #4ade80, #16a34a)",
                animation:
                  "spin 2s linear infinite",
              }}
            />

            <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">

              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                }}
              >
                <Zap
                  size={22}
                  className="text-green-500"
                />
              </motion.div>

            </div>
          </div>

          <h4 className="text-[18px] font-black text-gray-900 mb-1.5">
           Wheedle AI is crafting your proposal
          </h4>

          <p className="text-gray-400 text-[13px] mb-7 font-medium">
            Preparing pricing, project scope and generating proposal narrative...
          </p>

          <div className="space-y-2.5 text-left bg-gray-50 rounded-2xl p-4 border border-gray-100">

            {[
              "Analyzing client & project details",
              "Structuring proposal sections",
              "Preparing pricing & calculations",
              "Generating AI proposal narrative",
              "Finalizing professional document",
            ].map((stepText, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  x: -10,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay: i * 0.4,
                }}
                className="flex items-center gap-3 text-[12px] text-gray-500 font-medium"
              >

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay:
                      i * 0.4 + 0.3,
                    type: "spring",
                  }}
                  className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0"
                >
                  <Check
                    size={10}
                    className="text-emerald-600"
                    strokeWidth={2.5}
                  />
                </motion.div>

                {stepText}

              </motion.div>
            ))}

          </div>

        </div>
      </div>
    </div>
  );
}

  // ── Success State ─────────────────────────────────────────────────────────
if (showProposal) {
  return (
    <ViewProposal
      proposalId={generatedProposalId}
      onClose={() =>
        setShowProposal(false)
      }
    />
  );
}

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="check" size={36} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposal Created!</h2>
          <p className="text-gray-500 mb-2">
            <span className="font-semibold text-gray-700">{form.proposalNumber}</span> for{" "}
            <span className="font-semibold text-gray-700">{form.clientName}</span>
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Your AI-powered proposal is being generated. You'll be notified once it's ready to review or send.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSubmitted(false); setCurrentStep(1); }}
              className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              Create Another    
            </button>
            <button
  onClick={() => setShowProposal(true)}
  className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2"
>
  <Icon name="eye" size={15} className="text-white" />
  View Proposal
</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Icon name="file" size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Create Proposal</h1>
              <p className="text-xs text-gray-400">
                Step {currentStep} of {STEPS.length} · {STEPS[currentStep - 1].label}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
            {form.proposalNumber}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-8">

          {/* ── Sidebar Steps ─────────────────────────────────────────────── */}
          <div className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-6">
              <div className="space-y-1">
                {STEPS.map((step) => {
                  const isCompleted = step.id < currentStep;
                  const isActive = step.id === currentStep;
                  return (
                    <button
                      key={step.id}
                      onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition text-sm
                        ${isActive ? "bg-green-50 text-green-700 font-semibold" : ""}
                        ${isCompleted ? "text-gray-600 hover:bg-gray-100 cursor-pointer" : ""}
                        ${!isActive && !isCompleted ? "text-gray-300 cursor-not-allowed" : ""}
                      `}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                        ${isCompleted ? "bg-green-600 text-white" : ""}
                        ${isActive ? "bg-green-600 text-white" : ""}
                        ${!isActive && !isCompleted ? "bg-gray-100 text-gray-300" : ""}
                      `}>
                        {isCompleted ? <Icon name="check" size={12} /> : step.id}
                      </div>
                      <span>{step.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Progress */}
              <div className="mt-6 px-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Progress</span>
                  <span>{Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Total Preview */}
              {subtotal > 0 && (
                <div className="mt-5 px-3 py-3 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs text-green-600 font-medium mb-0.5">Proposal Value</p>
                  <p className="text-lg font-bold text-green-700">{fmt(total)}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Form Panel ────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Mobile Step Indicator */}
            <div className="lg:hidden flex gap-1.5 mb-6">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`h-1.5 rounded-full flex-1 transition-all duration-300
                    ${step.id <= currentStep ? "bg-green-500" : "bg-gray-200"}
                  `}
                />
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
              {/* Step Header */}
              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Icon name={STEPS[currentStep - 1].icon} size={18} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{STEPS[currentStep - 1].label}</h2>
                  <p className="text-xs text-gray-400">Step {currentStep} of {STEPS.length}</p>
                </div>
              </div>

              {/* Step Content */}
              {steps[currentStep]?.()}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setCurrentStep((s) => s - 1)}
                  disabled={currentStep === 1}
                  className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600
                    hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Back
                </button>

                {currentStep < STEPS.length ? (
                  <button
                    onClick={() => setCurrentStep((s) => s + 1)}
                    disabled={!canProceed()}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold
                      hover:bg-green-700 active:scale-95 transition flex items-center gap-2
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue <Icon name="arrow" size={15} className="text-white" />
                  </button>
                ) : (
                  <button
                    onClick={handleGenerate}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold
                      hover:bg-green-700 active:scale-95 transition flex items-center gap-2"
                  >
                    <Icon name="sparkle" size={15} className="text-white" />
                    Generate Proposal
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}