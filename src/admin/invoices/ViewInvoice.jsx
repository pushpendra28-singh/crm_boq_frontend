import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  LoaderCircle,
  RefreshCw,
  Mail,
} from "lucide-react";

import {
  fetchInvoiceById,
} from "./services/invoiceApi";

import {
  normalizeStoredInvoice,
} from "./invoice-document/invoiceAdapters";

import InvoiceDocumentPreview from "./invoice-document/InvoiceDocumentPreview";
import SendInvoiceModal
  from "./components/SendInvoiceModal";


const ViewInvoice = ({
  invoiceId,
  onBack,
}) => {
  const [invoice, setInvoice] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshKey, setRefreshKey] =
    useState(0);

    const [
  showSendInvoice,
  setShowSendInvoice,
] = useState(false);


  /* ─────────────────────────────────────────
     Fetch single invoice
  ───────────────────────────────────────── */

  useEffect(() => {
    const controller =
      new AbortController();


    const loadInvoice = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data =
          await fetchInvoiceById({
            invoiceId,
            signal:
              controller.signal,
          });

        setInvoice(
          data.invoice
        );
      } catch (error) {
        if (
          error.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "Load invoice error:",
          error
        );

        setInvoice(null);

        setError(
          error.message ||
            "Unable to load invoice."
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    };


    loadInvoice();


    return () => {
      controller.abort();
    };
  }, [
    invoiceId,
    refreshKey,
  ]);


  /* ─────────────────────────────────────────
     Normalize stored invoice

     Database invoice structure:
     customerSnapshot
     businessSnapshot
     ...

     Common template structure:
     customer
     business
     ...
  ───────────────────────────────────────── */

  const normalizedInvoice =
    useMemo(() => {
      if (!invoice) {
        return null;
      }

      return normalizeStoredInvoice(
        invoice
      );
    }, [invoice]);


  /* ─────────────────────────────────────────
     Page-only helper
  ───────────────────────────────────────── */

  const getStatusClasses = (
    status
  ) => {
    switch (status) {
      case "paid":
        return "bg-green-50 text-green-600";

      case "cancelled":
        return "bg-red-50 text-red-500";

      case "unpaid":
        return "bg-amber-50 text-amber-600";

      default:
        return "bg-gray-100 text-gray-500";
    }
  };


  /* ─────────────────────────────────────────
     Loading
  ───────────────────────────────────────── */

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
        <div className="text-center">
          <LoaderCircle
            size={30}
            className="mx-auto animate-spin text-green-500"
          />

          <p className="mt-3 text-[13px] text-gray-500">
            Loading invoice...
          </p>
        </div>
      </div>
    );
  }


  /* ─────────────────────────────────────────
     Error
  ───────────────────────────────────────── */

  if (error) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft
            size={16}
          />

          Back to Invoices
        </button>


        <div className="rounded-2xl border border-red-100 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
            <AlertCircle
              size={22}
              className="text-red-500"
            />
          </div>

          <h3 className="mt-4 text-[15px] font-semibold text-gray-800">
            Unable to load invoice
          </h3>

          <p className="mx-auto mt-1 max-w-md text-[13px] text-gray-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setRefreshKey(
                (previous) =>
                  previous + 1
              )
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            <RefreshCw
              size={15}
            />

            Try Again
          </button>
        </div>
      </div>
    );
  }


  if (
    !invoice ||
    !normalizedInvoice
  ) {
    return null;
  }


  return (
    <div className="space-y-6">
      {/* ===============================
          PAGE HEADER
      =============================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
          >
            <ArrowLeft
              size={17}
            />
          </button>


          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black text-gray-800">
                {
                  invoice.invoiceNumber
                }
              </h2>

              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusClasses(
                  invoice.status
                )}`}
              >
                {invoice.status}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Invoice details and billing information.
            </p>
          </div>
        </div>

        <button
  type="button"
  onClick={() =>
    setShowSendInvoice(true)
  }
  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-green-600"
>
  <Mail size={16} />

  Send Invoice
</button>
      </div>


      {/* ===============================
          COMMON INVOICE DOCUMENT
      =============================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
      <InvoiceDocumentPreview
  invoice={
    normalizedInvoice
  }

  showActions

  fileName={
    invoice.invoiceNumber
  }
/>
        <SendInvoiceModal
  open={showSendInvoice}

  onClose={() =>
    setShowSendInvoice(false)
  }

  invoiceId={
    invoice.id
  }

  invoiceNumber={
    invoice.invoiceNumber
  }

  defaultEmail={
    invoice
      .customerSnapshot
      ?.email || ""
  }
/>
      </div>
    </div>
  


  );
};


export default ViewInvoice;