import { useEffect, useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../../config/api";

// ── Icons ─────────────────────────────────────────────
const Icon = ({ children }) => (
  <div className="flex items-center justify-center">
    {children}
  </div>
);

export default function ViewProposal({
  proposalId,
  onClose,
}) {

  const params = useParams();

  const id =
    proposalId || params.id;
  const navigate = useNavigate();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const proposalRef = useRef(null);

  // ── Fetch Proposal ──────────────────────────────────
  useEffect(() => {
    fetchProposal();

  }, [id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE_URL}/new-proposals/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to fetch proposal"
        );
      }

      setProposal(data.proposal || data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">
            Loading proposal...
          </p>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────
  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-red-100 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <div className="w-14 h-14 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            ❌
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Proposal Not Found
          </h2>

          <p className="text-sm text-gray-500 mb-6">
            {error || "Unable to load proposal."}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Proposal Pages ─────────────────────────────────
  const pages = proposal.generatedContent
  ? [
      {
        title: proposal.proposalTitle,
        content:
          proposal.generatedContent.fullProposal ||
          proposal.generatedContent.executiveSummary ||
          "No content generated",
      },
    ]
  : [];

const totalPages = pages.length || 1;
const activePage = pages[currentPage - 1];
const downloadPDF = () => {
  if (!proposalRef.current) return;

  const opt = {
    margin: 0,
    filename: `${proposal.proposalNumber || "proposal"}.pdf`,
    image: {
      type: "jpeg",
      quality: 1,
    },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollY: 0,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    },
    pagebreak: {
      mode: ["css", "legacy"],
    },
  };

  html2pdf()
    .set(opt)
    .from(proposalRef.current)
    .save();
};

  // ── Main UI ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Proposal Preview
            </h1>

            <p className="text-xs text-gray-400">
              {proposal.proposalNumber}
            </p>
          </div>

          <div className="flex items-center gap-3">

           <button
  onClick={() => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  }}
  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
>
  Back
</button>

            <button
            onClick={downloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Document Area */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Proposal Meta */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {proposal.proposalTitle}
              </h2>


              <div className="space-y-1 text-sm text-gray-500">
                <p>
                  Client:{" "}
                  <span className="font-medium text-gray-700">
                    {proposal.clientName}
                  </span>
                </p>

                <p>{proposal.clientEmail}</p>

                {proposal.clientCompany && (
                  <p>{proposal.clientCompany}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-w-[240px]">

              <div className="space-y-2 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Proposal No
                  </span>
                  <span className="font-medium text-gray-700">
                    {proposal.proposalNumber}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Issue Date
                  </span>
                  <span className="font-medium text-gray-700">
                    {proposal.issueDate}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Valid Until
                  </span>
                  <span className="font-medium text-gray-700">
                    {proposal.validUntil || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Status
                  </span>

                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {proposal.status || "Generated"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Viewer */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Page Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">

            <div>
              <h3 className="font-semibold text-gray-900">
                Page {currentPage}
              </h3>

              <p className="text-xs text-gray-400">
                {totalPages} pages total
              </p>
            </div>

            <div className="flex items-center gap-2">

              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((p) => p - 1)
                }
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-30"
              >
                ← Previous
              </button>

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => p + 1)
                }
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>

          {/* A4 Page */}
          <div className="bg-gray-200 p-6 flex justify-center">
<div
  className="
    bg-gray-300
    rounded-2xl
    w-full
    max-w-[980px]
    h-[80vh]
    overflow-y-auto
    p-8
    border
    border-gray-300
  "
>
              {/* Placeholder */}
             {/* Premium Proposal Body */}

<div
  ref={proposalRef}
  className="flex flex-col items-center gap-8"
>
  {activePage?.content ? (
    <div
      className="
        proposal-html
        bg-white
        w-[210mm]
        min-h-[297mm]
        p-[18mm]
        shadow-[0_10px_40px_rgba(0,0,0,0.15)]
        border
        border-gray-200
        rounded-md
        overflow-hidden
        break-after-page
      "
      dangerouslySetInnerHTML={{
        __html: activePage.content,
      }}
    />
  ) : (
    <div className="text-center text-gray-400 py-32">
      Proposal content will render here
    </div>
  )}
</div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-3 text-center text-xs text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>
    </div>
  );
}