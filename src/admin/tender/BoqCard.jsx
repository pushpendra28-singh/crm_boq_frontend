import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, FileDown, Copy, Check,
  ChevronDown, ChevronUp, FileText,
} from "lucide-react";

/* ── Lightweight markdown renderer (same as before, slightly enhanced) ── */
const renderMarkdown = (text) => {
  const lines    = text.split("\n");
  const elements = [];
  let key        = 0;

  for (const line of lines) {
    if (/^## (.+)/.test(line)) {
      elements.push(
        <div key={key++} className="mt-4 mb-2 pb-1 border-b border-green-100">
          <span className="text-[13px] font-bold text-green-800">
            {line.replace(/^## /, "")}
          </span>
        </div>
      );
    } else if (/^# (.+)/.test(line)) {
      elements.push(
        <p key={key++} className="text-[14px] font-black text-gray-900 mt-3 mb-1">
          {line.replace(/^# /, "")}
        </p>
      );
    } else if (/^\*\*(.+)\*\*$/.test(line.trim())) {
      elements.push(
        <p key={key++} className="text-[12px] font-bold text-gray-700 mt-2">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    } else if (/^[-*] /.test(line)) {
      elements.push(
        <div key={key++} className="flex gap-2 ml-3 my-0.5">
          <span className="text-green-500 text-[11px] mt-0.5 flex-shrink-0">●</span>
          <span className="text-[12px] text-gray-600 leading-relaxed">
            {line.replace(/^[-*] /, "")}
          </span>
        </div>
      );
    } else if (/^\d+\. /.test(line)) {
      const num  = line.match(/^(\d+)\./)?.[1];
      const rest = line.replace(/^\d+\.\s*/, "");
      elements.push(
        <div key={key++} className="flex gap-2 ml-3 my-0.5">
          <span className="text-green-600 text-[12px] font-bold flex-shrink-0 w-4">{num}.</span>
          <span className="text-[12px] text-gray-600 leading-relaxed">{rest}</span>
        </div>
      );
    } else if (/\|/.test(line) && !/^[\|\s\-]+$/.test(line)) {
      // Table row
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      elements.push(
        <div key={key++} className="grid gap-px my-0.5" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
          {cells.map((cell, ci) => (
            <span
              key={ci}
              className="text-[11px] text-gray-600 px-2 py-1 bg-gray-50 border border-gray-100 leading-relaxed"
            >
              {cell}
            </span>
          ))}
        </div>
      );
    } else if (line.trim() === "" || /^[\|\s\-]+$/.test(line)) {
      elements.push(<div key={key++} className="h-1" />);
    } else {
      const parts = line.split(/\*\*(.+?)\*\*/g);
      elements.push(
        <p key={key++} className="text-[12px] text-gray-600 leading-relaxed my-0.5">
          {parts.map((part, pi) =>
            pi % 2 === 1
              ? <strong key={pi} className="font-semibold text-gray-800">{part}</strong>
              : part
          )}
        </p>
      );
    }
  }
  return elements;
};

/* ── BOQ Card ── */
const BOQCard = ({ proposal, tenderId, onDownload }) => {
  const [copied,    setCopied]    = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    await onDownload(tenderId);
    setDownloading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-[82%] overflow-hidden rounded-2xl border border-green-200 shadow-sm bg-white"
    >
      {/* ── Card header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <FileText size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none">BOQ Generated</p>
            <p className="text-[10px] text-green-200 mt-0.5">Bill of Quantities & Requirements Document</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>

          {/* Download DOCX */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white text-green-700 hover:bg-green-50 transition disabled:opacity-60"
          >
            <FileDown size={12} />
            {downloading ? "Preparing…" : "Download .xlsx"}
          </button>
        </div>
      </div>

      {/* ── Success banner ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border-b border-green-100">
        <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
        <p className="text-[12px] text-green-700 font-medium">
          Your BOQ is ready. Download the Excel document to share with vendors.
        </p>
      </div>

      {/* ── Preview ── */}
      <div className={`px-4 py-4 overflow-y-auto transition-all ${expanded ? "max-h-[520px]" : "max-h-[220px]"}`}>
        {renderMarkdown(proposal)}
      </div>

      {/* ── Expand toggle ── */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-gray-400 hover:text-gray-600 border-t border-gray-100 hover:bg-gray-50 transition"
      >
        {expanded ? <><ChevronUp size={13} /> Collapse preview</> : <><ChevronDown size={13} /> Expand full preview</>}
      </button>
    </motion.div>
  );
};

export default BOQCard;