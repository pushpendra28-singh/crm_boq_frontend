import { useState } from 'react';
import { Info } from 'lucide-react';
import { leaveApi } from './leaveApi';
import { Panel, Notice, Directory, field, button, secondary, label } from './leaveUi';
export default function LeaveApply({ types, isSuperAdmin = false, close, saved }) {
  const [form, set] = useState({ typeId: types.find(t => t.active)?._id || '', from: '', to: '', portion: 'full', reason: '' });
  const [selectedEmployee, setSelectedEmployee] = useState([]);
  const [key] = useState(() => crypto.randomUUID());
  const [preview, setPreview] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const change = (name, value) => { set(f => ({ ...f, [name]: value, ...(name === 'typeId' ? { portion: 'full' } : {}) })); setPreview(null); setError(''); };
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const request = { ...form, ...(isSuperAdmin ? { employee: selectedEmployee[0] } : {}) };
      if (!preview) setPreview(await leaveApi('/preview', { method: 'POST', body: request }));
      else { const r = await leaveApi('/requests', { method: 'POST', body: { ...request, key } }); saved(r.message); }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <Panel title="Apply for leave" close={close} busy={busy}>
    <p className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-800">
      <Info size={17} className="mt-0.5 shrink-0 text-blue-500" />
      <span>Select your dates. Company holidays and weekly offs are excluded automatically.</span>
    </p>
    <form onSubmit={submit} className="space-y-5"><fieldset disabled={busy} className="space-y-5">
      {isSuperAdmin && <div className="space-y-2"><span className={label}>Employee</span><Directory selected={selectedEmployee} onChange={value => { setSelectedEmployee(value); setPreview(null); setError(''); }}/></div>}
      <label className={label}>Leave type<select required className={field} value={form.typeId} onChange={e => change('typeId', e.target.value)}><option value="">Select type</option>{types.filter(t => t.active).map(t => <option key={t._id} value={t._id}>{t.name} · {t.paid ? 'Paid' : 'Unpaid'}</option>)}</select></label>
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-[#f5f8ff] p-4 sm:grid-cols-2">
        <label className={label}>From<input required type="date" min="2000-01-01" max="2099-12-31" className={field} value={form.from} onChange={e => change('from', e.target.value)} /></label>
        <label className={label}>To<input required type="date" min={form.from || '2000-01-01'} max="2099-12-31" className={field} value={form.to} onChange={e => change('to', e.target.value)} /></label>
      </div>
      <label className={label}>Duration<select className={field} value={form.portion} onChange={e => change('portion', e.target.value)}><option value="full">Full day(s)</option>{types.find(t => t._id === form.typeId)?.halfDay && <><option value="first_half">First half · single date</option><option value="second_half">Second half · single date</option></>}</select></label>
      <label className={label}>Reason<textarea required minLength={3} maxLength={1000} rows={4} className={field} placeholder="Share the reason for your request" value={form.reason} onChange={e => change('reason', e.target.value)} /></label>
    </fieldset>
      {preview && <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-white shadow-lg shadow-emerald-500/30">
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-8 h-32 w-32 rounded-full bg-white/15" />
        <p className="relative text-3xl font-black tabular-nums">{preview.units} <span className="text-sm font-semibold text-white/90">leave day(s)</span></p>
        <p className="relative mt-2 text-xs text-white/85">{preview.excludedDays} holiday / weekly-off date(s) excluded.</p>
        {preview.paid && <p className="relative mt-3 inline-block rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white">Available: {preview.balance.available} · After submission: {preview.balance.available - preview.units}</p>}
      </div>}
      <Notice error>{error}</Notice>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className={secondary} disabled={busy} onClick={close}>Close</button><button className={button} disabled={busy || !form.typeId || (isSuperAdmin && !selectedEmployee.length) || (preview?.paid && preview.balance.available < preview.units)}>{busy ? 'Processing…' : preview ? 'Submit request' : 'Review leave days'}</button></div>
    </form>
  </Panel>;
}



// import { useState } from 'react';
// import { leaveApi } from './leaveApi';
// import { Panel, Notice, field, button, secondary, label } from './leaveUi';
// export default function LeaveApply({ types, close, saved }) {
//   const [form, set] = useState({ typeId: types.find(t => t.active)?._id || '', from: '', to: '', portion: 'full', reason: '' });
//   const [key] = useState(() => crypto.randomUUID());
//   const [preview, setPreview] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
//   const change = (name, value) => { set(f => ({ ...f, [name]: value, ...(name === 'typeId' ? { portion: 'full' } : {}) })); setPreview(null); setError(''); };
//   async function submit(e) {
//     e.preventDefault(); setBusy(true); setError('');
//     try {
//       if (!preview) setPreview(await leaveApi('/preview', { method: 'POST', body: form }));
//       else { const r = await leaveApi('/requests', { method: 'POST', body: { ...form, key } }); saved(r.message); }
//     } catch (e) { setError(e.message); } finally { setBusy(false); }
//   }
//   return <Panel title="Apply for leave" close={close} busy={busy}><p className="text-sm text-slate-500">Select your dates. Company holidays and weekly offs are excluded automatically.</p>
//     <form onSubmit={submit} className="space-y-5"><fieldset disabled={busy} className="space-y-5">
//       <label className={label}>Leave type<select required className={field} value={form.typeId} onChange={e => change('typeId', e.target.value)}><option value="">Select type</option>{types.filter(t => t.active).map(t => <option key={t._id} value={t._id}>{t.name} · {t.paid ? 'Paid' : 'Unpaid'}</option>)}</select></label>
//       <div className="grid grid-cols-2 gap-3"><label className={label}>From<input required type="date" min="2000-01-01" max="2099-12-31" className={field} value={form.from} onChange={e => change('from', e.target.value)} /></label><label className={label}>To<input required type="date" min={form.from || '2000-01-01'} max="2099-12-31" className={field} value={form.to} onChange={e => change('to', e.target.value)} /></label></div>
//       <label className={label}>Duration<select className={field} value={form.portion} onChange={e => change('portion', e.target.value)}><option value="full">Full day(s)</option>{types.find(t => t._id === form.typeId)?.halfDay && <><option value="first_half">First half · single date</option><option value="second_half">Second half · single date</option></>}</select></label>
//       <label className={label}>Reason<textarea required minLength={3} maxLength={1000} rows={4} className={field} placeholder="Share the reason for your request" value={form.reason} onChange={e => change('reason', e.target.value)} /></label>
//     </fieldset>
//       {preview && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><p className="text-3xl font-semibold text-emerald-900">{preview.units} <span className="text-sm">leave day(s)</span></p><p className="mt-2 text-xs text-emerald-700">{preview.excludedDays} holiday / weekly-off date(s) excluded.</p>{preview.paid && <p className="mt-2 text-sm text-emerald-800">Available: {preview.balance.available} · After submission: {preview.balance.available - preview.units}</p>}</div>}
//       <Notice error>{error}</Notice><div className="flex justify-end gap-2"><button type="button" className={secondary} disabled={busy} onClick={close}>Close</button><button className={button} disabled={busy || !form.typeId || (preview?.paid && preview.balance.available < preview.units)}>{busy ? 'Processing…' : preview ? 'Submit request' : 'Review leave days'}</button></div>
//     </form>
//   </Panel>;
// }
