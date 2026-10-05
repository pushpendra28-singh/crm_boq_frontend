import { useRef, useState } from "react";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { holidayRequest } from "./holidayApi";
import { showDate, todayIST, validDate } from "./holidayHelpers";
import { Modal, Notice, useHolidayData, inputClass, buttonClass, primaryClass } from "./holidayUi";

function HolidayForm({ year, target, onClose, onChanged }) {
  const bulk = !target, deleting = target?.action === "delete";
  const nextId = useRef(1), lock = useRef(false);
  const [rows, setRows] = useState([{ key: 0, name: target?.name || "", date: target?.date || "" }]);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [result, setResult] = useState(null), [finished, setFinished] = useState(false);
  const historical = !!target && (target.date < todayIST() || rows[0].date < todayIST());
  const changeRow = (key, field, value) => { setRows(items => items.map(row => row.key === key ? { ...row, [field]: value } : row)); setConfirmed(false); };
  async function submit(event) {
    event.preventDefault();
    if (lock.current || finished) return;
    setError("");
    if (!deleting) {
      const dates = new Set();
      for (const [index, row] of rows.entries()) {
        if (row.name.trim().length < 2 || row.name.trim().length > 120 || !validDate(row.date)) { setError(`Row ${index + 1}: enter a valid name and date.`); return; }
        if (bulk && !row.date.startsWith(`${year}-`)) { setError(`All dates must belong to ${year}.`); return; }
        if (dates.has(row.date)) { setError(`Duplicate date: ${row.date}.`); return; }
        dates.add(row.date);
      }
    }
    if (!bulk && (reason.trim().length < 3 || reason.trim().length > 1000)) { setError("Provide a reason between 3 and 1000 characters."); return; }
    if (historical && !confirmed) { setError("Confirm the change to the historical holiday schedule."); return; }
    lock.current = true; setBusy(true);
    try {
      const data = await holidayRequest(bulk ? "/holidays/bulk" : `/holidays/${target.id}`, {
        method: bulk ? "POST" : deleting ? "DELETE" : "PATCH",
        body: bulk ? { year, holidays: rows.map(({ name, date }) => ({ name: name.trim(), date })) }
          : { name: rows[0].name.trim(), date: rows[0].date, reason: reason.trim(), version: target.version },
      });
      setResult(data); setFinished(true); onChanged();
    } catch (err) {
      const conflicts = err.details?.conflictingDates;
      setError(`${err.message}${Array.isArray(conflicts) ? ` Dates: ${conflicts.join(", ")}` : ""}`);
      if (err.uncertain || err.status === 409 || err.status === 404) {
        // Never blindly repeat an uncertain bulk write or stale mutation.
        setFinished(true); onChanged();
      }
    } finally { lock.current = false; setBusy(false); }
  }
  return <Modal title={bulk ? `Add holidays · ${year}` : deleting ? "Delete holiday" : "Edit holiday"} onClose={onClose} busy={busy}>
    <Notice error>{error}</Notice>
    {result && <Notice error={result.partial}>{result.message}</Notice>}
    {result?.results && <ul className="mb-4 max-h-48 space-y-2 overflow-auto rounded-xl bg-gray-50 p-3 text-xs">{result.results.map(row => <li key={row.date} className="flex flex-wrap justify-between gap-2"><span>{showDate(row.date)}</span><strong className={row.status === "created" ? "text-green-700" : "text-amber-700"}>{({ created: "Saved", conflict: "Date already exists", unconfirmed: "Refresh to confirm", not_attempted: "Not attempted" })[row.status] || row.status}</strong></li>)}</ul>}
    {finished && <p className="mb-4 text-xs leading-relaxed text-gray-500">Close this form and review the refreshed list before submitting any remaining rows.</p>}
    <form onSubmit={submit}>
      <fieldset disabled={busy || finished} className="space-y-4">
        {deleting ? <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">Remove <strong>{target.name}</strong> on {showDate(target.date)}? The audit history will be retained.</p> : <>
          <p className="text-xs leading-relaxed text-gray-500">Full-day company holidays. {bulk ? "Add all rows for the selected year, then save once." : "Changing the date may move this holiday to another year."}</p>
          {rows.map((row, index) => <div key={row.key} className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3 sm:grid-cols-[1fr_180px_auto]">
            <label className="space-y-1 text-xs font-medium text-gray-500"><span>Holiday name · {index + 1}</span><input autoFocus={index === 0} required minLength={2} maxLength={120} value={row.name} onChange={e => changeRow(row.key, "name", e.target.value)} className={inputClass} placeholder="Holiday name" /></label>
            <label className="space-y-1 text-xs font-medium text-gray-500"><span>Date</span><input required type="date" min={bulk ? `${year}-01-01` : "2000-01-01"} max={bulk ? `${year}-12-31` : "2099-12-31"} value={row.date} onChange={e => changeRow(row.key, "date", e.target.value)} className={inputClass} /></label>
            {bulk && <button type="button" aria-label={`Remove row ${index + 1}`} className={`${buttonClass} self-end`} disabled={rows.length === 1} onClick={() => setRows(items => items.filter(item => item.key !== row.key))}><Trash2 size={15} /></button>}
          </div>)}
          {bulk && <button type="button" className={buttonClass} disabled={rows.length >= 366} onClick={() => setRows(items => [...items, { key: nextId.current++, name: "", date: "" }])}><Plus size={15} />Add row</button>}
        </>}
        {!bulk && <label className="block space-y-2 text-xs font-medium text-gray-500"><span>Reason for {deleting ? "deletion" : "change"}</span><textarea required minLength={3} maxLength={1000} rows={3} className={inputClass} value={reason} onChange={e => setReason(e.target.value)} /></label>}
        {historical && <label className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800"><input type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-0.5 accent-green-600" />I understand this changes the holiday schedule for a past date.</label>}
        <div className="flex justify-end"><button className={primaryClass} type="submit">{busy ? "Saving…" : deleting ? "Confirm delete" : bulk ? "Save holidays" : "Save changes"}</button></div>
      </fieldset>
    </form>
  </Modal>;
}

export default function OfficialHolidays({ canView, canCreate, canEdit, canDelete }) {
  const [year, setYear] = useState(Number(todayIST().slice(0, 4)));
  const [revision, setRevision] = useState(0), [form, setForm] = useState(null);
  const { data, error, loading } = useHolidayData(canView ? `/holidays?year=${year}` : null, revision);
  const holidays = Array.isArray(data?.holidays) ? data.holidays : [];
  const responseError = data && !Array.isArray(data.holidays) ? "Unexpected holiday response. Please refresh." : error;
  return <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold text-gray-900">Official holidays</h2><p className="mt-1 text-xs text-gray-500">Your company’s full-day holiday schedule.</p></div><div className="flex flex-wrap items-end gap-2">
      <label className="text-xs text-gray-500">Year<select className={`${inputClass} mt-1`} value={year} onChange={e => setYear(Number(e.target.value))}>{Array.from({ length: 100 }, (_, i) => 2000 + i).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      {canView && <button className={buttonClass} disabled={loading} onClick={() => setRevision(value => value + 1)}>Refresh</button>}
      {canCreate && <button className={primaryClass} onClick={() => setForm({ action: "create" })}><Plus size={15} />Add holidays</button>}
    </div></header>
    <Notice error>{responseError}</Notice>
    {!canView ? <p className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Your permissions allow actions but not viewing the holiday list. Ask your administrator for View holidays access.</p> : loading ? <p role="status" className="py-16 text-center text-sm text-gray-500">Loading holidays…</p> : !responseError && holidays.length === 0 ? <div className="py-16 text-center"><CalendarDays className="mx-auto mb-3 text-green-500" size={30} /><p className="text-sm font-medium text-gray-600">No holidays added for {year}</p><p className="mt-2 text-xs text-gray-400">Add your official dates to build the year’s schedule.</p></div> : !responseError && <div className="mt-6 overflow-x-auto" tabIndex={0} role="region" aria-label="Holiday list"><table className="w-full min-w-[540px] text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="rounded-l-xl p-3">Holiday</th><th className="p-3">Date</th><th className="p-3">Day</th>{(canEdit || canDelete) && <th className="rounded-r-xl p-3 text-right">Actions</th>}</tr></thead><tbody>{holidays.map(holiday => <tr key={holiday.id} className="border-b border-gray-100 transition hover:bg-green-50/40"><td className="p-4 font-medium text-gray-800">{holiday.name}</td><td className="p-4 text-gray-600">{showDate(holiday.date)}</td><td className="p-4 text-gray-500">{new Date(`${holiday.date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", timeZone: "UTC" })}</td>{(canEdit || canDelete) && <td className="p-3"><div className="flex justify-end gap-2">{canEdit && <button aria-label={`Edit ${holiday.name}`} className={buttonClass} onClick={() => setForm({ ...holiday, action: "edit" })}><Pencil size={14} /></button>}{canDelete && <button aria-label={`Delete ${holiday.name}`} className={`${buttonClass} text-red-600`} onClick={() => setForm({ ...holiday, action: "delete" })}><Trash2 size={14} /></button>}</div></td>}</tr>)}</tbody></table></div>}
    {form && (form.action === "create" ? canCreate : canView && (form.action === "edit" ? canEdit : canDelete)) && <HolidayForm key={`${form.id || "new"}-${form.action}-${year}`} year={year} target={form.action === "create" ? null : form} onClose={() => setForm(null)} onChanged={() => setRevision(value => value + 1)} />}
  </section>;
}
