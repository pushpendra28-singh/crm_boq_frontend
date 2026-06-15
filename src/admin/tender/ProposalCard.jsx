import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, Check, FileDown } from "lucide-react";

/* Very lightweight markdown renderer — no extra deps needed */
const renderMarkdown = (text) => {
  const lines = text.split("\n");
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^## (.+)/.test(line)) {
      elements.push(
        <h2 key={key++} className="text-[14px] font-bold text-gray-800 mt-5 mb-2 pb-1.5 border-b border-gray-100">
          {line.replace(/^## /, "")}
        </h2>
      );
    } else if (/^# (.+)/.test(line)) {
      elements.push(
        <h1 key={key++} className="text-[16px] font-black text-gray-900 mt-4 mb-2">
          {line.replace(/^# /, "")}
        </h1>
      );
    } else if (/^\* (.+)/.test(line) || /^- (.+)/.test(line)) {
      elements.push(
        <li key={key++} className="text-[12.5px] text-gray-600 ml-4 mb-1 list-disc leading-relaxed">
          {line.replace(/^[\*\-] /, "")}
        </li>
      );
    } else if (/^\d+\. (.+)/.test(line)) {
      elements.push(
        <li key={key++} className="text-[12.5px] text-gray-600 ml-4 mb-1 list-decimal leading-relaxed">
          {line.replace(/^\d+\. /, "")}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1" />);
    } else {
      // Bold inline
      const parts = line.split(/\*\*(.+?)\*\*/g);
      elements.push(
        <p key={key++} className="text-[12.5px] text-gray-600 mb-1 leading-relaxed">
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

const ProposalCard = ({ proposal }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([proposal], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposal_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-[80%] bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-green-500" />
          <span className="text-[13px] font-bold text-green-700">Proposal Generated</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:bg-white hover:text-gray-700 transition border border-transparent hover:border-gray-200"
          >
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:bg-white hover:text-gray-700 transition border border-transparent hover:border-gray-200"
          >
            <FileDown size={12} />
            Download
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 max-h-[420px] overflow-y-auto">
        {renderMarkdown(proposal)}
      </div>
    </motion.div>
  );
};

export default ProposalCard;