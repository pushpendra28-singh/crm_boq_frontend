import { useState } from "react";
import { motion } from "framer-motion";
import { FilePlus, FolderOpen } from "lucide-react";
import CreateTender from "./CreateTender";
import ViewTenders from "./ViewTenders";

const TenderManagement = () => {
  const [view, setView] = useState("home");

  if (view === "create") return <CreateTender onBack={() => setView("home")} />;
  if (view === "list")   return <ViewTenders  onBack={() => setView("home")} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-black text-gray-800">Tender Management</h2>
        <p className="text-gray-400 text-sm mt-1">
          Create AI-powered requirement proposals or track existing ones.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
        <motion.button
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("create")}
          className="group relative flex flex-col items-start p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-400 hover:bg-green-50/30 transition-all text-left overflow-hidden"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 group-hover:bg-green-200 flex items-center justify-center mb-4 transition-colors">
            <FilePlus size={22} className="text-green-600" />
          </div>
          <h3 className="text-[15px] font-bold text-gray-800 mb-1">Create Requirement / Proposal</h3>
          <p className="text-[12px] text-gray-400 leading-relaxed">
            Use the AI assistant to generate a professional tender proposal — answer questions or provide a document.
          </p>
        </motion.button>

        <motion.button
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("list")}
          className="group relative flex flex-col items-start p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-left overflow-hidden"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center mb-4 transition-colors">
            <FolderOpen size={22} className="text-indigo-600" />
          </div>
          <h3 className="text-[15px] font-bold text-gray-800 mb-1">View All Proposals</h3>
          <p className="text-[12px] text-gray-400 leading-relaxed">
            Browse all tenders and track the status of each requirement or proposal.
          </p>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TenderManagement;