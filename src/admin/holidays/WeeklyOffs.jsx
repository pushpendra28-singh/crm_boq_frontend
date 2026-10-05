import { useMemo, useRef, useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { holidayRequest } from "./holidayApi";
import { WEEKDAYS, todayIST, showDate, validDate, ruleLabel, validateRules, proposedOffDates, monthRange } from "./holidayHelpers";
import { Modal, Notice, useHolidayData, inputClass, buttonClass, primaryClass } from "./holidayUi";

function PolicyForm({ current, policies, onClose, onChanged }) {
  const lock = useRef(false);
  const [effectiveFrom, setEffectiveFrom] = useState(todayIST());
  const [rules, setRules] = useState(() => current ? current.rules.map(rule => ({ ...rule, occurrences: [...(rule.occurrences || [])] })) : [{ weekday: 0, pattern: "every_week", occurrences: [], anchorDate: null }]);
  const [reason, setReason] = useState("");
  const [confirmPastChange, setConfirmPastChange] = useState(false), [confirmNoWeeklyOffs, setConfirmNoWeeklyOffs] = useState(false);
  const [busy, setBusy] = useState(false), [finished, setFinished] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const rulesError = validateRules(rules);
  const dates = useMemo(() => proposedOffDates(effectiveFrom, rules), [effectiveFrom, rules]);
  const nextPolicy = policies.filter(policy => policy.effectiveFrom > effectiveFrom).sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))[0];
  function changeRules(next) { setRules(next); setConfirmNoWeeklyOffs(false); setConfirmPastChange(false); }
  function updateRule(weekday, patch) { changeRules(rules.map(rule => rule.weekday === weekday ? { ...rule, ...patch } : rule)); }
  function preset(type) {
    const sunday = { weekday: 0, pattern: "every_week", occurrences: [], anchorDate: null };
    changeRules(type === "sunday" ? [sunday] : [sunday, { weekday: 6, pattern: type === "both" ? "every_week" : "selected_occurrences", occurrences: type === "both" ? [] : [2, 4], anchorDate: null }]);
  }
  async function submit(event) {
    event.preventDefault(); if (lock.current || finished) return;
    setError("");
    if (!validDate(effectiveFrom)) { setError("Select a valid effective date between 2000 and 2099."); return; }
    if (policies.some(policy => policy.effectiveFrom === effectiveFrom)) { setError("A policy already starts on this date. Choose a different effective date."); return; }
    if (rulesError) { setError(rulesError); return; }
    if (reason.trim().length < 3 || reason.trim().length > 1000) { setError("Provide a reason between 3 and 1000 characters."); return; }
    if (effectiveFrom < todayIST() && !confirmPastChange) { setError("Confirm the historical schedule change."); return; }
    if (rules.length === 0 && !confirmNoWeeklyOffs) { setError("Confirm that there will be no weekly offs."); return; }
    lock.current = true; setBusy(true);
    try {
      const result = await holidayRequest("/weekly-offs", { method: "POST", body: { effectiveFrom, rules, reason: reason.trim(), confirmPastChange, confirmNoWeeklyOffs } });
      setMessage(result.message); setFinished(true); onChanged();
    } catch (err) {
      setError(err.message);
      if (err.uncertain || err.status === 409) { setFinished(true); onChanged(); }
    } finally { lock.current = false; setBusy(false); }
  }
  return <Modal title="New weekly-off policy" busy={busy} onClose={onClose}>
    <Notice error>{error}</Notice><Notice>{message}</Notice>
    {finished && <p className="mb-4 text-xs text-gray-500">Close and review the refreshed policy history before making another change.</p>}
    <form onSubmit={submit}><fieldset disabled={busy || finished} className="space-y-5">
      <p className="text-xs leading-relaxed text-gray-500">Save the complete weekly schedule from an effective date. Earlier policy records are retained. An existing effective date cannot be overwritten.</p>
      <label className="block space-y-2 text-xs font-medium text-gray-500"><span>Effective from</span><input autoFocus type="date" required min="2000-01-01" max="2099-12-31" className={inputClass} value={effectiveFrom} onChange={e => { setEffectiveFrom(e.target.value); setConfirmPastChange(false); }} /></label>
      {nextPolicy && <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">A later saved policy starts on {showDate(nextPolicy.effectiveFrom)}. It will take over from that date.</p>}
      <div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} onClick={() => preset("sunday")}>Sunday only</button><button type="button" className={buttonClass} onClick={() => preset("both")}>Saturday + Sunday</button><button type="button" className={buttonClass} onClick={() => preset("selected")}>Sunday + 2nd/4th Saturday</button></div>
      <div className="space-y-2">{WEEKDAYS.map((name, weekday) => {
        const rule = rules.find(item => item.weekday === weekday);
        return <div key={weekday} className={`rounded-xl border p-3 ${rule ? "border-green-200 bg-green-50/30" : "border-gray-100"}`}>
          <div className="flex flex-wrap items-center gap-3"><label className="flex min-w-28 items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" className="accent-green-600" checked={!!rule} onChange={e => changeRules(e.target.checked ? [...rules, { weekday, pattern: "every_week", occurrences: [], anchorDate: null }] : rules.filter(item => item.weekday !== weekday))} />{name}</label>
          {rule ? <select aria-label={`${name} off pattern`} className={`${inputClass} sm:w-auto`} value={rule.pattern} onChange={e => updateRule(weekday, { pattern: e.target.value, occurrences: [], anchorDate: null })}><option value="every_week">Every week</option><option value="selected_occurrences">Selected occurrences</option><option value="alternate_weeks">Every other week</option></select> : <span className="text-xs text-gray-400">Working day</span>}</div>
          {rule?.pattern === "selected_occurrences" && <div className="mt-3 flex flex-wrap gap-3">{[1, 2, 3, 4, 5].map(number => <label key={number} className="flex items-center gap-1.5 text-xs text-gray-600"><input type="checkbox" className="accent-green-600" checked={rule.occurrences.includes(number)} onChange={e => updateRule(weekday, { occurrences: e.target.checked ? [...rule.occurrences, number].sort() : rule.occurrences.filter(value => value !== number) })} />{["1st", "2nd", "3rd", "4th", "5th"][number - 1]}</label>)}<p className="w-full text-[11px] text-gray-400">The 5th occurrence applies only in months where it exists.</p></div>}
          {rule?.pattern === "alternate_weeks" && <label className="mt-3 block space-y-1 text-xs text-gray-500"><span>First off {name} · repeats every 14 days</span><input required type="date" min="2000-01-01" max="2099-12-31" className={inputClass} value={rule.anchorDate || ""} onChange={e => updateRule(weekday, { anchorDate: e.target.value || null })} /></label>}
        </div>;
      })}</div>
      <div className="rounded-xl border border-green-100 bg-green-50/50 p-4"><h3 className="text-sm font-semibold text-green-900">Proposed off dates · first 6 weeks</h3><p className="mt-1 text-[11px] leading-relaxed text-green-800">Preview of this draft only. Official holidays and later saved policies are not merged here.</p>
        {rulesError || !validDate(effectiveFrom) ? <p className="mt-3 text-xs text-amber-800">{rulesError || "Select a valid effective date."}</p> : dates.length ? <div className="mt-3 flex flex-wrap gap-2">{dates.map(date => <span key={date} className="rounded-lg border border-green-100 bg-white px-2 py-1 text-xs text-green-800">{showDate(date)}</span>)}</div> : <p className="mt-3 text-xs text-green-800">No weekly offs in the preview period.</p>}
      </div>
      <label className="block space-y-2 text-xs font-medium text-gray-500"><span>Reason</span><textarea required minLength={3} maxLength={1000} rows={3} className={inputClass} value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is the schedule changing?" /></label>
      {effectiveFrom < todayIST() && <label className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800"><input required type="checkbox" checked={confirmPastChange} onChange={e => setConfirmPastChange(e.target.checked)} className="mt-0.5 accent-green-600" />I understand this changes the weekly-off schedule for past dates.</label>}
      {rules.length === 0 && <label className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800"><input required type="checkbox" checked={confirmNoWeeklyOffs} onChange={e => setConfirmNoWeeklyOffs(e.target.checked)} className="mt-0.5 accent-green-600" />I confirm that all weekdays are working days under this policy.</label>}
      <div className="flex justify-end"><button type="submit" className={primaryClass}>{busy ? "Saving…" : "Save policy"}</button></div>
    </fieldset></form>
  </Modal>;
}

export default function WeeklyOffs({ canManage }) {
  const [revision, setRevision] = useState(0), [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState(todayIST().slice(0, 7));
  const { data, loading, error } = useHolidayData("/weekly-offs", revision);
  const range = monthRange(month);
  const preview = useHolidayData(`/weekly-offs/preview?${new URLSearchParams(range)}`, revision);
  const policies = Array.isArray(data?.policies) ? data.policies : [];
  const validResponse = !!data && Array.isArray(data.policies);
  const responseError = error || (data && !validResponse ? "Unexpected policy response. Please refresh." : "");
  const validPreview = Array.isArray(preview.data?.days);
  return <div className="space-y-5">
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"><header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-gray-900">Weekly-off schedule</h2><p className="mt-1 text-xs text-gray-500">Effective-dated rules for your company.</p></div><div className="flex gap-2"><button className={buttonClass} disabled={loading || preview.loading} onClick={() => setRevision(value => value + 1)}>Refresh</button>{canManage && <button className={primaryClass} disabled={loading || !validResponse || !!responseError} onClick={() => setShowForm(true)}><Plus size={15} />New policy</button>}</div></header>
      <Notice error>{responseError}</Notice>
      {loading ? <p role="status" className="py-10 text-center text-sm text-gray-500">Loading weekly-off policies…</p> : validResponse && <>
        <div className="mt-5 rounded-xl border border-green-100 bg-green-50/50 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-green-700">Current policy</p>{data.currentPolicy ? <><p className="mt-2 text-sm font-semibold text-green-900">Effective {showDate(data.currentPolicy.effectiveFrom)}</p><ul className="mt-3 space-y-1 text-xs text-green-800">{data.currentPolicy.rules.length ? data.currentPolicy.rules.map(rule => <li key={rule.weekday}>{ruleLabel(rule)}</li>) : <li>No weekly offs configured in this policy.</li>}</ul></> : <p className="mt-2 text-sm text-green-900">No policy is effective today. Future policies, if any, are listed below.</p>}</div>
        <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-800">Policy history & upcoming changes</h3>
        {policies.length === 0 ? <p className="text-sm text-gray-500">No weekly-off policies have been saved.</p> : <div className="space-y-3">{policies.map(policy => <article key={policy.id} className="rounded-xl border border-gray-100 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-gray-800">From {showDate(policy.effectiveFrom)}</strong><span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500">{policy.id === data.currentPolicy?.id ? "Current" : policy.effectiveFrom > (data.today || todayIST()) ? "Upcoming" : "Historical"}</span></div><ul className="mt-2 space-y-1 text-xs text-gray-600">{policy.rules.length ? policy.rules.map(rule => <li key={rule.weekday}>{ruleLabel(rule)}</li>) : <li>No weekly offs</li>}</ul><p className="mt-2 break-words text-xs text-gray-400">Reason: {policy.reason}</p></article>)}</div>}
      </>}
    </section>
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 text-base font-semibold text-gray-900"><CalendarDays size={18} className="text-green-600" />Saved schedule preview</h3><p className="mt-1 text-xs text-gray-500">Includes effective policy changes. Official holidays are not included yet.</p></div><label className="text-xs text-gray-500">Month<input type="month" min="2000-01" max="2099-12" value={month} className={`${inputClass} mt-1`} onChange={e => { if (/^20\d{2}-(0[1-9]|1[0-2])$/.test(e.target.value)) setMonth(e.target.value); }} /></label></div>
      <Notice error>{preview.error || (preview.data && !validPreview ? "Unexpected preview response. Please refresh." : "")}</Notice>
      {preview.loading ? <p role="status" className="py-10 text-center text-sm text-gray-500">Loading preview…</p> : validPreview && <><div className="mb-4 mt-5 flex flex-wrap gap-4 text-[11px] text-gray-500"><span>Green: weekly off</span><span>Gray: working day</span><span>Amber: no policy</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{preview.data.days.map(day => <div key={day.date} className={`rounded-xl border p-3 ${day.status === "weekly_off" ? "border-green-200 bg-green-50 text-green-800" : day.status === "not_configured" ? "border-amber-100 bg-amber-50 text-amber-800" : "border-gray-100 bg-gray-50 text-gray-500"}`}><p className="text-xs font-semibold">{showDate(day.date)}</p><p className="mt-1 text-[10px]">{day.status === "weekly_off" ? "Weekly off" : day.status === "not_configured" ? "Not configured" : "Working day"}</p></div>)}</div></>}
    </section>
    {showForm && canManage && <PolicyForm current={data?.currentPolicy} policies={policies} onClose={() => setShowForm(false)} onChanged={() => setRevision(value => value + 1)} />}
  </div>;
}
