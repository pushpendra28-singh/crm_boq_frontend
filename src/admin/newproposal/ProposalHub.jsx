import { useState } from "react";
import CreateProposal from "./CreateProposal";
import ProposalsListing from "./ProposalsListing";

// ── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, className = "" }) => {
  const icons = {
    plus: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    list: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    sparkle: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
      </svg>
    ),
    arrow: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
      </svg>
    ),
    file: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20,6 9,17 4,12" />
      </svg>
    ),
  };
  return icons[name] || null;
};

// ── Feature bullet ────────────────────────────────────────────────────────────
const Feature = ({ text }) => (
  <li className="flex items-center gap-2 text-sm text-gray-500">
    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
      <Icon name="check" size={9} className="text-green-600" />
    </span>
    {text}
  </li>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProposalHub() {
  const [view, setView] = useState("hub"); // "hub" | "create" | "list"

  if (view === "create") {
    return <CreateProposal onBack={() => setView("hub")} />;
  }

  if (view === "list") {
    return (
      <ProposalsListing
        onBack={() => setView("hub")}
        onCreateNew={() => setView("create")}
      />
    );
  }

  // ── Hub Landing ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
            <Icon name="file" size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Proposals</h1>
            <p className="text-xs text-gray-400">AI-powered proposal generation</p>
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">

        {/* Create Proposal */}
        <button
          onClick={() => setView("create")}
          className="group relative bg-white border border-gray-200 hover:border-green-300 rounded-2xl p-7 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          {/* Accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl bg-green-50 group-hover:bg-green-100 flex items-center justify-center mb-5 transition-colors duration-200">
            <Icon name="sparkle" size={22} className="text-green-600" />
          </div>

          <h2 className="text-base font-bold text-gray-900 mb-1.5">Create Proposal</h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Generate a professional AI-powered proposal in minutes. Fill in client details, scope, pricing, and timeline.
          </p>

          <ul className="space-y-1.5 mb-6">
            <Feature text="6-step guided wizard" />
            <Feature text="AI-generated content" />
            <Feature text="Pricing calculator with tax & discount" />
            <Feature text="Milestone-based timeline" />
          </ul>

          <div className="flex items-center gap-2 text-sm font-semibold text-green-600 group-hover:gap-3 transition-all duration-200">
            <Icon name="plus" size={15} className="text-green-600" />
            Start creating
            <Icon name="arrow" size={14} className="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>

        {/* View All Proposals */}
        <button
          onClick={() => setView("list")}
          className="group relative bg-white border border-gray-200 hover:border-blue-300 rounded-2xl p-7 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          {/* Accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-5 transition-colors duration-200">
            <Icon name="list" size={22} className="text-blue-600" />
          </div>

          <h2 className="text-base font-bold text-gray-900 mb-1.5">View All Proposals</h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Browse, filter, and manage all generated proposals. Track status, download PDFs, and manage the full pipeline.
          </p>

          <ul className="space-y-1.5 mb-6">
            <Feature text="Search & filter by status" />
            <Feature text="Track proposal pipeline" />
            <Feature text="View, edit & delete proposals" />
            <Feature text="Download generated proposals" />
          </ul>

          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:gap-3 transition-all duration-200">
            <Icon name="list" size={15} className="text-blue-600" />
            View proposals
            <Icon name="arrow" size={14} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      </div>

      {/* Bottom tip */}
      <div className="mt-auto pt-10">
        <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 max-w-3xl">
          <Icon name="sparkle" size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-700">Pro tip:</span> After creating a proposal, you can track its status from <span className="font-medium text-gray-700">View All Proposals</span>. Update status as clients respond — from <em>Generated</em> → <em>Sent</em> → <em>Accepted</em>.
          </p>
        </div>
      </div>
    </div>
  );
}