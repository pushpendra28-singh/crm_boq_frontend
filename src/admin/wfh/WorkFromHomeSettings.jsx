import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Home, AlertCircle, CheckCircle2 } from "lucide-react";
import { getWfhSettings, updateWfhSetting } from "./wfhApi";

const typeLabel = (type) => (type === "half_day" ? "Half Day" : "Full Day");

export default function WorkFromHomeSettings() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError("");
    setMessage("");

    getWfhSettings({ signal: controller.signal })
      .then((result) => {
        if (!active) return;
        if (!Array.isArray(result.employees)) {
          throw new Error("Invalid WFH settings response.");
        }
        setRows(result.employees);
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
  }, [retry]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row.name?.toLowerCase().includes(query) ||
        row.email?.toLowerCase().includes(query)
    );
  }, [rows, search]);

  async function save(row, enabled = row.wfh.enabled, dayType = row.wfh.dayType || "full_day") {
    if (savingId) return;
    setSavingId(String(row.id));
    setError("");
    setMessage("");

    try {
      const result = await updateWfhSetting(row.id, { enabled, dayType });
      setRows((current) =>
        current.map((item) =>
          String(item.id) === String(row.id)
            ? { ...item, wfh: result.wfh }
            : item
        )
      );
      setMessage(`${row.name}: ${result.message}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId("");
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-[0.18em] text-emerald-600">ATTENDANCE · WFH</span>
          <h1 className="mt-1 text-2xl font-black text-gray-900">WFH Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Allow selected employees to mark attendance from home and choose whether it counts as a full or half day.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
          onClick={() => setRetry((value) => value + 1)}
          disabled={loading || !!savingId}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {(error || message) && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`} role={error ? "alert" : "status"}>
          {error ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <span>{error || message}</span>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            maxLength={100}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee by name or email"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-gray-500">
            <RefreshCw size={18} className="animate-spin" /> Loading WFH settings…
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
            <Home size={28} className="text-gray-300" />
            <h2 className="mt-3 font-semibold text-gray-700">No eligible employees found</h2>
            <p className="mt-1 text-sm text-gray-400">Try another search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-4 py-3">WFH Access</th>
                  <th className="px-4 py-3">Attendance Type</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((row) => {
                  const enabled = Boolean(row.wfh?.enabled);
                  const dayType = row.wfh?.dayType || "full_day";
                  const saving = savingId === String(row.id);

                  return (
                    <tr key={row.id} className="hover:bg-gray-50/80">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-800">{row.name}</div>
                        <div className="mt-0.5 text-xs text-gray-400">{row.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => save(row, !enabled, enabled ? dayType : "full_day")}
                          disabled={saving}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                          title={enabled ? "Disable WFH access" : "Enable WFH access"}
                        >
                          {saving ? "Saving…" : enabled ? "Allowed" : "Not allowed"}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={dayType}
                          disabled={!enabled || saving}
                          onChange={(event) => save(row, true, event.target.value)}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="full_day">Full Day</option>
                          <option value="half_day">Half Day</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-gray-400">
                        {enabled ? `WFH · ${typeLabel(dayType)}` : "Employee must use office attendance"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
