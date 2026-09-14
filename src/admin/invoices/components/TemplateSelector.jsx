import React from "react";
import {
  Check,
  LayoutTemplate,
} from "lucide-react";

import {
  getAvailableInvoiceTemplates,
} from "../invoice-document/templateRegistry";


const TemplateSelector = ({
  selectedTemplate,
  onSelect,
}) => {
  /*
    Templates UI me hard-code nahi hain.

    Registry me jo available templates honge,
    wahi automatically yahan show honge.
  */
  const templates =
    getAvailableInvoiceTemplates();


  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* HEADER */}

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
          <LayoutTemplate
            size={17}
          />
        </div>

        <div>
          <h3 className="text-[14px] font-bold text-slate-900">
            Invoice Template
          </h3>

          <p className="mt-1 text-[12px] leading-5 text-slate-500">
            Choose the layout that will be used for this invoice.
          </p>
        </div>
      </div>


      {/* TEMPLATE OPTIONS */}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {templates.map(
          (template) => {
            const isSelected =
              selectedTemplate?.key ===
                template.key &&
              Number(
                selectedTemplate?.version
              ) ===
                Number(
                  template.version
                );


            return (
              <button
                key={`${template.key}-${template.version}`}
                type="button"
                onClick={() =>
                  onSelect({
                    key: template.key,
                    version:
                      template.version,
                  })
                }
                aria-pressed={
                  isSelected
                }
                className={`
                  relative
                  rounded-xl
                  border
                  p-4
                  text-left
                  transition
                  duration-200
                  ${
                    isSelected
                      ? "border-green-500 bg-green-50/60 ring-2 ring-green-500/10"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }
                `}
              >
                {/* SELECTED CHECK */}

                {isSelected && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                    <Check
                      size={12}
                      strokeWidth={3}
                    />
                  </div>
                )}


                <div className="pr-7">
                  <p className="text-[13px] font-bold text-slate-900">
                    {template.name}
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    {
                      template.description
                    }
                  </p>

                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Version{" "}
                    {
                      template.version
                    }
                  </p>
                </div>
              </button>
            );
          }
        )}
      </div>
    </section>
  );
};


export default TemplateSelector;