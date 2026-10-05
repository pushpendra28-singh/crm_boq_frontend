import { useEffect, useState } from "react";
import API_BASE_URL from "../../config/api";

const TIMEZONE = "Asia/Kolkata";

function getCurrentMonth() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year").value;
  const month = parts.find((part) => part.type === "month").value;

  return `${year}-${month}`;
}

function formatTime(value) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString("en-IN", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(value) {
  return new Date(`${value}T00:00:00+05:30`).toLocaleDateString(
    "en-IN",
    {
      timeZone: TIMEZONE,
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return "—";

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function AttendanceHistory({ refreshKey }) {
  const [month, setMonth] = useState(getCurrentMonth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 20000);

    async function loadHistory() {
      setLoading(true);
      setError("");
      setRecords([]);

      try {
        const token = localStorage.getItem("adminToken");

        if (!token) {
          throw new Error("Your session has expired. Please log in again.");
        }

        const response = await fetch(
          `${API_BASE_URL.replace(/\/$/, "")}/attendance/history?month=${encodeURIComponent(month)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message || "Unable to load attendance records."
          );
        }

        if (!result?.success || !Array.isArray(result.attendance)) {
          throw new Error("Unexpected response. Please refresh your records.");
        }

        if (active) setRecords(result.attendance);
      } catch (err) {
        if (!active) return;

        setError(
          timedOut
            ? "The request timed out. Please try again."
            : err instanceof TypeError
              ? "Unable to connect. Check your connection and try again."
              : err.message
        );
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [month, refreshKey, retry]);

  return (
    <section className="att-card att-history" aria-label="My attendance records">
      <div className="att-history-header">
        <div>
          <h2>My attendance records</h2>
          <p>Your check-in, check-out and recorded work duration.</p>
        </div>

        <div className="att-history-controls">
          <label>
            <span>Month</span>
            <input
              type="month"
              value={month}
              min="2000-01"
              max="2100-12"
              onChange={(event) => {
                const value = event.target.value;

                if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
                  setMonth(value);
                }
              }}
            />
          </label>

          <button
            type="button"
            className="att-secondary"
            disabled={loading}
            onClick={() => setRetry((value) => value + 1)}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p className="att-history-message" role="status">
          Loading your records…
        </p>
      ) : error ? (
        <p className="att-notice att-notice-error" role="alert">
          {error}
        </p>
      ) : records.length === 0 ? (
        <p className="att-history-message">
          No attendance records for this month.
        </p>
      ) : (
        <div
          className="att-history-scroll"
          role="region"
          aria-label="Attendance table; scroll horizontally on small screens"
          tabIndex={0}
        >
          <table className="att-history-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Check-in</th>
                <th scope="col">Check-out</th>
                <th scope="col">Time at work</th>
                <th scope="col">Mode / Location</th>
                <th scope="col">Status / Arrival</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{formatDate(record.attendanceDate)}</td>
                  <td>{formatTime(record.checkInAt)}</td>
                  <td>
                    {record.checkOutAt ? (
                      formatTime(record.checkOutAt)
                    ) : (
                      <span className="att-history-pending">
                        {record.attendanceStatus === "absent" ? "—" : "Not checked out"}
                      </span>
                    )}
                  </td>
                  <td>{formatDuration(record.workingMinutes)}</td>
                  <td>
                    <div className="text-xs font-semibold text-gray-700">{record.workMode === "wfh" ? `WFH · ${record.wfhType === "half_day" ? "Half Day" : "Full Day"}` : "Office"}</div>
                    {record.workMode === "wfh" && record.checkInLocation ? (
                      <a className="text-[11px] text-emerald-700 underline" href={`https://www.google.com/maps?q=${record.checkInLocation.latitude},${record.checkInLocation.longitude}`} target="_blank" rel="noreferrer">
                        {record.checkInLocation.latitude.toFixed(5)}, {record.checkInLocation.longitude.toFixed(5)}
                      </a>
                    ) : null}
                  </td>
                  <td>
                   <span
  className={`att-history-status ${
    record.attendanceStatus === "absent"
      ? "att-history-absent"
      : record.attendanceStatus === "half_day"
        ? "att-history-late"
        : record.arrivalStatus === "late"
          ? "att-history-late"
          : record.arrivalStatus === "on_time"
            ? "att-history-on-time"
            : ""
  }`}
>
  {record.attendanceStatus === "absent"
    ? "Absent"
    : record.attendanceStatus === "half_day"
      ? "Half Day"
      : record.arrivalStatus === "late"
        ? "Late"
        : record.arrivalStatus === "on_time"
          ? "On time"
          : "—"}
</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="att-history-footnote">
        Times are shown in IST. Work duration is finalized after check-out;
        breaks are not deducted.
      </p>
    </section>
  );
}







// import { useEffect, useState } from "react";
// import API_BASE_URL from "../../config/api";

// const TIMEZONE = "Asia/Kolkata";

// function getCurrentMonth() {
//   const parts = new Intl.DateTimeFormat("en-GB", {
//     timeZone: TIMEZONE,
//     year: "numeric",
//     month: "2-digit",
//   }).formatToParts(new Date());

//   const year = parts.find((part) => part.type === "year").value;
//   const month = parts.find((part) => part.type === "month").value;

//   return `${year}-${month}`;
// }

// function formatTime(value) {
//   if (!value) return "—";

//   return new Date(value).toLocaleTimeString("en-IN", {
//     timeZone: TIMEZONE,
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true,
//   });
// }

// function formatDate(value) {
//   return new Date(`${value}T00:00:00+05:30`).toLocaleDateString(
//     "en-IN",
//     {
//       timeZone: TIMEZONE,
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     }
//   );
// }

// function formatDuration(minutes) {
//   if (minutes === null || minutes === undefined) return "—";

//   return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
// }

// export default function AttendanceHistory({ refreshKey }) {
//   const [month, setMonth] = useState(getCurrentMonth);
//   const [records, setRecords] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [retry, setRetry] = useState(0);

//   useEffect(() => {
//     const controller = new AbortController();
//     let active = true;
//     let timedOut = false;

//     const timeout = setTimeout(() => {
//       timedOut = true;
//       controller.abort();
//     }, 20000);

//     async function loadHistory() {
//       setLoading(true);
//       setError("");
//       setRecords([]);

//       try {
//         const token = localStorage.getItem("adminToken");

//         if (!token) {
//           throw new Error("Your session has expired. Please log in again.");
//         }

//         const response = await fetch(
//           `${API_BASE_URL.replace(/\/$/, "")}/attendance/history?month=${encodeURIComponent(month)}`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//             signal: controller.signal,
//             cache: "no-store",
//           }
//         );

//         const result = await response.json().catch(() => null);

//         if (!response.ok) {
//           throw new Error(
//             result?.message || "Unable to load attendance records."
//           );
//         }

//         if (!result?.success || !Array.isArray(result.attendance)) {
//           throw new Error("Unexpected response. Please refresh your records.");
//         }

//         if (active) setRecords(result.attendance);
//       } catch (err) {
//         if (!active) return;

//         setError(
//           timedOut
//             ? "The request timed out. Please try again."
//             : err instanceof TypeError
//               ? "Unable to connect. Check your connection and try again."
//               : err.message
//         );
//       } finally {
//         clearTimeout(timeout);
//         if (active) setLoading(false);
//       }
//     }

//     loadHistory();

//     return () => {
//       active = false;
//       clearTimeout(timeout);
//       controller.abort();
//     };
//   }, [month, refreshKey, retry]);

//   return (
//     <section className="att-card att-history" aria-label="My attendance records">
//       <div className="att-history-header">
//         <div>
//           <h2>My attendance records</h2>
//           <p>Your check-in, check-out and recorded work duration.</p>
//         </div>

//         <div className="att-history-controls">
//           <label>
//             <span>Month</span>
//             <input
//               type="month"
//               value={month}
//               min="2000-01"
//               max="2100-12"
//               onChange={(event) => {
//                 const value = event.target.value;

//                 if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
//                   setMonth(value);
//                 }
//               }}
//             />
//           </label>

//           <button
//             type="button"
//             className="att-secondary"
//             disabled={loading}
//             onClick={() => setRetry((value) => value + 1)}
//           >
//             Refresh
//           </button>
//         </div>
//       </div>

//       {loading ? (
//         <p className="att-history-message" role="status">
//           Loading your records…
//         </p>
//       ) : error ? (
//         <p className="att-notice att-notice-error" role="alert">
//           {error}
//         </p>
//       ) : records.length === 0 ? (
//         <p className="att-history-message">
//           No attendance records for this month.
//         </p>
//       ) : (
//         <div
//           className="att-history-scroll"
//           role="region"
//           aria-label="Attendance table; scroll horizontally on small screens"
//           tabIndex={0}
//         >
//           <table className="att-history-table">
//             <thead>
//               <tr>
//                 <th scope="col">Date</th>
//                 <th scope="col">Check-in</th>
//                 <th scope="col">Check-out</th>
//                 <th scope="col">Time at work</th>
//                 <th scope="col">Status / Arrival</th>
//               </tr>
//             </thead>

//             <tbody>
//               {records.map((record) => (
//                 <tr key={record.id}>
//                   <td>{formatDate(record.attendanceDate)}</td>
//                   <td>{formatTime(record.checkInAt)}</td>
//                   <td>
//                     {record.checkOutAt ? (
//                       formatTime(record.checkOutAt)
//                     ) : (
//                       <span className="att-history-pending">
//                         {record.attendanceStatus === "absent" ? "—" : "Not checked out"}
//                       </span>
//                     )}
//                   </td>
//                   <td>{formatDuration(record.workingMinutes)}</td>
//                   <td>
//                     <span
//                       className={`att-history-status ${
//                         record.attendanceStatus === "absent" ? "att-history-absent" : record.arrivalStatus === "late"
//                           ? "att-history-late"
//                           : record.arrivalStatus === "on_time"
//                             ? "att-history-on-time"
//                             : ""
//                       }`}
//                     >
//                       {record.attendanceStatus === "absent" ? "Absent" : record.arrivalStatus === "late"
//                         ? "Late"
//                         : record.arrivalStatus === "on_time"
//                           ? "On time"
//                           : "—"}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       <p className="att-history-footnote">
//         Times are shown in IST. Work duration is finalized after check-out;
//         breaks are not deducted.
//       </p>
//     </section>
//   );
// }