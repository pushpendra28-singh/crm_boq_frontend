import React from "react";
import { CalendarDays } from "lucide-react";

const InvoiceDetailsSection = ({
   invoiceNumber,
  invoiceDate,
  dueDate,
  paymentTerms,
  onChange,
  onPaymentTermsChange,
}) => {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
          <CalendarDays size={17} />
        </div>

        <div>
          <h3 className="text-[15px] font-bold text-gray-800">
            Invoice Details
          </h3>

          <p className="mt-0.5 text-[12px] text-gray-400">
            Manage invoice number and payment dates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-2 block text-[12px] font-semibold text-gray-600">
            Invoice Number
          </label>

          <input
            type="text"
            value={invoiceNumber}
            disabled
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] font-medium text-gray-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-[12px] font-semibold text-gray-600">
            Invoice Date
          </label>

          <input
            type="date"
            name="invoiceDate"
            value={invoiceDate}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-700 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />
        </div>

        <div>
  <label className="mb-2 block text-[12px] font-semibold text-gray-600">
    Payment Terms
  </label>

  <select
    value={paymentTerms}
    onChange={onPaymentTermsChange}
    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-700 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
  >
    <option value="0">
      Due on Receipt
    </option>

    <option value="7">
      7 Days
    </option>

    <option value="15">
      15 Days
    </option>

    <option value="30">
      30 Days
    </option>

    <option value="45">
      45 Days
    </option>

    <option value="custom">
      Custom Date
    </option>
  </select>
</div>

        <div>
          <label className="mb-2 block text-[12px] font-semibold text-gray-600">
            Due Date
          </label>

         <input
  type="date"
  name="dueDate"
  value={dueDate}
  onChange={onChange}
  disabled={paymentTerms !== "custom"}
  className={`w-full rounded-xl border px-3 py-2.5 text-[13px] outline-none transition
    ${
      paymentTerms !== "custom"
        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500"
        : "border-gray-200 bg-white text-gray-700 focus:border-green-400 focus:ring-2 focus:ring-green-100"
    }
  `}
/>
        </div>
      </div>
    </section>
  );
};

export default InvoiceDetailsSection;