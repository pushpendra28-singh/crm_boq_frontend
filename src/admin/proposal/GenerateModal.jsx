import { useState, useEffect } from "react";
import API_BASE_URL from "../../config/api";
import {
  Zap, Search, Users, ArrowRight, Sparkles, Factory,
  Building2, Home, Check, X, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── Generate Modal ──────────────────────────────────────────────────────────
const ROOF_TYPES = ["RCC Flat", "Sloped Tin", "Sloped Tile", "Industrial Shed", "Other"];
const GRID_TYPES = ["On-Grid", "Off-Grid", "Hybrid"];
const PHASE_TYPES = ["Single Phase", "Three Phase"];
const SHADING = ["None", "Partial", "Heavy"];

const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-gray-400 mt-1 font-medium">{hint}</p>}
  </div>
);

const Input = ({ value, onChange, type = "text", placeholder, min, max, ...rest }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    min={min}
    max={max}
    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
    {...rest}
  />
);

const Select = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-900 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all appearance-none cursor-pointer"
    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
  >
    {options.map((o) => (
      <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
    ))}
  </select>
);

const GenerateModal = ({ mode, onClose, onGenerated }) => {
  const [step, setStep] = useState(1);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pollInterval, setPollInterval] = useState(null);
  const [generatedId, setGeneratedId] = useState(null);

  const [customer, setCustomer] = useState({ name: "", email: "", whatsapp: "", city: "", pincode: "", address: "" });
  const [survey, setSurvey] = useState({
    monthlyBill: "", roofType: "RCC Flat", roofAreaSqFt: "", sanctionedLoad: "",
    gridType: "On-Grid", phase: "Single Phase", existingSolarKW: "0", shadingLevel: "None",
  });

  useEffect(() => {
    if (mode === "lead") fetchLeads();
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [mode]);

  const fetchLeads = async (search = "") => {
    setLeadsLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/proposals/leads/eligible?search=${search}&limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLeads(data.leads || []);
    } catch { setLeads([]); }
    setLeadsLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => { if (mode === "lead") fetchLeads(leadsSearch); }, 300);
    return () => clearTimeout(t);
  }, [leadsSearch]);

  const handleSubmit = async () => {
    if (!survey.monthlyBill || Number(survey.monthlyBill) <= 0) {
      alert("Please enter a valid monthly electricity bill");
      return;
    }

    setGenerating(true);
    setStep(3);

    try {
      const token = localStorage.getItem("adminToken");
      const endpoint = mode === "lead"
        ? `${API_BASE_URL}/proposals/generate-from-lead`
        : `${API_BASE_URL}/proposals/generate-manual`;

      const payload = mode === "lead"
        ? { leadId: selectedLead._id, survey: { ...survey, monthlyBill: Number(survey.monthlyBill), existingSolarKW: Number(survey.existingSolarKW || 0) } }
        : { customer, survey: { ...survey, monthlyBill: Number(survey.monthlyBill), existingSolarKW: Number(survey.existingSolarKW || 0) } };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setGeneratedId(data.proposalId);

      const interval = setInterval(async () => {
        try {
          const r = await fetch(`${API_BASE_URL}/proposals/${data.proposalId}/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const d = await r.json();
          if (d.generationStatus === "completed" || d.generationStatus === "failed") {
            clearInterval(interval);
            setGenerating(false);
            onGenerated();
          }
        } catch { /* ignore poll errors */ }
      }, 2000);
      setPollInterval(interval);

    } catch (err) {
      setGenerating(false);
      setStep(mode === "lead" ? 2 : 2);
      alert(err.message || "Generation failed");
    }
  };

  const getCategoryIcon = (cat) => {
    if (cat === "Commercial") return (
      <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
        <Factory size={11} className="text-amber-500" />
      </div>
    );
    if (cat === "Housing Society") return (
      <div className="w-6 h-6 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
        <Building2 size={11} className="text-violet-500" />
      </div>
    );
    return (
      <div className="w-6 h-6 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center">
        <Home size={11} className="text-sky-500" />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        style={{
          borderRadius: "20px",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        {/* ── Modal Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0"
          style={{ background: "linear-gradient(to bottom, #fafafa, #ffffff)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                boxShadow: "0 2px 8px rgba(22,163,74,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-gray-900">
                {step === 3 ? "Generating Proposal" : mode === "lead" ? "Generate from Lead" : "Manual Proposal"}
              </h3>
              {step < 3 && (
                <p className="text-[11px] text-gray-400 font-medium">
                  {mode === "lead" ? `Step ${step} of 2` : "Fill in customer details"}
                </p>
              )}
            </div>
          </div>
          {step !== 3 && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-all duration-200"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── Modal Body ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP 3: Generating */}
          {step === 3 && (
            <div className="text-center py-6">
              <div className="relative mx-auto w-20 h-20 mb-6">
                {/* Outer ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "conic-gradient(#16a34a, #4ade80, #16a34a)",
                    animation: "spin 2s linear infinite",
                  }}
                />
                <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  >
                    <Zap size={22} className="text-green-500" />
                  </motion.div>
                </div>
              </div>

              <h4 className="text-[17px] font-black text-gray-900 mb-1.5">AI is crafting your proposal</h4>
              <p className="text-gray-400 text-[13px] mb-7 font-medium">Calculating system size, savings, and generating narrative...</p>

              <div className="space-y-2.5 text-left bg-gray-50 rounded-2xl p-4 border border-gray-100">
                {[
                  "Analyzing monthly electricity bill",
                  "Calculating optimal solar system size",
                  "Computing financial projections & ROI",
                  "Generating AI-powered proposal narrative",
                  "Finalizing itemized cost breakdown",
                ].map((stepText, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.4 }}
                    className="flex items-center gap-3 text-[12px] text-gray-500 font-medium"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.4 + 0.3, type: "spring" }}
                      className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0"
                    >
                      <Check size={10} className="text-emerald-600" strokeWidth={2.5} />
                    </motion.div>
                    {stepText}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1 (lead mode): Select Lead */}
          {step === 1 && mode === "lead" && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={leadsSearch}
                  onChange={(e) => setLeadsSearch(e.target.value)}
                  placeholder="Search leads by name or phone..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                  style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                />
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                {leadsLoading ? (
                  <div className="text-center py-10 text-gray-400">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Loader2 size={18} className="animate-spin text-green-500" />
                    </div>
                    <p className="text-[12px] font-medium">Loading eligible leads...</p>
                  </div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Users size={18} className="text-gray-400" />
                    </div>
                    <p className="text-[12px] font-medium">No eligible leads found</p>
                    <p className="text-[11px] mt-1 text-gray-400">Leads must have status: Pending, Connected, or In Progress</p>
                  </div>
                ) : (
                  leads.map((lead) => (
                    <button
                      key={lead._id}
                      onClick={() => {
                        setSelectedLead(lead);
                        const bill = lead.bill || lead.monthlyBill || lead.commercialBill || "";
                        setSurvey((s) => ({ ...s, monthlyBill: bill }));
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200
                        ${selectedLead?._id === lead._id
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                        }`}
                      style={{ boxShadow: selectedLead?._id === lead._id ? "0 0 0 3px rgba(22,163,74,0.1)" : "0 1px 2px rgba(0,0,0,0.04)" }}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black flex-shrink-0 transition-all ${
                          selectedLead?._id === lead._id
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {lead.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-gray-900 truncate">{lead.name}</p>
                        <p className="text-[11px] text-gray-400 font-medium">{lead.whatsapp} · {lead.category}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getCategoryIcon(lead.category)}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          lead.status === "Connected"   ? "bg-sky-50 text-sky-700 border-sky-200" :
                          lead.status === "In Progress" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                          "bg-gray-100 text-gray-500 border-gray-200"
                        }`}>{lead.status}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {selectedLead && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2"
                  style={{ boxShadow: "0 1px 4px rgba(22,163,74,0.1)" }}
                >
                  <div className="w-5 h-5 rounded-full bg-green-200 border border-green-300 flex items-center justify-center flex-shrink-0">
                    <Check size={10} className="text-green-700" strokeWidth={2.5} />
                  </div>
                  <p className="text-[12px] text-green-700 font-semibold">
                    Selected: <span className="font-black">{selectedLead.name}</span>
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* STEP 1 (manual mode): Customer Details */}
          {step === 1 && mode === "manual" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full Name" required>
                  <Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Rajesh Kumar" />
                </Field>
                <Field label="WhatsApp">
                  <Input value={customer.whatsapp} onChange={(e) => setCustomer({ ...customer, whatsapp: e.target.value })} placeholder="9876543210" />
                </Field>
              </div>
              <Field label="Email">
                <Input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="rajesh@example.com" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <Input value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} placeholder="Noida" />
                </Field>
                <Field label="Pincode">
                  <Input value={customer.pincode} onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })} placeholder="201301" />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 2: Survey Data */}
          {step === 2 && (
            <div className="space-y-4">
              {selectedLead && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-xl"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  <div className="w-9 h-9 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center text-[12px] font-black text-green-700 flex-shrink-0">
                    {selectedLead.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">{selectedLead.name}</p>
                    <p className="text-[11px] text-gray-400 font-medium">{selectedLead.whatsapp} · {selectedLead.category}</p>
                  </div>
                </motion.div>
              )}

              <Field label="Monthly Electricity Bill (₹)" required hint="Average monthly bill from last 3 months">
                <Input type="number" min="500" max="500000" value={survey.monthlyBill}
                  onChange={(e) => setSurvey({ ...survey, monthlyBill: e.target.value })} placeholder="5000" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Roof Type">
                  <Select value={survey.roofType} onChange={(e) => setSurvey({ ...survey, roofType: e.target.value })} options={ROOF_TYPES} />
                </Field>
                <Field label="Grid Type">
                  <Select value={survey.gridType} onChange={(e) => setSurvey({ ...survey, gridType: e.target.value })} options={GRID_TYPES} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Phase">
                  <Select value={survey.phase} onChange={(e) => setSurvey({ ...survey, phase: e.target.value })} options={PHASE_TYPES} />
                </Field>
                <Field label="Shading Level">
                  <Select value={survey.shadingLevel} onChange={(e) => setSurvey({ ...survey, shadingLevel: e.target.value })} options={SHADING} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Roof Area (sq.ft)" hint="Optional">
                  <Input type="number" value={survey.roofAreaSqFt} onChange={(e) => setSurvey({ ...survey, roofAreaSqFt: e.target.value })} placeholder="500" />
                </Field>
                <Field label="Existing Solar (kW)" hint="Enter 0 if none">
                  <Input type="number" min="0" value={survey.existingSolarKW} onChange={(e) => setSurvey({ ...survey, existingSolarKW: e.target.value })} placeholder="0" />
                </Field>
              </div>

              <Field label="Sanctioned Load (kW)" hint="From electricity bill">
                <Input type="number" value={survey.sanctionedLoad} onChange={(e) => setSurvey({ ...survey, sanctionedLoad: e.target.value })} placeholder="5" />
              </Field>
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        {step !== 3 && (
          <div
            className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0"
            style={{ background: "linear-gradient(to top, #fafafa, #ffffff)" }}
          >
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-[13px] font-semibold hover:border-gray-300 hover:shadow-sm transition-all"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => {
                if (mode === "lead" && step === 1) {
                  if (!selectedLead) { alert("Please select a lead"); return; }
                  setStep(2);
                } else if (mode === "manual" && step === 1) {
                  if (!customer.name) { alert("Please enter customer name"); return; }
                  setStep(2);
                } else {
                  handleSubmit();
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all hover:opacity-90 hover:-translate-y-px"
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                boxShadow: "0 2px 10px rgba(22,163,74,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              {step === 2 ? (
                <><Sparkles size={14} /> Generate with AI</>
              ) : (
                <>Continue <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default GenerateModal;




// import { useState, useEffect } from "react";
// import API_BASE_URL from "../../config/api";
// import {
//   Zap, Search, Users, ArrowRight, Sparkles, Factory,
//   Building2, Home, Check, X, Loader2,
// } from "lucide-react";
// import { motion } from "framer-motion";

// // ─── Generate Modal ──────────────────────────────────────────────────────────
// const ROOF_TYPES = ["RCC Flat", "Sloped Tin", "Sloped Tile", "Industrial Shed", "Other"];
// const GRID_TYPES = ["On-Grid", "Off-Grid", "Hybrid"];
// const PHASE_TYPES = ["Single Phase", "Three Phase"];
// const SHADING = ["None", "Partial", "Heavy"];

// const Field = ({ label, required, children, hint }) => (
//   <div>
//     <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
//       {label} {required && <span className="text-red-400">*</span>}
//     </label>
//     {children}
//     {hint && <p className="text-[10px] text-slate-600 mt-1">{hint}</p>}
//   </div>
// );

// const Input = ({ value, onChange, type = "text", placeholder, min, max, ...rest }) => (
//   <input
//     type={type}
//     value={value}
//     onChange={onChange}
//     placeholder={placeholder}
//     min={min}
//     max={max}
//     className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition"
//     {...rest}
//   />
// );

// const Select = ({ value, onChange, options }) => (
//   <select
//     value={value}
//     onChange={onChange}
//     className="w-full bg-[#0f0f24] border border-white/8 rounded-xl px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-indigo-500/50 transition appearance-none"
//   >
//     {options.map((o) => (
//       <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
//     ))}
//   </select>
// );

// const GenerateModal = ({ mode, onClose, onGenerated }) => {
//   const [step, setStep] = useState(1); // 1: lead select (if mode=lead), 2: survey, 3: generating
//   const [leads, setLeads] = useState([]);
//   const [selectedLead, setSelectedLead] = useState(null);
//   const [leadsLoading, setLeadsLoading] = useState(false);
//   const [leadsSearch, setLeadsSearch] = useState("");
//   const [generating, setGenerating] = useState(false);
//   const [pollInterval, setPollInterval] = useState(null);
//   const [generatedId, setGeneratedId] = useState(null);

//   const [customer, setCustomer] = useState({ name: "", email: "", whatsapp: "", city: "", pincode: "", address: "" });
//   const [survey, setSurvey] = useState({
//     monthlyBill: "", roofType: "RCC Flat", roofAreaSqFt: "", sanctionedLoad: "",
//     gridType: "On-Grid", phase: "Single Phase", existingSolarKW: "0", shadingLevel: "None",
//   });

//   useEffect(() => {
//     if (mode === "lead") fetchLeads();
//     return () => { if (pollInterval) clearInterval(pollInterval); };
//   }, [mode]);

//   const fetchLeads = async (search = "") => {
//     setLeadsLoading(true);
//     try {
//       const token = localStorage.getItem("adminToken");
//       const res = await fetch(`${API_BASE_URL}/proposals/leads/eligible?search=${search}&limit=30`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       setLeads(data.leads || []);
//     } catch { setLeads([]); }
//     setLeadsLoading(false);
//   };

//   useEffect(() => {
//     const t = setTimeout(() => { if (mode === "lead") fetchLeads(leadsSearch); }, 300);
//     return () => clearTimeout(t);
//   }, [leadsSearch]);

//   const handleSubmit = async () => {
//     if (!survey.monthlyBill || Number(survey.monthlyBill) <= 0) {
//       alert("Please enter a valid monthly electricity bill");
//       return;
//     }

//     setGenerating(true);
//     setStep(3);

//     try {
//       const token = localStorage.getItem("adminToken");
//       const endpoint = mode === "lead"
//         ? `${API_BASE_URL}/proposals/generate-from-lead`
//         : `${API_BASE_URL}/proposals/generate-manual`;

//       const payload = mode === "lead"
//         ? { leadId: selectedLead._id, survey: { ...survey, monthlyBill: Number(survey.monthlyBill), existingSolarKW: Number(survey.existingSolarKW || 0) } }
//         : { customer, survey: { ...survey, monthlyBill: Number(survey.monthlyBill), existingSolarKW: Number(survey.existingSolarKW || 0) } };

//       const res = await fetch(endpoint, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();

//       if (!res.ok) throw new Error(data.message);

//       setGeneratedId(data.proposalId);

//       // Poll for completion
//       const interval = setInterval(async () => {
//         try {
//           const r = await fetch(`${API_BASE_URL}/proposals/${data.proposalId}/status`, {
//             headers: { Authorization: `Bearer ${token}` },
//           });
//           const d = await r.json();
//           if (d.generationStatus === "completed" || d.generationStatus === "failed") {
//             clearInterval(interval);
//             setGenerating(false);
//             onGenerated();
//           }
//         } catch { /* ignore poll errors */ }
//       }, 2000);
//       setPollInterval(interval);

//     } catch (err) {
//       setGenerating(false);
//       setStep(mode === "lead" ? 2 : 2);
//       alert(err.message || "Generation failed");
//     }
//   };

//   const getCategoryIcon = (cat) => {
//     if (cat === "Commercial") return <Factory size={14} className="text-amber-400" />;
//     if (cat === "Housing Society") return <Building2 size={14} className="text-violet-400" />;
//     return <Home size={14} className="text-blue-400" />;
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
//       onClick={(e) => e.target === e.currentTarget && onClose()}
//     >
//       <motion.div
//         initial={{ scale: 0.95, opacity: 0 }}
//         animate={{ scale: 1, opacity: 1 }}
//         exit={{ scale: 0.95, opacity: 0 }}
//         className="bg-[#0f0f24] border border-white/8 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
//       >
//         {/* Modal Header */}
//         <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
//               <Sparkles size={15} className="text-white" />
//             </div>
//             <div>
//               <h3 className="text-[15px] font-bold text-white">
//                 {step === 3 ? "Generating Proposal" : mode === "lead" ? "Generate from Lead" : "Manual Proposal"}
//               </h3>
//               {step < 3 && (
//                 <p className="text-[11px] text-slate-500">
//                   {mode === "lead" ? `Step ${step} of 2` : "Fill in customer details"}
//                 </p>
//               )}
//             </div>
//           </div>
//           {step !== 3 && (
//             <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition">
//               <X size={16} />
//             </button>
//           )}
//         </div>

//         {/* Modal Body */}
//         <div className="flex-1 overflow-y-auto p-6">
//           {/* STEP 3: Generating */}
//           {step === 3 && (
//             <div className="text-center py-8">
//               <motion.div
//                 animate={{ rotate: 360 }}
//                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
//                 className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6"
//               >
//                 <Zap size={24} className="text-white" />
//               </motion.div>
//               <h4 className="text-[16px] font-bold text-white mb-2">AI is crafting your proposal</h4>
//               <p className="text-slate-500 text-[13px] mb-6">Calculating system size, savings, and generating narrative...</p>
//               <div className="space-y-2 text-left">
//                 {[
//                   "Analyzing monthly electricity bill",
//                   "Calculating optimal solar system size",
//                   "Computing financial projections & ROI",
//                   "Generating AI-powered proposal narrative",
//                   "Finalizing itemized cost breakdown",
//                 ].map((step, i) => (
//                   <motion.div
//                     key={i}
//                     initial={{ opacity: 0, x: -10 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: i * 0.4 }}
//                     className="flex items-center gap-3 text-[12px] text-slate-400"
//                   >
//                     <motion.div
//                       initial={{ scale: 0 }}
//                       animate={{ scale: 1 }}
//                       transition={{ delay: i * 0.4 + 0.3 }}
//                     >
//                       <Check size={14} className="text-emerald-400" />
//                     </motion.div>
//                     {step}
//                   </motion.div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* STEP 1 (lead mode): Select Lead */}
//           {step === 1 && mode === "lead" && (
//             <div className="space-y-4">
//               <div className="relative">
//                 <Search size={14} className="absolute left-3 top-3 text-slate-500" />
//                 <input
//                   type="text"
//                   value={leadsSearch}
//                   onChange={(e) => setLeadsSearch(e.target.value)}
//                   placeholder="Search leads by name or phone..."
//                   className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition"
//                 />
//               </div>

//               <div className="space-y-1 max-h-72 overflow-y-auto">
//                 {leadsLoading ? (
//                   <div className="text-center py-8 text-slate-500">
//                     <Loader2 size={20} className="animate-spin mx-auto mb-2" />
//                     <p className="text-[12px]">Loading eligible leads...</p>
//                   </div>
//                 ) : leads.length === 0 ? (
//                   <div className="text-center py-8 text-slate-500">
//                     <Users size={24} className="mx-auto mb-2 opacity-40" />
//                     <p className="text-[12px]">No eligible leads found</p>
//                     <p className="text-[11px] mt-1">Leads must have status: Pending, Connected, or In Progress</p>
//                   </div>
//                 ) : (
//                   leads.map((lead) => (
//                     <button
//                       key={lead._id}
//                       onClick={() => {
//                         setSelectedLead(lead);
//                         // Pre-fill bill from lead data
//                         const bill = lead.bill || lead.monthlyBill || lead.commercialBill || "";
//                         setSurvey((s) => ({ ...s, monthlyBill: bill }));
//                       }}
//                       className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition
//                         ${selectedLead?._id === lead._id
//                           ? "border-indigo-500/50 bg-indigo-500/10"
//                           : "border-white/5 bg-white/3 hover:bg-white/6 hover:border-white/10"
//                         }`}
//                     >
//                       <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
//                         {lead.name[0].toUpperCase()}
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="text-[13px] font-semibold text-white truncate">{lead.name}</p>
//                         <p className="text-[11px] text-slate-500">{lead.whatsapp} · {lead.category}</p>
//                       </div>
//                       <div className="flex items-center gap-2 flex-shrink-0">
//                         {getCategoryIcon(lead.category)}
//                         <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
//                           lead.status === "Connected" ? "bg-blue-500/15 text-blue-400" :
//                           lead.status === "In Progress" ? "bg-amber-500/15 text-amber-400" :
//                           "bg-slate-500/15 text-slate-400"
//                         }`}>{lead.status}</span>
//                       </div>
//                     </button>
//                   ))
//                 )}
//               </div>

//               {selectedLead && (
//                 <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
//                   <Check size={14} className="text-indigo-400 flex-shrink-0" />
//                   <p className="text-[12px] text-indigo-300">Selected: <span className="font-semibold">{selectedLead.name}</span></p>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* STEP 1 (manual mode): Customer Details */}
//           {step === 1 && mode === "manual" && (
//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-3">
//                 <Field label="Full Name" required>
//                   <Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Rajesh Kumar" />
//                 </Field>
//                 <Field label="WhatsApp">
//                   <Input value={customer.whatsapp} onChange={(e) => setCustomer({ ...customer, whatsapp: e.target.value })} placeholder="9876543210" />
//                 </Field>
//               </div>
//               <Field label="Email">
//                 <Input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="rajesh@example.com" />
//               </Field>
//               <div className="grid grid-cols-2 gap-3">
//                 <Field label="City">
//                   <Input value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} placeholder="Noida" />
//                 </Field>
//                 <Field label="Pincode">
//                   <Input value={customer.pincode} onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })} placeholder="201301" />
//                 </Field>
//               </div>
//             </div>
//           )}

//           {/* STEP 2: Survey Data */}
//           {step === 2 && (
//             <div className="space-y-4">
//               {selectedLead && (
//                 <div className="flex items-center gap-3 p-3 bg-white/3 border border-white/5 rounded-xl">
//                   <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">
//                     {selectedLead.name[0].toUpperCase()}
//                   </div>
//                   <div>
//                     <p className="text-[13px] font-semibold text-white">{selectedLead.name}</p>
//                     <p className="text-[11px] text-slate-500">{selectedLead.whatsapp} · {selectedLead.category}</p>
//                   </div>
//                 </div>
//               )}

//               <Field label="Monthly Electricity Bill (₹)" required hint="Average monthly bill from last 3 months">
//                 <Input type="number" min="500" max="500000" value={survey.monthlyBill}
//                   onChange={(e) => setSurvey({ ...survey, monthlyBill: e.target.value })} placeholder="5000" />
//               </Field>

//               <div className="grid grid-cols-2 gap-3">
//                 <Field label="Roof Type">
//                   <Select value={survey.roofType} onChange={(e) => setSurvey({ ...survey, roofType: e.target.value })} options={ROOF_TYPES} />
//                 </Field>
//                 <Field label="Grid Type">
//                   <Select value={survey.gridType} onChange={(e) => setSurvey({ ...survey, gridType: e.target.value })} options={GRID_TYPES} />
//                 </Field>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <Field label="Phase">
//                   <Select value={survey.phase} onChange={(e) => setSurvey({ ...survey, phase: e.target.value })} options={PHASE_TYPES} />
//                 </Field>
//                 <Field label="Shading Level">
//                   <Select value={survey.shadingLevel} onChange={(e) => setSurvey({ ...survey, shadingLevel: e.target.value })} options={SHADING} />
//                 </Field>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <Field label="Roof Area (sq.ft)" hint="Optional">
//                   <Input type="number" value={survey.roofAreaSqFt} onChange={(e) => setSurvey({ ...survey, roofAreaSqFt: e.target.value })} placeholder="500" />
//                 </Field>
//                 <Field label="Existing Solar (kW)" hint="Enter 0 if none">
//                   <Input type="number" min="0" value={survey.existingSolarKW} onChange={(e) => setSurvey({ ...survey, existingSolarKW: e.target.value })} placeholder="0" />
//                 </Field>
//               </div>

//               <Field label="Sanctioned Load (kW)" hint="From electricity bill">
//                 <Input type="number" value={survey.sanctionedLoad} onChange={(e) => setSurvey({ ...survey, sanctionedLoad: e.target.value })} placeholder="5" />
//               </Field>
//             </div>
//           )}
//         </div>

//         {/* Modal Footer */}
//         {step !== 3 && (
//           <div className="px-6 py-4 border-t border-white/5 flex gap-3">
//             {step === 2 && (
//               <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[13px] font-medium transition">
//                 ← Back
//               </button>
//             )}
//             <button
//               onClick={() => {
//                 if (mode === "lead" && step === 1) {
//                   if (!selectedLead) { alert("Please select a lead"); return; }
//                   setStep(2);
//                 } else if (mode === "manual" && step === 1) {
//                   if (!customer.name) { alert("Please enter customer name"); return; }
//                   setStep(2);
//                 } else {
//                   handleSubmit();
//                 }
//               }}
//               className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-semibold hover:opacity-90 transition"
//             >
//               {step === 2 ? (
//                 <><Sparkles size={14} /> Generate with AI</>
//               ) : (
//                 <>Continue <ArrowRight size={14} /></>
//               )}
//             </button>
//           </div>
//         )}
//       </motion.div>
//     </motion.div>
//   );
// };

// export default GenerateModal;