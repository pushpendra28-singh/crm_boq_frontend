import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock3, CalendarCheck, LocateFixed, MapPin, RefreshCw, AlertCircle, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { attendanceRequest, getCurrentLocation, locationFeedback } from "./attendanceApi";
import "./attendance.css";
import AttendanceHistory from "./AttendanceHistory";

const zone = "Asia/Kolkata";
const time = (value) => value ? new Date(value).toLocaleTimeString("en-IN", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: true }) : "—";
const dateKey = (value) => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
const duration = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
const shiftTime = (value) => value ? time(`2000-01-01T${value}+05:30`) : "—";

export default function AttendanceModule({ canMark = false, canView = false }) {
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState("loading");
  const [notice, setNotice] = useState(null);
  const [location, setLocation] = useState(null);
  const [stale, setStale] = useState(true);
  const [workMode, setWorkMode] = useState("office");
  const lock = useRef(false);
  const mounted = useRef(false);
  const abort = useRef(null);
  const offset = useRef(0);
  const currentDate = useRef(null);
  const apply = useCallback((result) => {
    if (!mounted.current) return;
    const serverTime = new Date(result.serverTime).getTime();
    offset.current = serverTime - Date.now();
    setNow(serverTime);
    currentDate.current = dateKey(serverTime);
    setData((previous) => ({ ...previous, ...result }));
    if (result.attendance?.workMode) setWorkMode(result.attendance.workMode);
    setStale(false);
  }, []);
  const refresh = useCallback(async (quiet = false) => {
    if (lock.current || !mounted.current) return;
    lock.current = true;
    setBusy("refreshing");
    setStale(true);
    if (!quiet) setNotice(null);
    abort.current = new AbortController();
    try {
      const result = await attendanceRequest("/today", { signal: abort.current.signal });
      apply(result);
    } catch (error) {
      if (mounted.current) setNotice({ type: "error", text: error.message });
    } finally {
      lock.current = false;
      if (mounted.current) setBusy("");
    }
  }, [apply]);
  useEffect(() => {
    mounted.current = true;
    // Scheduling allows React StrictMode cleanup to cancel the first mount.
    const start = setTimeout(() => refresh(), 0);
    const timer = setInterval(() => {
      const current = Date.now() + offset.current;
      setNow(current);
      if (currentDate.current && dateKey(current) !== currentDate.current) {
        setLocation(null);
        setStale(true);
        refresh(true);
      }
    }, 1000);
    const resume = () => { if (document.visibilityState === "visible") refresh(true); };
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      mounted.current = false;
      clearTimeout(start);
      clearInterval(timer);
      abort.current?.abort();
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [refresh]);

  async function perform(mark) {
  const effectiveMode = data?.attendance?.workMode || workMode;

  if (mark && !canMark) {
    setNotice({
      type: "error",
      text: "You do not have permission to mark attendance.",
    });
    return;
  }

  if (
    lock.current ||
    !data ||
    stale ||
    (mark && (data.nextAction === "completed" || data.actionBlocked))
  ) {
    return;
  }

  if (effectiveMode === "wfh" && !data.wfh?.enabled && !data.attendance?.workMode) {
    setNotice({ type: "error", text: "Work From Home is not enabled for your account." });
    return;
  }
    lock.current = true;
    setNotice(null);
    setLocation(null);
    setBusy("locating");
    let submitted = false;
    abort.current = new AbortController();
    try {
      const coordinates = await getCurrentLocation();
      if (!mounted.current) return;
      const feedback = effectiveMode === "wfh"
        ? { ...coordinates, checkedAt: Date.now(), quality: coordinates.accuracy > 0 && coordinates.accuracy <= (data.office?.maxAccuracyMeters || 100) }
        : locationFeedback(coordinates, data.office);
      setLocation(feedback);
      if (!mark) {
        if (!feedback.quality) {
          setNotice({ type: "info", text: "GPS accuracy is low. Move near a window or outside and try again." });
        } else if (effectiveMode === "wfh") {
          setNotice({ type: "success", text: "Your current GPS location is ready for WFH attendance." });
        } else if (feedback.inside) {
          setNotice({ type: "success", text: "Your reported location is within the office radius. Final verification happens when you mark attendance." });
        } else {
          setNotice({ type: "info", text: `You are approximately ${Math.ceil(feedback.distance)} meters away. Move within ${data.office.radiusMeters} meters of the office.` });
        }
        return;
      }
      if (!feedback.quality) {
        setNotice({ type: "error", text: "GPS accuracy is too low. Move near a window or outside and try again." });
        return;
      }
      // POST even when the local estimate differs; backend policy is authoritative.
      setBusy("saving");
      submitted = true;
      const endpoint = data.nextAction === "check_in" ? "/check-in" : "/check-out";
      const result = await attendanceRequest(endpoint, { method: "POST", body: { ...coordinates, workMode: effectiveMode }, signal: abort.current.signal });
      if (!mounted.current) return;
      apply(result);
      setNotice({ type: "success", text: result.message });
    } catch (error) {
      if (!mounted.current) return;
      setNotice({ type: "error", text: error.message });
      if (submitted) {
        setStale(true);
        setBusy("refreshing");
        try {
          const latest = await attendanceRequest("/today", { signal: abort.current.signal });
          apply(latest);
          if (latest.nextAction !== data.nextAction) setNotice({ type: "info", text: "Attendance status refreshed. Please review today's record below." });
        } catch {
          if (mounted.current) setNotice({ type: "error", text: `${error.message} Status could not be confirmed. Click Refresh before trying again.` });
        }
      }
    } finally {
      lock.current = false;
      if (mounted.current) setBusy("");
    }
  }

  const record = data?.attendance?.attendanceStatus === "absent" ? null : data?.attendance;
 const complete = Boolean(
  data?.nextAction === "completed" &&
  !data?.actionBlocked &&
  data?.attendance?.attendanceStatus !== "absent" &&
  data?.attendance?.checkIn?.at &&
  data?.attendance?.checkOut?.at
);
  const checkedIn = !!record?.checkIn;
  const elapsed = checkedIn ? Math.max(0, Math.floor((now - new Date(record.checkIn.at).getTime()) / 60000)) : 0;
  const worked = record?.workingMinutes ?? elapsed;
  const status = data?.actionBlocked ? (data?.attendance?.attendanceStatus === "absent" ? "Marked absent" : "Record removed") : complete ? "Day completed" : checkedIn ? "Checked in" : "Not checked in";
  const freshLocation = location && now - offset.current - location.checkedAt < 60000;
  const activeWorkMode = record?.workMode || workMode;
  const wfhAllowed = Boolean(data?.wfh?.enabled);
  const wfhSelectable = wfhAllowed || record?.workMode === "wfh";
  const displayedLocation = location || record?.checkIn?.location || null;
  const locked = !!busy || stale || !data;
  const entrance = reduceMotion ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

  return (
    <motion.section {...entrance} className="att-module" aria-label="Employee attendance" aria-busy={!!busy}>
      <header className="att-header">
        <div><span className="att-eyebrow">MY WORKDAY</span><h1>Attendance</h1><p>A clear view of your day, from arrival to sign-off.</p></div>
        <button className="att-secondary" onClick={() => refresh()} disabled={!!busy}><RefreshCw size={16} className={busy === "refreshing" ? "att-spin" : ""} />Refresh</button>
      </header>
      {notice && <div className={`att-notice att-notice-${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
        {notice.type === "success" ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}<span>{notice.text}</span>
      </div>}
      {!data ? <div className="att-card att-empty">{busy ? <><RefreshCw className="att-spin" size={25} /><h2>Loading your workday</h2><p>Getting today’s attendance and office settings.</p></> : <><AlertCircle size={28} /><h2>Attendance is unavailable</h2><p>Use Refresh to try again. If your session has expired, please log in again.</p></>}</div> : <>
        {data.actionMessage && <div className="att-notice att-notice-info" role="status">{data.actionMessage}</div>}
        {stale && <div className="att-notice att-notice-info" role="status"><AlertCircle size={18} />Refresh today’s status to enable attendance actions.</div>}
        <div className="att-grid">
          <div className="att-card att-workday">
            <div className="att-row"><span className="att-eyebrow">TODAY AT THE OFFICE</span><span className={`att-badge ${checkedIn ? "att-badge-green" : ""}`}><span className="att-dot" />{status}</span></div>
            <p className="att-date">{new Date(now).toLocaleDateString("en-IN", { timeZone: zone, weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <div className="att-clock">{new Date(now).toLocaleTimeString("en-IN", { timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</div>
            <p className="att-timezone">Indian Standard Time <span>•</span> Asia/Kolkata</p>
            <div className="att-shift"><Clock3 size={18} /><div><strong>{shiftTime(data.office.checkInTime)} — {shiftTime(data.office.checkOutTime)}</strong><span>Office shift · {data.office.graceMinutes}-minute arrival grace</span></div></div>
            {!checkedIn && !complete && (
              <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Work mode</div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${workMode === "office" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"}`} onClick={() => setWorkMode("office")} disabled={!!busy}>Office</button>
                  <button type="button" className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${workMode === "wfh" ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"} disabled:cursor-not-allowed disabled:opacity-50`} onClick={() => wfhSelectable && setWorkMode("wfh")} disabled={!!busy || !wfhSelectable} title={!wfhSelectable ? "WFH is not enabled for you" : "Work from home"}>Work From Home{wfhAllowed ? <span className="ml-1 text-[10px]">· {data.wfh.dayType === "half_day" ? "Half" : "Full"}</span> : <span className="ml-1 text-[10px]">· Not allowed</span>}</button>
                </div>
              </div>
            )}
            {activeWorkMode === "wfh" && wfhAllowed && !complete && (
              <p className="mt-3 text-xs font-medium text-emerald-700">WFH attendance will be recorded as {data.wfh.dayType === "half_day" ? "Half Day" : "Full Day"}.</p>
            )}
            <div className="att-action-area"><h2>{complete ? "Your workday is recorded." : checkedIn ? "Ready to wrap up?" : "Start your day here."}</h2><p>{complete ? "Your check-in and check-out are saved below." : checkedIn ? "Check out when you finish. Your current location will be verified." : activeWorkMode === "wfh" ? "Mark your attendance from your current location. Office radius does not apply to approved WFH." : `Mark your arrival from within ${data.office.radiusMeters} meters of the office.`}</p>
              <motion.button whileTap={reduceMotion ? undefined : { scale: 0.985 }} className="att-primary" disabled={locked || complete || !canMark || data.actionBlocked} onClick={() => perform(true)}>
                {busy === "locating" || busy === "saving" ? <RefreshCw size={20} className="att-spin" /> : complete ? <CheckCircle2 size={20} /> : checkedIn ? <LogOut size={20} /> : <LogIn size={20} />}
                {busy === "locating" ? "Getting your location…" : busy === "saving" ? "Saving attendance…" : data.actionBlocked ? "Contact administrator" : complete ? "Attendance completed" : checkedIn ? "Check out" : "Check in"}
                {!complete && !busy && <ArrowRight size={18} className="att-button-arrow" />}
              </motion.button>
              {!canMark && (
  <p className="att-action-note">
    You have view-only access. Contact your administrator
    to enable attendance marking.
  </p>
)}
              <p className="att-action-note"><ShieldCheck size={14} />Fresh location verified with every attendance action</p>
            </div>
          </div>
          <aside className="att-card att-location">
            <div className="att-row"><h2>{activeWorkMode === "wfh" ? "WFH location" : "Office location"}</h2><MapPin size={19} className="att-green" /></div>
            {activeWorkMode === "wfh" ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">GPS capture</div>
                  <p className="mt-1 text-sm text-emerald-800">WFH uses the employee’s current GPS location. No office-radius check is applied.</p>
                </div>
                <div className="att-location-metrics"><div><span>GPS latitude</span><strong>{displayedLocation ? displayedLocation.latitude.toFixed(6) : "—"}</strong></div><div><span>GPS longitude</span><strong>{displayedLocation ? displayedLocation.longitude.toFixed(6) : "—"}</strong></div><div><span>Accuracy</span><strong>{displayedLocation ? `± ${Math.ceil(displayedLocation.accuracy)} m` : "—"}</strong></div></div>
              </div>
            ) : (
              <>
                <div className="att-radar" aria-hidden="true"><div className="att-ring att-ring-outer" /><div className="att-ring att-ring-inner" /><div className="att-office-pin"><MapPin size={30} /></div><span className="att-radius">{data.office.radiusMeters} m radius</span></div>
                <h3>{data.office.name}</h3><p className="att-location-status">{!location ? "Check your location when you’re ready." : !freshLocation ? "Location estimate expired. Check again for an update." : !location.quality ? "Location accuracy needs improvement" : location.inside ? "Reported location is within range" : "Reported location is outside range"}</p>
                <div className="att-location-metrics"><div><span>Estimated distance</span><strong>{freshLocation ? `${Math.ceil(location.distance)} m` : "—"}</strong></div><div><span>GPS accuracy</span><strong>{freshLocation ? `± ${Math.ceil(location.accuracy)} m` : "—"}</strong></div></div>
              </>
            )}
            <button className="att-secondary att-full" disabled={locked || (activeWorkMode === "wfh" && !wfhSelectable)} onClick={() => perform(false)}><LocateFixed size={17} />{busy === "locating" ? "Locating…" : "Check location"}</button>
            <p className="att-small">The captured coordinates are saved with the attendance record for audit purposes.</p>
          </aside>
        </div>
        <div className="att-stats">
          {[{ label: "Check-in", value: time(record?.checkIn?.at), note: checkedIn ? record.arrivalStatus === "late" ? "Late arrival" : "On-time arrival" : "Waiting for your arrival", Icon: LogIn },
          { label: "Check-out", value: time(record?.checkOut?.at), note: complete ? record.earlyDeparture ? "Before scheduled shift end" : "Workday signed off" : data?.attendance?.attendanceStatus === "absent"? "Marked absent" : data?.actionBlocked ? "Record unavailable"  : "Not recorded yet", Icon: LogOut },
          { label: "Time at work", value: checkedIn ? duration(worked) : "—", note: complete ? "Recorded duration · no break deduction" : checkedIn ? "Live estimate since check-in" : "Starts when you check in", Icon: Clock3 }].map(({ label, value, note, Icon }) => <div className="att-card att-stat" key={label}><span className="att-stat-icon"><Icon size={20} /></span><span className="att-stat-label">{label}</span><strong>{value}</strong><p>{note}</p></div>)}
        </div>
        <div className="att-card att-record"><div className="att-row"><h2>Today’s activity</h2><CalendarCheck size={19} className="att-green" /></div><div className="att-activity"><div className={`att-event ${checkedIn ? "att-event-done" : ""}`}><span className="att-event-dot" /><div><strong>Arrival recorded</strong><p>{checkedIn ? `${time(record.checkIn.at)} · ${record.arrivalStatus === "late" ? "Late" : "On time"}` : "Check in to start your workday"}</p></div></div><div className={`att-event ${complete ? "att-event-done" : ""}`}><span className="att-event-dot" /><div><strong>Workday completed</strong><p>{complete ? `${time(record.checkOut.at)} · ${duration(worked)} recorded` : "Your check-out will appear here"}</p></div></div></div></div>
      </>}
      {canView && <AttendanceHistory refreshKey={data?.serverTime} />}
    </motion.section>
  );
}






// import { useCallback, useEffect, useRef, useState } from "react";
// import { motion, useReducedMotion } from "framer-motion";
// import { ArrowRight, CheckCircle2, Clock3, CalendarCheck, LocateFixed, MapPin, RefreshCw, AlertCircle, LogIn, LogOut, ShieldCheck } from "lucide-react";
// import { attendanceRequest, getCurrentLocation, locationFeedback } from "./attendanceApi";
// import "./attendance.css";
// import AttendanceHistory from "./AttendanceHistory";

// const zone = "Asia/Kolkata";
// const time = (value) => value ? new Date(value).toLocaleTimeString("en-IN", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: true }) : "—";
// const dateKey = (value) => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
// const duration = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
// const shiftTime = (value) => value ? time(`2000-01-01T${value}+05:30`) : "—";

// export default function AttendanceModule({ canMark = false, canView = false }) {
//   const reduceMotion = useReducedMotion();
//   const [data, setData] = useState(null);
//   const [now, setNow] = useState(Date.now());
//   const [busy, setBusy] = useState("loading");
//   const [notice, setNotice] = useState(null);
//   const [location, setLocation] = useState(null);
//   const [stale, setStale] = useState(true);
//   const lock = useRef(false);
//   const mounted = useRef(false);
//   const abort = useRef(null);
//   const offset = useRef(0);
//   const currentDate = useRef(null);
//   const apply = useCallback((result) => {
//     if (!mounted.current) return;
//     const serverTime = new Date(result.serverTime).getTime();
//     offset.current = serverTime - Date.now();
//     setNow(serverTime);
//     currentDate.current = dateKey(serverTime);
//     setData((previous) => ({ ...previous, ...result }));
//     setStale(false);
//   }, []);
//   const refresh = useCallback(async (quiet = false) => {
//     if (lock.current || !mounted.current) return;
//     lock.current = true;
//     setBusy("refreshing");
//     setStale(true);
//     if (!quiet) setNotice(null);
//     abort.current = new AbortController();
//     try {
//       const result = await attendanceRequest("/today", { signal: abort.current.signal });
//       apply(result);
//     } catch (error) {
//       if (mounted.current) setNotice({ type: "error", text: error.message });
//     } finally {
//       lock.current = false;
//       if (mounted.current) setBusy("");
//     }
//   }, [apply]);
//   useEffect(() => {
//     mounted.current = true;
//     // Scheduling allows React StrictMode cleanup to cancel the first mount.
//     const start = setTimeout(() => refresh(), 0);
//     const timer = setInterval(() => {
//       const current = Date.now() + offset.current;
//       setNow(current);
//       if (currentDate.current && dateKey(current) !== currentDate.current) {
//         setLocation(null);
//         setStale(true);
//         refresh(true);
//       }
//     }, 1000);
//     const resume = () => { if (document.visibilityState === "visible") refresh(true); };
//     window.addEventListener("focus", resume);
//     document.addEventListener("visibilitychange", resume);
//     return () => {
//       mounted.current = false;
//       clearTimeout(start);
//       clearInterval(timer);
//       abort.current?.abort();
//       window.removeEventListener("focus", resume);
//       document.removeEventListener("visibilitychange", resume);
//     };
//   }, [refresh]);

//   async function perform(mark) {
//   if (mark && !canMark) {
//     setNotice({
//       type: "error",
//       text: "You do not have permission to mark attendance.",
//     });
//     return;
//   }

//   if (
//     lock.current ||
//     !data ||
//     stale ||
//     (mark && (data.nextAction === "completed" || data.actionBlocked))
//   ) {
//     return;
//   }
//     lock.current = true;
//     setNotice(null);
//     setLocation(null);
//     setBusy("locating");
//     let submitted = false;
//     abort.current = new AbortController();
//     try {
//       const coordinates = await getCurrentLocation();
//       if (!mounted.current) return;
//       const feedback = locationFeedback(coordinates, data.office);
//       setLocation(feedback);
//       if (!mark) {
//         setNotice({
//           type: feedback.quality && feedback.inside ? "success" : "info", text:
//             !feedback.quality ? "Location accuracy is low. Move near a window and try again." :
//               feedback.inside ? "Your reported location is within the office radius. Final verification happens when you mark attendance." :
//                 `You are approximately ${Math.ceil(feedback.distance)} meters away. Move within ${data.office.radiusMeters} meters of the office.`
//         });
//         return;
//       }
//       // POST even when the local estimate differs; backend policy is authoritative.
//       setBusy("saving");
//       submitted = true;
//       const endpoint = data.nextAction === "check_in" ? "/check-in" : "/check-out";
//       const result = await attendanceRequest(endpoint, { method: "POST", body: coordinates, signal: abort.current.signal });
//       if (!mounted.current) return;
//       apply(result);
//       setNotice({ type: "success", text: result.message });
//     } catch (error) {
//       if (!mounted.current) return;
//       setNotice({ type: "error", text: error.message });
//       if (submitted) {
//         setStale(true);
//         setBusy("refreshing");
//         try {
//           const latest = await attendanceRequest("/today", { signal: abort.current.signal });
//           apply(latest);
//           if (latest.nextAction !== data.nextAction) setNotice({ type: "info", text: "Attendance status refreshed. Please review today's record below." });
//         } catch {
//           if (mounted.current) setNotice({ type: "error", text: `${error.message} Status could not be confirmed. Click Refresh before trying again.` });
//         }
//       }
//     } finally {
//       lock.current = false;
//       if (mounted.current) setBusy("");
//     }
//   }

//   const record = data?.attendance?.attendanceStatus === "absent" ? null : data?.attendance;
//  const complete = Boolean(
//   data?.nextAction === "completed" &&
//   !data?.actionBlocked &&
//   data?.attendance?.attendanceStatus !== "absent" &&
//   data?.attendance?.checkIn?.at &&
//   data?.attendance?.checkOut?.at
// );
//   const checkedIn = !!record?.checkIn;
//   const elapsed = checkedIn ? Math.max(0, Math.floor((now - new Date(record.checkIn.at).getTime()) / 60000)) : 0;
//   const worked = record?.workingMinutes ?? elapsed;
//   const status = data?.actionBlocked ? (data?.attendance?.attendanceStatus === "absent" ? "Marked absent" : "Record removed") : complete ? "Day completed" : checkedIn ? "Checked in" : "Not checked in";
//   const freshLocation = location && now - offset.current - location.checkedAt < 60000;
//   const locked = !!busy || stale || !data;
//   const entrance = reduceMotion ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

//   return (
//     <motion.section {...entrance} className="att-module" aria-label="Employee attendance" aria-busy={!!busy}>
//       <header className="att-header">
//         <div><span className="att-eyebrow">MY WORKDAY</span><h1>Attendance</h1><p>A clear view of your day, from arrival to sign-off.</p></div>
//         <button className="att-secondary" onClick={() => refresh()} disabled={!!busy}><RefreshCw size={16} className={busy === "refreshing" ? "att-spin" : ""} />Refresh</button>
//       </header>
//       {notice && <div className={`att-notice att-notice-${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
//         {notice.type === "success" ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}<span>{notice.text}</span>
//       </div>}
//       {!data ? <div className="att-card att-empty">{busy ? <><RefreshCw className="att-spin" size={25} /><h2>Loading your workday</h2><p>Getting today’s attendance and office settings.</p></> : <><AlertCircle size={28} /><h2>Attendance is unavailable</h2><p>Use Refresh to try again. If your session has expired, please log in again.</p></>}</div> : <>
//         {data.actionMessage && <div className="att-notice att-notice-info" role="status">{data.actionMessage}</div>}
//         {stale && <div className="att-notice att-notice-info" role="status"><AlertCircle size={18} />Refresh today’s status to enable attendance actions.</div>}
//         <div className="att-grid">
//           <div className="att-card att-workday">
//             <div className="att-row"><span className="att-eyebrow">TODAY AT THE OFFICE</span><span className={`att-badge ${checkedIn ? "att-badge-green" : ""}`}><span className="att-dot" />{status}</span></div>
//             <p className="att-date">{new Date(now).toLocaleDateString("en-IN", { timeZone: zone, weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
//             <div className="att-clock">{new Date(now).toLocaleTimeString("en-IN", { timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</div>
//             <p className="att-timezone">Indian Standard Time <span>•</span> Asia/Kolkata</p>
//             <div className="att-shift"><Clock3 size={18} /><div><strong>{shiftTime(data.office.checkInTime)} — {shiftTime(data.office.checkOutTime)}</strong><span>Office shift · {data.office.graceMinutes}-minute arrival grace</span></div></div>
//             <div className="att-action-area"><h2>{complete ? "Your workday is recorded." : checkedIn ? "Ready to wrap up?" : "Start your day here."}</h2><p>{complete ? "Your check-in and check-out are saved below." : checkedIn ? "Check out when you finish. Your current location will be verified." : `Mark your arrival from within ${data.office.radiusMeters} meters of the office.`}</p>
//               <motion.button whileTap={reduceMotion ? undefined : { scale: 0.985 }} className="att-primary" disabled={locked || complete || !canMark || data.actionBlocked} onClick={() => perform(true)}>
//                 {busy === "locating" || busy === "saving" ? <RefreshCw size={20} className="att-spin" /> : complete ? <CheckCircle2 size={20} /> : checkedIn ? <LogOut size={20} /> : <LogIn size={20} />}
//                 {busy === "locating" ? "Getting your location…" : busy === "saving" ? "Saving attendance…" : data.actionBlocked ? "Contact administrator" : complete ? "Attendance completed" : checkedIn ? "Check out" : "Check in"}
//                 {!complete && !busy && <ArrowRight size={18} className="att-button-arrow" />}
//               </motion.button>
//               {!canMark && (
//   <p className="att-action-note">
//     You have view-only access. Contact your administrator
//     to enable attendance marking.
//   </p>
// )}
//               <p className="att-action-note"><ShieldCheck size={14} />Fresh location verified with every attendance action</p>
//             </div>
//           </div>
//           <aside className="att-card att-location">
//             <div className="att-row"><h2>Office location</h2><MapPin size={19} className="att-green" /></div>
//             <div className="att-radar" aria-hidden="true"><div className="att-ring att-ring-outer" /><div className="att-ring att-ring-inner" /><div className="att-office-pin"><MapPin size={30} /></div><span className="att-radius">{data.office.radiusMeters} m radius</span></div>
//             <h3>{data.office.name}</h3><p className="att-location-status">{!location ? "Check your location when you’re ready." : !freshLocation ? "Location estimate expired. Check again for an update." : !location.quality ? "Location accuracy needs improvement" : location.inside ? "Reported location is within range" : "Reported location is outside range"}</p>
//             <div className="att-location-metrics"><div><span>Estimated distance</span><strong>{freshLocation ? `${Math.ceil(location.distance)} m` : "—"}</strong></div><div><span>GPS accuracy</span><strong>{freshLocation ? `± ${Math.ceil(location.accuracy)} m` : "—"}</strong></div></div>
//             <button className="att-secondary att-full" disabled={locked} onClick={() => perform(false)}><LocateFixed size={17} />{busy === "locating" ? "Locating…" : "Check location"}</button>
//             <p className="att-small">Location is requested when you check it or mark attendance. This graphic illustrates the radius; it is not a live map.</p>
//           </aside>
//         </div>
//         <div className="att-stats">
//           {[{ label: "Check-in", value: time(record?.checkIn?.at), note: checkedIn ? record.arrivalStatus === "late" ? "Late arrival" : "On-time arrival" : "Waiting for your arrival", Icon: LogIn },
//           { label: "Check-out", value: time(record?.checkOut?.at), note: complete ? record.earlyDeparture ? "Before scheduled shift end" : "Workday signed off" : data?.attendance?.attendanceStatus === "absent"? "Marked absent" : data?.actionBlocked ? "Record unavailable"  : "Not recorded yet", Icon: LogOut },
//           { label: "Time at work", value: checkedIn ? duration(worked) : "—", note: complete ? "Recorded duration · no break deduction" : checkedIn ? "Live estimate since check-in" : "Starts when you check in", Icon: Clock3 }].map(({ label, value, note, Icon }) => <div className="att-card att-stat" key={label}><span className="att-stat-icon"><Icon size={20} /></span><span className="att-stat-label">{label}</span><strong>{value}</strong><p>{note}</p></div>)}
//         </div>
//         <div className="att-card att-record"><div className="att-row"><h2>Today’s activity</h2><CalendarCheck size={19} className="att-green" /></div><div className="att-activity"><div className={`att-event ${checkedIn ? "att-event-done" : ""}`}><span className="att-event-dot" /><div><strong>Arrival recorded</strong><p>{checkedIn ? `${time(record.checkIn.at)} · ${record.arrivalStatus === "late" ? "Late" : "On time"}` : "Check in to start your workday"}</p></div></div><div className={`att-event ${complete ? "att-event-done" : ""}`}><span className="att-event-dot" /><div><strong>Workday completed</strong><p>{complete ? `${time(record.checkOut.at)} · ${duration(worked)} recorded` : "Your check-out will appear here"}</p></div></div></div></div>
//       </>}
//       {canView && <AttendanceHistory refreshKey={data?.serverTime} />}
//     </motion.section>
//   );
// }
