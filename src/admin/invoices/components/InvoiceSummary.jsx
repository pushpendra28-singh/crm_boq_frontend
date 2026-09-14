import React from "react";
import {
  Calculator,
  Plus,
} from "lucide-react";

const InvoiceSummary = ({
  invoiceData,
  onChange,
  subtotal,
  discountAmount,
  taxableAmount,
  taxAmount,
  additionalChargeAmount,
  grandTotal,
  formatCurrency,
}) => {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">

      {/* HEADER */}

      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
          <Calculator size={17} />
        </div>

        <div>
          <h3 className="text-[15px] font-bold text-gray-800">
            Tax & Summary
          </h3>

          <p className="mt-0.5 text-[12px] text-gray-400">
            Configure discount, tax and additional charges.
          </p>
        </div>
      </div>


      {/* DISCOUNT */}

      <div>
        <label className="mb-2 block text-[12px] font-semibold text-gray-600">
          Discount
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_1fr]">

          <select
            name="discountType"
            value={invoiceData.discountType}
            onChange={onChange}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-700 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
          >
            <option value="percentage">
              Percentage
            </option>

            <option value="fixed">
              Fixed Amount
            </option>
          </select>


          <div className="relative">

            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">
              {invoiceData.discountType === "percentage"
                ? "%"
                : "₹"}
            </span>

            <input
              type="number"
              name="discountValue"
              min="0"
              max={
                invoiceData.discountType === "percentage"
                  ? 100
                  : undefined
              }
              value={invoiceData.discountValue}
              onChange={onChange}
              placeholder="0"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-8 pr-3 text-[13px] text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />

          </div>

        </div>
      </div>


      {/* TAX */}

      <div className="mt-5 border-t border-gray-100 pt-5">

        <div className="mb-3 flex items-center justify-between">

          <div>
            <p className="text-[12px] font-semibold text-gray-600">
              GST / Tax
            </p>

            <p className="mt-0.5 text-[11px] text-gray-400">
              Apply tax to taxable amount.
            </p>
          </div>


          <label className="relative inline-flex cursor-pointer items-center">

           <input
  type="checkbox"
  name="taxEnabled"
  checked={invoiceData.taxEnabled}
  onChange={onChange}
  className="peer sr-only"
/>

            <div className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-green-500" />

            <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />

          </label>

        </div>


        {invoiceData.taxEnabled && (

          <div>
            <label className="mb-2 block text-[11px] font-medium text-gray-500">
              GST Rate
            </label>

            <select
              name="taxRate"
              value={invoiceData.taxRate}
              onChange={onChange}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-700 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
            >
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>

          </div>

        )}

      </div>


      {/* ADDITIONAL CHARGE */}

      <div className="mt-5 border-t border-gray-100 pt-5">

        <div className="mb-3 flex items-center gap-2">

          <Plus size={14} className="text-green-500" />

          <p className="text-[12px] font-semibold text-gray-600">
            Additional Charge
          </p>

        </div>


        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

          <input
            type="text"
            name="additionalChargeName"
            value={invoiceData.additionalChargeName}
            onChange={onChange}
            placeholder="e.g. Delivery Charge"
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />


          <div className="relative">

            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">
              ₹
            </span>

            <input
              type="number"
              name="additionalChargeAmount"
              min="0"
              value={invoiceData.additionalChargeAmount}
              onChange={onChange}
              placeholder="0.00"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-7 pr-3 text-[13px] text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />

          </div>

        </div>

      </div>


      {/* CALCULATION SUMMARY */}

      <div className="mt-6 rounded-xl bg-gray-50 p-4">

        <div className="space-y-3">

          <div className="flex justify-between text-[12px] text-gray-500">
            <span>Subtotal</span>

            <span>
              {formatCurrency(subtotal)}
            </span>
          </div>


          {discountAmount > 0 && (

            <div className="flex justify-between text-[12px] text-red-500">

              <span>
                Discount
                {invoiceData.discountType === "percentage" &&
                  invoiceData.discountValue &&
                  ` (${invoiceData.discountValue}%)`}
              </span>

              <span>
                -{formatCurrency(discountAmount)}
              </span>

            </div>

          )}


          <div className="flex justify-between text-[12px] text-gray-500">

            <span>
              Taxable Amount
            </span>

            <span>
              {formatCurrency(taxableAmount)}
            </span>

          </div>


          {invoiceData.taxEnabled && (

            <div className="flex justify-between text-[12px] text-gray-500">

              <span>
                GST ({invoiceData.taxRate}%)
              </span>

              <span>
                {formatCurrency(taxAmount)}
              </span>

            </div>

          )}


          {additionalChargeAmount > 0 && (

            <div className="flex justify-between text-[12px] text-gray-500">

              <span>
                {invoiceData.additionalChargeName ||
                  "Additional Charge"}
              </span>

              <span>
                {formatCurrency(additionalChargeAmount)}
              </span>

            </div>

          )}


          <div className="border-t border-gray-200 pt-3">

            <div className="flex items-center justify-between">

              <span className="text-[14px] font-bold text-gray-700">
                Grand Total
              </span>

              <span className="text-[20px] font-black text-gray-800">
                {formatCurrency(grandTotal)}
              </span>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
};

export default InvoiceSummary;