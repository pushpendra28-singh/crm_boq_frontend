import { useState } from "react";
import {
  X, Plus, Phone, Globe, Copy, CheckCheck,
  Activity, UserPlus, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScoreBadge, SourceChip, StatusSelect } from "./LeadComponents";
import AssignModal from "./AssignModal";

// ─── AIQualificationPanel now comes from LeadValidation ──────────────────────
import { AIQualificationPanel } from "./LeadValidation";

// ─── Lead Detail Drawer ───────────────────────────────────────────────────────
const LeadDrawer = ({ lead, onClose, onStatusChange, onAddNote, onAssign }) => {
  const [noteText, setNoteText]     = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [tab, setTab]               = useState("details");
  const [copied, setCopied]         = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(lead.whatsapp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNoteSubmit = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    await onAddNote(lead._id, noteText);
    setNoteText("");
    setAddingNote(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex justify-end"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-lg bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden shadow-2xl"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 flex items-center justify-center text-lg font-black text-green-600">
                {lead.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-gray-900">{lead.name}</h3>
                  {lead.isDuplicate && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200">
                      DUPLICATE
                    </span>
                  )}
                  {lead.priorityTag === "Hot Lead" && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                      HOT
                    </span>
                  )}
                  {lead.priorityTag === "Warm Lead" && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                      WARM
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                  {lead.category} Lead ·{" "}
                  <ScoreBadge score={lead.authenticityScore || lead.score || 0} />
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="flex border-b border-gray-100 bg-white">
            {["details", "AI", "activity", "notes"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-[12px] font-semibold capitalize transition
                  ${tab === t
                    ? "text-green-600 border-b-2 border-green-500"
                    : "text-gray-400 hover:text-gray-600"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50">

            {/* ════════════════════════════════════════
                DETAILS TAB
            ════════════════════════════════════════ */}
            {tab === "details" && (
              <>
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</span>
                  <StatusSelect value={lead.status} onChange={(v) => onStatusChange(lead._id, v)} />
                </div>

                {/* Source */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Source</span>
                  <SourceChip source={lead.source} />
                </div>

                {/* Assignment */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Assigned To</span>
                  <div className="flex items-center gap-2">
                    {lead.assignedToName ? (
                      <span className="flex items-center gap-1.5 text-[12px] font-medium text-gray-800">
                        <div className="w-5 h-5 rounded-md bg-green-50 border border-green-200 flex items-center justify-center text-[9px] font-black text-green-600">
                          {lead.assignedToName?.[0]?.toUpperCase()}
                        </div>
                        {lead.assignedToName}
                      </span>
                    ) : (
                      <span className="text-[12px] text-gray-400">Unassigned</span>
                    )}
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700"
                    >
                      <UserPlus size={11} />
                      {lead.assignedToName ? "Re-assign" : "Assign"}
                    </button>
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Contact</p>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone size={13} className="text-green-500" />
                      <span className="text-[13px] font-medium tabular-nums">{lead.whatsapp}</span>
                    </div>
                    <button
                      onClick={handleCopyPhone}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-700"
                    >
                      {copied
                        ? <CheckCheck size={13} className="text-green-500" />
                        : <Copy size={13} />}
                    </button>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700">
                      <Globe size={13} className="text-green-500" />
                      <span className="text-[13px]">{lead.email}</span>
                    </div>
                  )}
                </div>

                {/* Category-specific details */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Details</p>
                  <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                    {[
                      lead.category === "Residential" && [
                        { label: "Pincode",      value: lead.pincode },
                        { label: "Monthly Bill", value: lead.bill ? `₹ ${lead.bill}` : null },
                      ],
                      lead.category === "Housing Society" && [
                        { label: "Society",      value: lead.societyName },
                        { label: "Pincode",      value: lead.pincode },
                        { label: "Monthly Bill", value: lead.monthlyBill ? `₹ ${lead.monthlyBill}` : null },
                        { label: "AGM Status",   value: lead.agmStatus },
                        { label: "Designation",  value: lead.designation },
                      ],
                      lead.category === "Commercial" && [
                        { label: "Company",  value: lead.companyName },
                        { label: "City",     value: lead.city },
                        { label: "Pincode",  value: lead.pincode },
                        { label: "Bill",     value: lead.commercialBill ? `₹ ${lead.commercialBill}` : null },
                      ],
                    ]
                      .filter(Boolean)
                      .flat()
                      .filter((row) => row.value)
                      .map((row, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-[11px] text-gray-400">{row.label}</span>
                          <span className="text-[12px] text-gray-800 font-medium">{row.value}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* UTM / Attribution */}
                {lead.sourceDetails && Object.values(lead.sourceDetails).some(Boolean) && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Attribution</p>
                    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                      {[
                        { label: "Campaign",     value: lead.sourceDetails.campaign    || lead.sourceDetails.utmCampaign },
                        { label: "Medium",       value: lead.sourceDetails.medium      || lead.sourceDetails.utmMedium   },
                        { label: "Keyword",      value: lead.sourceDetails.keyword     || lead.sourceDetails.utmTerm     },
                        { label: "Landing Page", value: lead.sourceDetails.landingPage },
                        { label: "GCLID",        value: lead.sourceDetails.gclid       },
                        { label: "FBCLID",       value: lead.sourceDetails.fbclid      },
                      ]
                        .filter((r) => r.value)
                        .map((row, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-2.5">
                            <span className="text-[11px] text-gray-400">{row.label}</span>
                            <span className="text-[10px] text-gray-600 font-mono max-w-[160px] truncate">{row.value}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Assignment History */}
                {lead.assignmentHistory?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      Assignment History
                    </p>
                    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                      {[...lead.assignmentHistory].reverse().map((h, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <p className="text-[12px] text-gray-800 font-medium">{h.assignedToName || "—"}</p>
                            <p className="text-[10px] text-gray-400">
                              by {h.assignedByName || "Admin"} ·{" "}
                              {h.assignedAt ? new Date(h.assignedAt).toLocaleDateString() : "—"}
                            </p>
                            {h.note && <p className="text-[10px] text-gray-400 italic mt-0.5">{h.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>Created: {new Date(lead.createdAt).toLocaleString()}</span>
                  {lead.assignedAt && (
                    <span>Assigned: {new Date(lead.assignedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </>
            )}

            {/* ════════════════════════════════════════
                AI TAB — uses AIQualificationPanel from LeadValidation.js
                Passes the full lead object so the panel reads all fields.
            ════════════════════════════════════════ */}
            {tab === "AI" && (
              <AIQualificationPanel lead={lead} />
            )}

            {/* ════════════════════════════════════════
                ACTIVITY TAB
            ════════════════════════════════════════ */}
            {tab === "activity" && (
              <div className="space-y-3">
                {(!lead.activityLog || lead.activityLog.length === 0) ? (
                  <div className="text-center py-8 text-gray-400 text-[13px]">No activity yet</div>
                ) : (
                  [...lead.activityLog].reverse().map((a, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                          <Activity size={11} className="text-green-500" />
                        </div>
                        {i < lead.activityLog.length - 1 && (
                          <div className="w-px flex-1 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="pb-4 flex-1">
                        <p className="text-[12px] text-gray-700 capitalize">
                          {a.action?.replace(/_/g, " ")}
                        </p>
                        {a.from && (
                          <p className="text-[11px] text-gray-400">{a.from} → {a.to}</p>
                        )}
                        {a.note && (
                          <p className="text-[11px] text-gray-400 italic">{a.note}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {a.byName && `${a.byName} · `}
                          {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ════════════════════════════════════════
                NOTES TAB
            ════════════════════════════════════════ */}
            {tab === "notes" && (
              <div className="space-y-4">
                {/* Add note */}
                <div className="space-y-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note about this lead…"
                    rows={3}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition resize-none"
                  />
                  <button
                    onClick={handleNoteSubmit}
                    disabled={addingNote || !noteText.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-white bg-green-600 hover:bg-green-500 transition disabled:opacity-40"
                  >
                    {addingNote
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Plus size={12} />}
                    Add Note
                  </button>
                </div>

                {/* Notes list */}
                {(!lead.notes || lead.notes.length === 0) ? (
                  <div className="text-center py-6 text-gray-400 text-[13px]">No notes yet</div>
                ) : (
                  [...lead.notes].reverse().map((n, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                      <p className="text-[13px] text-gray-700 leading-relaxed">{n.text}</p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {n.addedBy} · {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </motion.div>
      </motion.div>

      {/* Assign Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <AssignModal
            lead={lead}
            onClose={() => setShowAssignModal(false)}
            onAssigned={(updatedLead) => {
              onAssign(updatedLead);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default LeadDrawer;