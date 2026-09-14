import React from "react";
import { FileText } from "lucide-react";

const InvoiceNotesSection = ({
  notes,
  terms,
  onChange,
}) => {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-500">
          <FileText size={17} />
        </div>

        <div>
          <h3 className="text-[15px] font-bold text-gray-800">
            Notes & Terms
          </h3>

          <p className="mt-0.5 text-[12px] text-gray-400">
            Add optional notes and payment conditions.
          </p>
        </div>
      </div>


      <div className="space-y-4">

        {/* NOTES */}

        <div>
          <label className="mb-2 block text-[12px] font-semibold text-gray-600">
            Customer Note
          </label>

          <textarea
            name="notes"
            value={notes}
            onChange={onChange}
            rows="3"
            placeholder="e.g. Thank you for your business."
            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />
        </div>


        {/* TERMS */}

        <div>
          <label className="mb-2 block text-[12px] font-semibold text-gray-600">
            Terms & Conditions
          </label>

          <textarea
            name="terms"
            value={terms}
            onChange={onChange}
            rows="4"
            placeholder="Enter invoice terms and conditions..."
            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />
        </div>

      </div>

    </section>
  );
};

export default InvoiceNotesSection;