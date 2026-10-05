import { useContext, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { AuthContext } from "../../auth/AuthContext";
import OfficialHolidays from "./OfficialHolidays";
import WeeklyOffs from "./WeeklyOffs";

export default function HolidaysModule() {
  const { hasPermission } = useContext(AuthContext);
  const reduceMotion = useReducedMotion();
  const canView = hasPermission("view_holidays");
  const canCreate = hasPermission("create_holidays");
  const canEdit = hasPermission("edit_holidays");
  const canDelete = hasPermission("delete_holidays");
  const canManage = hasPermission("manage_weekly_offs");
  const holidayAccess = canView || canCreate || canEdit || canDelete;
  const weeklyAccess = canView || canManage;
  const [selected, setSelected] = useState(holidayAccess ? "holidays" : "weekly");
  const tab = selected === "holidays" && holidayAccess ? "holidays" : weeklyAccess ? "weekly" : "holidays";
  if (!holidayAccess && !weeklyAccess) return <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">You do not have permission to access this module.</p>;
  return <div className="mx-auto max-w-6xl space-y-6 text-gray-800">
    <header className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-green-100 bg-green-50 text-green-600"><CalendarDays size={24} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-700">Company schedule</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Holidays & Weekly Offs</h1><p className="mt-1 text-xs text-gray-500">Plan official holidays and recurring days off in one place.</p></div></header>
    <nav aria-label="Holiday management views" className="flex w-fit flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">{[["holidays", "Official Holidays", holidayAccess], ["weekly", "Weekly Offs", weeklyAccess]].filter(([, , visible]) => visible).map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => setSelected(key)} className={`rounded-lg px-4 py-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${tab === key ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>{label}</button>)}</nav>
    <motion.div key={tab} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {tab === "holidays" && holidayAccess && <OfficialHolidays canView={canView} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />}
      {tab === "weekly" && weeklyAccess && <WeeklyOffs canManage={canManage} />}
    </motion.div>
  </div>;
}
