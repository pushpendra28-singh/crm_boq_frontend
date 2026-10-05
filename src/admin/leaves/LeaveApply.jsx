import { useState } from 'react';
import { leaveApi } from './leaveApi';
import { Panel, Notice, field, button, secondary, label } from './leaveUi';
export default function LeaveApply({ types, close, saved }) {
  const [form, set] = useState({ typeId: types.find(t => t.active)?._id || '', from: '', to: '', portion: 'full', reason: '' });
  const [key] = useState(() => crypto.randomUUID());
  const [preview, setPreview] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const change = (name, value) => { set(f => ({ ...f, [name]: value, ...(name === 'typeId' ? { portion: 'full' } : {}) })); setPreview(null); setError(''); };
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (!preview) setPreview(await leaveApi('/preview', { method: 'POST', body: form }));
      else { const r = await leaveApi('/requests', { method: 'POST', body: { ...form, key } }); saved(r.message); }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <Panel title="Apply for leave" close={close} busy={busy}><p className="text-sm text-slate-500">Select your dates. Company holidays and weekly offs are excluded automatically.</p>
    <form onSubmit={submit} className="space-y-5"><fieldset disabled={busy} className="space-y-5">
      <label className={label}>Leave type<select required className={field} value={form.typeId} onChange={e => change('typeId', e.target.value)}><option value="">Select type</option>{types.filter(t => t.active).map(t => <option key={t._id} value={t._id}>{t.name} · {t.paid ? 'Paid' : 'Unpaid'}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3"><label className={label}>From<input required type="date" min="2000-01-01" max="2099-12-31" className={field} value={form.from} onChange={e => change('from', e.target.value)} /></label><label className={label}>To<input required type="date" min={form.from || '2000-01-01'} max="2099-12-31" className={field} value={form.to} onChange={e => change('to', e.target.value)} /></label></div>
      <label className={label}>Duration<select className={field} value={form.portion} onChange={e => change('portion', e.target.value)}><option value="full">Full day(s)</option>{types.find(t => t._id === form.typeId)?.halfDay && <><option value="first_half">First half · single date</option><option value="second_half">Second half · single date</option></>}</select></label>
      <label className={label}>Reason<textarea required minLength={3} maxLength={1000} rows={4} className={field} placeholder="Share the reason for your request" value={form.reason} onChange={e => change('reason', e.target.value)} /></label>
    </fieldset>
      {preview && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><p className="text-3xl font-semibold text-emerald-900">{preview.units} <span className="text-sm">leave day(s)</span></p><p className="mt-2 text-xs text-emerald-700">{preview.excludedDays} holiday / weekly-off date(s) excluded.</p>{preview.paid && <p className="mt-2 text-sm text-emerald-800">Available: {preview.balance.available} · After submission: {preview.balance.available - preview.units}</p>}</div>}
      <Notice error>{error}</Notice><div className="flex justify-end gap-2"><button type="button" className={secondary} disabled={busy} onClick={close}>Close</button><button className={button} disabled={busy || !form.typeId || (preview?.paid && preview.balance.available < preview.units)}>{busy ? 'Processing…' : preview ? 'Submit request' : 'Review leave days'}</button></div>
    </form>
  </Panel>;
}
