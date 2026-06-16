import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sparkles, FileUp, PenLine, Send, User,
  Paperclip, ChevronRight, CheckCircle2, AlertCircle,
  RefreshCw, Loader2, TableProperties,
} from "lucide-react";
import { useTenderChat } from "./UseTenderChat";
import BOQCard from "./BoqCard";
import VendorSelector from "./VendorSelector";

/* ── Typing dots ── */
const TypingDots = () => (
  <div className="flex items-center gap-1 px-1 py-1">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-green-400"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.55, delay: i * 0.13, repeat: Infinity }}
      />
    ))}
  </div>
);

const BotAvatar = () => (
  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-sm">
    <Sparkles size={13} className="text-white" />
  </div>
);

/* ── Chat Bubble ── */
const Bubble = ({ msg, downloadXlsx, handleSendOption, handleVendorDone }) => {
  const isBot = msg.role === "bot";

  if (isBot && msg.text === "__boq__") {
    return (
      <div className="flex gap-3 justify-start">
        <BotAvatar />
        <BOQCard
          proposal={msg.proposal}
          tenderId={msg.tenderId}
          onDownload={downloadXlsx}
        />
      </div>
    );
  }

  if (isBot && msg.text === "__send_options__") {
    return (
      <div className="flex gap-3 justify-start">
        <BotAvatar />
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm max-w-[72%]"
        >
          <p className="text-[13px] text-gray-700 mb-3 font-medium">
            Your BOQ is ready. What would you like to do next?
          </p>
          <div className="space-y-2">
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSendOption("generated", msg.tenderId)}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100 text-green-700 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-green-200 flex items-center justify-center flex-shrink-0">
                <Send size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold">Send this proposal to vendors</p>
                <p className="text-[11px] opacity-70 mt-0.5">Dispatch the generated BOQ to registered vendors</p>
              </div>
              <ChevronRight size={14} className="opacity-40 flex-shrink-0" />
            </motion.button>

            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSendOption("custom", msg.tenderId)}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:border-indigo-400 hover:bg-indigo-100 text-indigo-700 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-200 flex items-center justify-center flex-shrink-0">
                <FileUp size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold">Send a different document</p>
                <p className="text-[11px] opacity-70 mt-0.5">Upload and send your own file to vendors</p>
              </div>
              <ChevronRight size={14} className="opacity-40 flex-shrink-0" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isBot && msg.text === "__vendor_selector__") {
    return (
      <div className="flex gap-3 justify-start">
        <BotAvatar />
        <VendorSelector tenderId={msg.tenderId} docType={msg.docType} onDone={handleVendorDone} />
      </div>
    );
  }

  if (isBot && msg.text === "__generating__") {
    return (
      <div className="flex gap-3 justify-start">
        <BotAvatar />
        <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-[12.5px] text-gray-500">
          <Loader2 size={13} className="animate-spin text-green-500" />
          Generating your multi-work BOQ Excel…
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"}`}
    >
      {isBot && <BotAvatar />}
      <div
        className={`relative max-w-[72%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm
          ${isBot
            ? "bg-white border border-gray-100 text-gray-700 rounded-tl-sm"
            : "bg-green-500 text-white rounded-tr-sm"
          }`}
      >
        {msg.options ? (
          <div className="space-y-2">
            <p className="mb-3 text-gray-700">{msg.text}</p>
            {msg.options.map((opt) => (
              <motion.button
                key={opt.key}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => opt.onSelect(opt.key)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all text-left
                  ${opt.key === "manual"
                    ? "border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100 text-green-700"
                    : "border-indigo-200 bg-indigo-50 hover:border-indigo-400 hover:bg-indigo-100 text-indigo-700"
                  }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                  ${opt.key === "manual" ? "bg-green-200" : "bg-indigo-200"}`}>
                  {opt.key === "manual" ? <PenLine size={16} /> : <FileUp size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold">{opt.label}</p>
                  <p className="text-[11px] opacity-70 mt-0.5">{opt.description}</p>
                </div>
                <ChevronRight size={14} className="opacity-40 flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {msg.text?.split("\n").map((line, i) => {
              if (/^\d+\.\s/.test(line)) {
                return (
                  <p key={i} className="text-[13px] leading-relaxed">
                    <span className="font-semibold text-green-700 mr-1">{line.match(/^\d+/)?.[0]}.</span>
                    {line.replace(/^\d+\.\s*/, "")}
                  </p>
                );
              }
              return <p key={i} className="text-[13px] leading-relaxed whitespace-pre-wrap">{line}</p>;
            })}
          </div>
        )}
        {msg.file && (
          <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/20 border border-white/30 text-[11px]">
            <Paperclip size={11} />
            <span className="truncate max-w-[180px]">{msg.file}</span>
          </div>
        )}
      </div>
      {!isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User size={13} className="text-gray-500" />
        </div>
      )}
    </motion.div>
  );
};

/* ── Doc upload panel ── */
const DocUploadPanel = ({ onSubmit, onCancel, disabled }) => {
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [dragging, setDragging] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3"
    >
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current.click()}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all
          ${file ? "border-green-300 bg-green-50" : dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-300 bg-white hover:border-gray-400"}`}
      >
        {file ? (
          <>
            <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
            <span className="text-[12.5px] font-medium text-green-700 truncate flex-1">{file.name}</span>
            <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-[11px] text-gray-400 hover:text-red-400">Remove</button>
          </>
        ) : (
          <>
            <FileUp size={16} className="text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[12.5px] font-medium text-gray-600">{dragging ? "Drop it here!" : "Attach your requirements document"}</p>
              <p className="text-[11px] text-gray-400">PDF, DOC, DOCX, TXT · optional</p>
            </div>
          </>
        )}
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setFile(e.target.files[0])} />
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your project & all work areas — e.g. 'Office renovation 5000 sq ft with electrical, CCTV, flooring, furniture, networking & painting. Budget ₹80L, 3 months timeline.'"
          rows={3}
          className="flex-1 resize-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors leading-relaxed"
        />
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => prompt.trim() && !disabled && onSubmit(prompt, file)}
          disabled={!prompt.trim() || disabled}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all
            ${prompt.trim() && !disabled ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
        >
          {disabled ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </motion.button>
      </div>
      <button onClick={onCancel} className="text-[11px] text-gray-400 hover:text-gray-600 transition w-full text-center">← Go back</button>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
const CreateTender = ({ onBack }) => {
  const {
    messages, typing, phase, error,
    startChat, sendMessage, sendDocPrompt,
    pushBot, reset, downloadXlsx,
    handleSendOption, handleVendorDone,
  } = useTenderChat();

  const [input, setInput] = useState("");
  const [modeChosen, setModeChosen] = useState(false);
  const bottomRef = useRef();
  const initializedRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleModeSelect = async (key) => {
    setModeChosen(true);
    if (key === "manual") {
      await startChat();
    } else {
      pushBot(
        "Got it! Describe your project and ALL work areas needed (e.g. electrical, CCTV, flooring, furniture, plumbing, civil, networking, etc.). You can also attach a reference document. I'll generate a complete multi-work BOQ in Excel. 📊"
      );
    }
  };

  // Greeting — only 2 options now
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    pushBot("👋 Hi! I'll help you create a detailed multi-work BOQ (Bill of Quantities) in Excel covering all your project work areas — electrical, CCTV, flooring, civil, furniture, and more.");
    setTimeout(() => {
      pushBot("How would you like to proceed?", {
        options: [
          {
            key: "manual",
            label: "Answer a few quick questions",
            description: "I ask 2 smart question rounds — complete multi-work Excel BOQ ready in minutes.",
            onSelect: handleModeSelect,
          },
          {
            key: "upload",
            label: "Describe directly / Upload document",
            description: "Describe all work areas or attach an existing requirements doc.",
            onSelect: handleModeSelect,
          },
        ],
      });
    }, 600);
  });

  const resolvedMessages = messages.map((m, i) =>
    m.options && modeChosen && i < messages.length - 1
      ? { ...m, options: undefined }
      : m
  );

  const handleSend = () => {
    const val = input.trim();
    if (!val) return;
    setInput("");
    sendMessage(val);
  };

  const docFlowActive =
    modeChosen &&
    phase !== "chatting" &&
    phase !== "generating" &&
    phase !== "done" &&
    phase !== "sending" &&
    messages.some(m => m.text?.includes("Describe your project"));

  const answeredCount = messages.filter(m => m.role === "user" && modeChosen).length;
  const progress =
    phase === "chatting" ? Math.min(Math.round((answeredCount / 4) * 100), 90)
    : phase === "done" ? 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-[calc(100vh-130px)] max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-sm">
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-gray-800 leading-none">BOQ Assistant</p>
            <p className="text-[11px] text-green-500 mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              AI-powered · Multi-work Excel BOQ
            </p>
          </div>
        </div>

        {phase === "chatting" && (
          <div className="ml-auto hidden sm:flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5">
            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="text-[10px] font-semibold text-gray-500 tabular-nums">Round {answeredCount}/2</span>
          </div>
        )}

        {phase === "done" && (
          <>
            <div className="ml-auto flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
              <CheckCircle2 size={12} className="text-green-500" />
              <span className="text-[11px] font-semibold text-green-600">BOQ Ready</span>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition"
            >
              <RefreshCw size={11} /> New
            </button>
          </>
        )}
      </div>

      {/* Chat window */}
      <div className="relative flex-1 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 rounded-2xl z-0 pointer-events-none" style={{ padding: "2px", background: "transparent" }}>
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: "conic-gradient(from var(--angle, 0deg), transparent 0deg, transparent 240deg, #4ade80 265deg, #86efac 272deg, #ffffff 278deg, #86efac 285deg, #4ade80 292deg, transparent 310deg, transparent 360deg)",
              animation: "borderSpin 1.5s linear infinite",
              borderRadius: "inherit",
            }}
          />
        </div>
        <div className="absolute inset-[2px] bg-white rounded-[14px] z-[1]" />
        <div className="relative z-[2] flex-1 overflow-hidden flex flex-col h-full shadow-sm">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <AnimatePresence initial={false}>
              {resolvedMessages.map((msg, i) => (
                <Bubble
                  key={i}
                  msg={msg}
                  downloadXlsx={downloadXlsx}
                  handleSendOption={handleSendOption}
                  handleVendorDone={handleVendorDone}
                />
              ))}
            </AnimatePresence>

            {typing && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3 justify-start">
                <BotAvatar />
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <TypingDots />
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-[12px] text-red-600">
                <AlertCircle size={13} /> {error}
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <AnimatePresence>
          {docFlowActive && (
            <DocUploadPanel
              onSubmit={sendDocPrompt}
              onCancel={() => {
                reset();
                setTimeout(() => {
                  initializedRef.current = false;
                  pushBot("👋 Hi! Let's create your multi-work BOQ. How would you like to proceed?");
                  pushBot("How would you like to proceed?", {
                    options: [
                      {
                        key: "manual",
                        label: "Answer a few quick questions",
                        description: "2 smart question rounds — Excel BOQ ready in minutes.",
                        onSelect: handleModeSelect,
                      },
                      {
                        key: "upload",
                        label: "Describe directly / Upload document",
                        description: "Describe all work areas or attach a requirements doc.",
                        onSelect: handleModeSelect,
                      },
                    ],
                  });
                }, 100);
              }}
              disabled={typing || phase === "generating"}
            />
          )}
        </AnimatePresence>

        {phase === "chatting" && (
          <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-4 py-2.5 focus-within:border-green-400 focus-within:bg-white transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type your answer…"
                autoFocus
                className="flex-1 bg-transparent text-[13px] text-gray-700 placeholder-gray-400 outline-none"
              />
              <motion.button
                whileTap={{ scale: 0.91 }}
                onClick={handleSend}
                disabled={!input.trim() || typing}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0
                  ${input.trim() && !typing ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
              >
                {typing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </motion.button>
            </div>
          </div>
        )}

        {(phase === "done" || phase === "sending") && (
          <div className="flex-shrink-0 border-t border-gray-100 px-4 py-2.5 flex items-center gap-2 bg-green-50/60">
            <TableProperties size={13} className="text-green-500" />
            <p className="text-[11.5px] text-green-600 font-medium">
              Multi-work BOQ saved — download the Excel file above. Each work category has its own sheet with auto-calculated amounts.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CreateTender;




// import { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   ArrowLeft,
//   Sparkles,
//   FileUp,
//   PenLine,
//   Send,
//   User,
//   Paperclip,
//   ChevronRight,
//   CheckCircle2,
//   AlertCircle,
//   RefreshCw,
//   Loader2,
// } from "lucide-react";
// import { useTenderChat } from "./UseTenderChat";
// import BOQCard from "./BoqCard";
// import VendorSelector from "./VendorSelector";
// import { UseTenderChatMulti } from "./UseTenderChatMulti";
// import MultiDownloadCard from "./MultiDownloadCard";

// /* ── Typing dots ── */
// const TypingDots = () => (
//   <div className="flex items-center gap-1 px-1 py-1">
//     {[0, 1, 2].map((i) => (
//       <motion.span
//         key={i}
//         className="w-1.5 h-1.5 rounded-full bg-green-400"
//         animate={{ y: [0, -4, 0] }}
//         transition={{ duration: 0.55, delay: i * 0.13, repeat: Infinity }}
//       />
//     ))}
//   </div>
// );

// const BotAvatar = () => (
//   <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-sm">
//     <Sparkles size={13} className="text-white" />
//   </div>
// );

// /* ── Chat Bubble ── */

// const Bubble = ({
//   msg,
//   downloadDocx,
//   downloadXlsx,
//   handleSendOption,       
//   handleVendorDone,
// }) => {
//   const isBot = msg.role === "bot";

//   if (isBot && msg.text === "__boq__") {
//     return (
//       <div className="flex gap-3 justify-start">
//         <BotAvatar />
//         <BOQCard
//           proposal={msg.proposal}
//           tenderId={msg.tenderId}
//           onDownload={downloadDocx}
//         />
//       </div>
//     );
//   }

//   if (isBot && msg.text === "__multi_download__") {
//     return (
//       <div className="flex gap-3 justify-start">
//         <BotAvatar />
//         <MultiDownloadCard
//           sessionId={msg.sessionId}
//           onDownloadDocx={downloadDocx}
//           onDownloadXlsx={downloadXlsx}
//         />
//       </div>
//     );
//   }

//   // ── Send options: shown after BOQ is ready ──
//   if (isBot && msg.text === "__send_options__") {
//     return (
//       <div className="flex gap-3 justify-start">
//         <BotAvatar />
//         <motion.div
//           initial={{ opacity: 0, y: 6 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm max-w-[72%]"
//         >
//           <p className="text-[13px] text-gray-700 mb-3 font-medium">
//             Your BOQ is ready. What would you like to do next?
//           </p>
//           <div className="space-y-2">
//             <motion.button
//               whileHover={{ x: 2 }}
//               whileTap={{ scale: 0.97 }}
//               onClick={() => handleSendOption("generated", msg.tenderId)}
//               className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100 text-green-700 transition-all text-left"
//             >
//               <div className="w-9 h-9 rounded-lg bg-green-200 flex items-center justify-center flex-shrink-0">
//                 <Send size={15} />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="text-[13px] font-semibold">
//                   Send this proposal to vendors
//                 </p>
//                 <p className="text-[11px] opacity-70 mt-0.5">
//                   Dispatch the generated BOQ to registered vendors
//                 </p>
//               </div>
//               <ChevronRight size={14} className="opacity-40 flex-shrink-0" />
//             </motion.button>

//             <motion.button
//               whileHover={{ x: 2 }}
//               whileTap={{ scale: 0.97 }}
//               onClick={() => handleSendOption("custom", msg.tenderId)}
//               className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:border-indigo-400 hover:bg-indigo-100 text-indigo-700 transition-all text-left"
//             >
//               <div className="w-9 h-9 rounded-lg bg-indigo-200 flex items-center justify-center flex-shrink-0">
//                 <FileUp size={15} />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="text-[13px] font-semibold">
//                   Send a different document
//                 </p>
//                 <p className="text-[11px] opacity-70 mt-0.5">
//                   Upload and send your own file to vendors
//                 </p>
//               </div>
//               <ChevronRight size={14} className="opacity-40 flex-shrink-0" />
//             </motion.button>
//           </div>
//         </motion.div>
//       </div>
//     );
//   }

//   // ── Vendor selector: shown after user picks a send option ──
//   if (isBot && msg.text === "__vendor_selector__") {
//     return (
//       <div className="flex gap-3 justify-start">
//         <BotAvatar />
//         <VendorSelector
//           tenderId={msg.tenderId}
//           docType={msg.docType}
//           onDone={handleVendorDone}
//         />
//       </div>
//     );
//   }

//   if (isBot && msg.text === "__generating__") {
//     return (
//       <div className="flex gap-3 justify-start">
//         <BotAvatar />
//         <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-[12.5px] text-gray-500">
//           <Loader2 size={13} className="animate-spin text-green-500" />
//           Generating your BOQ document…
//         </div>
//       </div>
//     );
//   }

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 7 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.22 }}
//       className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"}`}
//     >
//       {isBot && <BotAvatar />}

//       <div
//         className={`relative max-w-[72%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm
//           ${
//             isBot
//               ? "bg-white border border-gray-100 text-gray-700 rounded-tl-sm"
//               : "bg-green-500 text-white rounded-tr-sm"
//           }`}
//       >
//         {msg.options ? (
//           <div className="space-y-2">
//             <p className="mb-3 text-gray-700">{msg.text}</p>
//             {msg.options.map((opt) => (
//               <motion.button
//                 key={opt.key}
//                 whileHover={{ x: 2 }}
//                 whileTap={{ scale: 0.97 }}
//                 onClick={() => opt.onSelect(opt.key)}
//                 className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all text-left
//                   ${
//                     opt.key === "manual"
//                       ? "border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100 text-green-700"
//                       : "border-indigo-200 bg-indigo-50 hover:border-indigo-400 hover:bg-indigo-100 text-indigo-700"
//                   }`}
//               >
//                 <div
//                   className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
//                   ${opt.key === "manual" ? "bg-green-200" : "bg-indigo-200"}`}
//                 >
//                   {opt.key === "manual" ? (
//                     <PenLine size={16} />
//                   ) : (
//                     <FileUp size={16} />
//                   )}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-[13px] font-semibold">{opt.label}</p>
//                   <p className="text-[11px] opacity-70 mt-0.5">
//                     {opt.description}
//                   </p>
//                 </div>
//                 <ChevronRight size={14} className="opacity-40 flex-shrink-0" />
//               </motion.button>
//             ))}
//           </div>
//         ) : (
//           /* Render numbered/bulleted lists nicely inside bubble */
//           <div className="space-y-1">
//             {msg.text?.split("\n").map((line, i) => {
//               if (/^\d+\.\s/.test(line)) {
//                 return (
//                   <p key={i} className="text-[13px] leading-relaxed">
//                     <span className="font-semibold text-green-700 mr-1">
//                       {line.match(/^\d+/)?.[0]}.
//                     </span>
//                     {line.replace(/^\d+\.\s*/, "")}
//                   </p>
//                 );
//               }
//               return (
//                 <p
//                   key={i}
//                   className="text-[13px] leading-relaxed whitespace-pre-wrap"
//                 >
//                   {line}
//                 </p>
//               );
//             })}
//           </div>
//         )}

//         {msg.file && (
//           <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/20 border border-white/30 text-[11px]">
//             <Paperclip size={11} />
//             <span className="truncate max-w-[180px]">{msg.file}</span>
//           </div>
//         )}
//       </div>

//       {!isBot && (
//         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
//           <User size={13} className="text-gray-500" />
//         </div>
//       )}
//     </motion.div>
//   );
// };

// /* ── Doc upload panel ── */
// const DocUploadPanel = ({ onSubmit, onCancel, disabled }) => {
//   const fileRef = useRef();
//   const [file, setFile] = useState(null);
//   const [prompt, setPrompt] = useState("");
//   const [dragging, setDragging] = useState(false);

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 8 }}
//       animate={{ opacity: 1, y: 0 }}
//       exit={{ opacity: 0, y: 8 }}
//       className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3"
//     >
//       {/* Drop zone */}
//       <div
//         onDragOver={(e) => {
//           e.preventDefault();
//           setDragging(true);
//         }}
//         onDragLeave={() => setDragging(false)}
//         onDrop={(e) => {
//           e.preventDefault();
//           setDragging(false);
//           setFile(e.dataTransfer.files[0]);
//         }}
//         onClick={() => fileRef.current.click()}
//         className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all
//           ${file ? "border-green-300 bg-green-50" : dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-300 bg-white hover:border-gray-400"}`}
//       >
//         {file ? (
//           <>
//             <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
//             <span className="text-[12.5px] font-medium text-green-700 truncate flex-1">
//               {file.name}
//             </span>
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setFile(null);
//               }}
//               className="text-[11px] text-gray-400 hover:text-red-400"
//             >
//               Remove
//             </button>
//           </>
//         ) : (
//           <>
//             <FileUp size={16} className="text-gray-400 flex-shrink-0" />
//             <div>
//               <p className="text-[12.5px] font-medium text-gray-600">
//                 {dragging
//                   ? "Drop it here!"
//                   : "Attach your requirements document"}
//               </p>
//               <p className="text-[11px] text-gray-400">
//                 PDF, DOC, DOCX, TXT · optional
//               </p>
//             </div>
//           </>
//         )}
//         <input
//           ref={fileRef}
//           type="file"
//           className="hidden"
//           accept=".pdf,.doc,.docx,.txt"
//           onChange={(e) => setFile(e.target.files[0])}
//         />
//       </div>

//       {/* Prompt */}
//       <div className="flex items-end gap-2">
//         <textarea
//           value={prompt}
//           onChange={(e) => setPrompt(e.target.value)}
//           placeholder="Describe your requirement — e.g. 'Office interior for 3000 sq ft, modern design, budget ₹40L, completion in 3 months'"
//           rows={3}
//           className="flex-1 resize-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors leading-relaxed"
//         />
//         <motion.button
//           whileTap={{ scale: 0.93 }}
//           onClick={() => prompt.trim() && !disabled && onSubmit(prompt, file)}
//           disabled={!prompt.trim() || disabled}
//           className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all
//             ${prompt.trim() && !disabled ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
//         >
//           {disabled ? (
//             <Loader2 size={15} className="animate-spin" />
//           ) : (
//             <Send size={15} />
//           )}
//         </motion.button>
//       </div>

//       <button
//         onClick={onCancel}
//         className="text-[11px] text-gray-400 hover:text-gray-600 transition w-full text-center"
//       >
//         ← Go back
//       </button>
//     </motion.div>
//   );
// };

// /* ══════════════════════════════════════════════════
//    MAIN COMPONENT
// ══════════════════════════════════════════════════ */
// const CreateTender = ({ onBack }) => {
//   const {
//     messages,
//     typing,
//     phase,
//     error,
//     startChat,
//     sendMessage,
//     sendDocPrompt,
//     pushBot,
//     reset,
//     downloadDocx,
//     handleSendOption,
//     handleVendorDone,
//   } = useTenderChat();

//   const [isMultiMode, setIsMultiMode] = useState(false);
//   const multiHook = UseTenderChatMulti();

//   // active hook — single ya multi ke hisaab se
//   const activeHook = isMultiMode
//     ? multiHook
//     : {
//         messages,
//         typing,
//         phase,
//         error,
//         startChat,
//         sendMessage,
//         sendDocPrompt,
//         pushBot,
//         reset,
//         downloadDocx,
//         handleSendOption,
//         handleVendorDone,
//         downloadXlsx: undefined,
//       };

//   const [input, setInput] = useState("");
//   const [modeChosen, setModeChosen] = useState(false);
//   const bottomRef = useRef();
//   const initializedRef = useRef(false);

//   useEffect(() => {
//   bottomRef.current?.scrollIntoView({ behavior: "smooth" });
// }, [activeHook.messages, activeHook.typing]);

//   const handleModeSelect = async (key) => {
//     console.log("clicked key:", key);

//     setModeChosen(true);
//     if (key === "manual") {
//       await startChat();
//     } else if (key === "multi") {
      
//       setIsMultiMode(true);
//       await multiHook.startChat();
      
//     } else {
//       pushBot(
//         "Got it! Describe your requirement in detail below (you can also attach a reference document — optional). I'll generate the full BOQ instantly. 📋",
//       );
//     }
//   };
//   // Greeting
//   useEffect(() => {
//     if (initializedRef.current) return;
//     initializedRef.current = true;

//     pushBot(
//       "👋 Hi! I'll help you create a detailed BOQ (Bill of Quantities) & Requirements Document for your project.",
//     );
//     setTimeout(() => {
//       pushBot("How would you like to proceed?", {
//         options: [
//           {
//             key: "manual",
//             label: "Answer a few quick questions",
//             description:
//               "I ask 2–3 smart question blocks — BOQ ready in minutes.",
//             onSelect: handleModeSelect,
//           },
//           {
//             key: "upload",
//             label: "Describe directly / Upload document",
//             description: "Write your requirement or attach an existing doc.",
//             onSelect: handleModeSelect,
//           },
//           {
//             key: "multi",
//             label: "Multi-Work Project BOQ",
//             description:
//               "Building, CCTV, flooring, electrical — sab ek doc mein.",
//             onSelect: handleModeSelect,
//           },
//         ],
//       });
//     }, 600);
//   });

//  const resolvedMessages = activeHook.messages.map((m, i) =>
//   m.options && modeChosen && i < activeHook.messages.length - 1
//     ? { ...m, options: undefined }
//     : m,
// );

//   const handleSend = () => {
//     const val = input.trim();
//     if (!val) return;
//     setInput("");
//     sendMessage(val);
//   };

//   const docFlowActive =
//     modeChosen &&
//     activeHook.phase !== "chatting" &&
//     activeHook.phase !== "generating" &&
//     activeHook.phase !== "done" &&
//     activeHook.phase !== "sending" && // ← ADD THIS
//     activeHook.messages.some((m) =>
//   m.text?.includes("Describe your requirement")
// )

//   const answeredCount = activeHook.messages.filter(
//   (m) => m.role === "user" && modeChosen,
// ).length;
//   const progress =
//     activeHook.phase === "chatting"
//       ? Math.min(Math.round((answeredCount / 4) * 100), 90)
//       : activeHook.phase === "done"
//         ? 100
//         : 0;

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 8 }}
//       animate={{ opacity: 1, y: 0 }}
//       exit={{ opacity: 0 }}
//       className="flex flex-col h-[calc(100vh-130px)] max-w-3xl mx-auto"
//     >
//       {/* Header */}
//       <div className="flex items-center gap-3 mb-4 flex-shrink-0">
//         <button
//           onClick={onBack}
//           className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
//         >
//           <ArrowLeft size={18} />
//         </button>
//         <div className="flex items-center gap-2.5">
//           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-sm">
//             <Sparkles size={13} className="text-white" />
//           </div>
//           <div>
//             <p className="text-[14px] font-bold text-gray-800 leading-none">
//               BOQ Assistant
//             </p>
//             <p className="text-[11px] text-green-500 mt-0.5 flex items-center gap-1.5">
//               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
//               AI-powered · Fast BOQ generation
//             </p>
//           </div>
//         </div>

//         {activeHook.phase === "chatting" && (
//           <div className="ml-auto hidden sm:flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5">
//             <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
//               <motion.div
//                 className="h-full bg-green-500 rounded-full"
//                 animate={{ width: `${progress}%` }}
//                 transition={{ duration: 0.4 }}
//               />
//             </div>
//             <span className="text-[10px] font-semibold text-gray-500 tabular-nums">
//               Round {answeredCount}/2
//             </span>
//           </div>
//         )}

//         {activeHook.phase === "done" && (
//           <>
//             <div className="ml-auto flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
//               <CheckCircle2 size={12} className="text-green-500" />
//               <span className="text-[11px] font-semibold text-green-600">
//                 BOQ Ready
//               </span>
//             </div>
//             <button
//               onClick={reset}
//               className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition"
//             >
//               <RefreshCw size={11} /> New
//             </button>
//           </>
//         )}
//       </div>

//       {/* Chat window */}
//       {/* Chat window */}
//       <div className="relative flex-1 overflow-hidden rounded-2xl">
//         {/* Moving border glow */}
//         <div
//           className="absolute inset-0 rounded-2xl z-0 pointer-events-none"
//           style={{ padding: "2px", background: "transparent" }}
//         >
//           <div
//             className="absolute inset-0 rounded-2xl"
//             style={{
//               background:
//                 "conic-gradient(from var(--angle, 0deg), transparent 0deg, transparent 240deg, #4ade80 265deg, #86efac 272deg, #ffffff 278deg, #86efac 285deg, #4ade80 292deg, transparent 310deg, transparent 360deg)",
//               animation: "borderSpin 1.5s linear infinite",
//               borderRadius: "inherit",
//             }}
//           />
//         </div>
//         <div className="absolute inset-[2px] bg-white rounded-[14px] z-[1]" />
//         <div className="relative z-[2] flex-1 overflow-hidden flex flex-col h-full shadow-sm">
//           <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
//             <AnimatePresence initial={false}>
//               {resolvedMessages.map((msg, i) => (
//                 <Bubble
//                   key={i}
//                   msg={msg}
//                   downloadDocx={activeHook.downloadDocx}
//                   downloadXlsx={activeHook.downloadXlsx}
//                   handleSendOption={activeHook.handleSendOption}
//                   handleVendorDone={activeHook.handleVendorDone}
//                 />
//               ))}
//             </AnimatePresence>

//             {typing && (
//               <motion.div
//                 initial={{ opacity: 0, y: 5 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0 }}
//                 className="flex gap-3 justify-start"
//               >
//                 <BotAvatar />
//                 <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
//                   <TypingDots />
//                 </div>
//               </motion.div>
//             )}

//             {error && (
//               <motion.div
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-[12px] text-red-600"
//               >
//                 <AlertCircle size={13} /> {error}
//               </motion.div>
//             )}
//             <div ref={bottomRef} />
//           </div>
//         </div>

//         {/* Doc panel */}
//         <AnimatePresence>
//           {docFlowActive && (
//             <DocUploadPanel
//               onSubmit={sendDocPrompt}
//               onCancel={() => {
//                 reset();
//                 setTimeout(() => {
//                   initializedRef.current = false;
//                   // re-trigger greeting via a dummy state change is handled by reset
//                   pushBot(
//                     "👋 Hi! I'll help you create a detailed BOQ & Requirements Document.",
//                   );
//                   pushBot("How would you like to proceed?", {
//                     options: [
//                       {
//                         key: "manual",
//                         label: "Answer a few quick questions",
//                         description: "2–3 smart question blocks.",
//                         onSelect: handleModeSelect,
//                       },
//                       {
//                         key: "upload",
//                         label: "Describe directly / Upload document",
//                         description: "Write or attach a doc.",
//                         onSelect: handleModeSelect,
//                       },
//                     ],
//                   });
//                 }, 100);
//               }}
//               disabled={typing || activeHook.phase === "generating"}
//             />
//           )}
//         </AnimatePresence>

//         {/* Chat input */}
//         {activeHook.phase === "chatting" && (
//           <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3">
//             <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-4 py-2.5 focus-within:border-green-400 focus-within:bg-white transition-all">
//               <input
//                 type="text"
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={(e) =>
//                   e.key === "Enter" && !e.shiftKey && handleSend()
//                 }
//                 placeholder="Type your answer…"
//                 autoFocus
//                 className="flex-1 bg-transparent text-[13px] text-gray-700 placeholder-gray-400 outline-none"
//               />
//               <motion.button
//                 whileTap={{ scale: 0.91 }}
//                 onClick={handleSend}
//                 disabled={!input.trim() || typing}
//                 className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0
//                   ${input.trim() && !typing ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
//               >
//                 {typing ? (
//                   <Loader2 size={13} className="animate-spin" />
//                 ) : (
//                   <Send size={13} />
//                 )}
//               </motion.button>
//             </div>
//           </div>
//         )}

//         {(activeHook.phase === "done" || activeHook.phase === "sending") && (
//           <div className="flex-shrink-0 border-t border-gray-100 px-4 py-2.5 flex items-center gap-2 bg-green-50/60">
//             <CheckCircle2 size={13} className="text-green-500" />
//             <p className="text-[11.5px] text-green-600 font-medium">
//               BOQ saved as draft — download the Word document above to share
//               with vendors.
//             </p>
//           </div>
//         )}
//       </div>
//     </motion.div>
//   );
// };

// export default CreateTender;
