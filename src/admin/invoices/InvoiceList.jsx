import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { fetchInvoices, deleteInvoice } from "./services/invoiceApi";


const InvoiceList = ({ onCreate, onView, onEdit }) => {
  const [invoices, setInvoices] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

const [isDeleting, setIsDeleting] = useState(false);

/* ─────────────────────────────────────────────
   Confirm invoice deletion
───────────────────────────────────────────── */

const handleConfirmDelete =
  async () => {
    if (
      !invoiceToDelete?.id ||
      isDeleting
    ) {
      return;
    }


    try {
      setIsDeleting(true);


      await deleteInvoice({
        invoiceId:
          invoiceToDelete.id,
      });


      toast.success(
        `Invoice ${
          invoiceToDelete.invoiceNumber ||
          ""
        } deleted successfully`
      );


      setInvoiceToDelete(null);


      /*
        Current page par sirf ek invoice
        tha aur page > 1 hai to previous
        page par chale jayenge.

        Otherwise current page refresh.
      */

      if (
        invoices.length === 1 &&
        page > 1
      ) {
        setPage(
          (previous) =>
            previous - 1
        );
      } else {
        setRefreshKey(
          (previous) =>
            previous + 1
        );
      }

    } catch (error) {
      console.error(
        "Delete invoice error:",
        error
      );

      toast.error(
        error.message ||
          "Unable to delete invoice."
      );

    } finally {
      setIsDeleting(false);
    }
  };


  /* ─────────────────────────────────────────────
     Fetch invoices
  ───────────────────────────────────────────── */

  useEffect(() => {
    const controller = new AbortController();

    const loadInvoices = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await fetchInvoices({
          page,
          limit: 10,
          signal: controller.signal,
        });

        setInvoices(
          Array.isArray(data.invoices)
            ? data.invoices
            : []
        );

        setPagination(
          data.pagination || {
            page,
            limit: 10,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (error) {
        /*
          Component unmount hone ki wajah se request
          cancel hui hai to user ko error nahi dikhana.
        */
        if (error.name === "AbortError") {
          return;
        }

        console.error(
          "Load invoices error:",
          error
        );

        setInvoices([]);

        setError(
          error.message ||
            "Unable to load invoices."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadInvoices();

    /*
      InvoiceList unmount ho jaye ya page change
      ho jaye to previous request cancel.
    */
    return () => {
      controller.abort();
    };
  }, [page, refreshKey]);


  /* ─────────────────────────────────────────────
     Helpers
  ───────────────────────────────────────────── */

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };


  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  const getStatusClasses = (status) => {
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


  const handleRetry = () => {
    setRefreshKey(
      (previous) => previous + 1
    );
  };


  const handlePreviousPage = () => {
    setPage((previous) =>
      Math.max(previous - 1, 1)
    );
  };


  const handleNextPage = () => {
    setPage((previous) => {
      if (
        pagination.totalPages &&
        previous >= pagination.totalPages
      ) {
        return previous;
      }

      return previous + 1;
    });
  };


  return (
    <div className="space-y-6">

      {/* ===============================
          HEADER
      =============================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800">
            Invoices
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Create, manage and track customer invoices.
          </p>
        </div>


        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-green-600"
        >
          <Plus size={17} />

          Create Invoice
        </button>
      </div>


      {/* ===============================
          LOADING
      =============================== */}

      {isLoading && (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="text-center">
            <LoaderCircle
              size={28}
              className="mx-auto animate-spin text-green-500"
            />

            <p className="mt-3 text-[13px] text-gray-400">
              Loading invoices...
            </p>
          </div>
        </div>
      )}


      {/* ===============================
          ERROR
      =============================== */}

      {!isLoading && error && (
        <div className="rounded-2xl border border-red-100 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
            <AlertCircle
              size={22}
              className="text-red-500"
            />
          </div>

          <h3 className="mt-4 text-[15px] font-semibold text-gray-800">
            Unable to load invoices
          </h3>

          <p className="mx-auto mt-1 max-w-md text-[13px] leading-5 text-gray-400">
            {error}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            <RefreshCw size={15} />

            Try Again
          </button>
        </div>
      )}


      {/* ===============================
          EMPTY STATE
      =============================== */}

      {!isLoading &&
        !error &&
        invoices.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
              <FileText
                size={24}
                strokeWidth={1.8}
                className="text-green-500"
              />
            </div>

            <h3 className="mt-4 text-[15px] font-semibold text-gray-800">
              No invoices yet
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-[13px] leading-5 text-gray-400">
              Create your first professional invoice and it will appear here.
            </p>

            <button
              type="button"
              onClick={onCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-green-600"
            >
              <Plus size={16} />

              Create Invoice
            </button>
          </div>
        )}


      {/* ===============================
          INVOICE LIST
      =============================== */}

      {!isLoading &&
        !error &&
        invoices.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">

            {/* LIST HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-[14px] font-bold text-gray-800">
                  All Invoices
                </h3>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  {pagination.total} invoice
                  {pagination.total !== 1
                    ? "s"
                    : ""}{" "}
                  found
                </p>
              </div>

              <button
                type="button"
                onClick={handleRetry}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                title="Refresh invoices"
              >
                <RefreshCw size={15} />
              </button>
            </div>


            {/* TABLE */}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-left">
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Invoice
                    </th>

                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Invoice Date
                    </th>

                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Due Date
                    </th>

                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Status
                    </th>

                   <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400">
  Amount
</th>

<th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
  View
</th>

<th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
  Edit
</th>

<th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
  Delete
</th>
                  </tr>
                </thead>


                <tbody className="divide-y divide-gray-100">
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="transition hover:bg-gray-50/60"
                    >
                      {/* INVOICE NUMBER */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-500">
                            <FileText size={16} />
                          </div>

                          <span className="text-[13px] font-bold text-gray-700">
                            {invoice.invoiceNumber}
                          </span>
                        </div>
                      </td>


                      {/* CUSTOMER */}

                      <td className="px-5 py-4">
                        <p className="text-[13px] font-medium text-gray-700">
                          {invoice.customerName ||
                            "—"}
                        </p>
                      </td>


                      {/* INVOICE DATE */}

                      <td className="px-5 py-4 text-[12px] text-gray-500">
                        {formatDate(
                          invoice.invoiceDate
                        )}
                      </td>


                      {/* DUE DATE */}

                      <td className="px-5 py-4 text-[12px] text-gray-500">
                        {formatDate(
                          invoice.dueDate
                        )}
                      </td>


                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusClasses(
                            invoice.status
                          )}`}
                        >
                          {invoice.status}
                        </span>
                      </td>


                      {/* AMOUNT */}

                      <td className="px-5 py-4 text-right">
                        <span className="text-[13px] font-bold text-gray-800">
                          {formatCurrency(
                            invoice.grandTotal
                          )}
                        </span>
                      </td>
                    {/* VIEW */}

<td className="px-5 py-4 text-center">
  <button
    type="button"
    onClick={() =>
      onView(invoice.id)
    }
    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-green-200 hover:bg-green-50 hover:text-green-600"
    title="View invoice"
  >
    <Eye size={15} />
  </button>
</td>


{/* EDIT */}

<td className="px-5 py-4 text-center">
  <button
    type="button"
    onClick={() =>
      onEdit(invoice.id)
    }
    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-green-200 hover:bg-green-50 hover:text-green-600"
    title="Edit invoice"
  >
    <Pencil size={15} />
  </button>
</td>



<td className="px-5 py-4 text-center">
   <button
      type="button"
      onClick={() =>
        setInvoiceToDelete(
          invoice
        )
      }
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      title="Delete invoice"
    >
      <Trash2 size={15} />
    </button>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


            {/* ===============================
                PAGINATION
            =============================== */}

            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-[12px] text-gray-400">
                Page{" "}
                <span className="font-semibold text-gray-600">
                  {pagination.page}
                </span>

                {pagination.totalPages > 0 && (
                  <>
                    {" "}
                    of{" "}
                    <span className="font-semibold text-gray-600">
                      {pagination.totalPages}
                    </span>
                  </>
                )}
              </p>


              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />

                  Previous
                </button>


                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={
                    pagination.totalPages === 0 ||
                    page >= pagination.totalPages
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next

                  <ChevronRight size={14} />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────
    DELETE CONFIRMATION MODAL
───────────────────────────────────────── */}

{invoiceToDelete && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">

    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">

      {/* ICON */}

      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <Trash2 size={21} />
      </div>


      {/* CONTENT */}

      <h3 className="mt-4 text-lg font-bold text-gray-800">
        Delete Invoice?
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-gray-700">
          {invoiceToDelete.invoiceNumber}
        </span>
        ? This action cannot be undone.
      </p>


      {/* ACTIONS */}

      <div className="mt-6 flex justify-end gap-3">

        <button
          type="button"
          disabled={isDeleting}
          onClick={() =>
            setInvoiceToDelete(null)
          }
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>


        <button
          type="button"
          disabled={isDeleting}
          onClick={
            handleConfirmDelete
          }
          className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {isDeleting ? (
            <>
              <LoaderCircle
                size={15}
                className="animate-spin"
              />

              Deleting...
            </>
          ) : (
            <>
              <Trash2
                size={15}
              />

              Delete
            </>
          )}
        </button>

      </div>

    </div>
  </div>
)}

    </div>
  );
};

export default InvoiceList;