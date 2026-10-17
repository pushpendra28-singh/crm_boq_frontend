import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createSalaryStructure,
  getPayrollEmployees,
  getSalaryStructures,
  updateSalaryStructure,
} from "./payrollApi";

/* ------------------------------------------------------------------ */
/* Constants & helpers (logic unchanged)                               */
/* ------------------------------------------------------------------ */

const emptyComponent = (name = "") => ({
  name,
  calculationType: "fixed",
  value: "",
  percentageOf: "basic",
  prorate: true,
  capAmount: "",
  statutory: false,
});

const COMPONENT_PRESETS = {
  earnings: [
    { name: "HRA", calculationType: "percentage", value: "", percentageOf: "basic" },
    { name: "Special Allowance", calculationType: "fixed", value: "" },
    { name: "Conveyance Allowance", calculationType: "fixed", value: "" },
    { name: "Other Allowance", calculationType: "fixed", value: "" },
  ],
  deductions: [
    { name: "PF", calculationType: "percentage", value: "", percentageOf: "basic", statutory: true },
    { name: "ESI", calculationType: "percentage", value: "", percentageOf: "gross", statutory: true },
    { name: "Professional Tax", calculationType: "fixed", value: "", statutory: true },
    { name: "TDS", calculationType: "fixed", value: "", statutory: true },
  ],
  employerContributions: [
    { name: "Employer PF", calculationType: "percentage", value: "", percentageOf: "basic", statutory: true },
    { name: "Employer ESI", calculationType: "percentage", value: "", percentageOf: "gross", statutory: true },
  ],
};

const emptyForm = () => ({
  effectiveFrom: new Date().toISOString().slice(0, 10),
  currency: "INR",
  prorationMethod: "working_days",
  sandwichRule: true,
  basicPay: "",
  earnings: [],
  deductions: [],
  employerContributions: [],
  notes: "",
});

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function normalizeForEdit(item) {
  const earnings = Array.isArray(item?.earnings) ? item.earnings : [];
  const basic = Number(item?.basicPay || 0);
  return {
    effectiveFrom: item?.effectiveFrom ? new Date(item.effectiveFrom).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    currency: item?.currency || "INR",
    prorationMethod: item?.prorationMethod || "working_days",
    sandwichRule: item?.sandwichRule !== false,
    basicPay: basic ? String(basic) : "",
    earnings: earnings.map((row) => ({ ...emptyComponent(), ...row, value: String(row.value ?? row.amount ?? "") })),
    deductions: (item?.deductions || []).map((row) => ({ ...emptyComponent(), ...row, value: String(row.value ?? row.amount ?? "") })),
    employerContributions: (item?.employerContributions || []).map((row) => ({ ...emptyComponent(), ...row, value: String(row.value ?? row.amount ?? "") })),
    notes: item?.notes || "",
  };
}

/* UI-only: shared input styling + animation presets */
const INPUT_CLS =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100";

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: EASE, delay },
});

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function SalaryManagement({ canManage }) {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoadingEmployees(true);
    getPayrollEmployees()
      .then((result) => {
        if (!active) return;
        setEmployees(result.employees || []);
        if (!employeeId && result.employees?.length) setEmployeeId(String(result.employees[0]._id));
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoadingEmployees(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!employeeId) {
      setHistory([]);
      setForm(emptyForm());
      setEditingId("");
      return;
    }

    let active = true;
    setLoadingHistory(true);
    setError("");
    getSalaryStructures(employeeId)
      .then((result) => {
        if (!active) return;
        setHistory(result.salaries || []);
        setForm(emptyForm());
        setEditingId("");
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoadingHistory(false));

    return () => { active = false; };
  }, [employeeId]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => String(employee._id) === String(employeeId)),
    [employees, employeeId]
  );

  const preview = useMemo(() => {
    const basic = Number(form.basicPay || 0);
    let gross = basic;
    for (const item of form.earnings) {
      const value = Number(item.value || 0);
      const amount = item.calculationType === "percentage" ? basic * value / 100 : value;
      gross += Number.isFinite(amount) ? amount : 0;
    }

    let deductions = 0;
    for (const item of form.deductions) {
      const value = Number(item.value || 0);
      const amount = item.calculationType === "percentage" ? (item.percentageOf === "gross" ? gross : basic) * value / 100 : value;
      deductions += Number.isFinite(amount) ? amount : 0;
    }

    let employer = 0;
    for (const item of form.employerContributions) {
      const value = Number(item.value || 0);
      const amount = item.calculationType === "percentage" ? (item.percentageOf === "gross" ? gross : basic) * value / 100 : value;
      employer += Number.isFinite(amount) ? amount : 0;
    }

    return { gross, deductions, employer, net: Math.max(0, gross - deductions), monthlyCtcCost: gross + employer };
  }, [form]);

  function resetForm() {
    setForm(emptyForm());
    setEditingId("");
  }

  function editSalary(item) {
    setForm(normalizeForEdit(item));
    setEditingId(String(item._id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateComponent(section, index, key, value) {
    setForm((current) => ({
      ...current,
      [section]: current[section].map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row),
    }));
  }

  function addComponent(section, preset = null) {
    setForm((current) => ({
      ...current,
      [section]: [
        ...current[section],
        {
          ...emptyComponent(),
          ...(preset || {}),
        },
      ],
    }));
  }

  function removeComponent(section, index) {
    setForm((current) => ({ ...current, [section]: current[section].filter((_, rowIndex) => rowIndex !== index) }));
  }

  async function save() {
    if (!employeeId) return;
    if (!form.effectiveFrom) {
      toast.error("Effective date is required.");
      return;
    }
    if (Number(form.basicPay) <= 0) {
      toast.error("Basic Pay must be greater than zero.");
      return;
    }

    const payload = {
      employeeId,
      effectiveFrom: form.effectiveFrom,
      currency: form.currency,
      prorationMethod: form.prorationMethod,
      sandwichRule: form.sandwichRule,
      basicPay: Number(form.basicPay),
      earnings: normalizeComponents(form.earnings),
      deductions: normalizeComponents(form.deductions),
      employerContributions: normalizeComponents(form.employerContributions),
      notes: form.notes,
    };

    setSaving(true);
    try {
      if (editingId) await updateSalaryStructure(editingId, payload);
      else await createSalaryStructure(payload);
      toast.success(editingId ? "Salary details updated." : "Salary details saved.");
      const result = await getSalaryStructures(employeeId);
      setHistory(result.salaries || []);
      resetForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* ------------------------- Salary master header ------------------------- */}
      <motion.div
        {...fadeUp(0)}
        className="relative overflow-hidden rounded-3xl border border-slate-800/10 bg-gradient-to-br from-[#0a1230] via-[#0f1d4d] to-[#13287a] p-5 shadow-lg shadow-blue-950/20 md:p-6"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-lg shadow-orange-500/30 sm:flex">
              <CircleDollarSign size={22} />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-[0.18em] text-amber-300">SALARY MASTER</div>
              <h2 className="mt-1 text-xl font-black text-white md:text-2xl">Employee salary details</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-100/70">Keep salary revisions versioned by effective date. Basic Pay is required; every other component is optional.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-medium text-blue-50 backdrop-blur lg:self-auto">
            <ShieldCheck size={15} className="text-emerald-300" /> Industry-style component-based payroll
          </div>
        </div>

        {error && <div className="relative mt-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}

        <div className="relative mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="text-xs font-bold text-blue-100/80">Employee
            <div className="relative mt-1.5">
              <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} disabled={loadingEmployees || saving} className="w-full appearance-none rounded-2xl border border-white/10 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-800 shadow-md outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-400/40 disabled:opacity-70">
                {loadingEmployees ? <option>Loading employees…</option> : employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.name} · {employee.email}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </label>
          <div className="flex items-end">
            {selectedEmployee && (
              <motion.div
                key={selectedEmployee._id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="flex w-full items-center gap-3 rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-4 py-3 text-xs text-emerald-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-xs font-black uppercase text-white">
                  {(selectedEmployee.name || "?").trim().charAt(0)}
                </span>
                <span><strong className="text-white">{selectedEmployee.name}</strong> · Salary profile and history are maintained separately from attendance.</span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {!employeeId ? (
        <motion.div {...fadeUp(0.05)} className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-400">Select an employee to manage salary.</motion.div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
          {/* ------------------------------ Form card ------------------------------ */}
          <motion.div {...fadeUp(0.08)} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-9 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-violet-500" />
                <div>
                  <div className="flex items-center gap-2"><CircleDollarSign size={18} className="text-blue-600" /><h3 className="font-black text-[#0b1437]">{editingId ? "Edit salary revision" : "Add salary revision"}</h3></div>
                  <p className="mt-1 text-xs text-slate-400">Use a new effective date whenever salary changes. Existing payroll snapshots are not changed.</p>
                </div>
              </div>
              {editingId && <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.96 }} type="button" onClick={resetForm} className="self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">Cancel edit</motion.button>}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Field label="Effective from"><input type="date" value={form.effectiveFrom} onChange={(event) => setForm({ ...form, effectiveFrom: event.target.value })} className={INPUT_CLS} /></Field>
              <Field label="Proration"><select value={form.prorationMethod} onChange={(event) => setForm({ ...form, prorationMethod: event.target.value })} className={INPUT_CLS}><option value="working_days">Working days</option><option value="calendar_days">Calendar days</option></select></Field>
              <Field label="Currency"><input value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase().slice(0, 10) })} className={INPUT_CLS} /></Field>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-violet-50/50 p-4">
              <Field label="Basic Pay (monthly)"><input type="number" min="0" step="0.01" value={form.basicPay} onChange={(event) => setForm({ ...form, basicPay: event.target.value })} className={`${INPUT_CLS} text-base font-black`} placeholder="e.g. 18000" /></Field>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">Basic Pay is the primary salary base. PF can be configured as a percentage of Basic Pay; statutory rates are kept configurable rather than hard-coded.</p>
            </div>

            <ComponentSection title="Earnings / allowances" subtitle="Examples: HRA, Special Allowance, Conveyance, Other Allowance" section="earnings" tone="green" rows={form.earnings} onAdd={addComponent} onChange={updateComponent} onRemove={removeComponent} earnings />
            <ComponentSection title="Employee deductions" subtitle="Examples: PF, ESI, Professional Tax, TDS, Loan, Other Deduction" section="deductions" tone="orange" rows={form.deductions} onAdd={addComponent} onChange={updateComponent} onRemove={removeComponent} />
            <ComponentSection title="Employer contributions" subtitle="Shown in employer cost; not deducted from employee net salary" section="employerContributions" tone="violet" rows={form.employerContributions} onAdd={addComponent} onChange={updateComponent} />

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-blue-200 hover:bg-blue-50/30">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.sandwichRule} onChange={(event) => setForm({ ...form, sandwichRule: event.target.checked })} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 transition focus:ring-blue-500" />
                <span><strong className="text-sm text-[#0b1437]">Apply sandwich rule in payroll</strong><span className="mt-0.5 block text-xs leading-5 text-slate-500">A holiday / weekly off block between approved leave days is treated as loss-of-pay for this employee's payroll snapshot. Monthly attendance data itself is not modified.</span></span>
              </label>
            </div>

            <Field label="Notes"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value.slice(0, 1500) })} rows={3} className={`${INPUT_CLS} resize-none`} placeholder="Optional payroll notes" /></Field>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <PreviewCard label="Monthly gross" value={money(preview.gross)} grad="from-emerald-500 to-green-600" />
              <PreviewCard label="Employee deductions" value={money(preview.deductions)} grad="from-orange-400 to-orange-500" />
              <PreviewCard label="Net before attendance / LOP" value={money(preview.net)} grad="from-blue-500 to-sky-600" accent />
              <PreviewCard label="Monthly employer cost" value={money(preview.monthlyCtcCost)} grad="from-indigo-500 to-violet-600" />
            </div>

            <motion.button
              whileHover={canManage && !saving ? { y: -2 } : undefined}
              whileTap={canManage && !saving ? { scale: 0.97 } : undefined}
              type="button"
              onClick={save}
              disabled={!canManage || saving}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-shadow hover:shadow-xl hover:shadow-blue-600/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Save size={16} /> : <Check size={16} />}
              {saving ? "Saving…" : editingId ? "Update salary details" : "Save salary details"}
            </motion.button>
          </motion.div>

          {/* ---------------------------- History card ----------------------------- */}
          <motion.div {...fadeUp(0.16)} className="self-start rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-9 w-1.5 rounded-full bg-gradient-to-b from-emerald-400 to-blue-500" />
                <div>
                  <h3 className="font-black text-[#0b1437]">Salary history</h3>
                  <p className="mt-1 text-xs text-slate-400">Payroll uses the structure effective for each period.</p>
                </div>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-500"><CircleDollarSign size={20} /></span>
            </div>
            <div className="mt-4 space-y-3">
              {loadingHistory ? <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-400"><Loader2 size={17} className="animate-spin text-blue-600" /> Loading history…</div> : !history.length ? <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">No salary revision is configured.</div> : history.map((item, itemIndex) => {
                const previewItem = normalizeForEdit(item);
                let gross = Number(previewItem.basicPay || 0);
                previewItem.earnings.forEach((row) => { gross += row.calculationType === "percentage" ? Number(previewItem.basicPay || 0) * Number(row.value || 0) / 100 : Number(row.value || 0); });
                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: Math.min(itemIndex, 8) * 0.06 }}
                    whileHover={{ y: -2 }}
                    className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 transition-shadow hover:border-blue-100 hover:shadow-md hover:shadow-blue-900/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-[#0b1437]">Effective {new Date(item.effectiveFrom).toLocaleDateString("en-IN")}</div>
                        <div className="mt-1 text-xs text-slate-500">Basic {money(previewItem.basicPay)} · Gross <span className="font-bold text-emerald-600">{money(gross)}</span></div>
                      </div>
                      <button type="button" onClick={() => editSalary(item)} disabled={!canManage} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95 disabled:opacity-40"><Edit3 size={13} /> Edit</button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-blue-600">{previewItem.prorationMethod === "calendar_days" ? "Calendar" : "Working days"}</span>
                      <span className={`rounded-full border px-2 py-1 ${previewItem.sandwichRule ? "border-violet-100 bg-violet-50 text-violet-600" : "border-slate-200 bg-slate-100 text-slate-500"}`}>Sandwich {previewItem.sandwichRule ? "On" : "Off"}</span>
                      {previewItem.deductions.length > 0 && <span className="rounded-full border border-orange-100 bg-orange-50 px-2 py-1 text-orange-600">{previewItem.deductions.length} deductions</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component helpers                                                   */
/* ------------------------------------------------------------------ */

function normalizeComponents(rows) {
  return rows
    .filter((row) => String(row.name || "").trim() && Number(row.value || 0) > 0)
    .map((row) => ({
    name: String(row.name).trim(),
    calculationType: row.calculationType === "percentage" ? "percentage" : "fixed",
    value: Number(row.value || 0),
    percentageOf: row.percentageOf === "gross" ? "gross" : "basic",
    prorate: row.prorate !== false,
    capAmount: row.capAmount === "" ? null : Number(row.capAmount),
    statutory: Boolean(row.statutory),
  }));
}

const SECTION_TONES = {
  green: { bar: "from-emerald-400 to-green-600", chip: "hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700", add: "text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200" },
  orange: { bar: "from-orange-400 to-amber-500", chip: "hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700", add: "text-orange-700 hover:bg-orange-50 hover:border-orange-200" },
  violet: { bar: "from-indigo-500 to-violet-600", chip: "hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700", add: "text-violet-700 hover:bg-violet-50 hover:border-violet-200" },
};

function ComponentSection({ title, subtitle, section, rows, onAdd, onChange, onRemove, earnings = false, tone = "green" }) {
  const presets = COMPONENT_PRESETS[section] || [];
  const existingNames = new Set(rows.map((row) => String(row.name || "").trim().toLowerCase()));
  const theme = SECTION_TONES[tone] || SECTION_TONES.green;

  return (
    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2.5">
          <span className={`mt-0.5 h-8 w-1 rounded-full bg-gradient-to-b ${theme.bar}`} />
          <div>
            <h4 className="text-sm font-black text-[#0b1437]">{title}</h4>
            <p className="mt-0.5 text-[11px] leading-5 text-slate-400">{subtitle}</p>
          </div>
        </div>
        <button type="button" onClick={() => onAdd(section)} className={`inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold transition active:scale-95 ${theme.add}`}>
          <Plus size={14} /> Add custom
        </button>
      </div>

      {presets.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {presets.map((preset) => {
            const exists = existingNames.has(preset.name.toLowerCase());
            return (
              <button
                key={preset.name}
                type="button"
                disabled={exists}
                onClick={() => onAdd(section, preset)}
                className={`rounded-full border px-2.5 py-1.5 text-[10px] font-bold transition-all duration-200 ${exists ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300" : `border-slate-200 bg-white text-slate-500 active:scale-95 ${theme.chip}`}`}
              >
                + {preset.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {!rows.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-5 text-xs text-slate-400">
            No optional components added. Use a quick preset above or add a custom component.
          </div>
        ) : (
          rows.map((row, index) => (
            <ComponentRow key={`${section}-${index}`} row={row} section={section} index={index} earnings={earnings} onChange={onChange} onRemove={onRemove} />
          ))
        )}
      </div>
    </div>
  );
}

function ComponentRow({ row, section, index, earnings, onChange, onRemove }) {
  return <motion.div
    initial={{ opacity: 0, y: -8, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.3, ease: EASE }}
    className="rounded-2xl border border-slate-200 bg-slate-50/40 p-3 transition-colors hover:border-blue-200 hover:bg-white"
  >
    <div className="grid gap-2 md:grid-cols-[minmax(0,1.3fr)_130px_130px_44px]">
      <input value={row.name} onChange={(event) => onChange(section, index, "name", event.target.value)} placeholder="Component name" className={INPUT_CLS} />
      <select value={row.calculationType} onChange={(event) => onChange(section, index, "calculationType", event.target.value)} className={INPUT_CLS}><option value="fixed">Fixed ₹</option><option value="percentage">Percent %</option></select>
      <input type="number" min="0" step="0.01" value={row.value} onChange={(event) => onChange(section, index, "value", event.target.value)} placeholder="Value" className={INPUT_CLS} />
      <button type="button" onClick={() => onRemove(section, index)} className="flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"><Trash2 size={15} /></button>
    </div>

    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
      {row.calculationType === "percentage" && !earnings && <label className="flex items-center gap-1.5"><span>Based on</span><select value={row.percentageOf} onChange={(event) => onChange(section, index, "percentageOf", event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"><option value="basic">Basic Pay</option><option value="gross">Gross</option></select></label>}
      <label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={row.prorate !== false} onChange={(event) => onChange(section, index, "prorate", event.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /> Prorate with salary</label>
      <label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={row.statutory} onChange={(event) => onChange(section, index, "statutory", event.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /> Statutory</label>
      <label className="flex items-center gap-1.5"><span>Cap</span><input type="number" min="0" step="0.01" value={row.capAmount} onChange={(event) => onChange(section, index, "capAmount", event.target.value)} placeholder="Optional" className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
    </div>
  </motion.div>;
}

function Field({ label, children }) {
  return <label className="mt-4 block text-xs font-bold text-slate-500"><span className="mb-1.5 block">{label}</span>{children}</label>;
}

function PreviewCard({ label, value, grad = "from-slate-500 to-slate-600", accent }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} px-4 py-3 text-white shadow-md ${accent ? "ring-2 ring-blue-300/50" : ""}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">{label}</div>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="mt-1 truncate text-sm font-black"
      >
        {value}
      </motion.div>
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-white/15" />
    </div>
  );
}


// import { useEffect, useMemo, useState } from "react";
// import {
//   AlertCircle,
//   Check,
//   ChevronDown,
//   CircleDollarSign,
//   Edit3,
//   Loader2,
//   Plus,
//   Save,
//   ShieldCheck,
//   Trash2,
// } from "lucide-react";
// import toast from "react-hot-toast";
// import {
//   createSalaryStructure,
//   getPayrollEmployees,
//   getSalaryStructures,
//   updateSalaryStructure,
// } from "./payrollApi";

// const emptyComponent = (name = "") => ({
//   name,
//   calculationType: "fixed",
//   value: "",
//   percentageOf: "basic",
//   prorate: true,
//   capAmount: "",
//   statutory: false,
// });

// const COMPONENT_PRESETS = {
//   earnings: [
//     { name: "HRA", calculationType: "percentage", value: "", percentageOf: "basic" },
//     { name: "Special Allowance", calculationType: "fixed", value: "" },
//     { name: "Conveyance Allowance", calculationType: "fixed", value: "" },
//     { name: "Other Allowance", calculationType: "fixed", value: "" },
//   ],
//   deductions: [
//     { name: "PF", calculationType: "percentage", value: "", percentageOf: "basic", statutory: true },
//     { name: "ESI", calculationType: "percentage", value: "", percentageOf: "gross", statutory: true },
//     { name: "Professional Tax", calculationType: "fixed", value: "", statutory: true },
//     { name: "TDS", calculationType: "fixed", value: "", statutory: true },
//   ],
//   employerContributions: [
//     { name: "Employer PF", calculationType: "percentage", value: "", percentageOf: "basic", statutory: true },
//     { name: "Employer ESI", calculationType: "percentage", value: "", percentageOf: "gross", statutory: true },
//   ],
// };

// const emptyForm = () => ({
//   effectiveFrom: new Date().toISOString().slice(0, 10),
//   currency: "INR",
//   prorationMethod: "working_days",
//   sandwichRule: true,
//   basicPay: "",
//   earnings: [],
//   deductions: [],
//   employerContributions: [],
//   notes: "",
// });

// function money(value) {
//   return new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     maximumFractionDigits: 2,
//   }).format(Number(value || 0));
// }

// function normalizeForEdit(item) {
//   const earnings = Array.isArray(item?.earnings) ? item.earnings : [];
//   const basic = Number(item?.basicPay || 0);
//   return {
//     effectiveFrom: item?.effectiveFrom ? new Date(item.effectiveFrom).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
//     currency: item?.currency || "INR",
//     prorationMethod: item?.prorationMethod || "working_days",
//     sandwichRule: item?.sandwichRule !== false,
//     basicPay: basic ? String(basic) : "",
//     earnings: earnings.map((row) => ({ ...emptyComponent(), ...row, value: String(row.value ?? row.amount ?? "") })),
//     deductions: (item?.deductions || []).map((row) => ({ ...emptyComponent(), ...row, value: String(row.value ?? row.amount ?? "") })),
//     employerContributions: (item?.employerContributions || []).map((row) => ({ ...emptyComponent(), ...row, value: String(row.value ?? row.amount ?? "") })),
//     notes: item?.notes || "",
//   };
// }

// export default function SalaryManagement({ canManage }) {
//   const [employees, setEmployees] = useState([]);
//   const [employeeId, setEmployeeId] = useState("");
//   const [history, setHistory] = useState([]);
//   const [form, setForm] = useState(emptyForm);
//   const [editingId, setEditingId] = useState("");
//   const [loadingEmployees, setLoadingEmployees] = useState(true);
//   const [loadingHistory, setLoadingHistory] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     let active = true;
//     setLoadingEmployees(true);
//     getPayrollEmployees()
//       .then((result) => {
//         if (!active) return;
//         setEmployees(result.employees || []);
//         if (!employeeId && result.employees?.length) setEmployeeId(String(result.employees[0]._id));
//       })
//       .catch((err) => active && setError(err.message))
//       .finally(() => active && setLoadingEmployees(false));
//     return () => { active = false; };
//   }, []);

//   useEffect(() => {
//     if (!employeeId) {
//       setHistory([]);
//       setForm(emptyForm());
//       setEditingId("");
//       return;
//     }

//     let active = true;
//     setLoadingHistory(true);
//     setError("");
//     getSalaryStructures(employeeId)
//       .then((result) => {
//         if (!active) return;
//         setHistory(result.salaries || []);
//         setForm(emptyForm());
//         setEditingId("");
//       })
//       .catch((err) => active && setError(err.message))
//       .finally(() => active && setLoadingHistory(false));

//     return () => { active = false; };
//   }, [employeeId]);

//   const selectedEmployee = useMemo(
//     () => employees.find((employee) => String(employee._id) === String(employeeId)),
//     [employees, employeeId]
//   );

//   const preview = useMemo(() => {
//     const basic = Number(form.basicPay || 0);
//     let gross = basic;
//     for (const item of form.earnings) {
//       const value = Number(item.value || 0);
//       const amount = item.calculationType === "percentage" ? basic * value / 100 : value;
//       gross += Number.isFinite(amount) ? amount : 0;
//     }

//     let deductions = 0;
//     for (const item of form.deductions) {
//       const value = Number(item.value || 0);
//       const amount = item.calculationType === "percentage" ? (item.percentageOf === "gross" ? gross : basic) * value / 100 : value;
//       deductions += Number.isFinite(amount) ? amount : 0;
//     }

//     let employer = 0;
//     for (const item of form.employerContributions) {
//       const value = Number(item.value || 0);
//       const amount = item.calculationType === "percentage" ? (item.percentageOf === "gross" ? gross : basic) * value / 100 : value;
//       employer += Number.isFinite(amount) ? amount : 0;
//     }

//     return { gross, deductions, employer, net: Math.max(0, gross - deductions), monthlyCtcCost: gross + employer };
//   }, [form]);

//   function resetForm() {
//     setForm(emptyForm());
//     setEditingId("");
//   }

//   function editSalary(item) {
//     setForm(normalizeForEdit(item));
//     setEditingId(String(item._id));
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   }

//   function updateComponent(section, index, key, value) {
//     setForm((current) => ({
//       ...current,
//       [section]: current[section].map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row),
//     }));
//   }

//   function addComponent(section, preset = null) {
//     setForm((current) => ({
//       ...current,
//       [section]: [
//         ...current[section],
//         {
//           ...emptyComponent(),
//           ...(preset || {}),
//         },
//       ],
//     }));
//   }

//   function removeComponent(section, index) {
//     setForm((current) => ({ ...current, [section]: current[section].filter((_, rowIndex) => rowIndex !== index) }));
//   }

//   async function save() {
//     if (!employeeId) return;
//     if (!form.effectiveFrom) {
//       toast.error("Effective date is required.");
//       return;
//     }
//     if (Number(form.basicPay) <= 0) {
//       toast.error("Basic Pay must be greater than zero.");
//       return;
//     }

//     const payload = {
//       employeeId,
//       effectiveFrom: form.effectiveFrom,
//       currency: form.currency,
//       prorationMethod: form.prorationMethod,
//       sandwichRule: form.sandwichRule,
//       basicPay: Number(form.basicPay),
//       earnings: normalizeComponents(form.earnings),
//       deductions: normalizeComponents(form.deductions),
//       employerContributions: normalizeComponents(form.employerContributions),
//       notes: form.notes,
//     };

//     setSaving(true);
//     try {
//       if (editingId) await updateSalaryStructure(editingId, payload);
//       else await createSalaryStructure(payload);
//       toast.success(editingId ? "Salary details updated." : "Salary details saved.");
//       const result = await getSalaryStructures(employeeId);
//       setHistory(result.salaries || []);
//       resetForm();
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <div className="space-y-5">
//       <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
//         <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
//           <div>
//             <div className="text-[11px] font-bold tracking-[0.18em] text-emerald-600">SALARY MASTER</div>
//             <h2 className="mt-1 text-xl font-black text-gray-950">Employee salary details</h2>
//             <p className="mt-1 text-sm text-gray-500">Keep salary revisions versioned by effective date. Basic Pay is required; every other component is optional.</p>
//           </div>
//           <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-xs text-gray-500">
//             <ShieldCheck size={15} className="text-emerald-600" /> Industry-style component-based payroll
//           </div>
//         </div>

//         {error && <div className="mt-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}

//         <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
//           <label className="text-xs font-bold text-gray-500">Employee
//             <div className="relative mt-1.5">
//               <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} disabled={loadingEmployees || saving} className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-gray-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50">
//                 {loadingEmployees ? <option>Loading employees…</option> : employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.name} · {employee.email}</option>)}
//               </select>
//               <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
//             </div>
//           </label>
//           <div className="flex items-end">
//             {selectedEmployee && <div className="w-full rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"><strong>{selectedEmployee.name}</strong> · Salary profile and history are maintained separately from attendance.</div>}
//           </div>
//         </div>
//       </div>

//       {!employeeId ? (
//         <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-400">Select an employee to manage salary.</div>
//       ) : (
//         <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
//           <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
//             <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
//               <div><div className="flex items-center gap-2"><CircleDollarSign size={18} className="text-emerald-600" /><h3 className="font-black text-gray-950">{editingId ? "Edit salary revision" : "Add salary revision"}</h3></div><p className="mt-1 text-xs text-gray-400">Use a new effective date whenever salary changes. Existing payroll snapshots are not changed.</p></div>
//               {editingId && <button type="button" onClick={resetForm} className="self-start rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600">Cancel edit</button>}
//             </div>

//             <div className="mt-5 grid gap-3 md:grid-cols-3">
//               <Field label="Effective from"><input type="date" value={form.effectiveFrom} onChange={(event) => setForm({ ...form, effectiveFrom: event.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" /></Field>
//               <Field label="Proration"><select value={form.prorationMethod} onChange={(event) => setForm({ ...form, prorationMethod: event.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"><option value="working_days">Working days</option><option value="calendar_days">Calendar days</option></select></Field>
//               <Field label="Currency"><input value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase().slice(0, 10) })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" /></Field>
//             </div>

//             <div className="mt-4 rounded-2xl border border-gray-200 bg-slate-50 p-4">
//               <Field label="Basic Pay (monthly)"><input type="number" min="0" step="0.01" value={form.basicPay} onChange={(event) => setForm({ ...form, basicPay: event.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 text-base font-black" placeholder="e.g. 18000" /></Field>
//               <p className="mt-2 text-[11px] leading-5 text-gray-500">Basic Pay is the primary salary base. PF can be configured as a percentage of Basic Pay; statutory rates are kept configurable rather than hard-coded.</p>
//             </div>

//             <ComponentSection title="Earnings / allowances" subtitle="Examples: HRA, Special Allowance, Conveyance, Other Allowance" section="earnings" rows={form.earnings} onAdd={addComponent} onChange={updateComponent} onRemove={removeComponent} earnings />
//             <ComponentSection title="Employee deductions" subtitle="Examples: PF, ESI, Professional Tax, TDS, Loan, Other Deduction" section="deductions" rows={form.deductions} onAdd={addComponent} onChange={updateComponent} onRemove={removeComponent} />
//             <ComponentSection title="Employer contributions" subtitle="Shown in employer cost; not deducted from employee net salary" section="employerContributions" rows={form.employerContributions} onAdd={addComponent} onChange={updateComponent} />

//             <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
//               <label className="flex cursor-pointer items-start gap-3">
//                 <input type="checkbox" checked={form.sandwichRule} onChange={(event) => setForm({ ...form, sandwichRule: event.target.checked })} className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
//                 <span><strong className="text-sm text-gray-800">Apply sandwich rule in payroll</strong><span className="mt-0.5 block text-xs leading-5 text-gray-500">A holiday / weekly off block between approved leave days is treated as loss-of-pay for this employee's payroll snapshot. Monthly attendance data itself is not modified.</span></span>
//               </label>
//             </div>

//             <Field label="Notes"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value.slice(0, 1500) })} rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 resize-none" placeholder="Optional payroll notes" /></Field>

//             <div className="mt-5 grid gap-3 sm:grid-cols-4">
//               <PreviewCard label="Monthly gross" value={money(preview.gross)} />
//               <PreviewCard label="Employee deductions" value={money(preview.deductions)} />
//               <PreviewCard label="Net before attendance / LOP" value={money(preview.net)} accent />
//               <PreviewCard label="Monthly employer cost" value={money(preview.monthlyCtcCost)} />
//             </div>

//             <button type="button" onClick={save} disabled={!canManage || saving} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gray-950 px-5 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
//               {saving ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Save size={16} /> : <Check size={16} />}
//               {saving ? "Saving…" : editingId ? "Update salary details" : "Save salary details"}
//             </button>
//           </div>

//           <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
//             <div className="flex items-center justify-between"><div><h3 className="font-black text-gray-950">Salary history</h3><p className="mt-1 text-xs text-gray-400">Payroll uses the structure effective for each period.</p></div><CircleDollarSign size={20} className="text-gray-300" /></div>
//             <div className="mt-4 space-y-3">
//               {loadingHistory ? <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-gray-400"><Loader2 size={17} className="animate-spin" /> Loading history…</div> : !history.length ? <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">No salary revision is configured.</div> : history.map((item) => {
//                 const previewItem = normalizeForEdit(item);
//                 let gross = Number(previewItem.basicPay || 0);
//                 previewItem.earnings.forEach((row) => { gross += row.calculationType === "percentage" ? Number(previewItem.basicPay || 0) * Number(row.value || 0) / 100 : Number(row.value || 0); });
//                 return <div key={item._id} className="rounded-2xl border border-gray-100 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-black text-gray-800">Effective {new Date(item.effectiveFrom).toLocaleDateString("en-IN")}</div><div className="mt-1 text-xs text-gray-500">Basic {money(previewItem.basicPay)} · Gross {money(gross)}</div></div><button type="button" onClick={() => editSalary(item)} disabled={!canManage} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 disabled:opacity-40"><Edit3 size={13} /> Edit</button></div><div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400"><span className="rounded-full bg-white px-2 py-1">{previewItem.prorationMethod === "calendar_days" ? "Calendar" : "Working days"}</span><span className="rounded-full bg-white px-2 py-1">Sandwich {previewItem.sandwichRule ? "On" : "Off"}</span>{previewItem.deductions.length > 0 && <span className="rounded-full bg-white px-2 py-1">{previewItem.deductions.length} deductions</span>}</div></div>;
//               })}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function normalizeComponents(rows) {
//   return rows
//     .filter((row) => String(row.name || "").trim() && Number(row.value || 0) > 0)
//     .map((row) => ({
//     name: String(row.name).trim(),
//     calculationType: row.calculationType === "percentage" ? "percentage" : "fixed",
//     value: Number(row.value || 0),
//     percentageOf: row.percentageOf === "gross" ? "gross" : "basic",
//     prorate: row.prorate !== false,
//     capAmount: row.capAmount === "" ? null : Number(row.capAmount),
//     statutory: Boolean(row.statutory),
//   }));
// }

// function ComponentSection({ title, subtitle, section, rows, onAdd, onChange, onRemove, earnings = false }) {
//   const presets = COMPONENT_PRESETS[section] || [];
//   const existingNames = new Set(rows.map((row) => String(row.name || "").trim().toLowerCase()));

//   return (
//     <div className="mt-6">
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
//         <div>
//           <h4 className="text-sm font-black text-gray-900">{title}</h4>
//           <p className="mt-1 text-[11px] leading-5 text-gray-400">{subtitle}</p>
//         </div>
//         <button type="button" onClick={() => onAdd(section)} className="inline-flex items-center gap-1.5 self-start rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50">
//           <Plus size={14} /> Add custom
//         </button>
//       </div>

//       {presets.length > 0 && (
//         <div className="mt-3 flex flex-wrap gap-1.5">
//           {presets.map((preset) => {
//             const exists = existingNames.has(preset.name.toLowerCase());
//             return (
//               <button
//                 key={preset.name}
//                 type="button"
//                 disabled={exists}
//                 onClick={() => onAdd(section, preset)}
//                 className={`rounded-full border px-2.5 py-1.5 text-[10px] font-bold transition ${exists ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300" : "border-gray-200 bg-white text-gray-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"}`}
//               >
//                 + {preset.name}
//               </button>
//             );
//           })}
//         </div>
//       )}

//       <div className="mt-3 space-y-2">
//         {!rows.length ? (
//           <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-xs text-gray-400">
//             No optional components added. Use a quick preset above or add a custom component.
//           </div>
//         ) : (
//           rows.map((row, index) => (
//             <ComponentRow key={`${section}-${index}`} row={row} section={section} index={index} earnings={earnings} onChange={onChange} onRemove={onRemove} />
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// function ComponentRow({ row, section, index, earnings, onChange, onRemove }) {
//   return <div className="rounded-2xl border border-gray-200 p-3">
//     <div className="grid gap-2 md:grid-cols-[minmax(0,1.3fr)_130px_130px_44px]">
//       <input value={row.name} onChange={(event) => onChange(section, index, "name", event.target.value)} placeholder="Component name" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" />
//       <select value={row.calculationType} onChange={(event) => onChange(section, index, "calculationType", event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"><option value="fixed">Fixed ₹</option><option value="percentage">Percent %</option></select>
//       <input type="number" min="0" step="0.01" value={row.value} onChange={(event) => onChange(section, index, "value", event.target.value)} placeholder="Value" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" />
//       <button type="button" onClick={() => onRemove(section, index)} className="flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600"><Trash2 size={15} /></button>
//     </div>

//     <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
//       {row.calculationType === "percentage" && !earnings && <label className="flex items-center gap-1.5"><span>Based on</span><select value={row.percentageOf} onChange={(event) => onChange(section, index, "percentageOf", event.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1"><option value="basic">Basic Pay</option><option value="gross">Gross</option></select></label>}
//       <label className="flex items-center gap-1.5"><input type="checkbox" checked={row.prorate !== false} onChange={(event) => onChange(section, index, "prorate", event.target.checked)} className="rounded border-gray-300 text-emerald-600" /> Prorate with salary</label>
//       <label className="flex items-center gap-1.5"><input type="checkbox" checked={row.statutory} onChange={(event) => onChange(section, index, "statutory", event.target.checked)} className="rounded border-gray-300 text-emerald-600" /> Statutory</label>
//       <label className="flex items-center gap-1.5"><span>Cap</span><input type="number" min="0" step="0.01" value={row.capAmount} onChange={(event) => onChange(section, index, "capAmount", event.target.value)} placeholder="Optional" className="w-24 rounded-lg border border-gray-200 px-2 py-1" /></label>
//     </div>
//   </div>;
// }

// function Field({ label, children }) {
//   return <label className="mt-4 block text-xs font-bold text-gray-500">{label}{children}</label>;
// }

// function PreviewCard({ label, value, accent }) {
//   return <div className={`rounded-2xl border px-4 py-3 ${accent ? "border-emerald-100 bg-emerald-50" : "border-gray-100 bg-slate-50"}`}><div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div><div className={`mt-1 text-sm font-black ${accent ? "text-emerald-700" : "text-gray-900"}`}>{value}</div></div>;
// }

// /* Tailwind utility aliases kept local so this module does not depend on any other stylesheet. */
