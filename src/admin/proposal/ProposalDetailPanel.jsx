import {
  FileText, Send, Eye, CheckCircle, XCircle, Clock, TrendingUp,
  Sun, IndianRupee, BarChart3, RotateCcw, Layers, Sparkles,
  Leaf, X, Loader2, AlertCircle, Download, ChevronDown, File, FileSpreadsheet,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

// ─── Shared Helpers ──────────────────────────────────────────────────────────
const fmt = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";
const fmtKW = (n) => n ? `${n} kW` : "—";
const fmtYrs = (n) => n ? `${n} yrs` : "—";

// ─── Status Config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:     { label: "Draft",     color: "text-slate-500",   bg: "bg-slate-100",      border: "border-slate-200",  icon: FileText },
  generating:{ label: "Generating",color: "text-amber-700",   bg: "bg-amber-50",       border: "border-amber-200",  icon: Loader2 },
  sent:      { label: "Sent",      color: "text-sky-700",     bg: "bg-sky-50",         border: "border-sky-200",    icon: Send },
  opened:    { label: "Opened",    color: "text-violet-700",  bg: "bg-violet-50",      border: "border-violet-200", icon: Eye },
  accepted:  { label: "Accepted",  color: "text-emerald-700", bg: "bg-emerald-50",     border: "border-emerald-200",icon: CheckCircle },
  rejected:  { label: "Rejected",  color: "text-rose-700",    bg: "bg-rose-50",        border: "border-rose-200",   icon: XCircle },
  expired:   { label: "Expired",   color: "text-orange-700",  bg: "bg-orange-50",      border: "border-orange-200", icon: Clock },
  revised:   { label: "Revised",   color: "text-purple-700",  bg: "bg-purple-50",      border: "border-purple-200", icon: RotateCcw },
};

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status, genStatus }) => {
  const isGenerating = genStatus === "generating" || genStatus === "pending";
  if (isGenerating) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Loader2 size={10} className="animate-spin" /> Generating
      </span>
    );
  }
  if (genStatus === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle size={10} /> Failed
      </span>
    );
  }
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
};

// ─── Section Label ───────────────────────────────────────────────────────────
const SectionLabel = ({ children, icon: Icon, iconClass }) => (
  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-3 flex items-center gap-2">
    {Icon && <Icon size={11} className={iconClass || "text-gray-400"} />}
    {children}
  </p>
);

// ─── Info Block ───────────────────────────────────────────────────────────────
const InfoBlock = ({ children, accent }) => {
  const accents = {
    indigo: "bg-indigo-50 border-indigo-100",
    emerald: "bg-emerald-50 border-emerald-100",
    violet: "bg-violet-50 border-violet-100",
    default: "bg-gray-50 border-gray-100",
  };
  return (
    <div className={`rounded-xl p-5 border ${accents[accent] || accents.default}`}>
      {children}
    </div>
  );
};

// ─── Proposal Detail Panel ───────────────────────────────────────────────────
const ProposalDetailPanel = ({ proposal, onClose, onSend, onRegenerate, onStatusChange }) => {
  const p = proposal?.proposal;
  const c = proposal?.customer;
  const s = proposal?.survey;
  const [showDownload, setShowDownload] = useState(false);

  if (!proposal) return null;

  const handleDownload = async (type) => {
    try {
      const response = await fetch(
        `/api/proposals/${proposal._id}/download/${type}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "pdf"
          ? `${c?.name || "proposal"}-proposal.pdf`
          : `${c?.name || "proposal"}-proposal.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setShowDownload(false);
    } catch (err) {
      console.error("Download Error:", err);
      alert("Failed to download proposal");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed inset-y-0 right-0 w-full max-w-2xl z-50 flex flex-col overflow-hidden"
      style={{
        background: "#ffffff",
        borderLeft: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.1), -2px 0 8px rgba(0,0,0,0.05)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0"
        style={{ background: "linear-gradient(to bottom, #fafafa, #ffffff)" }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[15px] font-black text-emerald-700 flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
              border: "1px solid #6ee7b7",
              boxShadow: "0 1px 3px rgba(16,185,129,0.15)",
            }}
          >
            {c?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h3 className="text-[15px] font-black text-gray-900">{c?.name}'s Proposal</h3>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
              Version {proposal.version}
              <span className="mx-1.5 text-gray-300">·</span>
              {new Date(proposal.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <StatusBadge status={proposal.status} genStatus={proposal.generationStatus} />

          {/* Download button */}
          <div className="relative">
            <button
              onClick={() => setShowDownload(!showDownload)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-all duration-200"
              title="Download"
            >
              <Download size={16} />
            </button>
            {showDownload && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-50"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <button
                  onClick={() => handleDownload("pdf")}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-rose-50 text-gray-700 text-[13px] font-medium transition group"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-50 group-hover:bg-rose-100 border border-rose-100 flex items-center justify-center transition">
                    <File size={13} className="text-rose-500" />
                  </div>
                  Download PDF
                </button>
                <div className="h-px bg-gray-100 mx-3" />
                <button
                  onClick={() => handleDownload("docx")}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-sky-50 text-gray-700 text-[13px] font-medium transition group"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-50 group-hover:bg-sky-100 border border-sky-100 flex items-center justify-center transition">
                    <FileSpreadsheet size={13} className="text-sky-500" />
                  </div>
                  Download DOCX
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50/40">
        {/* Generation in progress */}
        {proposal.generationStatus !== "completed" && (
          <div className="m-6 p-8 bg-amber-50 border border-amber-100 rounded-2xl text-center"
            style={{ boxShadow: "0 2px 12px rgba(245,158,11,0.08)" }}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <Loader2 size={24} className="text-amber-500 animate-spin" />
            </div>
            <p className="text-amber-700 font-bold text-[15px]">
              {proposal.generationStatus === "failed" ? "Generation Failed" : "AI is crafting your proposal..."}
            </p>
            <p className="text-amber-600/70 text-[12px] mt-1.5 font-medium">
              {proposal.generationStatus === "failed"
                ? proposal.generationError || "Unknown error occurred"
                : "This usually takes 10–30 seconds"}
            </p>
          </div>
        )}

        {proposal.generationStatus === "completed" && p && (
          <div className="p-6 space-y-6">

            {/* ── System Overview Cards ── */}
            <div>
              <SectionLabel icon={Sun} iconClass="text-amber-500">System Overview</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "System Size",      value: fmtKW(p.systemSizeKW),           icon: Sun,         iconBg: "bg-amber-50",   iconColor: "text-amber-500",   border: "border-amber-100",   val: "text-amber-600" },
                  { label: "Panel Count",      value: `${p.panelCount} × ${p.panelWattage}Wp`, icon: Layers,  iconBg: "bg-sky-50",     iconColor: "text-sky-500",     border: "border-sky-100",     val: "text-sky-600" },
                  { label: "Monthly Savings",  value: fmt(p.monthlyEnergySavings),      icon: IndianRupee, iconBg: "bg-emerald-50", iconColor: "text-emerald-500", border: "border-emerald-100", val: "text-emerald-600" },
                  { label: "Payback Period",   value: fmtYrs(p.paybackYears),           icon: TrendingUp,  iconBg: "bg-indigo-50",  iconColor: "text-indigo-500",  border: "border-indigo-100",  val: "text-indigo-600" },
                  { label: "Net Investment",   value: fmt(p.netCost),                   icon: IndianRupee, iconBg: "bg-violet-50",  iconColor: "text-violet-500",  border: "border-violet-100",  val: "text-violet-600" },
                  { label: "25-Year Savings",  value: fmt(p.roi25Years),                icon: BarChart3,   iconBg: "bg-cyan-50",    iconColor: "text-cyan-500",    border: "border-cyan-100",    val: "text-cyan-600" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-xl p-3.5 border border-gray-100 hover:border-gray-200 hover:-translate-y-px transition-all duration-200 group"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-lg ${item.iconBg} border ${item.border} flex items-center justify-center`}>
                        <item.icon size={11} className={item.iconColor} strokeWidth={2} />
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.label}</p>
                    </div>
                    <p className={`text-[16px] font-black ${item.val}`}>{item.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── Executive Summary ── */}
            {p.executiveSummary && (
              <div>
                <SectionLabel icon={Sparkles} iconClass="text-indigo-400">Executive Summary</SectionLabel>
                <InfoBlock accent="indigo">
                  <p className="text-[13px] text-gray-700 leading-7 whitespace-pre-line">{p.executiveSummary}</p>
                </InfoBlock>
              </div>
            )}

            {/* ── System Description ── */}
            {p.systemDescription && (
              <div>
                <SectionLabel>System Description</SectionLabel>
                <InfoBlock>
                  <p className="text-[13px] text-gray-700 leading-7 whitespace-pre-line">{p.systemDescription}</p>
                </InfoBlock>
              </div>
            )}

            {/* ── Financial Highlights ── */}
            {p.financialHighlights && (
              <div>
                <SectionLabel>Financial Highlights</SectionLabel>
                <InfoBlock accent="emerald">
                  <p className="text-[13px] text-gray-700 leading-7 whitespace-pre-line">{p.financialHighlights}</p>
                </InfoBlock>
              </div>
            )}

            {/* ── Installation Process ── */}
            {p.installationProcess && (
              <div>
                <SectionLabel>Installation Process</SectionLabel>
                <InfoBlock>
                  <p className="text-[13px] text-gray-700 leading-7 whitespace-pre-line">{p.installationProcess}</p>
                </InfoBlock>
              </div>
            )}

            {/* ── Maintenance Support ── */}
            {p.maintenanceSupport && (
              <div>
                <SectionLabel>Maintenance & Support</SectionLabel>
                <InfoBlock>
                  <p className="text-[13px] text-gray-700 leading-7 whitespace-pre-line">{p.maintenanceSupport}</p>
                </InfoBlock>
              </div>
            )}

            {/* ── Why Choose Us ── */}
            {p.whyChooseUs && (
              <div>
                <SectionLabel>Why Choose Us</SectionLabel>
                <InfoBlock accent="violet">
                  <p className="text-[13px] text-gray-700 leading-7 whitespace-pre-line">{p.whyChooseUs}</p>
                </InfoBlock>
              </div>
            )}

            {/* ── Financial Breakdown ── */}
            <div>
              <SectionLabel icon={IndianRupee} iconClass="text-emerald-500">Financial Breakdown</SectionLabel>
              <div
                className="bg-white rounded-xl overflow-hidden border border-gray-100"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              >
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                  <span className="text-[12px] text-gray-500 font-medium">Gross Installation Cost</span>
                  <span className="text-[13px] font-bold text-gray-900">{fmt(p.installationCost)}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-emerald-50/60">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 text-[9px] font-black">−</span>
                    <span className="text-[12px] text-emerald-700 font-semibold">Govt. Subsidy ({p.subsidyScheme})</span>
                  </div>
                  <span className="text-[13px] font-bold text-emerald-600">− {fmt(p.subsidyAmount)}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3.5 bg-gray-50">
                  <span className="text-[13px] font-black text-gray-900">Net Investment</span>
                  <span
                    className="text-[15px] font-black text-emerald-600 tabular-nums"
                  >{fmt(p.netCost)}</span>
                </div>
              </div>
            </div>

            {/* ── Cost Breakdown ── */}
            {p.costBreakdown?.length > 0 && (
              <div>
                <SectionLabel>Itemized Breakdown</SectionLabel>
                <div
                  className="bg-white rounded-xl overflow-hidden border border-gray-100"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                >
                  {p.costBreakdown.map((item, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center px-4 py-3 hover:bg-gray-50/80 transition-colors ${i < p.costBreakdown.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <div>
                        <p className="text-[12px] text-gray-700 font-medium">{item.item}</p>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-gray-400 mt-0.5">{item.quantity} × {fmt(item.unitCost)}</p>
                        )}
                      </div>
                      <span className="text-[12px] font-bold text-gray-900">{fmt(item.totalCost)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── EMI Options ── */}
            {p.emiOptions?.length > 0 && (
              <div>
                <SectionLabel icon={BarChart3} iconClass="text-indigo-400">Financing Options (EMI)</SectionLabel>
                <div className="grid grid-cols-3 gap-3">
                  {p.emiOptions.map((emi, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      className="bg-white rounded-xl p-4 text-center border border-indigo-100 hover:border-indigo-200 hover:-translate-y-px transition-all duration-200"
                      style={{ boxShadow: "0 1px 4px rgba(99,102,241,0.08)" }}
                    >
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">{emi.tenure} months</p>
                      <p className="text-[17px] font-black text-indigo-600 tabular-nums">{fmt(emi.emi)}</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">per month</p>
                      <div className="mt-2 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 inline-block">
                        <p className="text-[10px] text-indigo-500 font-bold">@ {emi.interestRate}%</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Environmental ── */}
            <div
              className="flex items-center gap-4 rounded-xl p-4 border border-emerald-100"
              style={{
                background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                boxShadow: "0 2px 8px rgba(16,185,129,0.08)",
              }}
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                <Leaf size={18} className="text-emerald-600" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-emerald-700">
                  CO₂ Offset: {p.co2OffsetTonsPerYear} tonnes / year
                </p>
                <p className="text-[11px] text-emerald-600/70 mt-0.5 font-medium">
                  Equivalent to planting {Math.round(p.co2OffsetTonsPerYear * 45)} trees annually
                </p>
              </div>
            </div>

            {/* ── Customer Info ── */}
            <div>
              <SectionLabel>Customer</SectionLabel>
              <div
                className="bg-white rounded-xl p-4 border border-gray-100"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              >
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black text-emerald-700 flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", border: "1px solid #6ee7b7" }}
                  >
                    {c?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <p className="text-[14px] font-black text-gray-900">{c?.name}</p>
                </div>
                <div className="space-y-1.5">
                  {c?.whatsapp && (
                    <p className="text-[12px] text-gray-500 font-medium flex items-center gap-2">
                      <span className="text-[14px]">📱</span> {c.whatsapp}
                    </p>
                  )}
                  {c?.email && (
                    <p className="text-[12px] text-gray-500 font-medium flex items-center gap-2">
                      <span className="text-[14px]">✉️</span> {c.email}
                    </p>
                  )}
                  {c?.city && (
                    <p className="text-[12px] text-gray-500 font-medium flex items-center gap-2">
                      <span className="text-[14px]">📍</span> {c.city}{c.pincode ? ` − ${c.pincode}` : ""}
                    </p>
                  )}
                  <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                    {[
                      { label: "Monthly Bill", value: fmt(s?.monthlyBill) },
                      { label: "Roof",          value: s?.roofType },
                      { label: "Grid",          value: s?.gridType },
                    ].filter(d => d.value).map((d) => (
                      <span key={d.label} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-[11px] text-gray-600 font-semibold">
                        <span className="text-gray-400 font-normal">{d.label}:</span> {d.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Actions Footer ── */}
      {proposal.generationStatus === "completed" && (
        <div
          className="px-6 py-4 border-t border-gray-100 flex gap-2 flex-wrap flex-shrink-0"
          style={{ background: "linear-gradient(to top, #fafafa, #ffffff)" }}
        >
          {proposal.status === "draft" && (
            <button
              onClick={() => onSend(proposal._id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all hover:opacity-90 hover:-translate-y-px"
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                boxShadow: "0 2px 10px rgba(22,163,74,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              <Send size={14} /> Send to Customer
            </button>
          )}
          <button
            onClick={() => onRegenerate(proposal._id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-[13px] font-semibold hover:border-gray-300 hover:shadow-sm transition-all"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
          >
            <RotateCcw size={14} className="text-gray-500" /> Regenerate
          </button>
          {["sent", "opened"].includes(proposal.status) && (
            <button
              onClick={() => onStatusChange(proposal._id, "accepted")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] font-semibold hover:bg-emerald-100 transition-all"
            >
              <CheckCircle size={14} /> Mark Accepted
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ProposalDetailPanel;




// import {
//   FileText, Send, Eye, CheckCircle, XCircle, Clock, TrendingUp,
//   Sun, IndianRupee, BarChart3, RotateCcw, Layers, Sparkles,
//   Leaf, X, Loader2, AlertCircle,Download,ChevronDown,File,FileSpreadsheet,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import { useState } from "react";

// // ─── Shared Helpers ──────────────────────────────────────────────────────────
// const fmt = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";
// const fmtKW = (n) => n ? `${n} kW` : "—";
// const fmtYrs = (n) => n ? `${n} yrs` : "—";

// // ─── Status Config ───────────────────────────────────────────────────────────
// const STATUS_CONFIG = {
//   draft:     { label: "Draft",     color: "text-slate-400",   bg: "bg-slate-500/15",  icon: FileText },
//   generating:{ label: "Generating",color: "text-amber-400",   bg: "bg-amber-500/15",  icon: Loader2 },
//   sent:      { label: "Sent",      color: "text-blue-400",    bg: "bg-blue-500/15",   icon: Send },
//   opened:    { label: "Opened",    color: "text-indigo-400",  bg: "bg-indigo-500/15", icon: Eye },
//   accepted:  { label: "Accepted",  color: "text-emerald-400", bg: "bg-emerald-500/15",icon: CheckCircle },
//   rejected:  { label: "Rejected",  color: "text-red-400",     bg: "bg-red-500/15",    icon: XCircle },
//   expired:   { label: "Expired",   color: "text-orange-400",  bg: "bg-orange-500/15", icon: Clock },
//   revised:   { label: "Revised",   color: "text-violet-400",  bg: "bg-violet-500/15", icon: RotateCcw },
// };

// // ─── Status Badge ────────────────────────────────────────────────────────────
// const StatusBadge = ({ status, genStatus }) => {
//   const isGenerating = genStatus === "generating" || genStatus === "pending";
//   if (isGenerating) {
//     return (
//       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400">
//         <Loader2 size={10} className="animate-spin" /> Generating
//       </span>
//     );
//   }
//   if (genStatus === "failed") {
//     return (
//       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400">
//         <AlertCircle size={10} /> Failed
//       </span>
//     );
//   }
//   const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
//   const Icon = cfg.icon;
//   return (
//     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
//       <Icon size={10} /> {cfg.label}
//     </span>
//   );
// };

// // ─── Proposal Detail Panel ───────────────────────────────────────────────────
// const ProposalDetailPanel = ({ proposal, onClose, onSend, onRegenerate, onStatusChange }) => {
//   const p = proposal?.proposal;
//   const c = proposal?.customer;
//   const s = proposal?.survey;
//   const [showDownload, setShowDownload] = useState(false);

//   if (!proposal) return null;

//   const handleDownload = async (type) => {
//   try {
//     const response = await fetch(
//       `/api/proposals/${proposal._id}/download/${type}`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       }
//     );

//     if (!response.ok) {
//       throw new Error("Download failed");
//     }

//     const blob = await response.blob();

//     const url = window.URL.createObjectURL(blob);

//     const a = document.createElement("a");

//     a.href = url;

//     a.download =
//       type === "pdf"
//         ? `${c?.name || "proposal"}-proposal.pdf`
//         : `${c?.name || "proposal"}-proposal.docx`;

//     document.body.appendChild(a);

//     a.click();

//     a.remove();

//     window.URL.revokeObjectURL(url);

//     setShowDownload(false);
//   } catch (err) {
//     console.error("Download Error:", err);
//     alert("Failed to download proposal");
//   }
// };

//   return (
//     <motion.div
//       initial={{ opacity: 0, x: 40 }}
//       animate={{ opacity: 1, x: 0 }}
//       exit={{ opacity: 0, x: 40 }}
//       className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[#0f0f24] border-l border-white/5 z-50 flex flex-col overflow-hidden shadow-2xl"
//     >
//       {/* Header */}
//       <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
//         <div>
//           <h3 className="text-[15px] font-bold text-white">{c?.name}'s Proposal</h3>
//           <p className="text-[11px] text-slate-500 mt-0.5">Version {proposal.version} · {new Date(proposal.createdAt).toLocaleDateString()}</p>
//         </div>
//         <div className="flex items-center gap-2 relative">
//           <StatusBadge status={proposal.status} genStatus={proposal.generationStatus} />
//           <div className="relative">
//   <button
//     onClick={() => setShowDownload(!showDownload)}
//     className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition"
//   >
//     <Download size={18} />
//   </button>

//   {showDownload && (
//     <div className="absolute right-0 mt-2 w-52 bg-[#151530] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
//       <button
//        onClick={() => handleDownload("pdf")}
//         className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 text-slate-300 text-sm"
//       >
//         <File size={16} />
//         Download PDF
//       </button>

//       <button
//        onClick={() => handleDownload("docx")}
//         className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 text-slate-300 text-sm border-t border-white/5"
//       >
//         <FileSpreadsheet size={16} />
//         Download DOCX
//       </button>
//     </div>
//   )}
// </div>
//           <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition">
//             <X size={18} />
//           </button>
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto">
//         {/* Generation in progress */}
//         {proposal.generationStatus !== "completed" && (
//           <div className="m-6 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
//             <Loader2 size={32} className="text-amber-400 animate-spin mx-auto mb-3" />
//             <p className="text-amber-400 font-semibold text-[14px]">
//               {proposal.generationStatus === "failed" ? "Generation Failed" : "AI is generating your proposal..."}
//             </p>
//             <p className="text-slate-500 text-[12px] mt-1">
//               {proposal.generationStatus === "failed"
//                 ? proposal.generationError || "Unknown error occurred"
//                 : "This usually takes 10–30 seconds"}
//             </p>
//           </div>
//         )}

//         {proposal.generationStatus === "completed" && p && (
//           <div className="p-6 space-y-6">
//             {/* System Overview */}
//             <div className="grid grid-cols-2 gap-3">
//               {[
//                 { label: "System Size", value: fmtKW(p.systemSizeKW), icon: Sun, color: "text-amber-400" },
//                 { label: "Panel Count", value: `${p.panelCount} × ${p.panelWattage}Wp`, icon: Layers, color: "text-blue-400" },
//                 { label: "Monthly Savings", value: fmt(p.monthlyEnergySavings), icon: IndianRupee, color: "text-emerald-400" },
//                 { label: "Payback Period", value: fmtYrs(p.paybackYears), icon: TrendingUp, color: "text-indigo-400" },
//                 { label: "Net Investment", value: fmt(p.netCost), icon: IndianRupee, color: "text-violet-400" },
//                 { label: "25-Year Savings", value: fmt(p.roi25Years), icon: BarChart3, color: "text-cyan-400" },
//               ].map((item) => (
//                 <div key={item.label} className="bg-white/3 border border-white/5 rounded-xl p-3">
//                   <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{item.label}</p>
//                   <p className={`text-[15px] font-bold ${item.color}`}>{item.value}</p>
//                 </div>
//               ))}
//             </div>

//             {/* AI Narrative */}
//             {/* Executive Summary */}
// {p.executiveSummary && (
//   <div className="space-y-3">
//     <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
//       <Sparkles size={12} className="text-indigo-400" />
//       Executive Summary
//     </p>

//     <div className="bg-indigo-500/8 border border-indigo-500/15 rounded-xl p-5">
//       <p className="text-[13px] text-slate-300 leading-7 whitespace-pre-line">
//         {p.executiveSummary}
//       </p>
//     </div>
//   </div>
// )}

// {/* System Description */}
// {p.systemDescription && (
//   <div className="space-y-3">
//     <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
//       System Description
//     </p>

//     <div className="bg-white/3 border border-white/5 rounded-xl p-5">
//       <p className="text-[13px] text-slate-300 leading-7 whitespace-pre-line">
//         {p.systemDescription}
//       </p>
//     </div>
//   </div>
// )}

// {/* Financial Highlights */}
// {p.financialHighlights && (
//   <div className="space-y-3">
//     <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
//       Financial Highlights
//     </p>

//     <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-5">
//       <p className="text-[13px] text-slate-300 leading-7 whitespace-pre-line">
//         {p.financialHighlights}
//       </p>
//     </div>
//   </div>
// )}

// {/* Installation Process */}
// {p.installationProcess && (
//   <div className="space-y-3">
//     <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
//       Installation Process
//     </p>

//     <div className="bg-white/3 border border-white/5 rounded-xl p-5">
//       <p className="text-[13px] text-slate-300 leading-7 whitespace-pre-line">
//         {p.installationProcess}
//       </p>
//     </div>
//   </div>
// )}

// {/* Maintenance Support */}
// {p.maintenanceSupport && (
//   <div className="space-y-3">
//     <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
//       Maintenance & Support
//     </p>

//     <div className="bg-white/3 border border-white/5 rounded-xl p-5">
//       <p className="text-[13px] text-slate-300 leading-7 whitespace-pre-line">
//         {p.maintenanceSupport}
//       </p>
//     </div>
//   </div>
// )}

// {/* Why Choose Us */}
// {p.whyChooseUs && (
//   <div className="space-y-3">
//     <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
//       Why Choose Us
//     </p>

//     <div className="bg-violet-500/8 border border-violet-500/15 rounded-xl p-5">
//       <p className="text-[13px] text-slate-300 leading-7 whitespace-pre-line">
//         {p.whyChooseUs}
//       </p>
//     </div>
//   </div>
// )}
//             {/* {p.executiveSummary && (
//               <div className="space-y-3">
//                 <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
//                   <Sparkles size={12} className="text-indigo-400" /> AI Summary
//                 </p>
//                 <div className="bg-indigo-500/8 border border-indigo-500/15 rounded-xl p-4">
//                   <p className="text-[13px] text-slate-300 leading-relaxed">{p.executiveSummary}</p>
//                 </div>
//               </div>
//             )} */}
                  
//             {/* Financial */}
//             <div>
//               <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Financial Breakdown</p>
//               <div className="bg-white/3 border border-white/5 rounded-xl overflow-hidden">
//                 <div className="flex justify-between px-4 py-2.5 border-b border-white/5">
//                   <span className="text-[12px] text-slate-400">Gross Installation Cost</span>
//                   <span className="text-[12px] font-semibold text-white">{fmt(p.installationCost)}</span>
//                 </div>
//                 <div className="flex justify-between px-4 py-2.5 border-b border-white/5 bg-emerald-500/5">
//                   <span className="text-[12px] text-emerald-400">Govt. Subsidy ({p.subsidyScheme})</span>
//                   <span className="text-[12px] font-semibold text-emerald-400">− {fmt(p.subsidyAmount)}</span>
//                 </div>
//                 <div className="flex justify-between px-4 py-2.5">
//                   <span className="text-[13px] font-bold text-white">Net Investment</span>
//                   <span className="text-[13px] font-bold text-white">{fmt(p.netCost)}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Cost Breakdown */}
//             {p.costBreakdown?.length > 0 && (
//               <div>
//                 <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Itemized Breakdown</p>
//                 <div className="bg-white/3 border border-white/5 rounded-xl overflow-hidden">
//                   {p.costBreakdown.map((item, i) => (
//                     <div key={i} className={`flex justify-between items-center px-4 py-2.5 ${i < p.costBreakdown.length - 1 ? "border-b border-white/5" : ""}`}>
//                       <div>
//                         <p className="text-[12px] text-slate-300">{item.item}</p>
//                         {item.quantity > 1 && <p className="text-[10px] text-slate-600">{item.quantity} × {fmt(item.unitCost)}</p>}
//                       </div>
//                       <span className="text-[12px] font-semibold text-white">{fmt(item.totalCost)}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* EMI Options */}
//             {p.emiOptions?.length > 0 && (
//               <div>
//                 <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Financing Options (EMI)</p>
//                 <div className="grid grid-cols-3 gap-2">
//                   {p.emiOptions.map((emi, i) => (
//                     <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-3 text-center">
//                       <p className="text-[10px] text-slate-500 mb-1">{emi.tenure} months</p>
//                       <p className="text-[16px] font-black text-indigo-400">{fmt(emi.emi)}/mo</p>
//                       <p className="text-[10px] text-slate-600 mt-0.5">@ {emi.interestRate}%</p>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Environmental */}
//             <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-4">
//               <Leaf size={20} className="text-emerald-400 flex-shrink-0" />
//               <div>
//                 <p className="text-[13px] font-semibold text-emerald-400">
//                   CO₂ Offset: {p.co2OffsetTonsPerYear} tonnes/year
//                 </p>
//                 <p className="text-[11px] text-slate-500 mt-0.5">
//                   Equivalent to planting {Math.round(p.co2OffsetTonsPerYear * 45)} trees annually
//                 </p>
//               </div>
//             </div>

//             {/* Customer Info */}
//             <div>
//               <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Customer</p>
//               <div className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-1">
//                 <p className="text-[13px] text-white font-semibold">{c?.name}</p>
//                 {c?.whatsapp && <p className="text-[12px] text-slate-400">📱 {c.whatsapp}</p>}
//                 {c?.email && <p className="text-[12px] text-slate-400">✉️ {c.email}</p>}
//                 {c?.city && <p className="text-[12px] text-slate-400">📍 {c.city} {c.pincode ? `− ${c.pincode}` : ""}</p>}
//                 <p className="text-[12px] text-slate-400 pt-1">
//                   Monthly Bill: {fmt(s?.monthlyBill)} · {s?.roofType} · {s?.gridType}
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Actions */}
//       {proposal.generationStatus === "completed" && (
//         <div className="px-6 py-4 border-t border-white/5 flex gap-2 flex-wrap">
//           {proposal.status === "draft" && (
//             <button
//               onClick={() => onSend(proposal._id)}
//               className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-semibold hover:opacity-90 transition"
//             >
//               <Send size={14} /> Send to Customer
//             </button>
//           )}
//           <button
//             onClick={() => onRegenerate(proposal._id)}
//             className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[13px] font-medium transition"
//           >
//             <RotateCcw size={14} /> Regenerate
//           </button>
//           {["sent", "opened"].includes(proposal.status) && (
//             <button
//               onClick={() => onStatusChange(proposal._id, "accepted")}
//               className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[13px] font-medium transition"
//             >
//               <CheckCircle size={14} /> Mark Accepted
//             </button>
//           )}
//         </div>
//       )}
//     </motion.div>
//   );
// };

// export default ProposalDetailPanel;