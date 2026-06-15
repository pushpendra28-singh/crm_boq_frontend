import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { SOURCE_CONFIG, SOURCES } from "./Constants";

/**
 * SourceBar
 * Horizontal scrollable bar with "All" + each source as a pill button.
 * Shows lead count per source (derived from the current leads array).
 * Clicking a source sets it as active; clicking again or "All" resets.
 *
 * Props:
 *  activeSource  : string | ""   — currently selected source
 *  onChange      : (source: string) => void
 *  leads         : Lead[]        — full current page leads (for counts)
 */
const SourceBar = ({ activeSource, onChange, leads = [] }) => {
  // Count per source from current leads
  const countMap = leads.reduce((acc, l) => {
    const src = l.source || "Manual";
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  // Only show sources that have at least 1 lead OR are already selected
  const visibleSources = SOURCES.filter(
    (s) => countMap[s] > 0 || activeSource === s
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        overflowX: "auto",
        paddingBottom: "4px",
        scrollbarWidth: "none",
      }}
    >
      <style>{`
        .source-bar-wrap::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ALL pill */}
      <button
        onClick={() => onChange("")}
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 14px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          border: !activeSource ? "none" : "1px solid #e5e7eb",
          background: !activeSource ? "#16a34a" : "#fff",
          color: !activeSource ? "#fff" : "#6b7280",
          boxShadow: !activeSource
            ? "0 2px 8px rgba(22,163,74,0.25)"
            : "0 1px 3px rgba(0,0,0,0.06)",
          transition: "all 0.15s",
        }}
      >
        <Layers size={12} />
        All
        <span
          style={{
            fontSize: "10px",
            fontWeight: 800,
            padding: "1px 7px",
            borderRadius: "20px",
            background: !activeSource ? "rgba(255,255,255,0.25)" : "#f3f4f6",
            color: !activeSource ? "#fff" : "#9ca3af",
          }}
        >
          {leads.length}
        </span>
      </button>

      {/* Source pills */}
      {visibleSources.map((src) => {
        const cfg   = SOURCE_CONFIG[src] || SOURCE_CONFIG["Other"];
        const Icon  = cfg.icon;
        const count = countMap[src] || 0;
        const active = activeSource === src;

        return (
          <motion.button
            key={src}
            layout
            onClick={() => onChange(active ? "" : src)}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              border: active ? "1px solid currentColor" : "1px solid #e5e7eb",
              background: active ? undefined : "#fff",
              boxShadow: active
                ? "0 1px 4px rgba(0,0,0,0.08)"
                : "0 1px 3px rgba(0,0,0,0.06)",
              transition: "all 0.15s",
            }}
            // For active state, use the existing cfg color classes via className
            // For inactive, override with neutral light styles via inline style
            className={
              active
                ? `${cfg.bg.replace("/10", "/15")} ${cfg.color}`
                : ""
            }
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.color = "#374151";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = "";
              }
            }}
          >
            <Icon size={12} className={active ? cfg.color : ""} style={!active ? { color: "#9ca3af" } : {}} />
            {src}
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                padding: "1px 7px",
                borderRadius: "20px",
                background: active ? "rgba(0,0,0,0.08)" : "#f3f4f6",
                color: active ? "inherit" : "#9ca3af",
              }}
            >
              {count}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default SourceBar;


// import { motion } from "framer-motion";
// import { Layers } from "lucide-react";
// import { SOURCE_CONFIG, SOURCES } from "./Constants";

// /**
//  * SourceBar
//  * Horizontal scrollable bar with "All" + each source as a pill button.
//  * Shows lead count per source (derived from the current leads array).
//  * Clicking a source sets it as active; clicking again or "All" resets.
//  *
//  * Props:
//  *  activeSource  : string | ""   — currently selected source
//  *  onChange      : (source: string) => void
//  *  leads         : Lead[]        — full current page leads (for counts)
//  */
// const SourceBar = ({ activeSource, onChange, leads = [] }) => {
//   // Count per source from current leads
//   const countMap = leads.reduce((acc, l) => {
//     const src = l.source || "Manual";
//     acc[src] = (acc[src] || 0) + 1;
//     return acc;
//   }, {});

//   // Only show sources that have at least 1 lead OR are already selected
//   const visibleSources = SOURCES.filter(
//     (s) => countMap[s] > 0 || activeSource === s
//   );

//   return (
//     <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
//       {/* ALL pill */}
//       <button
//         onClick={() => onChange("")}
//         className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all
//           ${!activeSource
//             ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
//             : "bg-white/5 text-slate-400 border-white/8 hover:text-white hover:bg-white/8"}`}
//       >
//         <Layers size={12} />
//         All
//         <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
//           !activeSource ? "bg-white/20 text-white" : "bg-white/10 text-slate-500"
//         }`}>
//           {leads.length}
//         </span>
//       </button>

//       {/* Source pills */}
//       {visibleSources.map((src) => {
//         const cfg   = SOURCE_CONFIG[src] || SOURCE_CONFIG["Other"];
//         const Icon  = cfg.icon;
//         const count = countMap[src] || 0;
//         const active = activeSource === src;

//         return (
//           <motion.button
//             key={src}
//             layout
//             onClick={() => onChange(active ? "" : src)}
//             className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all
//               ${active
//                 ? `${cfg.bg.replace("/10", "/25")} ${cfg.color} border-current shadow-sm`
//                 : "bg-white/5 text-slate-400 border-white/8 hover:text-slate-200 hover:bg-white/8"}`}
//           >
//             <Icon size={12} className={active ? cfg.color : ""} />
//             {src}
//             <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
//               active ? "bg-white/20" : "bg-white/8 text-slate-600"
//             }`}>
//               {count}
//             </span>
//           </motion.button>
//         );
//       })}
//     </div>
//   );
// };

// export default SourceBar;