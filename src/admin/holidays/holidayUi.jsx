import { useEffect, useRef, useState } from "react";
import { holidayRequest } from "./holidayApi";

export const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-gray-50 disabled:text-gray-400";
export const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:border-green-300 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50";
export const primaryClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
export function Notice({ children, error = false }) {
  return children ? <div role={error ? "alert" : "status"} className={`my-4 rounded-xl border p-3 text-sm leading-relaxed ${error ? "border-red-100 bg-red-50 text-red-700" : "border-green-100 bg-green-50 text-green-800"}`}>{children}</div> : null;
}
export function useHolidayData(path, revision = 0) {
  const [state, setState] = useState({ data: null, error: "", loading: !!path });
  useEffect(() => {
    if (!path) { setState({ data: null, error: "", loading: false }); return; }
    let live = true;
    const controller = new AbortController();
    setState({ data: null, error: "", loading: true });
    holidayRequest(path, { signal: controller.signal })
      .then(data => { if (live) setState({ data, error: "", loading: false }); })
      .catch(error => { if (live) setState({ data: null, error: error.message, loading: false }); });
    return () => { live = false; controller.abort(); };
  }, [path, revision]);
  return state;
}
export function Modal({ title, children, onClose, busy }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto max-h-[90vh] w-[min(760px,94vw)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 text-gray-800 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm">
    <header className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4"><h2 className="text-lg font-bold">{title}</h2><button type="button" aria-label="Close dialog" disabled={busy} onClick={onClose} className={buttonClass}>Close</button></header>
    <div className="p-5">{children}</div>
  </dialog>;
}
