import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api";
import toast from "react-hot-toast";
import { ArrowLeft, Trash2, Search, FileDown, X, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ── status config ── */
const statusConfig = {
  Pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Replied: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Closed:  "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

const ViewContactLeads = ({ goBack }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showMessage, setShowMessage] = useState(null);

  /* ── fetch ── */
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/contact-leads`);
      const data = await res.json();
      setLeads(data);
    } catch {
      toast.error("Failed to load contact leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  /* ── status update ── */
  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_BASE_URL}/contact-leads/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, status } : l)));
      toast.success("Status updated");
    } catch {
      toast.error("Update failed");
    }
  };

  /* ── delete ── */
  const deleteLead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/contact-leads/${id}`, { method: "DELETE" });
      setLeads((prev) => prev.filter((l) => l._id !== id));
      toast.success("Lead deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ── bulk delete ── */
  const deleteSelected = async () => {
    try {
      await Promise.all(
        selected.map((id) =>
          fetch(`${API_BASE_URL}/contact-leads/${id}`, { method: "DELETE" })
        )
      );
      setLeads((prev) => prev.filter((l) => !selected.includes(l._id)));
      setSelected([]);
      toast.success("Selected leads deleted");
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  /* ── export PDF ── */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Contact Leads", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["Name", "Company", "Phone", "Email", "Subject", "Status"]],
      body: leads.map((l) => [l.fullName, l.companyName, l.phone, l.email, l.subject, l.status]),
    });
    doc.save("contact-leads.pdf");
  };

  /* ── search filter ── */
  const filteredLeads = leads.filter((l) =>
    `${l.fullName} ${l.email} ${l.companyName}`.toLowerCase().includes(search.toLowerCase())
  );

  const allChecked = filteredLeads.length > 0 && filteredLeads.every((l) => selected.includes(l._id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition border border-white/5"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Contact Leads</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {filteredLeads.length} record{filteredLeads.length !== 1 ? "s" : ""}
              {selected.length > 0 && (
                <span className="ml-2 text-indigo-400">· {selected.length} selected</span>
              )}
            </p>
          </div>
        </div>

        {/* actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#141428] border border-white/5 rounded-xl pl-9 pr-4 py-2 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition w-48"
            />
          </div>

          {/* export */}
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[13px] font-medium transition shadow-lg shadow-indigo-500/20"
          >
            <FileDown size={15} />
            Export PDF
          </button>

          {/* bulk delete */}
          <AnimatePresence>
            {selected.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                onClick={deleteSelected}
                className="flex items-center gap-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-[13px] font-medium transition"
              >
                <Trash2 size={14} />
                Delete ({selected.length})
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── TABLE CARD ── */}
      <div className="bg-[#141428] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) =>
                      e.target.checked
                        ? setSelected(filteredLeads.map((l) => l._id))
                        : setSelected([])
                    }
                    className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer"
                  />
                </th>
                {["Name", "Company", "Phone", "Email", "Subject", "Message", "Status", "Action"].map((col) => (
                  <th key={col} className="px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-white/5 rounded-full animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <SlidersHorizontal size={28} className="text-slate-700" />
                      <p className="text-slate-500 text-sm">No contact leads found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredLeads.map((l, idx) => (
                    <motion.tr
                      key={l._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.025 }}
                      className={`border-t border-white/5 hover:bg-white/[0.02] transition-colors group
                        ${selected.includes(l._id) ? "bg-indigo-500/5" : ""}`}
                    >
                      {/* checkbox */}
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(l._id)}
                          onChange={(e) =>
                            e.target.checked
                              ? setSelected([...selected, l._id])
                              : setSelected(selected.filter((i) => i !== l._id))
                          }
                          className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* name */}
                      <td className="px-5 py-4 text-[13px] font-semibold text-white whitespace-nowrap">
                        {l.fullName}
                      </td>

                      {/* company */}
                      <td className="px-5 py-4 text-[13px] text-slate-400 whitespace-nowrap">
                        {l.companyName || <span className="text-slate-700">—</span>}
                      </td>

                      {/* phone */}
                      <td className="px-5 py-4 text-[13px] text-slate-400 tabular-nums whitespace-nowrap">
                        {l.phone}
                      </td>

                      {/* email */}
                      <td className="px-5 py-4 text-[13px] text-slate-400 whitespace-nowrap">
                        {l.email}
                      </td>

                      {/* subject */}
                      <td className="px-5 py-4 text-[13px] text-slate-300 max-w-[140px]">
                        <span className="truncate block">{l.subject}</span>
                      </td>

                      {/* message */}
                      <td className="px-5 py-4 text-[13px] text-slate-500 max-w-[180px]">
                        {l.message.split(" ").length > 3 ? (
                          <span>
                            {l.message.split(" ").slice(0, 3).join(" ")}…{" "}
                            <button
                              onClick={() => setShowMessage(l.message)}
                              className="text-indigo-400 hover:text-indigo-300 text-[11px] font-medium transition"
                            >
                              Read more
                            </button>
                          </span>
                        ) : (
                          l.message
                        )}
                      </td>

                      {/* status */}
                      <td className="px-5 py-4">
                        <select
                          value={l.status}
                          onChange={(e) => updateStatus(l._id, e.target.value)}
                          className={`appearance-none cursor-pointer px-3 py-1.5 rounded-full text-[11px] font-semibold border transition
                            focus:outline-none focus:ring-1 focus:ring-indigo-500/30 bg-transparent
                            ${statusConfig[l.status] || "bg-white/5 text-slate-400 border-white/10"}`}
                        >
                          <option value="Pending" className="bg-[#141428] text-amber-400">Pending</option>
                          <option value="Replied" className="bg-[#141428] text-emerald-400">Replied</option>
                          <option value="Closed"  className="bg-[#141428] text-slate-400">Closed</option>
                        </select>
                      </td>

                      {/* action */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setConfirmDelete(l._id)}
                          className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[#141428] border border-white/8 rounded-2xl p-6 w-80 shadow-2xl"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mb-4">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <h2 className="text-[15px] font-bold text-white mb-1">Delete lead?</h2>
              <p className="text-[13px] text-slate-500 mb-5">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[13px] text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { deleteLead(confirmDelete); setConfirmDelete(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold transition shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MESSAGE MODAL ── */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[#141428] border border-white/8 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative mx-4"
            >
              <button
                onClick={() => setShowMessage(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X size={15} />
              </button>
              <h2 className="text-[15px] font-bold text-white mb-4">Full Message</h2>
              <p className="text-[13px] text-slate-300 leading-relaxed">{showMessage}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ViewContactLeads;


// import { useEffect, useState } from "react";
// import API_BASE_URL from "../config/api";
// import toast from "react-hot-toast";
// import { ArrowLeft, Trash2, Search, FileDown, X } from "lucide-react";

// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// const ViewContactLeads = ({ goBack }) => {
//   const [leads, setLeads] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [selected, setSelected] = useState([]);
//   const [search, setSearch] = useState("");

//   const [confirmDelete, setConfirmDelete] = useState(null);
//   const [showMessage, setShowMessage] = useState(null);

//   const fetchLeads = async () => {
//     try {
//       setLoading(true);

//       const res = await fetch(`${API_BASE_URL}/contact-leads`);
//       const data = await res.json();

//       setLeads(data);
//     } catch {
//       toast.error("Failed to load contact leads");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchLeads();
//   }, []);

//   /* ---------------- STATUS UPDATE ---------------- */

//   const updateStatus = async (id, status) => {
//     try {
//       await fetch(`${API_BASE_URL}/contact-leads/${id}/status`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ status }),
//       });

//       setLeads((prev) =>
//         prev.map((l) => (l._id === id ? { ...l, status } : l)),
//       );

//       toast.success("Status updated");
//     } catch {
//       toast.error("Update failed");
//     }
//   };

//   /* ---------------- DELETE ---------------- */

//   const deleteLead = async (id) => {
//     try {
//       await fetch(`${API_BASE_URL}/contact-leads/${id}`, {
//         method: "DELETE",
//       });

//       setLeads((prev) => prev.filter((l) => l._id !== id));

//       toast.success("Lead deleted");
//     } catch {
//       toast.error("Delete failed");
//     }
//   };

//   /* ---------------- BULK DELETE ---------------- */

//   const deleteSelected = async () => {
//     try {
//       await Promise.all(
//         selected.map((id) =>
//           fetch(`${API_BASE_URL}/contact-leads/${id}`, {
//             method: "DELETE",
//           }),
//         ),
//       );

//       setLeads((prev) => prev.filter((l) => !selected.includes(l._id)));

//       setSelected([]);

//       toast.success("Selected leads deleted");
//     } catch {
//       toast.error("Bulk delete failed");
//     }
//   };

//   /* ---------------- EXPORT PDF ---------------- */

//   const exportPDF = () => {
//     const doc = new jsPDF();

//     doc.text("Contact Leads", 14, 15);

//     autoTable(doc, {
//       startY: 20,
//       head: [["Name", "Company", "Phone", "Email", "Subject", "Status"]],
//       body: leads.map((l) => [
//         l.fullName,
//         l.companyName,
//         l.phone,
//         l.email,
//         l.subject,
//         l.status,
//       ]),
//     });

//     doc.save("contact-leads.pdf");
//   };

//   /* ---------------- SEARCH FILTER ---------------- */

//   const filteredLeads = leads.filter((l) =>
//     `${l.fullName} ${l.email} ${l.companyName}`
//       .toLowerCase()
//       .includes(search.toLowerCase()),
//   );

//   /* ---------------- STATUS COLOR ---------------- */

//   const statusColor = (status) => {
//     if (status === "Pending") return "bg-yellow-100 text-yellow-700";

//     if (status === "Replied") return "bg-green-100 text-green-700";

//     if (status === "Closed") return "bg-gray-200 text-gray-700";

//     return "";
//   };

//   return (
//     <div className="bg-white rounded-xl shadow p-6">
//       {/* HEADER */}

//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center gap-3">
//           <button onClick={goBack}>
//             <ArrowLeft />
//           </button>

//           <h1 className="text-xl font-bold">Contact Leads ({leads.length})</h1>
//         </div>

//         <div className="flex gap-3">
//           {/* SEARCH */}

//           <div className="relative">
//             <Search
//               className="absolute left-3 top-2.5 text-gray-400"
//               size={16}
//             />

//             <input
//               type="text"
//               placeholder="Search leads..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="border rounded-lg pl-9 pr-3 py-2 text-sm"
//             />
//           </div>

//           {/* EXPORT */}

//           <button
//             onClick={exportPDF}
//             className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
//           >
//             <FileDown size={16} />
//             Export
//           </button>

//           {/* BULK DELETE */}

//           {selected.length > 0 && (
//             <button
//               onClick={deleteSelected}
//               className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm"
//             >
//               Delete Selected
//             </button>
//           )}
//         </div>
//       </div>

//       {/* TABLE */}

//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="p-3">
//                 <input
//                   type="checkbox"
//                   onChange={(e) =>
//                     e.target.checked
//                       ? setSelected(filteredLeads.map((l) => l._id))
//                       : setSelected([])
//                   }
//                 />
//               </th>

//               <th className="p-3">Name</th>
//               <th className="p-3">Company</th>
//               <th className="p-3">Phone</th>
//               <th className="p-3">Email</th>
//               <th className="p-3">Subject</th>
//               <th className="p-3">Message</th>
//               <th className="p-3">Status</th>
//               <th className="p-3">Action</th>
//             </tr>
//           </thead>

//           <tbody>
//             {loading && (
//               <tr>
//                 <td colSpan="9" className="text-center py-6">
//                   Loading leads...
//                 </td>
//               </tr>
//             )}

//             {!loading &&
//               filteredLeads.map((l) => (
//                 <tr key={l._id} className="border-t hover:bg-gray-50">
//                   <td className="p-3">
//                     <input
//                       type="checkbox"
//                       checked={selected.includes(l._id)}
//                       onChange={(e) =>
//                         e.target.checked
//                           ? setSelected([...selected, l._id])
//                           : setSelected(selected.filter((i) => i !== l._id))
//                       }
//                     />
//                   </td>

//                   <td className="p-3 font-medium">{l.fullName}</td>

//                   <td className="p-3">{l.companyName}</td>

//                   <td className="p-3">{l.phone}</td>

//                   <td className="p-3">{l.email}</td>

//                   <td className="p-3">{l.subject}</td>

//                   {/* MESSAGE */}

//                   <td className="p-3 max-w-[220px]">
//                     {l.message.split(" ").length > 3 ? (
//                       <>
//                         {l.message.split(" ").slice(0, 3).join(" ")}...
//                         <button
//                           onClick={() => setShowMessage(l.message)}
//                           className="text-blue-600 ml-1 text-xs"
//                         >
//                           Read more
//                         </button>
//                       </>
//                     ) : (
//                       l.message
//                     )}
//                   </td>

//                   {/* STATUS */}

//                   <td className="p-3">
//                     <select
//                       value={l.status}
//                       onChange={(e) => updateStatus(l._id, e.target.value)}
//                       className={`px-2 py-1 rounded text-xs ${statusColor(
//                         l.status,
//                       )}`}
//                     >
//                       <option>Pending</option>
//                       <option>Replied</option>
//                       <option>Closed</option>
//                     </select>
//                   </td>

//                   {/* ACTION */}

//                   <td className="p-3">
//                     <button
//                       onClick={() => setConfirmDelete(l._id)}
//                       className="text-red-500"
//                     >
//                       <Trash2 size={18} />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//           </tbody>
//         </table>
//       </div>

//       {/* DELETE CONFIRMATION */}

//       {confirmDelete && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
//           <div className="bg-white p-6 rounded-xl shadow-lg">
//             <h2 className="text-lg font-semibold mb-4">Delete this lead?</h2>

//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setConfirmDelete(null)}
//                 className="px-4 py-2 border rounded"
//               >
//                 Cancel
//               </button>

//               <button
//                 onClick={() => {
//                   deleteLead(confirmDelete);
//                   setConfirmDelete(null);
//                 }}
//                 className="px-4 py-2 bg-red-500 text-white rounded"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* MESSAGE MODAL */}

//       {showMessage && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
//           <div className="bg-white max-w-lg w-full p-6 rounded-xl shadow-lg relative">
//             <button
//               onClick={() => setShowMessage(null)}
//               className="absolute top-3 right-3"
//             >
//               <X />
//             </button>

//             <h2 className="font-semibold mb-3">Full Message</h2>

//             <p className="text-gray-700">{showMessage}</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ViewContactLeads;
