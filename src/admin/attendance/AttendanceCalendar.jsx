import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Pencil,
  Trash2,
} from "lucide-react";

import API_BASE_URL from "../../config/api";
import { attendanceRequest } from "./attendanceApi";
import { Editor } from "./AttendanceManagement";
import useAttendanceLeaves from "./useAttendanceLeaves";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getISTDate() {
  return new Date(Date.now() + 19800000).toISOString().slice(0, 10);
}

async function getData(params, signal, endpoint = "all") {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const controller = new AbortController();
  const cancel = () => controller.abort();
  let timedOut = false;

  signal.addEventListener("abort", cancel, { once: true });

  if (signal.aborted) controller.abort();

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 20000);

  try {
    const response = await fetch(
     `${API_BASE_URL.replace(/\/$/, "")}/attendance/${endpoint}?${new URLSearchParams(params)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
        cache: "no-store",
      }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      throw new Error(
        result?.message || "Unable to load attendance calendar."
      );
    }

    return result;
  } catch (error) {
    if (timedOut) {
      throw new Error("The request timed out. Please refresh the calendar.", { cause: error });
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect. Check your connection and try again.",
        { cause: error }
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", cancel);
  }
}

export default function AttendanceCalendar({ canEdit, canDelete, canMark }) {
  const reduceMotion = useReducedMotion();

  const [month, setMonth] = useState(() => getISTDate().slice(0, 7));
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [directoryRetry, setDirectoryRetry] = useState(0);
  const [target, setTarget] = useState(null);
  const [schedule, setSchedule] = useState({
  month: "",
  days: [],
});
const [scheduleLoading, setScheduleLoading] = useState(true);
const [scheduleError, setScheduleError] = useState("");

const [markTarget, setMarkTarget] = useState(null);
const [marking, setMarking] = useState(false);
const [markError, setMarkError] = useState("");
const markRequestLock = useRef(false);

const scheduleReady =
  schedule.month === month &&
  !scheduleLoading &&
  !scheduleError;

const scheduleByDate = useMemo(
  () =>
    new Map(
      (schedule.month === month ? schedule.days : []).map((day) => [
        day.date,
        day,
      ])
    ),
  [schedule, month]
);

  const leaveState = useAttendanceLeaves(employeeId, month, refreshKey);

  const today = getISTDate();

  const calendar = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    const firstDate = new Date(Date.UTC(year, monthNumber - 1, 1));
    const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

    return {
      from: `${month}-01`,
      to: `${month}-${String(days).padStart(2, "0")}`,
      days,
      offset: firstDate.getUTCDay(),
      title: firstDate.toLocaleDateString("en-IN", {
        timeZone: "UTC",
        month: "long",
        year: "numeric",
      }),
    };
  }, [month]);

  const recordsByDate = useMemo(
    () => new Map(records.map((record) => [record.attendanceDate, record])),
    [records]
  );

  const selectedEmployee = employees.find(
    (employee) => employee.id === employeeId
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setDirectoryLoading(true);
    setDirectoryError("");

    getData({ directory: "1" }, controller.signal)
      .then((result) => {
        if (!active) return;

        if (!Array.isArray(result.employees)) {
          throw new Error("Invalid employee list response.");
        }

        setEmployees(result.employees);

        setEmployeeId((current) =>
          result.employees.some((employee) => employee.id === current)
            ? current
            : result.employees[0]?.id || ""
        );
      })
      .catch((err) => {
        if (active) setDirectoryError(err.message);
      })
      .finally(() => {
        if (active) setDirectoryLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [directoryRetry]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setRecords([]);
    setError("");
    setTarget(null);

    if (!employeeId) {
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);

    async function loadMonth() {
      try {
        const params = {
          employeeId,
          from: calendar.from,
          to: calendar.to,
        };

        const first = await getData(
          { ...params, page: "1" },
          controller.signal
        );

        if (
          !Array.isArray(first.records) ||
          !Number.isInteger(first.pages) ||
          first.pages < 1
        ) {
          throw new Error("Invalid calendar response.");
        }

        const collected = [...first.records];

        // Existing API is paginated. Fetch every page for this employee/month.
        for (let page = 2; page <= first.pages; page += 1) {
          const next = await getData(
            { ...params, page: String(page) },
            controller.signal
          );

          if (!Array.isArray(next.records)) {
            throw new Error("Unable to load the complete month.");
          }

          collected.push(...next.records);
        }

        if (active) {
          const unique = new Map(
            collected.map((record) => [record.id, record])
          );

          setRecords([...unique.values()]);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMonth();

    return () => {
      active = false;
      controller.abort();
    };
  }, [employeeId, calendar.from, calendar.to, refreshKey]);


  useEffect(() => {
  const controller = new AbortController();
  let active = true;

  setScheduleLoading(true);
  setScheduleError("");
  setSchedule({ month: "", days: [] });

  getData({ month }, controller.signal, "schedule")
    .then((result) => {
      if (!active) return;

      const dates = new Set();

      if (
        result.month !== month ||
        !Array.isArray(result.days) ||
        result.days.length !== calendar.days ||
        result.days.some((day) => {
          if (
            !day ||
            typeof day.date !== "string" ||
            day.date < calendar.from ||
            day.date > calendar.to ||
            !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
            dates.has(day.date) ||
            typeof day.isWeeklyOff !== "boolean" ||
            typeof day.weeklyOffConfigured !== "boolean" ||
            !(
              day.holidayName === null ||
              typeof day.holidayName === "string"
            )
          ) {
            return true;
          }

          dates.add(day.date);
          return false;
        })
      ) {
        throw new Error(
          "Invalid holiday schedule response. Please refresh the calendar."
        );
      }

      setSchedule({
        month,
        days: result.days,
      });
    })
    .catch((err) => {
      if (active) setScheduleError(err.message);
    })
    .finally(() => {
      if (active) setScheduleLoading(false);
    });

  return () => {
    active = false;
    controller.abort();
  };
}, [
  month,
  calendar.days,
  calendar.from,
  calendar.to,
  refreshKey,
]);

  function changeMonth(direction) {
    const [year, monthNumber] = month.split("-").map(Number);
    const next = new Date(Date.UTC(year, monthNumber - 1 + direction, 1));

    if (next.getUTCFullYear() < 2000 || next.getUTCFullYear() > 2099) {
      return;
    }

    setRecords([]);
    setLoading(Boolean(employeeId));
    setMessage("");
    setMonth(next.toISOString().slice(0, 7));
  }

  function openAction(record, action) {
    if (action === "edit" && !canEdit) return;
    if (action === "delete" && !canDelete) return;

    setTarget({
      ...record,
      action,
      employeeName:
        record.employeeName || selectedEmployee?.name || "Employee",
    });
  }

  function openMarkConfirmation(date, record) {
  if (!canMark || record || date > today) return;

  setMarkError("");
  setMarkTarget({
    date,
    employeeId,
    employeeName: selectedEmployee?.name || "Employee",
  });
}

  async function confirmMarkAttendance() {
    if (!markTarget || !canMark || markRequestLock.current) return;

    markRequestLock.current = true;
    setMarking(true);
    setMarkError("");

    try {
      const result = await attendanceRequest("/manual", {
        method: "POST",
        body: {
          employeeId: markTarget.employeeId,
          attendanceDate: markTarget.date,
        },
        validateActionResponse: false,
        expectedStatus: 201,
      });
      setMarkTarget(null);
      setMessage(result.message);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setMarkError(err instanceof Error ? err.message : "Unable to mark attendance.");
    } finally {
      markRequestLock.current = false;
      setMarking(false);
    }
  }

  const cells = Math.ceil((calendar.offset + calendar.days) / 7) * 7;
  const busy = directoryLoading || loading;

  return (
    <section
      className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_14px_48px_-24px_rgba(10,26,79,0.35)]"
      aria-label="Attendance calendar"
    >
      <div className="flex flex-col gap-6 bg-gradient-to-br from-[#0a1a4f] via-[#0d2468] to-blue-700 p-5 sm:p-7 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-sm"><CalendarDays size={21} /></span>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Attendance calendar
            </h2>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-blue-200">
            Attendance, holidays & weekly offs · IST
          </p>
        </div>

        <label className="flex min-w-0 flex-col gap-2 text-[10px] font-semibold uppercase tracking-widest text-blue-200 xl:w-72">
          Employee
          <select
            className="w-full min-w-0 cursor-pointer rounded-xl border border-white/20 bg-white px-3 py-3 text-sm font-medium normal-case tracking-normal text-[#0a1a4f] shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-400/30 disabled:cursor-not-allowed disabled:opacity-50"
            value={employeeId}
            disabled={directoryLoading || employees.length === 0}
            onChange={(event) => {
              setRecords([]);
              setLoading(true);
              setMessage("");
              setEmployeeId(event.target.value);
            }}
          >
            {employees.length === 0 && (
              <option value="">
                {directoryLoading ? "Loading employees…" : "No employees"}
              </option>
            )}

            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} · {employee.email}
                {employee.isActive === false ? " (Inactive)" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="flex w-fit max-w-full items-center gap-1 rounded-2xl border border-white/20 bg-white/10 p-1.5 shadow-sm backdrop-blur-sm">
          <button
            type="button"
            aria-label="Previous month"
            disabled={month === "2000-01"}
            onClick={() => changeMonth(-1)}
            className="rounded-xl p-2.5 text-blue-100 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="min-w-[132px] px-1 text-center text-sm font-bold tracking-tight text-white sm:min-w-[156px]">
            {calendar.title}
          </span>

          <button
            type="button"
            aria-label="Next month"
            disabled={month === "2099-12"}
            onClick={() => changeMonth(1)}
            className="rounded-xl p-2.5 text-blue-100 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"
          >
            <ChevronRight size={20} />
          </button>

          <button
            type="button"
            aria-label="Refresh calendar"
            disabled={busy || scheduleLoading}
            onClick={() => {
  setMessage("");

  if (directoryError) {
    setDirectoryRetry((value) => value + 1);
  }

  setRefreshKey((value) => value + 1);
}}
            className="ml-1 rounded-xl border-l border-white/15 p-2.5 text-blue-100 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-30"
          >
           <RefreshCw
  size={17}
  className={
    busy || scheduleLoading
      ? "animate-spin motion-reduce:animate-none"
      : ""
  }
/>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-100 bg-white px-5 py-3 text-xs font-medium text-slate-600 sm:px-7">
        {[
          ["Present", "bg-emerald-500"], ["Late", "bg-amber-500"],
          ["Absent", "bg-rose-500"], ["Holiday", "bg-violet-400"],
          ["Weekly off", "bg-sky-400"], ["Approved leave", "bg-indigo-400"], ["No record", "bg-slate-300"],
        ].map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}
          </span>
        ))}
      </div>

{leaveState.loading && <p role="status" className="px-5 pt-4 text-xs text-slate-500">Loading approved leaves…</p>}
{leaveState.error && <p role="alert" className="mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Approved leaves are unavailable. {leaveState.error} Attendance and company schedule are shown separately.</p>}

{scheduleLoading && (
  <p
    role="status"
    className="px-5 pt-4 text-xs text-slate-500"
  >
    Loading holidays and weekly offs…
  </p>
)}

{scheduleError && (
  <p
    role="alert"
    className="mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
  >
    Holidays and weekly offs are unavailable. {scheduleError} Attendance
    records are shown separately.
  </p>
)}

{scheduleReady &&
  schedule.days.some((day) => !day.weeklyOffConfigured) && (
    <p className="px-5 pt-4 text-xs text-slate-500">
      Weekly-off policy is not configured for some dates in this month.
    </p>
  )}

      {message && (
        <p
          role="status"
          className="mx-5 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          {message}
        </p>
      )}

      {directoryError || error ? (
        <p
          role="alert"
          className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700"
        >
          {directoryError || error}
        </p>
      ) : busy ? (
        <p role="status" className="px-6 py-24 text-center text-sm text-slate-500">
          Loading calendar…
        </p>
      ) : !employeeId ? (
        <p className="px-6 py-24 text-center text-sm text-slate-500">
          No employees are available.
        </p>
      ) : (
        <div
          className="overflow-x-auto bg-[#f5f8ff] p-3 focus-visible:outline-blue-500 sm:p-5"
          tabIndex={0}
          role="region"
          aria-label={`${selectedEmployee?.name || "Employee"} attendance for ${calendar.title}`}
        >
          <div className="min-w-[770px]">
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="rounded-lg bg-[#0a1a4f]/5 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#0a1a4f]"
                >
                  {weekday}
                </div>
              ))}
            </div>

            <motion.div
              key={`${employeeId}-${month}`}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-2 grid grid-cols-7 gap-2"
            >
              {Array.from({ length: cells }, (_, index) => {
                const day = index - calendar.offset + 1;

                if (day < 1 || day > calendar.days) {
                  return (
                    <div
                      key={`empty-${index}`}
                      aria-hidden="true"
                      className="min-h-[148px] rounded-xl bg-slate-200/30"
                    />
                  );
                }

                const date = `${month}-${String(day).padStart(2, "0")}`;
                const record = recordsByDate.get(date);
                const leaveDay = leaveState.byDate.get(date);
                const scheduleDay = scheduleReady
  ? scheduleByDate.get(date)
  : null;
                const future = date > today;
                const absent = record?.attendanceStatus === "absent";
                const halfDay = record?.attendanceStatus === "half_day";
                const late = record?.arrivalStatus === "late";

                const needsReview = Boolean(leaveDay && (
                  leaveDay.conflict || (record && (absent || (leaveDay.units >= 1 && (record.checkInAt || record.checkOutAt))))
                ));

                // Visual priority only: schedule colors never change attendance status.
                const cellTone = scheduleDay?.holidayName
                  ? "border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50"
                  : scheduleDay?.isWeeklyOff
                    ? "border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50"
                    : leaveDay
                      ? "border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50"
                      : record
                      ? absent
                        ? "border-rose-200 bg-gradient-to-br from-rose-50 to-red-50"
                        : late
                          ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
                          : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50"
                      : "border-slate-200/80 bg-white";
              const statusTone = absent
  ? "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-sm shadow-rose-500/30"
  : halfDay || late
    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm shadow-orange-500/30"
    : "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm shadow-emerald-500/30";

                return (
                  <div
  key={date}
  onClick={
    canMark && !record && !future
      ? () => openMarkConfirmation(date, record)
      : undefined
  }
  role={canMark && !record && !future ? "button" : undefined}
  tabIndex={canMark && !record && !future ? 0 : undefined}
  aria-label={canMark && !record && !future ? `Mark attendance for ${selectedEmployee?.name || "employee"} on ${date}` : undefined}
  onKeyDown={
    canMark && !record && !future
      ? (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openMarkConfirmation(date, record);
          }
        }
      : undefined
  }
  className={`relative flex min-h-[148px] min-w-0 flex-col rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
    cellTone
  } ${
    date === today ? "ring-2 ring-inset ring-blue-500" : ""
  } ${
    canMark && !record && !future
      ? "cursor-pointer hover:ring-2 hover:ring-blue-300"
      : ""
  }`}
>
                    <div className="mb-3 flex items-center justify-between gap-1">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold tabular-nums ${date === today ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/30" : "text-[#0a1a4f]"}`}>
                        {day}
                      </span>
                      {date === today && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-blue-700">TODAY</span>}
                    </div>

                    <div className="space-y-1.5">
                      {scheduleDay?.holidayName && (
                        <div className="text-violet-800">
                          <p className="text-[9px] font-bold uppercase tracking-widest">Holiday</p>
                          <p className="mt-1 break-words text-xs font-semibold leading-5">{scheduleDay.holidayName}</p>
                        </div>
                      )}
                      {scheduleDay?.isWeeklyOff && (
                        <p className="text-xs font-semibold text-sky-800">Weekly off</p>
                      )}
                      {leaveDay?.leaves.map(leave => (
                        <div key={`${leave.requestId}-${leave.portion}`} className="rounded-lg border border-indigo-200 bg-white/70 px-2 py-1.5 text-indigo-900">
                          <p className="text-[10px] font-semibold">{leave.paid ? "Paid leave" : "Unpaid leave"} · {leave.units === 0.5 ? "½ day" : "Full day"}</p>
                          <p className="mt-0.5 break-words text-[10px]">{leave.typeName}</p>
                          {leave.portion !== "full" && <p className="mt-0.5 text-[9px] text-indigo-700">{leave.portion === "first_half" ? "First half" : "Second half"}</p>}
                          {leave.cancellationPending && <p className="mt-1 text-[9px] font-medium text-amber-800">Cancellation pending</p>}
                        </div>
                      ))}
                      {needsReview && <p className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-900">Attendance / leave needs review</p>}
                      {record ? (
                        <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${statusTone}`}>
                         {absent ? "Absent": halfDay? "Half Day": late? "Present · Late": "Present"}
                        </span>
                      ) : !scheduleDay?.holidayName && !scheduleDay?.isWeeklyOff && !leaveDay ? (
                        <p className="pt-1 text-[11px] text-slate-400">{future ? "Upcoming" : "No record"}</p>
                      ) : null}
                    </div>

                    {record && (canEdit || canDelete) && (
                      <div className="mt-auto flex items-center justify-end gap-1 pt-2">
                        {canEdit && (
                          <button type="button" title="Edit attendance"
                            aria-label={`Edit attendance for ${date}`}
                            onClick={() => openAction(record, "edit")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/5 bg-white/80 text-slate-600 transition hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            <Pencil size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button type="button" title="Delete attendance"
                            aria-label={`Delete attendance for ${date}`}
                            onClick={() => openAction(record, "delete")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/5 bg-white/80 text-slate-500 transition hover:bg-rose-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      )}

      <p className="border-t border-slate-100 bg-white px-5 py-4 text-[11px] leading-relaxed text-slate-400 sm:px-7">
       No record does not automatically mean absent. Approved leave remains effective until cancellation is approved. Leave labels refresh every 30 seconds while this page is visible and when you return to it. Recorded attendance is preserved; review any flagged conflicts.
      </p>

      {target &&
        (target.action === "edit" ? canEdit : canDelete) && (
          <Editor
            key={`${target.id}-${target.action}`}
            target={target}
            onClose={() => setTarget(null)}
            onSaved={(text) => {
              setTarget(null);
              setMessage(text);
              setRefreshKey((value) => value + 1);
            }}
          />
        )}

        {markTarget && canMark && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a1a4f]/55 p-4 backdrop-blur-sm">
    <div role="dialog" aria-modal="true" aria-labelledby="mark-attendance-title" className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-[#0a1a4f]/40">
      <div className="bg-gradient-to-r from-[#0a1a4f] via-[#0d2468] to-blue-700 px-6 py-4">
        <h3 id="mark-attendance-title" className="text-lg font-extrabold text-white">
          Mark Attendance
        </h3>
      </div>

      <div className="p-6">
        <p className="text-sm text-slate-500">
          Do you want to mark attendance for{" "}
          <span className="font-semibold text-[#0a1a4f]">
            {markTarget.employeeName}
          </span>{" "}
          on{" "}
          <span className="font-semibold text-[#0a1a4f]">
            {markTarget.date}
          </span>
          ?
        </p>

        <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          This will record the employee as Present for this date.
        </p>

        {markError && (
          <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {markError}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={marking}
            onClick={() => {
              setMarkTarget(null);
              setMarkError("");
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={marking}
            onClick={confirmMarkAttendance}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {marking ? "Marking…" : "Mark Present"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </section>
  );
}



// import { useEffect, useMemo, useRef, useState } from "react";
// import { motion, useReducedMotion } from "framer-motion";
// import {
//   CalendarDays,
//   ChevronLeft,
//   ChevronRight,
//   RefreshCw,
//   Pencil,
//   Trash2,
// } from "lucide-react";

// import API_BASE_URL from "../../config/api";
// import { attendanceRequest } from "./attendanceApi";
// import { Editor } from "./AttendanceManagement";
// import useAttendanceLeaves from "./useAttendanceLeaves";

// const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// function getISTDate() {
//   return new Date(Date.now() + 19800000).toISOString().slice(0, 10);
// }

// async function getData(params, signal, endpoint = "all") {
//   const token = localStorage.getItem("adminToken");

//   if (!token) {
//     throw new Error("Your session has expired. Please log in again.");
//   }

//   const controller = new AbortController();
//   const cancel = () => controller.abort();
//   let timedOut = false;

//   signal.addEventListener("abort", cancel, { once: true });

//   if (signal.aborted) controller.abort();

//   const timer = setTimeout(() => {
//     timedOut = true;
//     controller.abort();
//   }, 20000);

//   try {
//     const response = await fetch(
//      `${API_BASE_URL.replace(/\/$/, "")}/attendance/${endpoint}?${new URLSearchParams(params)}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//         signal: controller.signal,
//         cache: "no-store",
//       }
//     );

//     const result = await response.json().catch(() => null);

//     if (!response.ok || !result?.success) {
//       throw new Error(
//         result?.message || "Unable to load attendance calendar."
//       );
//     }

//     return result;
//   } catch (error) {
//     if (timedOut) {
//       throw new Error("The request timed out. Please refresh the calendar.", { cause: error });
//     }

//     if (error instanceof TypeError) {
//       throw new Error(
//         "Unable to connect. Check your connection and try again.",
//         { cause: error }
//       );
//     }

//     throw error;
//   } finally {
//     clearTimeout(timer);
//     signal.removeEventListener("abort", cancel);
//   }
// }

// export default function AttendanceCalendar({ canEdit, canDelete, canMark }) {
//   const reduceMotion = useReducedMotion();

//   const [month, setMonth] = useState(() => getISTDate().slice(0, 7));
//   const [employees, setEmployees] = useState([]);
//   const [employeeId, setEmployeeId] = useState("");
//   const [directoryLoading, setDirectoryLoading] = useState(true);
//   const [directoryError, setDirectoryError] = useState("");

//   const [records, setRecords] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [message, setMessage] = useState("");
//   const [refreshKey, setRefreshKey] = useState(0);
//   const [directoryRetry, setDirectoryRetry] = useState(0);
//   const [target, setTarget] = useState(null);
//   const [schedule, setSchedule] = useState({
//   month: "",
//   days: [],
// });
// const [scheduleLoading, setScheduleLoading] = useState(true);
// const [scheduleError, setScheduleError] = useState("");

// const [markTarget, setMarkTarget] = useState(null);
// const [marking, setMarking] = useState(false);
// const [markError, setMarkError] = useState("");
// const markRequestLock = useRef(false);

// const scheduleReady =
//   schedule.month === month &&
//   !scheduleLoading &&
//   !scheduleError;

// const scheduleByDate = useMemo(
//   () =>
//     new Map(
//       (schedule.month === month ? schedule.days : []).map((day) => [
//         day.date,
//         day,
//       ])
//     ),
//   [schedule, month]
// );

//   const leaveState = useAttendanceLeaves(employeeId, month, refreshKey);

//   const today = getISTDate();

//   const calendar = useMemo(() => {
//     const [year, monthNumber] = month.split("-").map(Number);
//     const firstDate = new Date(Date.UTC(year, monthNumber - 1, 1));
//     const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

//     return {
//       from: `${month}-01`,
//       to: `${month}-${String(days).padStart(2, "0")}`,
//       days,
//       offset: firstDate.getUTCDay(),
//       title: firstDate.toLocaleDateString("en-IN", {
//         timeZone: "UTC",
//         month: "long",
//         year: "numeric",
//       }),
//     };
//   }, [month]);

//   const recordsByDate = useMemo(
//     () => new Map(records.map((record) => [record.attendanceDate, record])),
//     [records]
//   );

//   const selectedEmployee = employees.find(
//     (employee) => employee.id === employeeId
//   );

//   useEffect(() => {
//     const controller = new AbortController();
//     let active = true;

//     setDirectoryLoading(true);
//     setDirectoryError("");

//     getData({ directory: "1" }, controller.signal)
//       .then((result) => {
//         if (!active) return;

//         if (!Array.isArray(result.employees)) {
//           throw new Error("Invalid employee list response.");
//         }

//         setEmployees(result.employees);

//         setEmployeeId((current) =>
//           result.employees.some((employee) => employee.id === current)
//             ? current
//             : result.employees[0]?.id || ""
//         );
//       })
//       .catch((err) => {
//         if (active) setDirectoryError(err.message);
//       })
//       .finally(() => {
//         if (active) setDirectoryLoading(false);
//       });

//     return () => {
//       active = false;
//       controller.abort();
//     };
//   }, [directoryRetry]);

//   useEffect(() => {
//     const controller = new AbortController();
//     let active = true;

//     setRecords([]);
//     setError("");
//     setTarget(null);

//     if (!employeeId) {
//       setLoading(false);
//       return () => controller.abort();
//     }

//     setLoading(true);

//     async function loadMonth() {
//       try {
//         const params = {
//           employeeId,
//           from: calendar.from,
//           to: calendar.to,
//         };

//         const first = await getData(
//           { ...params, page: "1" },
//           controller.signal
//         );

//         if (
//           !Array.isArray(first.records) ||
//           !Number.isInteger(first.pages) ||
//           first.pages < 1
//         ) {
//           throw new Error("Invalid calendar response.");
//         }

//         const collected = [...first.records];

//         // Existing API is paginated. Fetch every page for this employee/month.
//         for (let page = 2; page <= first.pages; page += 1) {
//           const next = await getData(
//             { ...params, page: String(page) },
//             controller.signal
//           );

//           if (!Array.isArray(next.records)) {
//             throw new Error("Unable to load the complete month.");
//           }

//           collected.push(...next.records);
//         }

//         if (active) {
//           const unique = new Map(
//             collected.map((record) => [record.id, record])
//           );

//           setRecords([...unique.values()]);
//         }
//       } catch (err) {
//         if (active) setError(err.message);
//       } finally {
//         if (active) setLoading(false);
//       }
//     }

//     loadMonth();

//     return () => {
//       active = false;
//       controller.abort();
//     };
//   }, [employeeId, calendar.from, calendar.to, refreshKey]);


//   useEffect(() => {
//   const controller = new AbortController();
//   let active = true;

//   setScheduleLoading(true);
//   setScheduleError("");
//   setSchedule({ month: "", days: [] });

//   getData({ month }, controller.signal, "schedule")
//     .then((result) => {
//       if (!active) return;

//       const dates = new Set();

//       if (
//         result.month !== month ||
//         !Array.isArray(result.days) ||
//         result.days.length !== calendar.days ||
//         result.days.some((day) => {
//           if (
//             !day ||
//             typeof day.date !== "string" ||
//             day.date < calendar.from ||
//             day.date > calendar.to ||
//             !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
//             dates.has(day.date) ||
//             typeof day.isWeeklyOff !== "boolean" ||
//             typeof day.weeklyOffConfigured !== "boolean" ||
//             !(
//               day.holidayName === null ||
//               typeof day.holidayName === "string"
//             )
//           ) {
//             return true;
//           }

//           dates.add(day.date);
//           return false;
//         })
//       ) {
//         throw new Error(
//           "Invalid holiday schedule response. Please refresh the calendar."
//         );
//       }

//       setSchedule({
//         month,
//         days: result.days,
//       });
//     })
//     .catch((err) => {
//       if (active) setScheduleError(err.message);
//     })
//     .finally(() => {
//       if (active) setScheduleLoading(false);
//     });

//   return () => {
//     active = false;
//     controller.abort();
//   };
// }, [
//   month,
//   calendar.days,
//   calendar.from,
//   calendar.to,
//   refreshKey,
// ]);

//   function changeMonth(direction) {
//     const [year, monthNumber] = month.split("-").map(Number);
//     const next = new Date(Date.UTC(year, monthNumber - 1 + direction, 1));

//     if (next.getUTCFullYear() < 2000 || next.getUTCFullYear() > 2099) {
//       return;
//     }

//     setRecords([]);
//     setLoading(Boolean(employeeId));
//     setMessage("");
//     setMonth(next.toISOString().slice(0, 7));
//   }

//   function openAction(record, action) {
//     if (action === "edit" && !canEdit) return;
//     if (action === "delete" && !canDelete) return;

//     setTarget({
//       ...record,
//       action,
//       employeeName:
//         record.employeeName || selectedEmployee?.name || "Employee",
//     });
//   }

//   function openMarkConfirmation(date, record) {
//   if (!canMark || record || date > today) return;

//   setMarkError("");
//   setMarkTarget({
//     date,
//     employeeId,
//     employeeName: selectedEmployee?.name || "Employee",
//   });
// }

//   async function confirmMarkAttendance() {
//     if (!markTarget || !canMark || markRequestLock.current) return;

//     markRequestLock.current = true;
//     setMarking(true);
//     setMarkError("");

//     try {
//       const result = await attendanceRequest("/manual", {
//         method: "POST",
//         body: {
//           employeeId: markTarget.employeeId,
//           attendanceDate: markTarget.date,
//         },
//         validateActionResponse: false,
//         expectedStatus: 201,
//       });
//       setMarkTarget(null);
//       setMessage(result.message);
//       setRefreshKey((value) => value + 1);
//     } catch (err) {
//       setMarkError(err instanceof Error ? err.message : "Unable to mark attendance.");
//     } finally {
//       markRequestLock.current = false;
//       setMarking(false);
//     }
//   }

//   const cells = Math.ceil((calendar.offset + calendar.days) / 7) * 7;
//   const busy = directoryLoading || loading;

//   return (
//     <section
//       className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_48px_-28px_rgba(15,60,35,0.3)]"
//       aria-label="Attendance calendar"
//     >
//       <div className="flex flex-col gap-6 border-b border-slate-100 bg-gradient-to-br from-emerald-50/70 via-white to-white p-5 sm:p-7 xl:flex-row xl:items-center xl:justify-between">
//         <div>
//           <div className="flex items-center gap-3">
//             <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-700 shadow-sm"><CalendarDays size={21} /></span>
//             <h2 className="text-xl font-semibold tracking-tight text-slate-900">
//               Attendance calendar
//             </h2>
//           </div>

//           <p className="mt-3 text-xs leading-relaxed text-slate-500">
//             Attendance, holidays & weekly offs · IST
//           </p>
//         </div>

//         <label className="flex min-w-0 flex-col gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 xl:w-72">
//           Employee
//           <select
//             className="w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium normal-case tracking-normal text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
//             value={employeeId}
//             disabled={directoryLoading || employees.length === 0}
//             onChange={(event) => {
//               setRecords([]);
//               setLoading(true);
//               setMessage("");
//               setEmployeeId(event.target.value);
//             }}
//           >
//             {employees.length === 0 && (
//               <option value="">
//                 {directoryLoading ? "Loading employees…" : "No employees"}
//               </option>
//             )}

//             {employees.map((employee) => (
//               <option key={employee.id} value={employee.id}>
//                 {employee.name} · {employee.email}
//                 {employee.isActive === false ? " (Inactive)" : ""}
//               </option>
//             ))}
//           </select>
//         </label>

//         <div className="flex w-fit max-w-full items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
//           <button
//             type="button"
//             aria-label="Previous month"
//             disabled={month === "2000-01"}
//             onClick={() => changeMonth(-1)}
//             className="rounded-xl p-2.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"
//           >
//             <ChevronLeft size={20} />
//           </button>

//           <span className="min-w-[132px] px-1 text-center text-sm font-semibold tracking-tight text-slate-800 sm:min-w-[156px]">
//             {calendar.title}
//           </span>

//           <button
//             type="button"
//             aria-label="Next month"
//             disabled={month === "2099-12"}
//             onClick={() => changeMonth(1)}
//             className="rounded-xl p-2.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"
//           >
//             <ChevronRight size={20} />
//           </button>

//           <button
//             type="button"
//             aria-label="Refresh calendar"
//             disabled={busy || scheduleLoading}
//             onClick={() => {
//   setMessage("");

//   if (directoryError) {
//     setDirectoryRetry((value) => value + 1);
//   }

//   setRefreshKey((value) => value + 1);
// }}
//             className="ml-1 rounded-xl border-l border-slate-100 p-2.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-30"
//           >
//            <RefreshCw
//   size={17}
//   className={
//     busy || scheduleLoading
//       ? "animate-spin motion-reduce:animate-none"
//       : ""
//   }
// />
//           </button>
//         </div>
//       </div>

//       <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-100 px-5 py-3 text-xs text-slate-600 sm:px-7">
//         {[
//           ["Present", "bg-emerald-500"], ["Late", "bg-amber-500"],
//           ["Absent", "bg-rose-500"], ["Holiday", "bg-violet-400"],
//           ["Weekly off", "bg-sky-400"], ["Approved leave", "bg-indigo-400"], ["No record", "bg-slate-300"],
//         ].map(([label, color]) => (
//           <span key={label} className="inline-flex items-center gap-2">
//             <span className={`h-2 w-2 rounded-full ${color}`} />{label}
//           </span>
//         ))}
//       </div>

// {leaveState.loading && <p role="status" className="px-5 pt-4 text-xs text-slate-500">Loading approved leaves…</p>}
// {leaveState.error && <p role="alert" className="mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Approved leaves are unavailable. {leaveState.error} Attendance and company schedule are shown separately.</p>}

// {scheduleLoading && (
//   <p
//     role="status"
//     className="px-5 pt-4 text-xs text-slate-500"
//   >
//     Loading holidays and weekly offs…
//   </p>
// )}

// {scheduleError && (
//   <p
//     role="alert"
//     className="mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
//   >
//     Holidays and weekly offs are unavailable. {scheduleError} Attendance
//     records are shown separately.
//   </p>
// )}

// {scheduleReady &&
//   schedule.days.some((day) => !day.weeklyOffConfigured) && (
//     <p className="px-5 pt-4 text-xs text-slate-500">
//       Weekly-off policy is not configured for some dates in this month.
//     </p>
//   )}

//       {message && (
//         <p
//           role="status"
//           className="mx-5 mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800"
//         >
//           {message}
//         </p>
//       )}

//       {directoryError || error ? (
//         <p
//           role="alert"
//           className="m-5 rounded-xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700"
//         >
//           {directoryError || error}
//         </p>
//       ) : busy ? (
//         <p role="status" className="px-6 py-24 text-center text-sm text-slate-500">
//           Loading calendar…
//         </p>
//       ) : !employeeId ? (
//         <p className="px-6 py-24 text-center text-sm text-slate-500">
//           No employees are available.
//         </p>
//       ) : (
//         <div
//           className="overflow-x-auto bg-slate-50/50 p-3 focus-visible:outline-emerald-500 sm:p-5"
//           tabIndex={0}
//           role="region"
//           aria-label={`${selectedEmployee?.name || "Employee"} attendance for ${calendar.title}`}
//         >
//           <div className="min-w-[770px]">
//             <div className="grid grid-cols-7 gap-2">
//               {WEEKDAYS.map((weekday) => (
//                 <div
//                   key={weekday}
//                   className="pb-4 pt-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400"
//                 >
//                   {weekday}
//                 </div>
//               ))}
//             </div>

//             <motion.div
//               key={`${employeeId}-${month}`}
//               initial={reduceMotion ? false : { opacity: 0, y: 6 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.25 }}
//               className="grid grid-cols-7 gap-2"
//             >
//               {Array.from({ length: cells }, (_, index) => {
//                 const day = index - calendar.offset + 1;

//                 if (day < 1 || day > calendar.days) {
//                   return (
//                     <div
//                       key={`empty-${index}`}
//                       aria-hidden="true"
//                       className="min-h-[148px] rounded-xl bg-slate-100/50"
//                     />
//                   );
//                 }

//                 const date = `${month}-${String(day).padStart(2, "0")}`;
//                 const record = recordsByDate.get(date);
//                 const leaveDay = leaveState.byDate.get(date);
//                 const scheduleDay = scheduleReady
//   ? scheduleByDate.get(date)
//   : null;
//                 const future = date > today;
//                 const absent = record?.attendanceStatus === "absent";
//                 const halfDay = record?.attendanceStatus === "half_day";
//                 const late = record?.arrivalStatus === "late";

//                 const needsReview = Boolean(leaveDay && (
//                   leaveDay.conflict || (record && (absent || (leaveDay.units >= 1 && (record.checkInAt || record.checkOutAt))))
//                 ));

//                 // Visual priority only: schedule colors never change attendance status.
//                 const cellTone = scheduleDay?.holidayName
//                   ? "border-violet-200/80 bg-violet-50"
//                   : scheduleDay?.isWeeklyOff
//                     ? "border-sky-200/80 bg-sky-50"
//                     : leaveDay
//                       ? "border-indigo-200/80 bg-indigo-50"
//                       : record
//                       ? absent
//                         ? "border-rose-200/70 bg-rose-50/70"
//                         : late
//                           ? "border-amber-200/70 bg-amber-50/70"
//                           : "border-emerald-200/70 bg-emerald-50/60"
//                       : "border-slate-200/70 bg-white";
//               const statusTone = absent
//   ? "bg-rose-100 text-rose-800"
//   : halfDay || late
//     ? "bg-amber-100 text-amber-900"
//     : "bg-emerald-100 text-emerald-800";

//                 return (
//                   <div
//   key={date}
//   onClick={
//     canMark && !record && !future
//       ? () => openMarkConfirmation(date, record)
//       : undefined
//   }
//   role={canMark && !record && !future ? "button" : undefined}
//   tabIndex={canMark && !record && !future ? 0 : undefined}
//   aria-label={canMark && !record && !future ? `Mark attendance for ${selectedEmployee?.name || "employee"} on ${date}` : undefined}
//   onKeyDown={
//     canMark && !record && !future
//       ? (event) => {
//           if (event.key === "Enter" || event.key === " ") {
//             event.preventDefault();
//             openMarkConfirmation(date, record);
//           }
//         }
//       : undefined
//   }
//   className={`relative flex min-h-[148px] min-w-0 flex-col rounded-xl border p-3 transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none ${
//     cellTone
//   } ${
//     date === today ? "ring-2 ring-inset ring-emerald-500" : ""
//   } ${
//     canMark && !record && !future
//       ? "cursor-pointer hover:ring-2 hover:ring-emerald-200"
//       : ""
//   }`}
// >
//                     <div className="mb-3 flex items-center justify-between gap-1">
//                       <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold tabular-nums ${date === today ? "bg-emerald-600 text-white" : "text-slate-700"}`}>
//                         {day}
//                       </span>
//                       {date === today && <span className="text-[9px] font-bold tracking-wider text-emerald-700">TODAY</span>}
//                     </div>

//                     <div className="space-y-1.5">
//                       {scheduleDay?.holidayName && (
//                         <div className="text-violet-800">
//                           <p className="text-[9px] font-bold uppercase tracking-widest">Holiday</p>
//                           <p className="mt-1 break-words text-xs font-medium leading-5">{scheduleDay.holidayName}</p>
//                         </div>
//                       )}
//                       {scheduleDay?.isWeeklyOff && (
//                         <p className="text-xs font-semibold text-sky-800">Weekly off</p>
//                       )}
//                       {leaveDay?.leaves.map(leave => (
//                         <div key={`${leave.requestId}-${leave.portion}`} className="rounded-lg border border-indigo-200/60 bg-indigo-100/70 px-2 py-1.5 text-indigo-900">
//                           <p className="text-[10px] font-semibold">{leave.paid ? "Paid leave" : "Unpaid leave"} Â· {leave.units === 0.5 ? "Â½ day" : "Full day"}</p>
//                           <p className="mt-0.5 break-words text-[10px]">{leave.typeName}</p>
//                           {leave.portion !== "full" && <p className="mt-0.5 text-[9px] text-indigo-700">{leave.portion === "first_half" ? "First half" : "Second half"}</p>}
//                           {leave.cancellationPending && <p className="mt-1 text-[9px] font-medium text-amber-800">Cancellation pending</p>}
//                         </div>
//                       ))}
//                       {needsReview && <p className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-900">Attendance / leave needs review</p>}
//                       {record ? (
//                         <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${statusTone}`}>
//                          {absent ? "Absent": halfDay? "Half Day": late? "Present Â· Late": "Present"}
//                         </span>
//                       ) : !scheduleDay?.holidayName && !scheduleDay?.isWeeklyOff && !leaveDay ? (
//                         <p className="pt-1 text-[11px] text-slate-400">{future ? "Upcoming" : "No record"}</p>
//                       ) : null}
//                     </div>

//                     {record && (canEdit || canDelete) && (
//                       <div className="mt-auto flex items-center justify-end gap-1 pt-2">
//                         {canEdit && (
//                           <button type="button" title="Edit attendance"
//                             aria-label={`Edit attendance for ${date}`}
//                             onClick={() => openAction(record, "edit")}
//                             className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/5 bg-white/70 text-slate-600 transition hover:bg-white hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
//                             <Pencil size={14} />
//                           </button>
//                         )}
//                         {canDelete && (
//                           <button type="button" title="Delete attendance"
//                             aria-label={`Delete attendance for ${date}`}
//                             onClick={() => openAction(record, "delete")}
//                             className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/5 bg-white/70 text-slate-500 transition hover:bg-white hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
//                             <Trash2 size={14} />
//                           </button>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </motion.div>
//           </div>
//         </div>
//       )}

//       <p className="border-t border-slate-100 px-5 py-4 text-[11px] leading-relaxed text-slate-400 sm:px-7">
//        No record does not automatically mean absent. Approved leave remains effective until cancellation is approved. Leave labels refresh every 30 seconds while this page is visible and when you return to it. Recorded attendance is preserved; review any flagged conflicts.
//       </p>

//       {target &&
//         (target.action === "edit" ? canEdit : canDelete) && (
//           <Editor
//             key={`${target.id}-${target.action}`}
//             target={target}
//             onClose={() => setTarget(null)}
//             onSaved={(text) => {
//               setTarget(null);
//               setMessage(text);
//               setRefreshKey((value) => value + 1);
//             }}
//           />
//         )}

//         {markTarget && canMark && (
//   <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
//     <div role="dialog" aria-modal="true" aria-labelledby="mark-attendance-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
//       <h3 id="mark-attendance-title" className="text-lg font-semibold text-slate-900">
//         Mark Attendance
//       </h3>

//       <p className="mt-2 text-sm text-slate-500">
//         Do you want to mark attendance for{" "}
//         <span className="font-semibold text-slate-800">
//           {markTarget.employeeName}
//         </span>{" "}
//         on{" "}
//         <span className="font-semibold text-slate-800">
//           {markTarget.date}
//         </span>
//         ?
//       </p>

//       <p className="mt-3 text-xs text-slate-500">
//         This will record the employee as Present for this date.
//       </p>

//       {markError && (
//         <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
//           {markError}
//         </p>
//       )}

//       <div className="mt-6 flex justify-end gap-2">
//         <button
//           type="button"
//           disabled={marking}
//           onClick={() => {
//             setMarkTarget(null);
//             setMarkError("");
//           }}
//           className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
//         >
//           Cancel
//         </button>

//         <button
//           type="button"
//           disabled={marking}
//           onClick={confirmMarkAttendance}
//           className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
//         >
//           {marking ? "Marking…" : "Mark Present"}
//         </button>
//       </div>
//     </div>
//   </div>
// )}
//     </section>
//   );
// }

