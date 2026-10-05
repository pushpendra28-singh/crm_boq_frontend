import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  IndianRupee,
  Loader2,
  MoreHorizontal,
  Download,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import SalaryManagement from "./SalaryManagement";
import {
  downloadSalarySlip,
  finalizePayroll,
  generatePayroll,
  getPayrollRun,
  getPayrollRuns,
  movePayrollToReview,
  recalculatePayroll,
  updatePayrollRecordPayment,
} from "./payrollApi";

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatMonth(month) {
  if (!month) return "";
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function statusMeta(status) {
  const map = {
    draft: { label: "Draft", cls: "border-slate-200 bg-slate-50 text-slate-700", Icon: Clock3 },
    review: { label: "In Review", cls: "border-amber-200 bg-amber-50 text-amber-700", Icon: Eye },
    finalized: { label: "Finalized", cls: "border-blue-200 bg-blue-50 text-blue-700", Icon: ShieldCheck },
    completed: { label: "Completed", cls: "border-emerald-200 bg-emerald-50 text-emerald-700", Icon: CheckCircle2 },
    cancelled: { label: "Cancelled", cls: "border-red-200 bg-red-50 text-red-700", Icon: X },
  };
  return map[status] || map.draft;
}

function paymentMeta(status) {
  const map = {
    pending: { label: "Pending", cls: "border-slate-200 bg-slate-50 text-slate-600" },
    hold: { label: "On Hold", cls: "border-amber-200 bg-amber-50 text-amber-700" },
    paid: { label: "Paid", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  };
  return map[status] || map.pending;
}

export default function PayrollModule({ hasPermission }) {
  const [tab, setTab] = useState("payroll");
  const [month, setMonth] = useState(currentMonth);
  const [run, setRun] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rowActionId, setRowActionId] = useState("");
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [holdRecord, setHoldRecord] = useState(null);
  const [holdReason, setHoldReason] = useState("");
  const [paymentRecord, setPaymentRecord] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [salarySlipRecord, setSalarySlipRecord] = useState(null);
const [salarySlipUrl, setSalarySlipUrl] = useState("");
const [salarySlipLoading, setSalarySlipLoading] = useState(false);
const [salarySlipError, setSalarySlipError] =  useState("");

  const canManage = hasPermission("manage_payroll");
  const canFinalize = hasPermission("finalize_payroll");
  const meta = statusMeta(run?.status);
  const StatusIcon = meta.Icon;
  const canRegenerate = Boolean(run && ["draft", "review"].includes(run.status) && !Number(run.totals?.paidCount || 0));
  const generateDisabled = !canManage || actionLoading || loading || (Boolean(run) && !canRegenerate);

  async function loadPayroll(showLoader = true) {
    if (showLoader) setLoading(true);
    setError("");
    try {
      const list = await getPayrollRuns(month);
      const nextRun = list.runs?.[0] || null;
      setRun(nextRun);

      if (!nextRun) {
        setRecords([]);
        setSelectedRecord(null);
        return;
      }

      const detail = await getPayrollRun(nextRun._id);
      setRun(detail.run || nextRun);
      setRecords(detail.records || []);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    loadPayroll(true);
  }, [month]);

  useEffect(() => {
  return () => {
    if (salarySlipUrl) {
      URL.revokeObjectURL(salarySlipUrl);
    }
  };
}, [salarySlipUrl]);

  async function handleGenerate() {
    setActionLoading(true);
    setError("");
    try {
      if (!run) {
        const result = await generatePayroll(month);
        toast.success(`Payroll generated through ${result.run?.cutoffDate || "today"}.`);
      } else {
        const result = await recalculatePayroll(run._id);
        toast.success(`Payroll regenerated through ${result.run?.cutoffDate || "today"}.`);
      }
      await loadPayroll(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function openSalarySlip(record) {
  if (!run?._id || !record?._id) {
    toast.error("Salary slip data is not available.");
    return;
  }

  setSalarySlipRecord(record);
  setSalarySlipLoading(true);
  setSalarySlipError("");
  setSalarySlipUrl("");

  try {
    const blob = await downloadSalarySlip(
      run._id,
      record._id
    );

    const url = URL.createObjectURL(blob);
    setSalarySlipUrl(url);
  } catch (error) {
    setSalarySlipError(
      error.message ||
        "Unable to generate salary slip."
    );
    toast.error(
      error.message ||
        "Unable to generate salary slip."
    );
  } finally {
    setSalarySlipLoading(false);
  }
}

function closeSalarySlip() {
  setSalarySlipRecord(null);
  setSalarySlipUrl("");
  setSalarySlipError("");
  setSalarySlipLoading(false);
}

  async function handleRunStatus(action, successMessage) {
    if (!run) return;
    setActionLoading(true);
    try {
      if (action === "review") await movePayrollToReview(run._id);
      else await finalizePayroll(run._id);
      toast.success(successMessage);
      await loadPayroll(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function applyRecordPayment(payload) {
    if (!run || !rowActionId) return;
    setActionLoading(true);
    try {
      await updatePayrollRecordPayment(run._id, rowActionId, payload);
      toast.success(payload.action === "hold" ? "Salary moved to hold." : payload.action === "release" ? "Salary hold released." : "Salary marked as paid.");
      setHoldRecord(null);
      setPaymentRecord(null);
      setHoldReason("");
      setPaymentMethod("");
      setPaymentReference("");
      await loadPayroll(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
      setRowActionId("");
    }
  }

  const stats = useMemo(() => {
    const totals = run?.totals || {};
    return [
      ["Employees", run?.employeeCount || 0, UserRound],
      ["Gross earned", money(totals.grossEarned), IndianRupee],
      ["Loss of pay", money(totals.lossOfPay), PauseCircle],
      ["Net payable", money(totals.net), WalletCards],
    ];
  }, [run]);

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-emerald-600">
              <WalletCards size={14} /> PAYROLL CONTROL CENTER
            </div>
            <h1 className="mt-2 text-2xl font-black text-gray-950 md:text-3xl">Salary & Payroll</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
              Salary is generated from the Monthly Work Record snapshot. The current month is calculated only through the current India date; regenerate refreshes that snapshot.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
              <CalendarDays size={16} className="text-gray-400" />
              <input
                type="month"
                value={month}
                max={currentMonth()}
                onChange={(event) => setMonth(event.target.value)}
                className="bg-transparent text-sm font-semibold text-gray-700 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generateDisabled}
              title={run && !canRegenerate ? "Regeneration is locked after finalization or payment." : "Calculate salary through the current India date"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : run ? <RotateCcw size={16} /> : <PlayCircle size={16} />}
              {!run ? "Generate Salary" : canRegenerate ? "Regenerate Salary" : "Salary Generated"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-600">{formatMonth(month)}</span>
          {run ? (
            <>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-semibold ${meta.cls}`}><StatusIcon size={13} /> {meta.label}</span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-gray-500">Calculated through <strong className="text-gray-800">{run.cutoffDate}</strong></span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 font-semibold text-violet-700">Sandwich rule {run.sandwichRule?.enabled ? "available" : "off"}</span>
            </>
          ) : (
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-gray-500">No payroll generated</span>
          )}
        </div>
      </header>

      <div className="flex gap-2 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
        <button type="button" onClick={() => setTab("payroll")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab === "payroll" ? "bg-gray-950 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
          Payroll Run
        </button>
        <button type="button" onClick={() => setTab("salary")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab === "salary" ? "bg-gray-950 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
          Salary Details
        </button>
      </div>

      {tab === "salary" ? (
        <SalaryManagement canManage={canManage} />
      ) : (
        <>
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(([label, value, Icon]) => (
              <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">{label}</div>
                    <div className="mt-2 text-2xl font-black text-gray-950">{value}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-emerald-600"><Icon size={20} /></div>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
              <div>
                <h2 className="font-black text-gray-950">Employee payroll</h2>
                <p className="mt-1 text-xs text-gray-400">Click a row to open the complete salary and attendance breakdown.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Banknote size={15} className="text-emerald-600" />
                {records.length} employee records
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 size={18} className="animate-spin" /> Loading payroll…
              </div>
            ) : !run ? (
              <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                <FileText size={34} className="text-gray-300" />
                <h3 className="mt-4 font-bold text-gray-800">Salary is not generated yet</h3>
                <p className="mt-1 max-w-md text-sm leading-6 text-gray-400">First configure employee salary details, then generate the selected month. The run will use Monthly Work Records and save its own snapshot.</p>
              </div>
            ) : !records.length ? (
              <div className="flex min-h-80 flex-col items-center justify-center text-sm text-gray-400">No employee payroll records were generated.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1180px] w-full text-sm">
                  <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Employee</th>
                      <th className="px-4 py-3.5 font-bold">Earned / Service</th>
                      <th className="px-4 py-3.5 font-bold">Gross Earned</th>
                      <th className="px-4 py-3.5 font-bold">LOP</th>
                      <th className="px-4 py-3.5 font-bold">Deductions</th>
                      <th className="px-4 py-3.5 font-bold">Net Salary</th>
                      <th className="px-4 py-3.5 font-bold">Payment</th>
                      <th className="px-5 py-3.5 text-right font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((record) => {
                      const payment = paymentMeta(record.paymentStatus);
                      return (
                        <tr key={record._id} className="group hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <button type="button" onClick={() => setSelectedRecord(record)} className="text-left">
                              <div className="font-bold text-gray-900 group-hover:text-emerald-700">{record.employeeSnapshot.name}</div>
                              <div className="mt-0.5 text-xs text-gray-400">{record.employeeSnapshot.email}</div>
                            </button>
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-700">{record.attendanceSnapshot?.salaryEarnedUnits ?? 0} <span className="text-[10px] font-medium text-gray-400">/ {record.attendanceSnapshot?.salaryAccruedUnits ?? 0}</span></td>
                          <td className="px-4 py-4 font-semibold text-gray-800">{money(record.grossSalary)}</td>
                          <td className="px-4 py-4 font-semibold text-orange-600">{money(record.lossOfPay)}</td>
                          <td className="px-4 py-4">{money(record.totalDeductions)}</td>
                          <td className="px-4 py-4 font-black text-emerald-700">{money(record.netSalary)}</td>
                          <td className="px-4 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${payment.cls}`}>{payment.label}</span></td>
                          <td className="px-5 py-4 text-right">
                           <RowAction
  record={record}
  disabled={actionLoading}
  canManage={canManage}
  onView={() => setSelectedRecord(record)}
  onSalarySlip={() => openSalarySlip(record)}
  onPay={() => {
    setRowActionId(record._id);
    setPaymentRecord(record);
  }}
  onHold={() => {
    setRowActionId(record._id);
    setHoldRecord(record);
  }}
  onRelease={() => {
    setRowActionId(record._id);
    applyRecordPayment({ action: "release" });
  }}
/>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {run && (
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="text-xs leading-5 text-gray-500">
                <strong className="text-gray-800">Workflow:</strong> Generate → Review → Finalize → Pay / Hold per employee. The current month is calculated through the current India date; regeneration refreshes the snapshot until payment starts.
              </div>
              <div className="flex flex-wrap gap-2">
                {canManage && run.status === "draft" && <WorkflowButton label="Move to Review" onClick={() => handleRunStatus("review", "Payroll moved to review.")} />}
                {canFinalize && ["draft", "review"].includes(run.status) && <WorkflowButton label="Finalize Payroll" onClick={() => handleRunStatus("finalize", "Payroll finalized.")} />}
              </div>
            </div>
          )}
        </>
      )}

      {selectedRecord && <RecordDetails record={selectedRecord} onClose={() => setSelectedRecord(null)} />}


        {salarySlipRecord && (
  <SalarySlipModal
    record={salarySlipRecord}
    url={salarySlipUrl}
    loading={salarySlipLoading}
    error={salarySlipError}
    onClose={closeSalarySlip}
  />
)}



      {holdRecord && (
        <Modal title="Put salary on hold" onClose={() => { if (!actionLoading) { setHoldRecord(null); setRowActionId(""); } }}>
          <p className="text-sm leading-6 text-gray-500">Add a clear reason. The employee payroll will stay visible but will not be shown as paid.</p>
          <textarea
            value={holdReason}
            onChange={(event) => setHoldReason(event.target.value.slice(0, 500))}
            rows={4}
            placeholder="Example: Bank details pending verification"
            className="mt-4 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => { setHoldRecord(null); setRowActionId(""); }} disabled={actionLoading} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600">Cancel</button>
            <button type="button" onClick={() => applyRecordPayment({ action: "hold", reason: holdReason })} disabled={actionLoading || !holdReason.trim()} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {actionLoading && <Loader2 size={15} className="animate-spin" />} Hold Salary
            </button>
          </div>
        </Modal>
      )}

      {paymentRecord && (
        <Modal title={`Mark ${paymentRecord.employeeSnapshot.name} as paid`} onClose={() => { if (!actionLoading) { setPaymentRecord(null); setRowActionId(""); } }}>
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
            Net salary to pay: <strong>{money(paymentRecord.netSalary)}</strong>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-bold text-gray-500">Payment method
              <input value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value.slice(0, 50))} placeholder="Bank transfer / Cash / UPI" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" />
            </label>
            <label className="text-xs font-bold text-gray-500">Reference (optional)
              <input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value.slice(0, 120))} placeholder="Transaction / UTR / voucher no." className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => { setPaymentRecord(null); setRowActionId(""); }} disabled={actionLoading} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600">Cancel</button>
            <button type="button" onClick={() => applyRecordPayment({ action: "paid", paymentMethod, paymentReference })} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {actionLoading && <Loader2 size={15} className="animate-spin" />} Mark Paid
            </button>
          </div>
        </Modal>
      )}
    </motion.section>
  );
}

function RowAction({
  record,
  disabled,
  canManage,
  onView,
  onSalarySlip,
  onPay,
  onHold,
  onRelease,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-label={`More actions for ${record.employeeSnapshot.name}`}
        title="More actions"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close action menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl">
            <ActionItem
              label="View details"
              icon={Eye}
              onClick={() => {
                setOpen(false);
                onView();
              }}
            />

            <ActionItem
              label="Salary slip"
              icon={FileText}
              onClick={() => {
                setOpen(false);
                onSalarySlip();
              }}
            />

            {canManage && record.paymentStatus !== "paid" && (
              <ActionItem
                label="Mark as paid"
                icon={CheckCircle2}
                onClick={() => {
                  setOpen(false);
                  onPay();
                }}
              />
            )}

            {canManage &&
              (record.paymentStatus === "hold" ? (
                <ActionItem
                  label="Release hold"
                  icon={PlayCircle}
                  onClick={() => {
                    setOpen(false);
                    onRelease();
                  }}
                />
              ) : record.paymentStatus !== "paid" ? (
                <ActionItem
                  label="Put on hold"
                  icon={PauseCircle}
                  onClick={() => {
                    setOpen(false);
                    onHold();
                  }}
                />
              ) : null)}
          </div>
        </>
      )}
    </div>
  );
}

function ActionItem({ label, icon: Icon, onClick }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-slate-50"><Icon size={14} /> {label}</button>;
}

function WorkflowButton({ label, onClick }) {
  return <button type="button" onClick={onClick} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50">{label}</button>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-black text-gray-950">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700"><X size={17} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function RecordDetails({ record, onClose }) {
  const attendance = record.attendanceSnapshot || {};
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-gray-950/30 backdrop-blur-sm">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <div className="text-[11px] font-bold tracking-[0.16em] text-emerald-600">PAYROLL DETAIL</div>
            <h3 className="mt-1 text-xl font-black text-gray-950">{record.employeeSnapshot.name}</h3>
            <div className="mt-1 text-xs text-gray-400">{record.employeeSnapshot.email}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-50"><X size={18} /></button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Earned units", attendance.salaryEarnedUnits],
              ["Service units", attendance.salaryAccruedUnits],
              ["LOP units", attendance.salaryUnpaidUnits],
              ["Sandwich", attendance.sandwichLeaveUnits],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-gray-100 bg-slate-50 px-3 py-3"><div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div><div className="mt-1 text-lg font-black text-gray-900">{value || 0}</div></div>
            ))}
          </div>

          <Section title="How this salary was calculated">
            <AmountRow label="Calculation through" value={record.cutoffDate || "—"} />
            <AmountRow label="Proration method" value={record.salarySnapshot?.prorationMethod === "calendar_days" ? "Calendar days" : "Working days"} />
            <AmountRow label="Monthly gross" value={money(record.monthlyGross)} helper="Current effective salary" />
            <AmountRow label="Gross accrued" value={money(record.grossAccrued)} helper="Salary available through cutoff before LOP" />
            <AmountRow label="Loss of pay" value={money(record.lossOfPay)} helper="Absence / unpaid leave / sandwich policy" negative />
            <AmountRow label="Gross earned" value={money(record.grossSalary)} strong />
          </Section>

          <Section title="Salary summary">
            <AmountRow label="Monthly gross" value={money(record.monthlyGross)} />
            <AmountRow label="Gross accrued" value={money(record.grossAccrued)} />
            <AmountRow label="Loss of pay" value={money(record.lossOfPay)} negative />
            <AmountRow label="Gross earned" value={money(record.grossSalary)} strong />
            <AmountRow label="Employee deductions" value={money(record.totalDeductions)} negative />
            <AmountRow label="Net salary" value={money(record.netSalary)} strong highlight />
            <AmountRow label="Employer contributions" value={money(record.employerContributionTotal)} />
          </Section>

          <Section title="Earnings">
            {(record.earnings || []).map((item) => <AmountRow key={item.name} label={item.name} value={money(item.amount)} helper={item.statutory ? "Statutory" : ""} />)}
          </Section>

          <Section title="Employee deductions">
            {(record.deductions || []).length ? (record.deductions || []).map((item) => <AmountRow key={item.name} label={item.name} value={money(item.amount)} helper={item.statutory ? "Statutory" : ""} />) : <div className="text-sm text-gray-400">No employee deductions configured.</div>}
          </Section>

          <Section title="Employer contributions">
            {(record.employerContributions || []).length ? (record.employerContributions || []).map((item) => <AmountRow key={item.name} label={item.name} value={money(item.amount)} helper={item.statutory ? "Statutory" : ""} />) : <div className="text-sm text-gray-400">No employer contributions configured.</div>}
          </Section>

          <Section title="Attendance used for payroll">
            <AmountRow label="Present units" value={attendance.presentUnits ?? 0} />
            <AmountRow label="Half-day units" value={attendance.halfDayUnits ?? 0} />
            <AmountRow label="Paid leave units" value={attendance.paidLeaveUnits ?? 0} />
            <AmountRow label="Unpaid leave units" value={attendance.unpaidLeaveUnits ?? 0} />
            <AmountRow label="Absent units" value={attendance.absentUnits ?? 0} />
            <AmountRow label="Late days" value={attendance.lateDays ?? 0} />
            <AmountRow label="WFH full / half" value={`${attendance.wfhFullDays ?? 0} / ${attendance.wfhHalfDays ?? 0}`} />
            <AmountRow label="Holidays / weekly offs" value={`${attendance.holidays ?? 0} / ${attendance.weeklyOffs ?? 0}`} />
          </Section>

          {Array.isArray(record.days) && record.days.length > 0 && (
            <Section title="Daily payroll snapshot">
              <div className="overflow-x-auto py-2">
                <table className="min-w-[620px] w-full text-xs">
                  <thead><tr className="text-left text-[10px] uppercase tracking-wider text-gray-400"><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Earned</th><th className="py-2 pr-3">LOP</th><th className="py-2">Reason</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {record.days.map((day) => (
                      <tr key={day.date}>
                        <td className="py-2 pr-3 font-semibold text-gray-700">{day.date}</td>
                        <td className="py-2 pr-3 text-gray-500">{day.status?.replace(/_/g, " ") || "—"}</td>
                        <td className="py-2 pr-3 font-semibold text-emerald-700">{day.payableUnits ?? 0}</td>
                        <td className="py-2 pr-3 font-semibold text-orange-600">{day.unpaidUnits ?? 0}</td>
                        <td className="py-2 text-gray-400">{day.sandwichLeave ? "Sandwich rule" : day.leave?.paid ? "Paid leave" : day.leave ? "Unpaid leave" : day.holidayName || (day.isWeeklyOff ? "Weekly off" : day.unpaidUnits > 0 ? "Absence" : "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {Array.isArray(record.salarySnapshot?.periods) && record.salarySnapshot.periods.length > 0 && (
            <Section title="Salary revision periods">
              {record.salarySnapshot.periods.map((period, index) => (
                <AmountRow key={`${period.from}-${index}`} label={`${period.from} → ${period.to}`} value={`${Math.round(Number(period.earnedFraction || 0) * 100)}% earned`} helper={`${Math.round(Number(period.fraction || 0) * 100)}% accrued`} />
              ))}
            </Section>
          )}

          {record.paymentStatus === "hold" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><strong>On hold:</strong> {record.holdReason || "No reason recorded."}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SalarySlipModal({
  record,
  url,
  loading,
  error,
  onClose,
}) {
  const employeeName =
    record?.employeeSnapshot?.name || "Employee";

  const month =
    record?.salaryRunMonth ||
    record?.month ||
    "";

  const fileName = `Salary-Slip-${employeeName
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")}-${month || "payroll"}.pdf`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="text-[10px] font-bold tracking-[0.18em] text-emerald-600">
              PAYROLL DOCUMENT
            </div>

            <h3 className="mt-1 truncate text-base font-black text-gray-950 sm:text-lg">
              Salary Slip - {employeeName}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {url && !loading && (
              <a
                href={url}
                download={fileName}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-950 px-3.5 text-xs font-bold text-white transition hover:bg-gray-800"
              >
                <Download size={15} />
                <span className="hidden sm:inline">
                  Download
                </span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
              aria-label="Close salary slip"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-slate-100">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-gray-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Loader2
                  size={22}
                  className="animate-spin text-emerald-600"
                />
              </div>

              <div className="font-semibold text-gray-700">
                Preparing salary slip…
              </div>

              <div className="text-xs text-gray-400">
                Creating the professional PDF from the payroll snapshot.
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
                <div className="text-sm font-bold text-red-800">
                  Unable to generate salary slip
                </div>

                <p className="mt-2 text-xs leading-5 text-red-700">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 rounded-xl bg-gray-950 px-4 py-2.5 text-xs font-bold text-white"
                >
                  Close
                </button>
              </div>
            </div>
          ) : url ? (
            <iframe
              src={url}
              title={`Salary slip - ${employeeName}`}
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Salary slip preview is not available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return <section className="rounded-2xl border border-gray-100 bg-white"><div className="border-b border-gray-100 px-4 py-3 text-sm font-black text-gray-900">{title}</div><div className="divide-y divide-gray-100 px-4">{children}</div></section>;
}

function AmountRow({ label, value, helper, negative, strong, highlight }) {
  return <div className="flex items-center justify-between gap-4 py-3 text-sm"><div><div className={`${strong ? "font-black text-gray-900" : "font-medium text-gray-600"}`}>{label}</div>{helper ? <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{helper}</div> : null}</div><div className={`${highlight ? "font-black text-emerald-700" : strong ? "font-black text-gray-900" : negative ? "font-semibold text-orange-600" : "font-semibold text-gray-800"}`}>{value}</div></div>;
}
   
