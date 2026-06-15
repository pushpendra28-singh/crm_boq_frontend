import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Send, CheckCircle2, Loader2,
  Search, X, Paperclip,
} from "lucide-react";
import API_BASE_URL from "../../config/api";


const getToken = () => localStorage.getItem("adminToken");

const VendorRow = ({ vendor, sent, sending, onSend }) => (
  <motion.div
    initial={{ opacity: 0, x: -6 }}
    animate={{ opacity: 1, x: 0 }}
    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all
      ${sent
        ? "border-green-200 bg-green-50"
        : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/40"
      }`}
  >
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
      {vendor.name?.[0]?.toUpperCase() || "V"}
    </div>

    <div className="flex-1 min-w-0">
        
      <p className="text-[12.5px] font-semibold text-gray-800 truncate">{vendor.name}</p>
      <p className="text-[11px] text-gray-400 truncate">{vendor.email}</p>
    </div>
    {sent ? (
      <div className="flex items-center gap-1 text-green-600 flex-shrink-0">
        <CheckCircle2 size={13} />

        <span className="text-[11px] font-semibold">Sent</span>
      </div>
    ) : (
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => onSend(vendor)}
        disabled={sending}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0
          ${sending
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-green-500 text-white hover:bg-green-600"
          }`}
      >
        {sending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
        {sending ? "Sending…" : "Send"}
      </motion.button>
    )}
  </motion.div>
);

const VendorSelector = ({ tenderId, docType, onDone }) => {
  const [vendors,    setVendors]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [fetched,    setFetched]    = useState(false);
  const [search,     setSearch]     = useState("");
  const [sending,    setSending]    = useState(null);
  const [sentIds,    setSentIds]    = useState(new Set());
  const [customFile, setCustomFile] = useState(null);
  const [error,      setError]      = useState(null);
  const fileRef = useRef();

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
        console.log("Fetching vendors...");
      const res  = await fetch(`${API_BASE_URL}/tender/vendors`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        

      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch vendors");
      setVendors(data.vendors || []);
      setFetched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!fetched && !loading && !error) fetchVendors();

  const handleSend = async (vendor) => {
    setSending(vendor._id);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("vendorId", vendor._id);
      formData.append("docType", docType === "custom" ? "custom" : "generated");
      if (customFile) {
        formData.append("customDoc", customFile);
        formData.append("customDocName", customFile.name);
      }
      const res  = await fetch(`${API_BASE_URL}/tender/${tenderId}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Send failed");
      setSentIds((prev) => new Set([...prev, vendor._id]));
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(null);
    }
  };

  const filtered = vendors.filter(
    (v) =>
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase())
  );

  const allSent = vendors.length > 0 && vendors.every((v) => sentIds.has(v._id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[82%] bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-700">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <Building2 size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none">Send to Vendors</p>
            <p className="text-[10px] text-indigo-200 mt-0.5">
              {docType === "custom" ? "Custom Document" : "Generated BOQ"}
            </p>
          </div>
        </div>
        {allSent && (
          <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
            <CheckCircle2 size={11} className="text-green-300" />
            <span className="text-[10px] font-semibold text-white">All Sent</span>
          </div>
        )}
      </div>

      {/* Custom doc upload strip */}
      {docType === "custom" && (
        <div
          onClick={() => fileRef.current.click()}
          className={`flex items-center gap-2.5 px-4 py-2.5 border-b cursor-pointer transition-all
            ${customFile ? "border-green-200 bg-green-50" : "border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50"}`}
        >
          {customFile ? (
            <>
              <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
              <span className="text-[12px] font-medium text-green-700 truncate flex-1">{customFile.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setCustomFile(null); }}
                className="text-gray-400 hover:text-red-400 transition flex-shrink-0"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <>
              <Paperclip size={13} className="text-indigo-400 flex-shrink-0" />
              <span className="text-[12px] text-indigo-600 font-medium">
                Attach document to send <span className="text-indigo-400 font-normal">(PDF, DOC, DOCX, TXT)</span>
              </span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => setCustomFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Body */}
      <div className="p-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
            <Loader2 size={15} className="animate-spin text-indigo-500" />
            <span className="text-[12px]">Loading vendors…</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-[12px] text-red-600">
            <span className="flex-1">{error}</span>
            <button onClick={fetchVendors} className="text-red-500 hover:text-red-700 font-semibold underline flex-shrink-0">
              Retry
            </button>
          </div>
        )}

        {fetched && !loading && vendors.length === 0 && (
          <div className="text-center py-6">
            <Building2 size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-[12.5px] font-semibold text-gray-500">No vendors found</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Create users with the "vendor" role to send proposals.
            </p>
          </div>
        )}

        {fetched && vendors.length > 0 && (
          <>
            {vendors.length > 3 && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-indigo-400 transition-colors">
                <Search size={12} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vendors…"
                  className="flex-1 bg-transparent text-[12px] text-gray-700 placeholder-gray-400 outline-none"
                />
              </div>
            )}

            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              <AnimatePresence>
                {filtered.map((vendor) => (
                  <VendorRow
                    key={vendor._id}
                    vendor={vendor}
                    sent={sentIds.has(vendor._id)}
                    sending={sending === vendor._id}
                    onSend={handleSend}
                  />
                ))}
              </AnimatePresence>
              {filtered.length === 0 && search && (
                <p className="text-center text-[11px] text-gray-400 py-3">
                  No vendors match "{search}"
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <p className="text-[11px] text-gray-400">
                {sentIds.size} of {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} notified
              </p>
              {sentIds.size > 0 && (
                <button
                  onClick={onDone}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  Done ✓
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default VendorSelector;