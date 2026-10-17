import { useEffect, useRef, useState } from "react";
import { holidayRequest } from "./holidayApi";

export const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400";
export const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-[#0a1a4f] shadow-sm transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50";
export const primaryClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-600 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";
export function Notice({ children, error = false }) {
  return children ? <div role={error ? "alert" : "status"} className={`my-4 rounded-xl border p-3 text-sm font-medium leading-relaxed ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{children}</div> : null;
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
  return <dialog ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto max-h-[90vh] w-[min(760px,94vw)] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-0 text-slate-800 shadow-2xl shadow-[#0a1a4f]/40 backdrop:bg-[#0a1a4f]/55 backdrop:backdrop-blur-sm">
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-gradient-to-r from-[#0a1a4f] via-[#0d2468] to-blue-700 px-5 py-4 shadow-lg shadow-[#0a1a4f]/20"><h2 className="text-lg font-extrabold text-white">{title}</h2><button type="button" aria-label="Close dialog" disabled={busy} onClick={onClose} className={buttonClass}>Close</button></header>
    <div className="bg-white p-5">{children}</div>
  </dialog>;
}


// import { useEffect, useRef, useState } from "react";
// import { holidayRequest } from "./holidayApi";

// export const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-gray-50 disabled:text-gray-400";
// export const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:border-green-300 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50";
// export const primaryClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
// export function Notice({ children, error = false }) {
//   return children ? <div role={error ? "alert" : "status"} className={`my-4 rounded-xl border p-3 text-sm leading-relaxed ${error ? "border-red-100 bg-red-50 text-red-700" : "border-green-100 bg-green-50 text-green-800"}`}>{children}</div> : null;
// }
// export function useHolidayData(path, revision = 0) {
//   const [state, setState] = useState({ data: null, error: "", loading: !!path });
//   useEffect(() => {
//     if (!path) { setState({ data: null, error: "", loading: false }); return; }
//     let live = true;
//     const controller = new AbortController();
//     setState({ data: null, error: "", loading: true });
//     holidayRequest(path, { signal: controller.signal })
//       .then(data => { if (live) setState({ data, error: "", loading: false }); })
//       .catch(error => { if (live) setState({ data: null, error: error.message, loading: false }); });
//     return () => { live = false; controller.abort(); };
//   }, [path, revision]);
//   return state;
// }
// export function Modal({ title, children, onClose, busy }) {
//   const ref = useRef(null);
//   useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
//   return <dialog ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto max-h-[90vh] w-[min(760px,94vw)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 text-gray-800 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm">
//     <header className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4"><h2 className="text-lg font-bold">{title}</h2><button type="button" aria-label="Close dialog" disabled={busy} onClick={onClose} className={buttonClass}>Close</button></header>
//     <div className="p-5">{children}</div>
//   </dialog>;
// }
