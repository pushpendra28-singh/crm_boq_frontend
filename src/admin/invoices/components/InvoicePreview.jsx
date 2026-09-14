import React, {
  useMemo,
} from "react";

import {
  normalizePreviewInvoice,
} from "../invoice-document/invoiceAdapters";

import InvoiceDocumentPreview from "../invoice-document/InvoiceDocumentPreview";


const InvoicePreview = ({
  business,
  invoiceData,
  selectedCustomer,

  subtotal,
  discountAmount,
  taxableAmount,
  taxAmount,
  additionalChargeAmount,
  grandTotal,

  onGenerate,
  isGenerating,
  isGenerated,
  isEditMode,

}) => {
  /*
    CreateInvoice ke current state ko
    common invoice contract me convert kar rahe hain.

    Existing calculation / API logic ko
    bilkul touch nahi kar rahe.
  */
  const normalizedInvoice =
    useMemo(() => {
      return normalizePreviewInvoice({
        invoiceData,
        selectedCustomer,
        business,

        subtotal,
        discountAmount,
        taxableAmount,
        taxAmount,
        additionalChargeAmount,
        grandTotal,
      });
    }, [
      invoiceData,
      selectedCustomer,
      business,

      subtotal,
      discountAmount,
      taxableAmount,
      taxAmount,
      additionalChargeAmount,
      grandTotal,
    ]);


  return (
    <div className="w-full">
      {/* =====================================
          PREVIEW HEADER
      ===================================== */}

      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900">
            Live Preview
          </h3>

          <p className="mt-1 text-[12px] leading-5 text-slate-500">
            Updates automatically as you create the invoice.
          </p>
        </div>

        <div className="flex-shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            A4 Preview
          </span>
        </div>
      </div>


      {/* =====================================
          COMMON DOCUMENT PREVIEW
      ===================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
        <InvoiceDocumentPreview
          invoice={
            normalizedInvoice
          }
        />
      </div>


      {/* =====================================
          GENERATE BUTTON
          Existing logic unchanged
      ===================================== */}

      <button
        type="button"
        onClick={onGenerate}
        disabled={
          isGenerating ||
          isGenerated
        }
        className="
          mt-4
          inline-flex
          w-full
          items-center
          justify-center
          rounded-xl
          bg-green-500
          px-5
          py-3
          text-[13px]
          font-bold
          text-white
          shadow-sm
          transition
          hover:bg-green-600
          focus:outline-none
          focus:ring-4
          focus:ring-green-500/10
          disabled:cursor-not-allowed
          disabled:bg-green-300
          disabled:shadow-none
        "
      >
       {isGenerating
  ? isEditMode
    ? "Updating Invoice..."
    : "Generating Invoice..."
  : isGenerated
    ? isEditMode
      ? "Invoice Updated"
      : "Invoice Generated"
    : isEditMode
      ? "Update Invoice"
      : "Generate Invoice"}
      </button>
    </div>
  );
};


export default InvoicePreview;