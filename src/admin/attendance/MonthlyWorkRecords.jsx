import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  getMonthlyWorkRecord,
  getMonthlyWorkRecords,
} from "./monthlyWorkRecordApi";

const todayMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonth = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

const formatDate = (value) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      })
    : "—";

const formatMinutes = (minutes) => {
  if (!Number.isFinite(minutes)) return "—";
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const statusMeta = (status) => {
  const map = {
    present: { label: "Present", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
    late: { label: "Late", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock3 },
    half_day: { label: "Half Day", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock3 },
    paid_leave: { label: "Paid Leave", cls: "bg-blue-50 text-blue-700 border-blue-200", Icon: CalendarDays },
    partial_paid_leave: { label: "Half Paid Leave", cls: "bg-blue-50 text-blue-700 border-blue-200", Icon: CalendarDays },
    unpaid_leave: { label: "Unpaid Leave", cls: "bg-orange-50 text-orange-700 border-orange-200", Icon: CalendarDays },
    partial_unpaid_leave: { label: "Partial Unpaid Leave", cls: "bg-orange-50 text-orange-700 border-orange-200", Icon: CalendarDays },
    holiday: { label: "Holiday", cls: "bg-violet-50 text-violet-700 border-violet-200", Icon: CalendarDays },
    weekly_off: { label: "Weekly Off", cls: "bg-slate-50 text-slate-700 border-slate-200", Icon: CalendarDays },
    not_employed: { label: "Not Employed", cls: "bg-gray-50 text-gray-500 border-gray-200", Icon: AlertCircle },
    absent: { label: "Absent", cls: "bg-red-50 text-red-700 border-red-200", Icon: XCircle },
  };
  return map[status] || { label: "Unknown", cls: "bg-gray-50 text-gray-600 border-gray-200", Icon: AlertCircle };
};

function shiftMonth(month, delta) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function MonthlyWorkRecords() {
  const reduceMotion = useReducedMotion();
  const [month, setMonth] = useState(todayMonth);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
      setSelectedEmployeeId("");
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");

    getMonthlyWorkRecords(
      { month, search: debouncedSearch, page, limit: 50 },
      { signal: controller.signal }
    )
      .then((result) => {
        if (!active) return;
        setData(result);
        if (debouncedSearch && result.records?.length) {
          setSelectedEmployeeId(String(result.records[0].employee.id));
        }
      })
      .catch((err) => {
        if (active && err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [month, page, debouncedSearch, refreshKey]);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setDetail(null);
      setDetailError("");
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    setDetailLoading(true);
    setDetailError("");

    getMonthlyWorkRecord(selectedEmployeeId, month, { signal: controller.signal })
      .then((result) => {
        if (active) setDetail(result);
      })
      .catch((err) => {
        if (active && err.name !== "AbortError") setDetailError(err.message);
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedEmployeeId, month, refreshKey]);

  const selectedInList = useMemo(
    () => data?.records?.find((item) => String(item.employee.id) === selectedEmployeeId),
    [data, selectedEmployeeId]
  );

  const entrance = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      };

  return (
    <motion.section {...entrance} className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-[0.18em] text-emerald-600">ATTENDANCE · MONTHLY</span>
          <h1 className="mt-1 text-2xl font-black text-gray-900">Monthly Work Records</h1>
          <p className="mt-1 text-sm text-gray-500">Attendance, approved leave, holidays and weekly offs in one monthly view.</p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading || detailLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
            <CalendarDays size={16} className="text-gray-400" />
            <input
              type="month"
              value={month}
              onChange={(event) => {
                setMonth(event.target.value);
                setPage(1);
                setSelectedEmployeeId("");
              }}
              className="bg-transparent text-sm font-semibold text-gray-700 outline-none"
              aria-label="Select month"
            />
          </div>

          <div className="relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value.slice(0, 100))}
              placeholder="Search employee by name or email"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              aria-label="Search employee"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                aria-label="Clear search"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setMonth((value) => shiftMonth(value, -1))}
              className="rounded-xl border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-50"
              aria-label="Previous month"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => setMonth((value) => shiftMonth(value, 1))}
              className="rounded-xl border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-50"
              aria-label="Next month"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-gray-900">{formatMonth(month)}</h2>
            <p className="text-xs text-gray-400">{data?.total ?? 0} employee records</p>
          </div>
          {data?.pages > 1 && (
            <div className="text-xs font-medium text-gray-500">Page {data.page} of {data.pages}</div>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-gray-500">
            <RefreshCw size={18} className="animate-spin" /> Loading monthly records…
          </div>
        ) : !data?.records?.length ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
            <UserRound size={28} className="text-gray-300" />
            <h3 className="mt-3 font-semibold text-gray-700">No employee records found</h3>
            <p className="mt-1 text-sm text-gray-400">Try another employee name or month.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Present</th>
                  <th className="px-4 py-3 font-semibold">WFH Full</th>
                  <th className="px-4 py-3 font-semibold">WFH Half</th>
                  <th className="px-4 py-3 font-semibold">Late</th>
                  <th className="px-4 py-3 font-semibold">Half Day</th>
                  <th className="px-4 py-3 font-semibold">Paid Leave</th>
                  <th className="px-4 py-3 font-semibold">Unpaid Leave</th>
                  <th className="px-4 py-3 font-semibold">Holiday</th>
                  <th className="px-4 py-3 font-semibold">Weekly Off</th>
                  <th className="px-4 py-3 font-semibold">Absent</th>
                  <th className="px-5 py-3 text-right font-semibold">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.records.map((record) => {
                  const selected = String(record.employee.id) === selectedEmployeeId;
                  return (
                    <tr key={record.employee.id} className={selected ? "bg-emerald-50/60" : "hover:bg-gray-50/80"}>
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => setSelectedEmployeeId(String(record.employee.id))} className="text-left">
                          <div className="font-semibold text-gray-800">{record.employee.name}</div>
                          <div className="mt-0.5 text-xs text-gray-400">{record.employee.email}</div>
                        </button>
                      </td>
                      <td className="px-4 py-4 font-semibold text-emerald-700">{record.summary.presentDays}</td>
                      <td className="px-4 py-4">{record.summary.wfhFullDays || 0}</td>
                      <td className="px-4 py-4">{record.summary.wfhHalfDays || 0}</td>
                      <td className="px-4 py-4 font-semibold text-amber-700">{record.summary.lateDays}</td>
                      <td className="px-4 py-4 font-semibold text-amber-700">{record.summary.halfDays || 0}</td>
                      <td className="px-4 py-4">{record.summary.paidLeaveDays}</td>
                      <td className="px-4 py-4">{record.summary.unpaidLeaveDays}</td>
                      <td className="px-4 py-4">{record.summary.holidayDays}</td>
                      <td className="px-4 py-4">{record.summary.weeklyOffDays}</td>
                      <td className="px-4 py-4 font-semibold text-red-600">{record.summary.absentDays}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployeeId(String(record.employee.id))}
                          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-700"
                        >
                          View record
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data?.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <span className="text-xs text-gray-400">Showing {data.records.length} of {data.total}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= data.pages}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {(selectedEmployeeId || search.trim()) && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-emerald-600">EMPLOYEE MONTHLY DETAIL</span>
                <h2 className="mt-1 text-lg font-bold text-gray-900">{detail?.employee?.name || selectedInList?.employee?.name || "Loading…"}</h2>
              </div>
              {detail?.employee?.email && <span className="text-xs text-gray-400">{detail.employee.email}</span>}
            </div>
          </div>

          {detailError && (
            <div className="m-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={17} /> {detailError}
            </div>
          )}

          {detailLoading ? (
            <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-gray-500">
              <RefreshCw size={18} className="animate-spin" /> Loading employee record…
            </div>
          ) : detail ? (
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
                {[
                  ["Expected", detail.summary.expectedWorkingDays],
                  ["Present", detail.summary.presentDays],
                  ["WFH Full", detail.summary.wfhFullDays || 0],
                  ["WFH Half", detail.summary.wfhHalfDays || 0],
                  ["Late", detail.summary.lateDays],
                  ["Half Day", detail.summary.halfDayDays || 0],
                  ["Paid Leave", detail.summary.paidLeaveDays],
                  ["Unpaid Leave", detail.summary.unpaidLeaveDays],
                  ["Holiday", detail.summary.holidayDays],
                  ["Weekly Off", detail.summary.weeklyOffDays],
                  ["Absent", detail.summary.absentDays],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
                    <div className="mt-1 text-lg font-black text-gray-800">{value}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
                <span>Total work time: <strong className="text-gray-800">{formatMinutes(detail.summary.totalWorkingMinutes)}</strong></span>
                <span>Attendance units: <strong className="text-gray-800">{detail.summary.attendanceUnits ?? 0}</strong></span>
                <span>Incomplete attendance: <strong className="text-gray-800">{detail.summary.incompleteAttendanceDays}</strong></span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-[1000px] w-full text-sm">
                  <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Day</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Work Mode</th>
                      <th className="px-4 py-3">Check In</th>
                      <th className="px-4 py-3">Check Out</th>
                      <th className="px-4 py-3">Work Time</th>
                      <th className="px-4 py-3">Leave</th>
                      <th className="px-4 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detail.days.map((day) => {
                      const meta = statusMeta(day.status);
                      const StatusIcon = meta.Icon;
                      const remarks = day.holidayName || (day.isWeeklyOff ? "Weekly off" : day.absenceUnits > 0 ? `${day.absenceUnits} day absence` : "—");
                      return (
                        <tr key={day.date} className="hover:bg-gray-50/70">
                          <td className="px-4 py-3 font-semibold text-gray-700">{formatDate(day.date)}</td>
                          <td className="px-4 py-3 text-gray-500">{day.day}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
                              <StatusIcon size={13} /> {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {day.attendance ? (
                              <div>
                                <div className="font-semibold text-gray-700">{day.attendance.workMode === "wfh" ? `WFH · ${day.attendance.wfhType === "half_day" ? "Half Day" : "Full Day"}` : "Office"}</div>
                                {day.attendance.workMode === "wfh" && day.attendance.checkInLocation ? (
                                  <a className="text-[10px] text-emerald-700 underline" href={`https://www.google.com/maps?q=${day.attendance.checkInLocation.latitude},${day.attendance.checkInLocation.longitude}`} target="_blank" rel="noreferrer">View location</a>
                                ) : null}
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{formatTime(day.attendance?.checkInAt)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatTime(day.attendance?.checkOutAt)}</td>
                          <td className="px-4 py-3 font-medium text-gray-700">{formatMinutes(day.attendance?.workingMinutes)}</td>
                          <td className="px-4 py-3 text-gray-600">{day.leave ? `${day.leave.typeName} (${day.leave.units})` : "—"}</td>
                          <td className="px-4 py-3 text-gray-400">{remarks}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </motion.section>
  );
}







// import { useEffect, useMemo, useRef, useState } from "react";
// import { motion, useReducedMotion } from "framer-motion";
// import {
//   AlertCircle,
//   CalendarDays,
//   CheckCircle2,
//   ChevronLeft,
//   ChevronRight,
//   Clock3,
//   RefreshCw,
//   Search,
//   UserRound,
//   XCircle,
// } from "lucide-react";
// import {
//   getMonthlyWorkRecord,
//   getMonthlyWorkRecords,
// } from "./monthlyWorkRecordApi";

// const todayMonth = () => {
//   const now = new Date();
//   return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
// };

// const formatMonth = (month) => {
//   const [year, monthNumber] = month.split("-").map(Number);
//   return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString("en-IN", {
//     month: "long",
//     year: "numeric",
//     timeZone: "UTC",
//   });
// };

// const formatDate = (value) =>
//   new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     timeZone: "UTC",
//   });

// const formatTime = (value) =>
//   value
//     ? new Date(value).toLocaleTimeString("en-IN", {
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//         timeZone: "Asia/Kolkata",
//       })
//     : "—";

// const formatMinutes = (minutes) => {
//   if (!Number.isFinite(minutes)) return "—";
//   return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
// };

// const statusMeta = (status) => {
//   const map = {
//     present: { label: "Present", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
//     late: { label: "Late", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock3 },
//     paid_leave: { label: "Paid Leave", cls: "bg-blue-50 text-blue-700 border-blue-200", Icon: CalendarDays },
//     partial_paid_leave: { label: "Half Paid Leave", cls: "bg-blue-50 text-blue-700 border-blue-200", Icon: CalendarDays },
//     unpaid_leave: { label: "Unpaid Leave", cls: "bg-orange-50 text-orange-700 border-orange-200", Icon: CalendarDays },
//     partial_unpaid_leave: { label: "Partial Unpaid Leave", cls: "bg-orange-50 text-orange-700 border-orange-200", Icon: CalendarDays },
//     holiday: { label: "Holiday", cls: "bg-violet-50 text-violet-700 border-violet-200", Icon: CalendarDays },
//     weekly_off: { label: "Weekly Off", cls: "bg-slate-50 text-slate-700 border-slate-200", Icon: CalendarDays },
//     absent: { label: "Absent", cls: "bg-red-50 text-red-700 border-red-200", Icon: XCircle },
//   };
//   return map[status] || { label: "Unknown", cls: "bg-gray-50 text-gray-600 border-gray-200", Icon: AlertCircle };
// };

// function shiftMonth(month, delta) {
//   const [year, monthNumber] = month.split("-").map(Number);
//   const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
//   return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
// }

// export default function MonthlyWorkRecords() {
//   const reduceMotion = useReducedMotion();
//   const [month, setMonth] = useState(todayMonth);
//   const [search, setSearch] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [data, setData] = useState(null);
//   const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
//   const [detail, setDetail] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [detailLoading, setDetailLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [detailError, setDetailError] = useState("");
//   const [refreshKey, setRefreshKey] = useState(0);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearch(search.trim());
//       setPage(1);
//       setSelectedEmployeeId("");
//     }, 300);
//     return () => clearTimeout(timer);
//   }, [search]);

//   useEffect(() => {
//     const controller = new AbortController();
//     let active = true;
//     setLoading(true);
//     setError("");

//     getMonthlyWorkRecords(
//       { month, search: debouncedSearch, page, limit: 50 },
//       { signal: controller.signal }
//     )
//       .then((result) => {
//         if (!active) return;
//         setData(result);
//         if (debouncedSearch && result.records?.length) {
//           setSelectedEmployeeId(String(result.records[0].employee.id));
//         }
//       })
//       .catch((err) => {
//         if (active && err.name !== "AbortError") setError(err.message);
//       })
//       .finally(() => {
//         if (active) setLoading(false);
//       });

//     return () => {
//       active = false;
//       controller.abort();
//     };
//   }, [month, page, debouncedSearch, refreshKey]);

//   useEffect(() => {
//     if (!selectedEmployeeId) {
//       setDetail(null);
//       setDetailError("");
//       return undefined;
//     }

//     const controller = new AbortController();
//     let active = true;
//     setDetailLoading(true);
//     setDetailError("");

//     getMonthlyWorkRecord(selectedEmployeeId, month, { signal: controller.signal })
//       .then((result) => {
//         if (active) setDetail(result);
//       })
//       .catch((err) => {
//         if (active && err.name !== "AbortError") setDetailError(err.message);
//       })
//       .finally(() => {
//         if (active) setDetailLoading(false);
//       });

//     return () => {
//       active = false;
//       controller.abort();
//     };
//   }, [selectedEmployeeId, month, refreshKey]);

//   const selectedInList = useMemo(
//     () => data?.records?.find((item) => String(item.employee.id) === selectedEmployeeId),
//     [data, selectedEmployeeId]
//   );

//   const entrance = reduceMotion
//     ? {}
//     : {
//         initial: { opacity: 0, y: 10 },
//         animate: { opacity: 1, y: 0 },
//         transition: { duration: 0.3 },
//       };

//   return (
//     <motion.section {...entrance} className="space-y-6">
//       <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
//         <div>
//           <span className="text-[11px] font-semibold tracking-[0.18em] text-emerald-600">ATTENDANCE · MONTHLY</span>
//           <h1 className="mt-1 text-2xl font-black text-gray-900">Monthly Work Records</h1>
//           <p className="mt-1 text-sm text-gray-500">Attendance, approved leave, holidays and weekly offs in one monthly view.</p>
//         </div>
//         <button
//           type="button"
//           onClick={() => setRefreshKey((value) => value + 1)}
//           disabled={loading || detailLoading}
//           className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
//         >
//           <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
//           Refresh
//         </button>
//       </div>

//       <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
//         <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
//           <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
//             <CalendarDays size={16} className="text-gray-400" />
//             <input
//               type="month"
//               value={month}
//               onChange={(event) => {
//                 setMonth(event.target.value);
//                 setPage(1);
//                 setSelectedEmployeeId("");
//               }}
//               className="bg-transparent text-sm font-semibold text-gray-700 outline-none"
//               aria-label="Select month"
//             />
//           </div>

//           <div className="relative">
//             <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               value={search}
//               onChange={(event) => setSearch(event.target.value.slice(0, 100))}
//               placeholder="Search employee by name or email"
//               className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
//               aria-label="Search employee"
//             />
//             {search && (
//               <button
//                 type="button"
//                 onClick={() => setSearch("")}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
//                 aria-label="Clear search"
//               >
//                 <XCircle size={16} />
//               </button>
//             )}
//           </div>

//           <div className="flex items-center justify-end gap-2">
//             <button
//               type="button"
//               onClick={() => setMonth((value) => shiftMonth(value, -1))}
//               className="rounded-xl border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-50"
//               aria-label="Previous month"
//             >
//               <ChevronLeft size={17} />
//             </button>
//             <button
//               type="button"
//               onClick={() => setMonth((value) => shiftMonth(value, 1))}
//               className="rounded-xl border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-50"
//               aria-label="Next month"
//             >
//               <ChevronRight size={17} />
//             </button>
//           </div>
//         </div>
//       </div>

//       {error && (
//         <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//           <AlertCircle size={17} />
//           <span>{error}</span>
//         </div>
//       )}

//       <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
//         <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
//           <div>
//             <h2 className="font-bold text-gray-900">{formatMonth(month)}</h2>
//             <p className="text-xs text-gray-400">{data?.total ?? 0} employee records</p>
//           </div>
//           {data?.pages > 1 && (
//             <div className="text-xs font-medium text-gray-500">Page {data.page} of {data.pages}</div>
//           )}
//         </div>

//         {loading ? (
//           <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-gray-500">
//             <RefreshCw size={18} className="animate-spin" /> Loading monthly records…
//           </div>
//         ) : !data?.records?.length ? (
//           <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
//             <UserRound size={28} className="text-gray-300" />
//             <h3 className="mt-3 font-semibold text-gray-700">No employee records found</h3>
//             <p className="mt-1 text-sm text-gray-400">Try another employee name or month.</p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-[900px] w-full text-sm">
//               <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-400">
//                 <tr>
//                   <th className="px-5 py-3 font-semibold">Employee</th>
//                   <th className="px-4 py-3 font-semibold">Present</th>
//                   <th className="px-4 py-3 font-semibold">Late</th>
//                   <th className="px-4 py-3 font-semibold">Paid Leave</th>
//                   <th className="px-4 py-3 font-semibold">Unpaid Leave</th>
//                   <th className="px-4 py-3 font-semibold">Holiday</th>
//                   <th className="px-4 py-3 font-semibold">Weekly Off</th>
//                   <th className="px-4 py-3 font-semibold">Absent</th>
//                   <th className="px-5 py-3 text-right font-semibold">View</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100">
//                 {data.records.map((record) => {
//                   const selected = String(record.employee.id) === selectedEmployeeId;
//                   return (
//                     <tr key={record.employee.id} className={selected ? "bg-emerald-50/60" : "hover:bg-gray-50/80"}>
//                       <td className="px-5 py-4">
//                         <button type="button" onClick={() => setSelectedEmployeeId(String(record.employee.id))} className="text-left">
//                           <div className="font-semibold text-gray-800">{record.employee.name}</div>
//                           <div className="mt-0.5 text-xs text-gray-400">{record.employee.email}</div>
//                         </button>
//                       </td>
//                       <td className="px-4 py-4 font-semibold text-emerald-700">{record.summary.presentDays}</td>
//                       <td className="px-4 py-4 font-semibold text-amber-700">{record.summary.lateDays}</td>
//                       <td className="px-4 py-4">{record.summary.paidLeaveDays}</td>
//                       <td className="px-4 py-4">{record.summary.unpaidLeaveDays}</td>
//                       <td className="px-4 py-4">{record.summary.holidayDays}</td>
//                       <td className="px-4 py-4">{record.summary.weeklyOffDays}</td>
//                       <td className="px-4 py-4 font-semibold text-red-600">{record.summary.absentDays}</td>
//                       <td className="px-5 py-4 text-right">
//                         <button
//                           type="button"
//                           onClick={() => setSelectedEmployeeId(String(record.employee.id))}
//                           className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-700"
//                         >
//                           View record
//                         </button>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {data?.pages > 1 && (
//           <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
//             <span className="text-xs text-gray-400">Showing {data.records.length} of {data.total}</span>
//             <div className="flex items-center gap-2">
//               <button
//                 type="button"
//                 disabled={page <= 1}
//                 onClick={() => setPage((value) => value - 1)}
//                 className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40"
//               >
//                 Previous
//               </button>
//               <button
//                 type="button"
//                 disabled={page >= data.pages}
//                 onClick={() => setPage((value) => value + 1)}
//                 className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40"
//               >
//                 Next
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {(selectedEmployeeId || search.trim()) && (
//         <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
//           <div className="border-b border-gray-100 px-5 py-4">
//             <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
//               <div>
//                 <span className="text-[11px] font-semibold tracking-wider text-emerald-600">EMPLOYEE MONTHLY DETAIL</span>
//                 <h2 className="mt-1 text-lg font-bold text-gray-900">{detail?.employee?.name || selectedInList?.employee?.name || "Loading…"}</h2>
//               </div>
//               {detail?.employee?.email && <span className="text-xs text-gray-400">{detail.employee.email}</span>}
//             </div>
//           </div>

//           {detailError && (
//             <div className="m-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//               <AlertCircle size={17} /> {detailError}
//             </div>
//           )}

//           {detailLoading ? (
//             <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-gray-500">
//               <RefreshCw size={18} className="animate-spin" /> Loading employee record…
//             </div>
//           ) : detail ? (
//             <div className="space-y-5 p-5">
//               <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
//                 {[
//                   ["Expected", detail.summary.expectedWorkingDays],
//                   ["Present", detail.summary.presentDays],
//                   ["Late", detail.summary.lateDays],
//                   ["Paid Leave", detail.summary.paidLeaveDays],
//                   ["Unpaid Leave", detail.summary.unpaidLeaveDays],
//                   ["Holiday", detail.summary.holidayDays],
//                   ["Weekly Off", detail.summary.weeklyOffDays],
//                   ["Absent", detail.summary.absentDays],
//                 ].map(([label, value]) => (
//                   <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
//                     <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
//                     <div className="mt-1 text-lg font-black text-gray-800">{value}</div>
//                   </div>
//                 ))}
//               </div>

//               <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
//                 <span>Total work time: <strong className="text-gray-800">{formatMinutes(detail.summary.totalWorkingMinutes)}</strong></span>
//                 <span>Incomplete attendance: <strong className="text-gray-800">{detail.summary.incompleteAttendanceDays}</strong></span>
//               </div>

//               <div className="overflow-x-auto rounded-xl border border-gray-100">
//                 <table className="min-w-[1000px] w-full text-sm">
//                   <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-400">
//                     <tr>
//                       <th className="px-4 py-3">Date</th>
//                       <th className="px-4 py-3">Day</th>
//                       <th className="px-4 py-3">Status</th>
//                       <th className="px-4 py-3">Check In</th>
//                       <th className="px-4 py-3">Check Out</th>
//                       <th className="px-4 py-3">Work Time</th>
//                       <th className="px-4 py-3">Leave</th>
//                       <th className="px-4 py-3">Remarks</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-100">
//                     {detail.days.map((day) => {
//                       const meta = statusMeta(day.status);
//                       const StatusIcon = meta.Icon;
//                       const remarks = day.holidayName || (day.isWeeklyOff ? "Weekly off" : day.absenceUnits > 0 ? `${day.absenceUnits} day absence` : "—");
//                       return (
//                         <tr key={day.date} className="hover:bg-gray-50/70">
//                           <td className="px-4 py-3 font-semibold text-gray-700">{formatDate(day.date)}</td>
//                           <td className="px-4 py-3 text-gray-500">{day.day}</td>
//                           <td className="px-4 py-3">
//                             <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
//                               <StatusIcon size={13} /> {meta.label}
//                             </span>
//                           </td>
//                           <td className="px-4 py-3 text-gray-600">{formatTime(day.attendance?.checkInAt)}</td>
//                           <td className="px-4 py-3 text-gray-600">{formatTime(day.attendance?.checkOutAt)}</td>
//                           <td className="px-4 py-3 font-medium text-gray-700">{formatMinutes(day.attendance?.workingMinutes)}</td>
//                           <td className="px-4 py-3 text-gray-600">{day.leave ? `${day.leave.typeName} (${day.leave.units})` : "—"}</td>
//                           <td className="px-4 py-3 text-gray-400">{remarks}</td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           ) : null}
//         </div>
//       )}
//     </motion.section>
//   );
// }
