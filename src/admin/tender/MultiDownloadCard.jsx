/**
 * MultiDownloadCard.jsx
 * Drop-in replacement — same props interface as before.
 * Adds: per-button error handling, disabled guard on done state,
 * try/catch so a failed download doesn't leave the button stuck spinning.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { FileDown, FileSpreadsheet, CheckCircle2, Loader2 } from "lucide-react";

const MultiDownloadCard = ({ sessionId, onDownloadDocx, onDownloadXlsx }) => {
  const [loadingDocx, setLoadingDocx] = useState(false);
  const [loadingXlsx, setLoadingXlsx] = useState(false);
  const [doneDocx,    setDoneDocx]    = useState(false);
  const [doneXlsx,    setDoneXlsx]    = useState(false);
  const [errorDocx,   setErrorDocx]   = useState(null);
  const [errorXlsx,   setErrorXlsx]   = useState(null);

  const handleDocx = async () => {
    if (loadingDocx || doneDocx) return;   // guard: ignore if already in-flight or done
    setLoadingDocx(true);
    setErrorDocx(null);
    try {
      await onDownloadDocx(sessionId);
      setDoneDocx(true);
    } catch {
      setErrorDocx("Download failed — please try again.");
    } finally {
      setLoadingDocx(false);
    }
  };

  const handleXlsx = async () => {
    if (loadingXlsx || doneXlsx) return;
    setLoadingXlsx(true);
    setErrorXlsx(null);
    try {
      await onDownloadXlsx(sessionId);
      setDoneXlsx(true);
    } catch {
      setErrorXlsx("Download failed — please try again.");
    } finally {
      setLoadingXlsx(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm max-w-[75%]"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
        <p className="text-[13px] font-semibold text-gray-800">
          Multi-Work BOQ is ready! Choose your format:
        </p>
      </div>

      <div className="space-y-2">
        {/* ── Word Document ── */}
        <motion.button
          whileHover={{ x: doneDocx ? 0 : 2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleDocx}
          disabled={loadingDocx || doneDocx}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all text-left
            ${doneDocx
              ? "border-green-300 bg-green-50 text-green-700 cursor-default opacity-80"
              : "border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100 text-green-700"
            }`}
        >
          <div className="w-9 h-9 rounded-lg bg-green-200 flex items-center justify-center flex-shrink-0">
            {loadingDocx
              ? <Loader2 size={15} className="animate-spin" />
              : doneDocx
                ? <CheckCircle2 size={15} />
                : <FileDown size={15} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold">
              {doneDocx ? "Word Document Downloaded ✓" : "Download Word Document (.docx)"}
            </p>
            <p className="text-[11px] opacity-70 mt-0.5">
              {doneDocx
                ? "Check your downloads folder"
                : "Professional BOQ with all works, specs & terms — ideal for vendors"}
            </p>
          </div>
        </motion.button>
        {errorDocx && (
          <p className="text-[11px] text-red-500 pl-1">⚠ {errorDocx}</p>
        )}

        {/* ── Excel Spreadsheet ── */}
        <motion.button
          whileHover={{ x: doneXlsx ? 0 : 2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleXlsx}
          disabled={loadingXlsx || doneXlsx}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all text-left
            ${doneXlsx
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 cursor-default opacity-80"
              : "border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100 text-emerald-700"
            }`}
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-200 flex items-center justify-center flex-shrink-0">
            {loadingXlsx
              ? <Loader2 size={15} className="animate-spin" />
              : doneXlsx
                ? <CheckCircle2 size={15} />
                : <FileSpreadsheet size={15} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold">
              {doneXlsx ? "Excel Spreadsheet Downloaded ✓" : "Download Excel Spreadsheet (.xlsx)"}
            </p>
            <p className="text-[11px] opacity-70 mt-0.5">
              {doneXlsx
                ? "Check your downloads folder"
                : "Each work on its own sheet · auto-calculated amounts · summary tab"}
            </p>
          </div>
        </motion.button>
        {errorXlsx && (
          <p className="text-[11px] text-red-500 pl-1">⚠ {errorXlsx}</p>
        )}
      </div>

      <p className="text-[11px] text-gray-400 mt-3 text-center">
        You can download both formats — they contain the same data.
      </p>
    </motion.div>
  );
};

export default MultiDownloadCard;