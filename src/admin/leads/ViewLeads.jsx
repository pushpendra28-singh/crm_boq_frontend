import { useEffect, useState, useCallback, useRef } from "react";
import {
  ArrowLeft, Search, Trash2, ChevronLeft, ChevronRight,
  SlidersHorizontal, Plus, BarChart2, List, Kanban,
  RefreshCw, Download, Filter, X, ChevronDown,
  AlertCircle, CheckCircle2, Clock, XCircle, TrendingUp,
  User, Phone, MapPin, Building2, Zap, Globe, Target,
  MessageSquare, Calendar, Star, GitMerge, Eye,
  ChevronUp, Loader2, Tag, Activity, ArrowUpRight,
  Users, Copy, CheckCheck, Link2, FileText, Megaphone,
  UserPlus, UserCheck, Search as SearchIcon,
} from "lucide-react";
import API_BASE_URL from "../../config/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ─── Split modules ─────────────────────────────────────────────────────────────
import { CATEGORIES, STATUSES, SOURCES, STATUS_CONFIG, SOURCE_CONFIG } from "./Constants";
import { ScoreBadge, SourceChip, StatusSelect, StatCard } from "./LeadComponents";
import AssignModal from "./AssignModal";
import LeadDrawer from "./LeadDrawer";
import FilterPanel from "./FilterPanel";
import { AnalyticsPanel, KanbanColumn } from "./AnalyticsPanel";
import SourceBar from "./SourceBar";

// ─── Lead Validation utilities (scores, badges, time range) ──────────────────
import {
  normalizeLeadScores,
  getPriorityConfig,
  ValidationBadges,
  resolveTimeRange,
} from "./LeadValidation";


const getAuthHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ViewLeads = ({ goBack }) => {
  const [leads, setLeads]               = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalLeads, setTotalLeads]     = useState(0);

  const [category, setCategory]         = useState("Residential");
  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage]   = useState(1);
  const [view, setView]                 = useState("table"); // table | kanban | analytics
  const [filterOpen, setFilterOpen]     = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [refreshKey, setRefreshKey]     = useState(0);
  const [activeSource, setActiveSource] = useState(""); // "" = All

  const [filters, setFilters] = useState({
    status: "",
    source: "",
    minScore: 0,
    startDate: "",
    endDate: "",
    showDuplicates: false,
    timeRange: "",
  });

  const leadsPerPage = 15;
  const filterRef    = useRef(null);
  const tableScrollRef = useRef(null);
  const [showScrollbar, setShowScrollbar] = useState(false);

  const activeFilterCount = [
    filters.status,
    filters.source,
    filters.minScore > 0 ? "1" : "",
    filters.startDate,
    filters.endDate,
    filters.showDuplicates ? "1" : "",
    filters.timeRange ? "1" : "",
  ].filter(Boolean).length;

  // ── Check if table needs horizontal scroll
  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const check = () => setShowScrollbar(el.scrollWidth > el.clientWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [leads, category]);

  // ── Search debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // ── Reset page on filter/search/category/source change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, category, filters, activeSource]);

  // ── Fetch leads
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const timeParams = filters.timeRange
        ? resolveTimeRange(filters.timeRange)
        : {
            ...(filters.startDate && { startDate: filters.startDate }),
            ...(filters.endDate   && { endDate:   filters.endDate   }),
          };

      const params = new URLSearchParams({
        ...(category && { category }),
        page:  currentPage,
        limit: leadsPerPage,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...((activeSource || filters.source) && { source: activeSource || filters.source }),
        ...(filters.status   && { status:   filters.status }),
        ...(filters.minScore > 0 && { minScore: filters.minScore }),
        ...timeParams,
        ...(filters.showDuplicates && { isDuplicate: "true" }),
      });

      const res = await fetch(`${API_BASE_URL}/leads?${params}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      const normalizeLead = (l) =>
        normalizeLeadScores({
          ...l,
          name:        l.name        || l.fullName     || l.customerName || "",
          whatsapp:    l.whatsapp    || l.phone        || l.mobile       || l.contact || "",
          email:       l.email       || "",
          category:    l.category    || l.formType     || "Residential",
          pincode:     l.pincode     || l.pinCode      || l.zip          || "",
          city:        l.city        || l.town         || "",
          societyName: l.societyName || l.society      || l.apartment    || "",
          companyName: l.companyName || l.company      || l.businessName || "",
          designation: l.designation || l.role         || "",
          agmStatus:   l.agmStatus   || l.agm          || l.hasAGM       || "",
          bill:
            l.bill          ||
            l.electricityBill ||
            l.monthlyBill   ||
            l.commercialBill ||
            l.powerBill     ||
            "",
          monthlyBill:
            l.monthlyBill   ||
            l.commercialBill ||
            l.bill          ||
            "",
          commercialBill:
            l.commercialBill ||
            l.monthlyBill   ||
            l.bill          ||
            "",
        });

      if (Array.isArray(data)) {
        const normalized = data.map(normalizeLead);
        setLeads(normalized);
        setTotalLeads(normalized.length);
        setTotalPages(Math.ceil(normalized.length / leadsPerPage));
      } else {
        const raw        = data.leads || [];
        const normalized = raw.map(normalizeLead);
        setLeads(normalized);
        setTotalLeads(data.pagination?.total      || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [category, currentPage, debouncedSearch, filters, activeSource, refreshKey]);

  // ── Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/leads/stats`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) setStats(await res.json());
    } catch {}
    finally { setStatsLoading(false); }
  }, [refreshKey]);

  useEffect(() => { fetchLeads(); },                              [fetchLeads]);
  useEffect(() => { if (view === "analytics") fetchStats(); },   [view, fetchStats]);

  // ── Update status
  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setLeads((prev) => prev.map((l) => l._id === id ? { ...l, status } : l));
      if (selectedLead?._id === id) setSelectedLead((l) => ({ ...l, status }));
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  // ── Add note
  const addNote = async (id, text) => {
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${id}/notes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLeads((prev) => prev.map((l) => l._id === id ? data.lead : l));
      if (selectedLead?._id === id) setSelectedLead(data.lead);
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    }
  };

  // ── Handle assign
  const handleLeadAssigned = useCallback((updatedLead) => {
    setLeads((prev) =>
      prev.map((l) => l._id === updatedLead._id ? updatedLead : l)
    );
    setSelectedLead(updatedLead);
  }, []);

  // ── Delete lead
  const deleteLead = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <span className="font-medium text-gray-800 text-sm">Delete this lead?</span>
        <div className="flex gap-2 justify-end">
          <button
            className="px-3 py-1 text-xs bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
                  method: "DELETE",
                  headers: getAuthHeaders(),
                });
                if (!res.ok) throw new Error();
                setLeads((prev) => prev.filter((l) => l._id !== id));
                if (selectedLead?._id === id) setSelectedLead(null);
                toast.success("Lead deleted");
              } catch {
                toast.error("Failed to delete lead");
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
    ));
  };

  // ── Export CSV
  const exportCSV = () => {
    if (!leads.length) { toast.error("No leads to export"); return; }
    const headers = [
      "Name", "WhatsApp", "Email", "Category", "Status", "Source",
      "Score", "Pincode", "Bill", "Assigned To", "Created At",
    ];
    const rows = leads.map((l) => [
      l.name, l.whatsapp, l.email || "", l.category, l.status, l.source || "",
      l.authenticityScore || 0, l.pincode || "",
      l.bill || l.monthlyBill || l.commercialBill || "",
      l.assignedToName || "", new Date(l.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `leads-${category.toLowerCase()}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  };

  // ── Filter helpers
  const updateFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const resetFilters = () =>
    setFilters({
      status: "", source: "", minScore: 0,
      startDate: "", endDate: "", showDuplicates: false,
      timeRange: "",
    });

  // ── Kanban data
  const kanbanData = STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
      style={{ background: "#f4f6f8", minHeight: "100vh", padding: "24px", fontFamily: "'Inter', sans-serif" }}
    >

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            style={{
              padding: "8px",
              borderRadius: "10px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              color: "#6b7280",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              transition: "all 0.15s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.color = "#111827"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#6b7280"; }}
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.3px" }}>
              Lead Management
            </h1>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0 0" }}>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>{totalLeads}</span> leads · {category}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            style={{
              padding: "8px",
              borderRadius: "10px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              color: "#6b7280",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={exportCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              color: "#374151",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* ── Controls Row ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>

        {/* Category tabs */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "4px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          flexShrink: 0,
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                transition: "all 0.15s",
                background: category === cat ? "#16a34a" : "transparent",
                color: category === cat ? "#fff" : "#6b7280",
                boxShadow: category === cat ? "0 2px 8px rgba(22,163,74,0.25)" : "none",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 0, maxWidth: "280px" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              paddingLeft: "36px",
              paddingRight: search ? "36px" : "14px",
              paddingTop: "8px",
              paddingBottom: "8px",
              fontSize: "13px",
              color: "#111827",
              outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              boxSizing: "border-box",
            }}
            onFocus={e => { e.target.style.borderColor = "#16a34a"; e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.1)"; }}
            onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter button */}
        <div style={{ position: "relative" }} ref={filterRef}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              border: activeFilterCount > 0 ? "1px solid #bbf7d0" : "1px solid #e5e7eb",
              background: activeFilterCount > 0 ? "#f0fdf4" : "#fff",
              color: activeFilterCount > 0 ? "#16a34a" : "#6b7280",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              transition: "all 0.15s",
            }}
          >
            <Filter size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "#16a34a",
                color: "#fff",
                fontSize: "9px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {filterOpen && (
              <FilterPanel
                filters={filters}
                onChange={updateFilter}
                onReset={resetFilters}
                onClose={() => setFilterOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* View switcher */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "4px",
          marginLeft: "auto",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          {[
            { key: "table",     Icon: List      },
            { key: "kanban",    Icon: Kanban    },
            { key: "analytics", Icon: BarChart2 },
          ].map(({ key, Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              title={key}
              style={{
                padding: "6px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                background: view === key ? "#16a34a" : "transparent",
                color: view === key ? "#fff" : "#9ca3af",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Source Filter Bar ── */}
      <SourceBar
        activeSource={activeSource}
        onChange={(src) => {
          setActiveSource(src);
          if (src) updateFilter("source", "");
        }}
        leads={leads}
      />

      {/* ── Time Range Filter ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", color: "#9ca3af", flexShrink: 0 }}>Time:</span>
        {[
          { key: "",    label: "All Time"    },
          { key: "24h", label: "Last 24h"    },
          { key: "7d",  label: "Last 7 Days" },
          { key: "15d", label: "Last 15 Days"},
          { key: "30d", label: "Last Month"  },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => updateFilter("timeRange", key)}
            style={{
              padding: "4px 12px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              border: filters.timeRange === key ? "1px solid #bbf7d0" : "1px solid #e5e7eb",
              background: filters.timeRange === key ? "#f0fdf4" : "#fff",
              color: filters.timeRange === key ? "#16a34a" : "#9ca3af",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Active filters display ── */}
      {activeFilterCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>Active filters:</span>
          {filters.status && (
            <span style={{
              display: "flex", alignItems: "center", gap: "4px",
              padding: "3px 10px", borderRadius: "20px",
              background: "#f3f4f6", fontSize: "11px", color: "#374151",
              border: "1px solid #e5e7eb",
            }}>
              Status: {filters.status}
              <button onClick={() => updateFilter("status", "")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "#9ca3af" }}><X size={10} /></button>
            </span>
          )}
          {filters.source && (
            <span style={{
              display: "flex", alignItems: "center", gap: "4px",
              padding: "3px 10px", borderRadius: "20px",
              background: "#f3f4f6", fontSize: "11px", color: "#374151",
              border: "1px solid #e5e7eb",
            }}>
              Source: {filters.source}
              <button onClick={() => updateFilter("source", "")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "#9ca3af" }}><X size={10} /></button>
            </span>
          )}
          {filters.minScore > 0 && (
            <span style={{
              display: "flex", alignItems: "center", gap: "4px",
              padding: "3px 10px", borderRadius: "20px",
              background: "#f3f4f6", fontSize: "11px", color: "#374151",
              border: "1px solid #e5e7eb",
            }}>
              Min score: {filters.minScore}
              <button onClick={() => updateFilter("minScore", 0)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "#9ca3af" }}><X size={10} /></button>
            </span>
          )}
          {filters.timeRange && (
            <span style={{
              display: "flex", alignItems: "center", gap: "4px",
              padding: "3px 10px", borderRadius: "20px",
              background: "#f0fdf4", fontSize: "11px", color: "#16a34a",
              border: "1px solid #bbf7d0",
            }}>
              {filters.timeRange === "24h" ? "Last 24h"
                : filters.timeRange === "7d"  ? "Last 7 Days"
                : filters.timeRange === "15d" ? "Last 15 Days"
                : "Last Month"}
              <button onClick={() => updateFilter("timeRange", "")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "#16a34a" }}><X size={10} /></button>
            </span>
          )}
          {filters.showDuplicates && (
            <span style={{
              display: "flex", alignItems: "center", gap: "4px",
              padding: "3px 10px", borderRadius: "20px",
              background: "#fff7ed", fontSize: "11px", color: "#ea580c",
              border: "1px solid #fed7aa",
            }}>
              Duplicates only
              <button onClick={() => updateFilter("showDuplicates", false)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "#ea580c" }}><X size={10} /></button>
            </span>
          )}
          <button
            onClick={resetFilters}
            style={{ fontSize: "11px", color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Analytics View ── */}
      {view === "analytics" && (
        <AnalyticsPanel stats={stats} loading={statsLoading} />
      )}

      {/* ── Kanban View ── */}
      {view === "kanban" && (
        <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "16px" }}>
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={kanbanData[status]}
              onLeadClick={setSelectedLead}
              onStatusChange={updateStatus}
            />
          ))}
        </div>
      )}

      {/* ── Table View ── */}
      {view === "table" && (
        <div style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          {/* Horizontal scroll container */}
          <div
            ref={tableScrollRef}
            style={{
              overflowX: "auto",
              overflowY: "visible",
              // Custom scrollbar styling
              scrollbarWidth: "thin",
              scrollbarColor: "#d1d5db #f9fafb",
            }}
          >
            <style>{`
              .leads-table-scroll::-webkit-scrollbar {
                height: 6px;
              }
              .leads-table-scroll::-webkit-scrollbar-track {
                background: #f9fafb;
                border-radius: 4px;
              }
              .leads-table-scroll::-webkit-scrollbar-thumb {
                background: #d1d5db;
                border-radius: 4px;
              }
              .leads-table-scroll::-webkit-scrollbar-thumb:hover {
                background: #9ca3af;
              }
              .lead-row:hover {
                background: #f9fafb !important;
              }
            `}</style>
            <div className="leads-table-scroll" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", minWidth: "700px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
                    {[
                      "Lead", "Contact", "Source", "Authenticity",
                      ...(category === "Residential" ? ["Bill", "Pincode"] : []),
                      ...(category === "Housing Society" ? ["Society", "Pincode", "Bill", "Designation", "AGM Status"] : []),
                      ...(category === "Commercial" ? ["Company", "City", "Pincode", "Bill"] : []),
                      "Assigned", "Status", "Actions"
                    ].map((h) => (
                      <th key={h} style={{
                        padding: "12px 20px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} style={{ padding: "14px 20px" }}>
                            <div
                              style={{
                                height: "12px",
                                background: "#f3f4f6",
                                borderRadius: "6px",
                                width: `${50 + Math.random() * 40}%`,
                                animation: "pulse 1.5s ease-in-out infinite",
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "60px 20px" }}>
                        <SlidersHorizontal size={28} style={{ margin: "0 auto 12px", color: "#d1d5db", display: "block" }} />
                        <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>No leads found</p>
                        {activeFilterCount > 0 && (
                          <button
                            onClick={resetFilters}
                            style={{
                              marginTop: "8px",
                              fontSize: "12px",
                              color: "#16a34a",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            Clear filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {leads.map((lead, idx) => {
                        const { row: rowClass } = getPriorityConfig(lead.priorityTag);
                        return (
                          <motion.tr
                            key={lead._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="lead-row"
                            style={{
                              borderTop: "1px solid #f3f4f6",
                              transition: "background 0.12s",
                              cursor: "default",
                            }}
                          >
                            {/* Lead name + category */}
                            <td style={{ padding: "12px 20px", whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{
                                  width: "34px",
                                  height: "34px",
                                  borderRadius: "10px",
                                  background: "#f0fdf4",
                                  border: "1px solid #bbf7d0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  color: "#16a34a",
                                  flexShrink: 0,
                                }}>
                                  {lead.name?.[0]?.toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", margin: 0, whiteSpace: "nowrap" }}>
                                      {lead.name}
                                    </p>
                                    {lead.isDuplicate && (
                                      <span style={{
                                        fontSize: "9px",
                                        fontWeight: 700,
                                        padding: "1px 5px",
                                        borderRadius: "4px",
                                        background: "#fff7ed",
                                        color: "#ea580c",
                                        border: "1px solid #fed7aa",
                                      }}>DUP</span>
                                    )}
                                  </div>
                                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0" }}>{lead.category}</p>
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td style={{ padding: "12px 20px", whiteSpace: "nowrap" }}>
                              <p style={{ fontSize: "13px", color: "#374151", margin: 0 }}>{lead.whatsapp || "—"}</p>
                              {lead.email && (
                                <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {lead.email}
                                </p>
                              )}
                            </td>

                            {/* Source */}
                            <td style={{ padding: "12px 20px", whiteSpace: "nowrap" }}>
                              <SourceChip source={lead.source || "Manual"} />
                            </td>

                            {/* Authenticity */}
                            <td style={{ padding: "12px 20px", whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <ScoreBadge score={lead.authenticityScore || 0} />
                                  <span style={{
                                    fontSize: "10px",
                                    padding: "2px 8px",
                                    borderRadius: "20px",
                                    fontWeight: 700,
                                    ...(getPriorityConfig(lead.priorityTag).badge
                                      ? {} // let existing badge class handle it
                                      : { background: "#f3f4f6", color: "#6b7280" }),
                                  }}
                                    className={getPriorityConfig(lead.priorityTag).badge}
                                  >
                                    {lead.priorityTag}
                                  </span>
                                </div>
                                <ValidationBadges lead={lead} />
                              </div>
                            </td>

                            {/* Category-specific columns */}
                            {category === "Residential" && (
                              <>
                                <td style={{ padding: "12px 20px", fontSize: "13px", color: "#374151", fontWeight: 500, whiteSpace: "nowrap" }}>
                                  {lead.bill ? `₹ ${lead.bill}` : "—"}
                                </td>
                                <td style={{ padding: "12px 20px", fontSize: "13px", color: "#374151", fontWeight: 500, whiteSpace: "nowrap" }}>
                                  {lead.pincode || "—"}
                                </td>
                              </>
                            )}
                            {category === "Housing Society" && (
                              <>
                                <td style={{ padding: "12px 20px", fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
                                  {lead.societyName || "—"}
                                </td>
                                <td style={{ padding: "12px 20px", fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
                                  {lead.pincode || "—"}
                                </td>
                                <td style={{ padding: "12px 20px", fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
                                  {lead.bill ? `₹ ${lead.bill}` : "—"}
                                </td>
                                <td style={{ padding: "12px 20px", fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
                                  {lead.designation || "—"}
                                </td>
                                <td style={{ padding: "12px 20px", fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
                                  {lead.agmStatus || "—"}
                                </td>
                              </>
                            )}
                            {category === "Commercial" && (
                              <>
                                <td style={{ padding: "12px 20px", fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
                                  {lead.companyName || "—"}
                                </td>
                                <td style={{ padding: "12px 20px", fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
                                  {lead.city || "—"}
                                </td>
                                <td style={{ padding: "12px 20px", fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
                                  {lead.pincode || "—"}
                                </td>
                                <td style={{ padding: "12px 20px", fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
                                  {lead.monthlyBill ? `₹ ${lead.monthlyBill}` : "—"}
                                </td>
                              </>
                            )}

                            {/* Assigned */}
                            <td style={{ padding: "12px 20px", whiteSpace: "nowrap" }}>
                              {lead.assignedToName ? (
                                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#6b7280" }}>
                                  <User size={11} style={{ color: "#16a34a" }} />
                                  {lead.assignedToName}
                                </span>
                              ) : (
                                <span style={{ fontSize: "12px", color: "#d1d5db" }}>—</span>
                              )}
                            </td>

                            {/* Status */}
                            <td style={{ padding: "12px 20px", whiteSpace: "nowrap" }}>
                              <StatusSelect
                                value={lead.status}
                                onChange={(v) => updateStatus(lead._id, v)}
                                small
                              />
                            </td>

                            {/* Actions */}
                            <td style={{ padding: "12px 20px", whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "2px" }} className="lead-actions">
                                <button
                                  onClick={() => setSelectedLead(lead)}
                                  style={{
                                    padding: "6px",
                                    borderRadius: "8px",
                                    border: "none",
                                    background: "none",
                                    color: "#9ca3af",
                                    cursor: "pointer",
                                    display: "flex",
                                    transition: "all 0.12s",
                                  }}
                                  title="View details"
                                  onMouseEnter={e => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.color = "#16a34a"; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#9ca3af"; }}
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => deleteLead(lead._id)}
                                  style={{
                                    padding: "6px",
                                    borderRadius: "8px",
                                    border: "none",
                                    background: "none",
                                    color: "#d1d5db",
                                    cursor: "pointer",
                                    display: "flex",
                                    transition: "all 0.12s",
                                  }}
                                  title="Delete"
                                  onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#d1d5db"; }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              borderTop: "1px solid #f3f4f6",
            }}>
              <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
                Showing{" "}
                <span style={{ color: "#374151", fontWeight: 500 }}>
                  {(currentPage - 1) * leadsPerPage + 1}–{Math.min(currentPage * leadsPerPage, totalLeads)}
                </span>{" "}
                of <span style={{ color: "#374151", fontWeight: 500 }}>{totalLeads}</span> entries
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    color: currentPage === 1 ? "#d1d5db" : "#374151",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={i} style={{ padding: "0 4px", color: "#9ca3af", fontSize: "13px" }}>…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 500,
                          cursor: "pointer",
                          border: currentPage === p ? "none" : "1px solid #e5e7eb",
                          background: currentPage === p ? "#16a34a" : "#fff",
                          color: currentPage === p ? "#fff" : "#374151",
                          transition: "all 0.15s",
                          boxShadow: currentPage === p ? "0 2px 8px rgba(22,163,74,0.3)" : "none",
                        }}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    color: currentPage === totalPages ? "#d1d5db" : "#374151",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Lead Detail Drawer ── */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDrawer
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onStatusChange={updateStatus}
            onAddNote={addNote}
            onAssign={handleLeadAssigned}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ViewLeads;