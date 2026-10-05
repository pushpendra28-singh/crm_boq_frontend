import { useEffect, useRef, useState } from 'react';
import { X, Search } from 'lucide-react';
import { leaveApi } from './leaveApi';
export const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:opacity-50';
export const button = 'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50';
export const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50';
export const label = 'grid gap-2 text-xs font-semibold text-slate-600';
export function Notice({ children, error = false }) { return children ? <p role={error ? 'alert' : 'status'} className={`rounded-xl border p-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-100 bg-emerald-50 text-emerald-800'}`}>{children}</p> : null; }
export function useLoad(path, key = 0) {
  const [state, set] = useState({ data: null, loading: true, error: '' });
  useEffect(() => {
    const c = new AbortController(); let active = true;
    set({ data: null, loading: Boolean(path), error: '' });
    if (path) leaveApi(path, { signal: c.signal }).then(data => { if (active) set({ data, loading: false, error: '' }); }).catch(e => { if (active) set({ data: null, loading: false, error: e.message }); });
    return () => { active = false; c.abort(); };
  }, [path, key]);
  return state;
}
export function Panel({ title, children, close, busy = false }) {
  const ref = useRef(null);
  useEffect(() => { const d = ref.current; d.showModal(); return () => d.close(); }, []);
  return <dialog ref={ref} onCancel={e => { e.preventDefault(); if (!busy) close(); }} className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-xl overflow-y-auto border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-950/30 backdrop:backdrop-blur-sm">
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5"><h2 className="text-lg font-semibold text-slate-900">{title}</h2><button type="button" disabled={busy} className={secondary} onClick={close} aria-label="Close panel"><X size={18}/></button></div>
    <div className="space-y-5 p-6">{children}</div>
  </dialog>;
}
export function Badge({ status }) {
  const colors = { pending: 'bg-amber-50 text-amber-800', under_review: 'bg-sky-50 text-sky-800', approved: 'bg-emerald-50 text-emerald-800', rejected: 'bg-rose-50 text-rose-800', cancelled: 'bg-slate-100 text-slate-600', cancel_requested: 'bg-violet-50 text-violet-800' };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[status] || colors.pending}`}>{status.replaceAll('_', ' ')}</span>;
}
export function Directory({ selected = [], onChange, reviewersOnly = false, multiple = false }) {
  const [query, setQuery] = useState(''), [search, setSearch] = useState(''), [page, setPage] = useState(1);
  const { data, loading, error } = useLoad(`/directory?q=${encodeURIComponent(search)}&page=${page}`);
  return <div className="space-y-3 rounded-xl border border-slate-200 p-3">
    <div className="flex gap-2"><input aria-label="Search employees" placeholder="Search name or email" className={field} value={query} onChange={e => setQuery(e.target.value)}/><button type="button" className={secondary} onClick={() => { setSearch(query); setPage(1); }} aria-label="Search"><Search size={16}/></button></div>
    <Notice error>{error}</Notice>
    {loading ? <p className="text-xs text-slate-500">Loading employees…</p> : <div className="max-h-44 space-y-1 overflow-y-auto">{data?.employees?.filter(u => !reviewersOnly || u.canApprove).map(u => <label key={u.id} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 text-xs hover:bg-slate-50"><input type={multiple ? 'checkbox' : 'radio'} checked={selected.includes(u.id)} onChange={() => onChange(multiple ? selected.includes(u.id) ? selected.filter(id => id !== u.id) : [...selected, u.id] : [u.id])}/><span><strong className="block text-slate-700">{u.name}</strong><span className="break-all text-slate-400">{u.email}</span></span></label>)}{!data?.employees?.length && <p className="text-xs text-slate-500">No matching employees.</p>}</div>}
    <div className="flex items-center justify-between text-xs text-slate-500"><button type="button" className={secondary} disabled={loading || page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>{page} / {data?.pages || 1}</span><button type="button" className={secondary} disabled={loading || !data || page >= data.pages} onClick={() => setPage(p => p + 1)}>Next</button></div>
    {multiple && <p className="text-xs text-slate-500">{selected.length} approver(s) selected across all pages.</p>}
  </div>;
}
