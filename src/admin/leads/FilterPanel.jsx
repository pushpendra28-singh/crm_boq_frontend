import { X } from "lucide-react";
import { motion } from "framer-motion";
import { STATUSES, SOURCES } from "./Constants";

// ─── Filter Panel ─────────────────────────────────────────────────────────────
const FilterPanel = ({ filters, onChange, onReset, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -8, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -8, scale: 0.97 }}
    className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl p-5 z-30 shadow-xl"
  >
    <div className="flex items-center justify-between mb-4">
      <span className="text-[13px] font-bold text-gray-800">Filters</span>
      <button onClick={onReset} className="text-[11px] text-emerald-600 hover:text-emerald-500 transition">Reset all</button>
    </div>

    <div className="space-y-4">
      {/* Status */}
      <div>
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Status</label>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => onChange("status", filters.status === s ? "" : s)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition border
                ${filters.status === s
                  ? "bg-emerald-500 text-white border-emerald-400"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800 hover:border-gray-300"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Source */}
      <div>
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Source</label>
        <div className="flex flex-wrap gap-1.5">
          {SOURCES.map((s) => (
            <button
              key={s}
              onClick={() => onChange("source", filters.source === s ? "" : s)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition border
                ${filters.source === s
                  ? "bg-emerald-500 text-white border-emerald-400"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800 hover:border-gray-300"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Min score */}
      <div>
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
          Min Score: <span className="text-emerald-600">{filters.minScore || 0}</span>
        </label>
        <input
          type="range" min={0} max={100} step={10}
          value={filters.minScore || 0}
          onChange={(e) => onChange("minScore", e.target.value)}
          className="w-full accent-emerald-500"
        />
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">From</label>
          <input type="date" value={filters.startDate || ""} onChange={(e) => onChange("startDate", e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-gray-700 focus:outline-none focus:border-emerald-400 transition" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">To</label>
          <input type="date" value={filters.endDate || ""} onChange={(e) => onChange("endDate", e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-gray-700 focus:outline-none focus:border-emerald-400 transition" />
        </div>
      </div>

      {/* Duplicates toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => onChange("showDuplicates", !filters.showDuplicates)}
          className={`w-9 h-5 rounded-full transition-all relative ${filters.showDuplicates ? "bg-emerald-500" : "bg-gray-200"}`}
        >
          <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${filters.showDuplicates ? "left-[19px]" : "left-[3px]"}`} />
        </div>
        <span className="text-[12px] text-gray-600">Show duplicates only</span>
      </label>
    </div>

    <button
      onClick={onClose}
      className="mt-5 w-full py-2 rounded-xl text-[13px] font-semibold text-white bg-emerald-500 hover:bg-emerald-400 transition"
    >
      Apply Filters
    </button>

    {/* AI Temperature */}
    <div className="mt-4">
      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
        AI Temperature
      </label>
      <div className="flex gap-2">
        {["Cold", "Warm", "Hot"].map((t) => (
          <button
            key={t}
            onClick={() => onChange("temperature", filters.temperature === t ? "" : t)}
            className={`px-2.5 py-1 rounded-lg text-[11px] border transition
              ${filters.temperature === t
                ? "bg-emerald-500 text-white border-emerald-400"
                : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800 hover:border-gray-300"}`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  </motion.div>
);

export default FilterPanel;