import React from "react";
import {
  PackagePlus,
  Plus,
  Trash2,
} from "lucide-react";

const InvoiceItems = ({
  items,
  addItem,
  removeItem,
  handleItemChange,
  calculateItemAmount,
  formatCurrency,
  subtotal,
}) => {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
            <PackagePlus size={17} />
          </div>

          <div>
            <h3 className="text-[15px] font-bold text-gray-800">
              Items & Services
            </h3>

            <p className="mt-0.5 text-[12px] text-gray-400">
              Add products or services included in this invoice.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-[12px] font-semibold text-green-600 transition hover:bg-green-100"
        >
          <Plus size={14} />
          Add Item
        </button>
      </div>

      <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_80px_130px_130px_40px] gap-3 px-1 md:grid">
        <span className="text-[10px] font-semibold uppercase text-gray-400">
          Description
        </span>

        <span className="text-[10px] font-semibold uppercase text-gray-400">
          Qty
        </span>

        <span className="text-[10px] font-semibold uppercase text-gray-400">
          Rate
        </span>

        <span className="text-[10px] font-semibold uppercase text-gray-400">
          Amount
        </span>

        <span />
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const amount = calculateItemAmount(item);

          return (
            <div
              key={item.id}
              className="rounded-xl border border-gray-200 bg-white p-3 md:grid md:grid-cols-[minmax(0,1fr)_80px_130px_130px_40px] md:items-center md:gap-3 md:p-2"
            >
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400 md:hidden">
                  Description
                </label>

                <input
                  type="text"
                  value={item.description}
                  onChange={(event) =>
                    handleItemChange(
                      item.id,
                      "description",
                      event.target.value
                    )
                  }
                  placeholder={`Item ${index + 1}`}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div className="mt-3 md:mt-0">
                <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400 md:hidden">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) =>
                    handleItemChange(
                      item.id,
                      "quantity",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] text-gray-700 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div className="mt-3 md:mt-0">
                <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400 md:hidden">
                  Rate
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(event) =>
                      handleItemChange(
                        item.id,
                        "rate",
                        event.target.value
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-7 pr-3 text-[13px] text-gray-700 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              <div className="mt-3 md:mt-0">
                <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400 md:hidden">
                  Amount
                </label>

                <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-[12px] font-semibold text-gray-700">
                  {formatCurrency(amount)}
                </div>
              </div>

              <div className="mt-3 flex justify-end md:mt-0">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 py-3 text-[12px] font-semibold text-gray-400 transition hover:border-green-300 hover:bg-green-50/50 hover:text-green-600"
      >
        <Plus size={15} />
        Add another item
      </button>

      <div className="mt-5 flex justify-end border-t border-gray-100 pt-4">
        <div className="flex items-center gap-8">
          <span className="text-[12px] font-medium text-gray-400">
            Subtotal
          </span>

          <span className="text-[15px] font-bold text-gray-800">
            {formatCurrency(subtotal)}
          </span>
        </div>
      </div>
    </section>
  );
};

export default InvoiceItems;