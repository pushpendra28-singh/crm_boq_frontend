import { useContext, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Plus, RefreshCw, ArrowUpRight, Mail } from 'lucide-react';
import { AuthContext } from '../../auth/AuthContext';
import { leaveApi } from './leaveApi';
import LeaveApply from './LeaveApply';
import { SettingsForm, Allocations } from './LeaveSettings';
import { Badge, Panel, Notice, field, button, secondary, label, useLoad } from './leaveUi';
import { leaveLinkParams, clearLeaveReturn } from './leaveLink';
const statuses = ['pending', 'under_review', 'approved', 'rejected', 'cancel_requested', 'cancelled'];
const readable = value => value.replaceAll('_', ' ');
function RequestPanel({ row, canApprove, canApply, canRetry, close, saved }) {
  const [action, setAction] = useState(''), [reason, setReason] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const choices = row.own && canApply && ['pending', 'under_review', 'approved'].includes(row.status)
    ? [['cancel', row.status === 'approved' ? 'Request cancellation' : 'Cancel request']]
    : !row.own && row.canAct && canApprove
      ? row.status === 'cancel_requested' ? [['approve_cancel', 'Approve cancellation'], ['deny_cancel', 'Keep leave approved']]
        : ['pending', 'under_review'].includes(row.status) ? [['approve', 'Approve leave'], ['reject', 'Reject leave'], ...(row.status === 'pending' ? [['review', 'Mark under review']] : [['pending', 'Return to pending']])] : []
      : [];
  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); try { const r = await leaveApi(`/requests/${row._id}/action`, { method: 'POST', body: { version: row.version, action, reason } }); saved(r.message); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  async function retry(job) { setBusy(true); setError(''); try { const r = await leaveApi(`/notifications/${row.accountId}/${job.id}/retry`, { method: 'POST' }); saved(r.message); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  return <Panel title="Leave request" close={close} busy={busy}>
    <div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-semibold text-slate-900">{row.employee.name}</h3><p className="mt-1 break-all text-xs text-slate-500">{row.employee.email}</p></div><Badge status={row.status}/></div>
    <div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-800">{row.typeName} · {row.paid ? 'Paid' : 'Unpaid'}</p><p className="mt-2 text-sm text-slate-600">{row.from} → {row.to}</p><p className="mt-2 text-2xl font-semibold text-emerald-700">{row.units} <span className="text-sm">day(s) · {readable(row.portion)}</span></p></div>
    <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reason</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{row.reason}</p></div>
    <details className="text-xs text-slate-500"><summary className="cursor-pointer">Charged dates · {row.days.length}</summary><p className="mt-2 leading-6">{row.days.map(d => `${d.date} (${d.units})`).join(', ')}</p></details>
    <div><h4 className="mb-3 text-sm font-semibold text-slate-800">Activity</h4><ol className="space-y-4 border-l border-emerald-100 pl-4">{row.history.map((h, i) => <li key={i}><Badge status={h.status}/><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{h.note}</p><p className="mt-1 text-[11px] text-slate-400">{h.actor?.name || 'User'} · {new Date(h.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p></li>)}</ol></div>
    <div className="space-y-2 rounded-xl border border-slate-100 p-3"><p className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Mail size={14}/>Email notifications</p><p className="text-xs text-slate-400">Sent means accepted by the email server; inbox delivery may vary.</p>{row.notification.map(job => <div key={job.id} className="flex items-center justify-between text-xs text-slate-500"><span>{job.status} · {job.attempts} attempt(s)</span>{canRetry && job.status === 'failed' && <button type="button" className={secondary} disabled={busy} onClick={() => retry(job)}>Retry</button>}</div>)}</div>
    {choices.length > 0 && <form onSubmit={submit} className="space-y-4 border-t border-slate-100 pt-5"><label className={label}>Action<select required disabled={busy} className={field} value={action} onChange={e => setAction(e.target.value)}><option value="">Choose action</option>{choices.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label><label className={label}>Reason / note<textarea required disabled={busy} minLength={3} maxLength={1000} className={field} rows={3} value={reason} onChange={e => setReason(e.target.value)}/></label><button className={button} disabled={busy || !action}>{busy ? 'Saving…' : 'Confirm action'}</button></form>}
    <Notice error>{error}</Notice><p className="break-all text-[10px] text-slate-400">Reference: {row._id}</p>
  </Panel>;
}
export default function LeaveModule() {
  const { hasPermission } = useContext(AuthContext);
  const reduce = useReducedMotion();
  const canApply = hasPermission('apply_leaves'), canApprove = hasPermission('approve_leaves'), canSettings = hasPermission('manage_leave_settings');
  const tabs = [
    ['mine', 'My Leaves', hasPermission('view_leaves') || canApply],
    ['approvals', 'Approvals', canApprove], ['all', 'All Requests', hasPermission('view_all_leaves')],
    ['balances', 'Balances', hasPermission('manage_leave_balances')], ['settings', 'Settings', canSettings],
  ].filter(t => t[2]);
  const [tab, setTab] = useState(() => canApprove && leaveLinkParams().has('leave') ? 'approvals' : tabs[0]?.[0]);
  const activeTab = tabs.some(t => t[0] === tab) ? tab : tabs[0]?.[0];
  const [year, setYear] = useState(() => { const n = Number(leaveLinkParams().get('year')); return n >= 2000 && n <= 2099 && Number.isInteger(n) ? n : Number(new Date(Date.now() + 19800000).toISOString().slice(0, 4)); });
  const [requestId, setRequestId] = useState(() => leaveLinkParams().get('leave') || '');
  useEffect(() => { clearLeaveReturn(); }, []);
  const [status, setStatus] = useState(''), [page, setPage] = useState(1), [refresh, setRefresh] = useState(0), [message, setMessage] = useState(''), [apply, setApply] = useState(false), [selected, setSelected] = useState(null);
  const meta = useLoad(tabs.length ? '/meta' : null, refresh);
  const listTab = ['mine', 'approvals', 'all'].includes(activeTab);
  const rows = useLoad(listTab ? `/requests?${new URLSearchParams({ year, scope: activeTab, page, ...(status ? { status } : {}), ...(requestId ? { requestId } : {}) })}` : null, refresh);
  const balance = useLoad(activeTab === 'mine' ? `/balance?year=${year}` : null, refresh);
  const saved = text => { setMessage(text); setApply(false); setSelected(null); setRefresh(n => n + 1); };
  if (!tabs.length) return <Notice error>You do not have permission to access leave management.</Notice>;
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">People & time off</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Leave management</h1><p className="mt-2 text-sm text-slate-500">Plan your time away. Keep every request in one place.</p></div><div className="flex gap-2"><button className={secondary} onClick={() => { setSelected(null); setRefresh(n => n + 1); }} aria-label="Refresh leaves"><RefreshCw size={16}/></button>{canApply && <button className={button} disabled={!meta.data || meta.loading} onClick={() => setApply(true)}><Plus size={16}/>Apply leave</button>}</div></header>
    <Notice>{message}</Notice><Notice error>{meta.error}</Notice>
    <div className="flex flex-wrap items-center justify-between gap-3"><nav aria-label="Leave sections" className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">{tabs.map(([key, title]) => <button key={key} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${activeTab === key ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`} onClick={() => { setTab(key); setPage(1); setSelected(null); }}>{title}</button>)}</nav><label className="flex items-center gap-2 text-xs text-slate-500">Year<input aria-label="Leave year" className={`${field} !w-24`} type="number" min="2000" max="2099" value={year} onChange={e => { const n = Number(e.target.value); if (Number.isInteger(n) && n >= 2000 && n <= 2099) { setYear(n); setPage(1); } }}/></label></div>
    {activeTab === 'mine' && <><Notice error>{balance.error}</Notice>{balance.loading ? <p className="text-sm text-slate-500">Loading balances…</p> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{balance.data?.balances?.filter(b => b.paid && b.active).map(b => <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-medium text-slate-600">{b.name}</p><p className="mt-3 text-3xl font-semibold text-slate-900">{b.available}<span className="ml-2 text-xs font-normal text-slate-400">available</span></p><p className="mt-3 text-xs text-slate-400">{b.allocated} allocated · {b.used} used · {b.reserved} reserved</p></div>)}</div>}</>}
    {listTab && <motion.section key={activeTab} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><div><h2 className="font-semibold text-slate-800">{tabs.find(t => t[0] === activeTab)?.[1]}</h2><p className="mt-1 text-xs text-slate-400">{rows.data?.total ?? '—'} request(s) · {year}</p></div><select aria-label="Filter request status" className={`${field} !w-auto`} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{statuses.map(s => <option key={s} value={s}>{readable(s)}</option>)}</select></div>
      {requestId && <div className="flex items-center justify-between gap-2 bg-emerald-50 p-3 text-xs text-emerald-800"><span>Showing request from email. Switch tabs if this request belongs to you.</span><button className={secondary} onClick={() => { setRequestId(''); setPage(1); }}>Show all</button></div>}
      <div className="p-5"><Notice error>{rows.error}</Notice>{rows.loading ? <p className="py-16 text-center text-sm text-slate-400">Loading requests…</p> : !rows.error && !rows.data?.rows?.length ? <div className="py-16 text-center"><CalendarDays className="mx-auto mb-3 text-emerald-400" size={30}/><p className="font-medium text-slate-700">No requests to show</p><p className="mt-2 text-xs text-slate-400">Try another year, status or section.</p></div> : <div className="divide-y divide-slate-100">{rows.data?.rows?.map(row => <button key={row._id} type="button" onClick={() => setSelected(row)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl px-2 py-5 text-left transition hover:bg-slate-50"><div className="min-w-0"><p className="font-semibold text-slate-800">{activeTab === 'mine' ? row.typeName : row.employee.name}</p><p className="mt-1 text-xs text-slate-500">{row.from} → {row.to} · {row.units} day(s) · {row.paid ? 'Paid' : 'Unpaid'}</p></div><div className="flex items-center gap-3"><Badge status={row.status}/><ArrowUpRight size={16} className="text-slate-400"/></div></button>)}</div>}</div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><button className={secondary} disabled={rows.loading || page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page} of {rows.data?.pages || 1}</span><button className={secondary} disabled={rows.loading || !rows.data || page >= rows.data.pages} onClick={() => setPage(p => p + 1)}>Next</button></div>
    </motion.section>}
    {activeTab === 'settings' && meta.data && <SettingsForm key={refresh} meta={meta.data} saved={saved}/>}
    {activeTab === 'balances' && <Allocations year={year} refresh={refresh} saved={saved}/>}
    {apply && canApply && meta.data && <LeaveApply types={meta.data.types} close={() => setApply(false)} saved={saved}/>}
    {selected && <RequestPanel row={selected} canApprove={canApprove} canApply={canApply} canRetry={canSettings} close={() => setSelected(null)} saved={saved}/>}
  </div>;
}
