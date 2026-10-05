import { useEffect, useRef, useState } from 'react';
import API_BASE_URL from '../../config/api';
const today = () => new Date(Date.now()+19800000).toISOString().slice(0,10);
const time = v => v ? new Date(v).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:true}) : '—';
const inputTime = v => v ? new Date(new Date(v).getTime()+19800000).toISOString().slice(11,19) : '';
async function request(path, options={}) {
  const token = localStorage.getItem('adminToken');
  if (!token) throw new Error('Your session has expired. Please log in again.');
  const c = new AbortController();
  const stop = ()=>c.abort();
  options.signal?.addEventListener('abort',stop,{once:true});
  if(options.signal?.aborted)c.abort();
  const timer=setTimeout(stop,20000);
  try {
    const res=await fetch(`${API_BASE_URL.replace(/\/$/,'')}/attendance${path}`,{...options,signal:c.signal,cache:'no-store',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}});
    const result=await res.json().catch(()=>null);
    if(!res.ok || !result?.success)throw new Error(result?.message || 'Attendance request failed. Refresh before retrying.');
    return result;
  } catch(e) {
    if(e.name==='AbortError')throw new Error('Request interrupted or timed out. Refresh records to confirm the result.');
    if(e instanceof TypeError)throw new Error('Unable to connect. Check your connection and refresh records.');
    throw e;
  } finally {clearTimeout(timer);options.signal?.removeEventListener('abort',stop);}
}
export function Editor({ target, onClose, onSaved }) {
  const dialog=useRef(null), lock=useRef(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [form,setForm]=useState({attendanceDate:target.attendanceDate,attendanceStatus:target.attendanceStatus,checkInTime:inputTime(target.checkInAt),checkOutTime:inputTime(target.checkOutAt),reason:''});
  const removing=target.action==='delete';
  useEffect(()=>{const d=dialog.current;d.showModal();return ()=>d.close();},[]);
  const change=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));
  async function save(e){
    e.preventDefault();if(lock.current)return;
    lock.current=true;setBusy(true);setError('');
    try{
      const result=await request(`/${target.id}`,{method:removing?'DELETE':'PATCH',body:JSON.stringify({...form,version:target.version})});
      onSaved(result.message);
    }catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}
  }
  return <dialog ref={dialog} className="att-edit-dialog" aria-labelledby="attendance-editor-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
    <form onSubmit={save}>
      <h2 id="attendance-editor-title">{removing?'Delete attendance':'Edit attendance'}</h2>
      <p>{target.employeeName} · {target.attendanceDate}</p>
      {error && <div className="att-notice att-notice-error" role="alert">{error}</div>}
      {!removing && <div className="att-edit-fields">
        <label>Date<input required type="date" name="attendanceDate" min="2000-01-01" max={today()} value={form.attendanceDate} onChange={change} disabled={busy}/></label>
        <label>Status<select name="attendanceStatus" value={form.attendanceStatus} onChange={change} disabled={busy}><option value="present">Present</option>
        <option value="absent">Absent</option>
        <option value="half_day">Half Day</option>
        </select></label>
       {['present', 'half_day'].includes(form.attendanceStatus) && <>
          <label>Check-in (IST)<input required type="time" step="1" name="checkInTime" value={form.checkInTime} onChange={change} disabled={busy}/></label>
          <label>Check-out (IST, optional)<input type="time" step="1" name="checkOutTime" value={form.checkOutTime} onChange={change} disabled={busy}/></label>
        </>}
      </div>}
      {removing && <p>The record will be removed from attendance views. Its audit history will be retained.</p>}
      {!removing && form.attendanceStatus==='absent' && <p>Effective work duration will be zero. Original punches will remain in the audit evidence.</p>}
      <label className="att-reason">Reason<textarea name="reason" required minLength={3} maxLength={1000} value={form.reason} onChange={change} disabled={busy}/></label>
      <div className="att-edit-actions"><button type="button" className="att-secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="att-secondary" type="submit" disabled={busy}>{busy?'Saving…':removing?'Confirm delete':'Save changes'}</button></div>
    </form>
  </dialog>;
}
export default function AttendanceManagement({canEdit,canDelete}) {
  const [filters,setFilters]=useState({from:today().slice(0,7)+'-01',to:today(),search:''});
  const [query,setQuery]=useState(filters),[page,setPage]=useState(1),[tick,setTick]=useState(0);
  const [result,setResult]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[target,setTarget]=useState(null);
  useEffect(()=>{
    const c=new AbortController();let live=true;
    setLoading(true);setResult(null);setError('');
    request(`/all?${new URLSearchParams({...query,page:String(page)})}`,{signal:c.signal})
      .then(r=>{if(live){if(!Array.isArray(r.records))throw new Error('Invalid attendance response.');setResult(r);}})
      .catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});
    return ()=>{live=false;c.abort();};
  },[query,page,tick]);
  return <section className="att-card att-management">
    <div className="att-header"><div><h1>All Attendance</h1><p>Team records and authorized corrections · IST</p></div><button className="att-secondary" disabled={loading} onClick={()=>{setTick(t=>t+1);setMessage('');}}>Refresh</button></div>
    <form className="att-filters" onSubmit={e=>{e.preventDefault();setPage(1);setQuery({...filters});}}>
      <label>From<input type="date" required min="2000-01-01" max={today()} value={filters.from} onChange={e=>setFilters({...filters,from:e.target.value})}/></label>
      <label>To<input type="date" required min={filters.from} max={today()} value={filters.to} onChange={e=>setFilters({...filters,to:e.target.value})}/></label>
      <label>Employee<input type="search" maxLength={100} placeholder="Name or email" value={filters.search} onChange={e=>setFilters({...filters,search:e.target.value})}/></label>
      <button className="att-secondary" type="submit" disabled={loading}>Apply filters</button>
    </form>
    {message && <div className="att-notice att-notice-success" role="status">{message}</div>}
    {error && <div className="att-notice att-notice-error" role="alert">{error}</div>}
    {loading ? <p role="status">Loading attendance…</p> : result && <>
      <div className="att-history-scroll" tabIndex={0} role="region" aria-label="Team attendance table">
        <table className="att-history-table"><thead><tr><th>Employee</th><th>Date</th><th>Check-in</th><th>Check-out</th><th>Time at work</th><th>Mode / Location</th><th>Status</th>{(canEdit||canDelete)&&<th>Actions</th>}</tr></thead>
        <tbody>{result.records.map(r=><tr key={r.id}>
          <td><strong>{r.employeeName}</strong><small className="att-employee-email">{r.employeeEmail}</small></td><td>{r.attendanceDate}</td><td>{time(r.checkInAt)}</td><td>{time(r.checkOutAt)}</td>
          <td>{r.workingMinutes==null?'Pending':`${Math.floor(r.workingMinutes/60)}h ${r.workingMinutes%60}m`}</td>
          <td>
            <div className="text-xs font-semibold text-gray-700">{r.workMode==='wfh'?`WFH · ${r.wfhType==='half_day'?'Half Day':'Full Day'}`:'Office'}</div>
            {r.workMode==='wfh' && r.checkInLocation ? <a className="text-[11px] text-emerald-700 underline" href={`https://www.google.com/maps?q=${r.checkInLocation.latitude},${r.checkInLocation.longitude}`} target="_blank" rel="noreferrer">{r.checkInLocation.latitude.toFixed(5)}, {r.checkInLocation.longitude.toFixed(5)}</a> : null}
          </td>
          <td>
  <span
    className={`att-history-status ${
      r.attendanceStatus === "absent"
        ? "att-history-absent"
        : r.attendanceStatus === "half_day"
          ? "att-history-late"
          : r.arrivalStatus === "late"
            ? "att-history-late"
            : "att-history-on-time"
    }`}
  >
    {r.attendanceStatus === "absent"
      ? "Absent"
      : r.attendanceStatus === "half_day"
        ? "Half Day"
        : r.arrivalStatus === "late"
          ? "Present · Late"
          : "Present · On time"}
  </span>
</td>
          {(canEdit||canDelete)&&<td><div className="att-row-actions">{canEdit&&<button className="att-secondary" onClick={()=>setTarget({...r,action:'edit'})}>Edit</button>}{canDelete&&<button className="att-secondary" onClick={()=>setTarget({...r,action:'delete'})}>Delete</button>}</div></td>}
        </tr>)}</tbody></table>
      </div>
      {result.records.length===0&&<p className="att-history-message">No records match these filters.</p>}
      <div className="att-pagination"><span>{result.total} records · Page {result.page} of {result.pages}</span><button className="att-secondary" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button><button className="att-secondary" disabled={page>=result.pages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
    </>}
    {target && (target.action==='edit'?canEdit:canDelete) && <Editor key={target.id+target.action} target={target} onClose={()=>setTarget(null)} onSaved={text=>{setTarget(null);setMessage(text);setTick(t=>t+1);}}/>}
  </section>;
}
