import { useEffect, useMemo, useState } from "react";
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
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-[0.18em] text-emerald-600">SALARY MASTER</div>
            <h2 className="mt-1 text-xl font-black text-gray-950">Employee salary details</h2>
            <p className="mt-1 text-sm text-gray-500">Keep salary revisions versioned by effective date. Basic Pay is required; every other component is optional.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-xs text-gray-500">
            <ShieldCheck size={15} className="text-emerald-600" /> Industry-style component-based payroll
          </div>
        </div>

        {error && <div className="mt-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="text-xs font-bold text-gray-500">Employee
            <div className="relative mt-1.5">
              <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} disabled={loadingEmployees || saving} className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-gray-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50">
                {loadingEmployees ? <option>Loading employees…</option> : employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.name} · {employee.email}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </label>
          <div className="flex items-end">
            {selectedEmployee && <div className="w-full rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"><strong>{selectedEmployee.name}</strong> · Salary profile and history are maintained separately from attendance.</div>}
          </div>
        </div>
      </div>

      {!employeeId ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-400">Select an employee to manage salary.</div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div><div className="flex items-center gap-2"><CircleDollarSign size={18} className="text-emerald-600" /><h3 className="font-black text-gray-950">{editingId ? "Edit salary revision" : "Add salary revision"}</h3></div><p className="mt-1 text-xs text-gray-400">Use a new effective date whenever salary changes. Existing payroll snapshots are not changed.</p></div>
              {editingId && <button type="button" onClick={resetForm} className="self-start rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600">Cancel edit</button>}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Field label="Effective from"><input type="date" value={form.effectiveFrom} onChange={(event) => setForm({ ...form, effectiveFrom: event.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" /></Field>
              <Field label="Proration"><select value={form.prorationMethod} onChange={(event) => setForm({ ...form, prorationMethod: event.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"><option value="working_days">Working days</option><option value="calendar_days">Calendar days</option></select></Field>
              <Field label="Currency"><input value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase().slice(0, 10) })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" /></Field>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-slate-50 p-4">
              <Field label="Basic Pay (monthly)"><input type="number" min="0" step="0.01" value={form.basicPay} onChange={(event) => setForm({ ...form, basicPay: event.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 text-base font-black" placeholder="e.g. 18000" /></Field>
              <p className="mt-2 text-[11px] leading-5 text-gray-500">Basic Pay is the primary salary base. PF can be configured as a percentage of Basic Pay; statutory rates are kept configurable rather than hard-coded.</p>
            </div>

            <ComponentSection title="Earnings / allowances" subtitle="Examples: HRA, Special Allowance, Conveyance, Other Allowance" section="earnings" rows={form.earnings} onAdd={addComponent} onChange={updateComponent} onRemove={removeComponent} earnings />
            <ComponentSection title="Employee deductions" subtitle="Examples: PF, ESI, Professional Tax, TDS, Loan, Other Deduction" section="deductions" rows={form.deductions} onAdd={addComponent} onChange={updateComponent} onRemove={removeComponent} />
            <ComponentSection title="Employer contributions" subtitle="Shown in employer cost; not deducted from employee net salary" section="employerContributions" rows={form.employerContributions} onAdd={addComponent} onChange={updateComponent} />

            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.sandwichRule} onChange={(event) => setForm({ ...form, sandwichRule: event.target.checked })} className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                <span><strong className="text-sm text-gray-800">Apply sandwich rule in payroll</strong><span className="mt-0.5 block text-xs leading-5 text-gray-500">A holiday / weekly off block between approved leave days is treated as loss-of-pay for this employee's payroll snapshot. Monthly attendance data itself is not modified.</span></span>
              </label>
            </div>

            <Field label="Notes"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value.slice(0, 1500) })} rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 resize-none" placeholder="Optional payroll notes" /></Field>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <PreviewCard label="Monthly gross" value={money(preview.gross)} />
              <PreviewCard label="Employee deductions" value={money(preview.deductions)} />
              <PreviewCard label="Net before attendance / LOP" value={money(preview.net)} accent />
              <PreviewCard label="Monthly employer cost" value={money(preview.monthlyCtcCost)} />
            </div>

            <button type="button" onClick={save} disabled={!canManage || saving} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gray-950 px-5 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Save size={16} /> : <Check size={16} />}
              {saving ? "Saving…" : editingId ? "Update salary details" : "Save salary details"}
            </button>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between"><div><h3 className="font-black text-gray-950">Salary history</h3><p className="mt-1 text-xs text-gray-400">Payroll uses the structure effective for each period.</p></div><CircleDollarSign size={20} className="text-gray-300" /></div>
            <div className="mt-4 space-y-3">
              {loadingHistory ? <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-gray-400"><Loader2 size={17} className="animate-spin" /> Loading history…</div> : !history.length ? <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">No salary revision is configured.</div> : history.map((item) => {
                const previewItem = normalizeForEdit(item);
                let gross = Number(previewItem.basicPay || 0);
                previewItem.earnings.forEach((row) => { gross += row.calculationType === "percentage" ? Number(previewItem.basicPay || 0) * Number(row.value || 0) / 100 : Number(row.value || 0); });
                return <div key={item._id} className="rounded-2xl border border-gray-100 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-black text-gray-800">Effective {new Date(item.effectiveFrom).toLocaleDateString("en-IN")}</div><div className="mt-1 text-xs text-gray-500">Basic {money(previewItem.basicPay)} · Gross {money(gross)}</div></div><button type="button" onClick={() => editSalary(item)} disabled={!canManage} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 disabled:opacity-40"><Edit3 size={13} /> Edit</button></div><div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400"><span className="rounded-full bg-white px-2 py-1">{previewItem.prorationMethod === "calendar_days" ? "Calendar" : "Working days"}</span><span className="rounded-full bg-white px-2 py-1">Sandwich {previewItem.sandwichRule ? "On" : "Off"}</span>{previewItem.deductions.length > 0 && <span className="rounded-full bg-white px-2 py-1">{previewItem.deductions.length} deductions</span>}</div></div>;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

function ComponentSection({ title, subtitle, section, rows, onAdd, onChange, onRemove, earnings = false }) {
  const presets = COMPONENT_PRESETS[section] || [];
  const existingNames = new Set(rows.map((row) => String(row.name || "").trim().toLowerCase()));

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-black text-gray-900">{title}</h4>
          <p className="mt-1 text-[11px] leading-5 text-gray-400">{subtitle}</p>
        </div>
        <button type="button" onClick={() => onAdd(section)} className="inline-flex items-center gap-1.5 self-start rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50">
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
                className={`rounded-full border px-2.5 py-1.5 text-[10px] font-bold transition ${exists ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300" : "border-gray-200 bg-white text-gray-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"}`}
              >
                + {preset.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {!rows.length ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-xs text-gray-400">
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
  return <div className="rounded-2xl border border-gray-200 p-3">
    <div className="grid gap-2 md:grid-cols-[minmax(0,1.3fr)_130px_130px_44px]">
      <input value={row.name} onChange={(event) => onChange(section, index, "name", event.target.value)} placeholder="Component name" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" />
      <select value={row.calculationType} onChange={(event) => onChange(section, index, "calculationType", event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"><option value="fixed">Fixed ₹</option><option value="percentage">Percent %</option></select>
      <input type="number" min="0" step="0.01" value={row.value} onChange={(event) => onChange(section, index, "value", event.target.value)} placeholder="Value" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" />
      <button type="button" onClick={() => onRemove(section, index)} className="flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600"><Trash2 size={15} /></button>
    </div>

    <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
      {row.calculationType === "percentage" && !earnings && <label className="flex items-center gap-1.5"><span>Based on</span><select value={row.percentageOf} onChange={(event) => onChange(section, index, "percentageOf", event.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1"><option value="basic">Basic Pay</option><option value="gross">Gross</option></select></label>}
      <label className="flex items-center gap-1.5"><input type="checkbox" checked={row.prorate !== false} onChange={(event) => onChange(section, index, "prorate", event.target.checked)} className="rounded border-gray-300 text-emerald-600" /> Prorate with salary</label>
      <label className="flex items-center gap-1.5"><input type="checkbox" checked={row.statutory} onChange={(event) => onChange(section, index, "statutory", event.target.checked)} className="rounded border-gray-300 text-emerald-600" /> Statutory</label>
      <label className="flex items-center gap-1.5"><span>Cap</span><input type="number" min="0" step="0.01" value={row.capAmount} onChange={(event) => onChange(section, index, "capAmount", event.target.value)} placeholder="Optional" className="w-24 rounded-lg border border-gray-200 px-2 py-1" /></label>
    </div>
  </div>;
}

function Field({ label, children }) {
  return <label className="mt-4 block text-xs font-bold text-gray-500">{label}{children}</label>;
}

function PreviewCard({ label, value, accent }) {
  return <div className={`rounded-2xl border px-4 py-3 ${accent ? "border-emerald-100 bg-emerald-50" : "border-gray-100 bg-slate-50"}`}><div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div><div className={`mt-1 text-sm font-black ${accent ? "text-emerald-700" : "text-gray-900"}`}>{value}</div></div>;
}

/* Tailwind utility aliases kept local so this module does not depend on any other stylesheet. */
