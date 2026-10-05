import { useContext, useState } from "react";
import { AuthContext } from "../../auth/AuthContext";

import AttendanceModule from "./AttendanceModule";
import AttendanceManagement from "./AttendanceManagement";
import AttendanceCalendar from "./AttendanceCalendar";
import MonthlyWorkRecords from "./MonthlyWorkRecords";

import "./attendance.css";

export default function AttendanceHome() {
  const { hasPermission } = useContext(AuthContext);

  const canViewOwn = hasPermission("view_attendance");
  const canMark = hasPermission("mark_attendance");
  const canViewAll = hasPermission("view_all_attendance");
  const canEdit = hasPermission("edit_attendance");
  const canDelete = hasPermission("delete_attendance");
  const canViewMonthly = hasPermission("view_monthly_records");

  const canOpenOwn = canViewOwn || canMark;

  const [selected, setSelected] = useState(
    canViewAll ? "all" : canViewMonthly ? "monthly" : "own"
  );

  const selectedAllowed =
    selected === "own" ? canOpenOwn :
    selected === "monthly" ? canViewMonthly :
    canViewAll;

  const tab = selectedAllowed
    ? selected
    : canViewAll
      ? "all"
      : canViewMonthly
        ? "monthly"
        : "own";

  return (
    <div className="att-module">
      <nav
        className="att-tabs flex-wrap"
        aria-label="Attendance views"
      >
        {canOpenOwn && (
          <button
            type="button"
            className={tab === "own" ? "active" : ""}
            aria-pressed={tab === "own"}
            onClick={() => setSelected("own")}
          >
            My Attendance
          </button>
        )}

        {canViewAll && (
          <>
            <button
              type="button"
              className={tab === "all" ? "active" : ""}
              aria-pressed={tab === "all"}
              onClick={() => setSelected("all")}
            >
              All Attendance
            </button>

            <button
              type="button"
              className={tab === "calendar" ? "active" : ""}
              aria-pressed={tab === "calendar"}
              onClick={() => setSelected("calendar")}
            >
              Calendar View
            </button>
          </>
        )}

        {canViewMonthly && (
          <button
            type="button"
            className={tab === "monthly" ? "active" : ""}
            aria-pressed={tab === "monthly"}
            onClick={() => setSelected("monthly")}
          >
            Monthly Records
          </button>
        )}
      </nav>

      {tab === "own" && canOpenOwn && (
        <AttendanceModule
          canView={canViewOwn}
          canMark={canMark}
        />
      )}

      {tab === "all" && canViewAll && (
        <AttendanceManagement
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {tab === "calendar" && canViewAll && (
        <AttendanceCalendar
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {tab === "monthly" && canViewMonthly && <MonthlyWorkRecords />}
    </div>
  );
}






// import { useContext, useState } from "react";
// import { AuthContext } from "../../auth/AuthContext";

// import AttendanceModule from "./AttendanceModule";
// import AttendanceManagement from "./AttendanceManagement";
// import AttendanceCalendar from "./AttendanceCalendar";
// import MonthlyWorkRecords from "./MonthlyWorkRecords";


// import "./attendance.css";

// export default function AttendanceHome() {
//   const { hasPermission } = useContext(AuthContext);

//   const canViewOwn = hasPermission("view_attendance");
//   const canMark = hasPermission("mark_attendance");
//   const canViewAll = hasPermission("view_all_attendance");
//   const canEdit = hasPermission("edit_attendance");
//   const canDelete = hasPermission("delete_attendance");
//   const canViewMonthly = hasPermission("view_monthly_records");


//   const canOpenOwn = canViewOwn || canMark;

//   const [selected, setSelected] = useState(
//     canViewAll ? "all" : "own"
//   );

//   const selectedAllowed =
//     selected === "own" ? canOpenOwn : canViewAll;

//   const tab = selectedAllowed
//     ? selected
//     : canViewAll
//       ? "all"
//       : "own";

//   return (
//     <div className="att-module">
//       <nav
//         className="att-tabs flex-wrap"
//         aria-label="Attendance views"
//       >
//         {canOpenOwn && (
//           <button
//             type="button"
//             className={tab === "own" ? "active" : ""}
//             aria-pressed={tab === "own"}
//             onClick={() => setSelected("own")}
//           >
//             My Attendance
//           </button>
//         )}

//         {canViewAll && (
//           <>
//             <button
//               type="button"
//               className={tab === "all" ? "active" : ""}
//               aria-pressed={tab === "all"}
//               onClick={() => setSelected("all")}
//             >
//               All Attendance
//             </button>

//             <button
//               type="button"
//               className={tab === "calendar" ? "active" : ""}
//               aria-pressed={tab === "calendar"}
//               onClick={() => setSelected("calendar")}
//             >
//               Calendar View
//             </button>
//           </>
//         )}
//       </nav>

//       {tab === "own" && canOpenOwn && (
//         <AttendanceModule
//           canView={canViewOwn}
//           canMark={canMark}
//         />
//       )}

//       {tab === "all" && canViewAll && (
//         <AttendanceManagement
//           canEdit={canEdit}
//           canDelete={canDelete}
//         />
//       )}

//       {tab === "calendar" && canViewAll && (
//         <AttendanceCalendar
//           canEdit={canEdit}
//           canDelete={canDelete}
//         />
//       )}
//     </div>
//   );
// }
