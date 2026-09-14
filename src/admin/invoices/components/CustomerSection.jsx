import React, {
  useState,
} from "react";

import {
    Building2,
  ChevronDown,
  Pencil,
  Plus,
  UserRound,
} from "lucide-react";

import CustomerForm from "./CustomerForm";


const CustomerSection = ({
  customers,
  customerId,
  selectedCustomer,
  onChange,

  /*
    Newly created customer ko parent
    CreateInvoice tak bhejne ke liye.
  */
  onCustomerCreated,
   onCustomerUpdated,
}) => {
  const [showCustomerForm,setShowCustomerForm,] = useState(false);
  const [editingCustomer,setEditingCustomer,] = useState(null);
  const [customerDropdownOpen,setCustomerDropdownOpen,] = useState(false);

  /* =============================================
     CUSTOMER CREATED
  ============================================= */

  const handleCustomerCreated = (
    customer
  ) => {
    /*
      CustomerForm API se jo newly created
      customer return karega, use parent ko
      forward kar rahe hain.

      Next step me CreateInvoice:
      - customers list me add karega
      - new customer ko auto-select karega
    */

    if (
      typeof onCustomerCreated ===
      "function"
    ) {
      onCustomerCreated(customer);
    }
  };

  /* =============================================
   CUSTOMER SELECT
============================================= */

const handleCustomerSelect = (
  customer
) => {
  /*
    Existing CreateInvoice handleChange ko
    change nahi kar rahe.

    Same event-like object bhej rahe hain.
  */

  onChange({
    target: {
      name: "customerId",
      value: String(customer.id),
      type: "select-one",
    },
  });

  setCustomerDropdownOpen(false);
};


/* =============================================
   EDIT CUSTOMER
============================================= */

const handleEditCustomer = (
  event,
  customer
) => {
  /*
    Customer row click hone se selection
    trigger na ho.
  */

  event.stopPropagation();

  setEditingCustomer(customer);

  setCustomerDropdownOpen(false);

  setShowCustomerForm(true);
};


/* =============================================
   CUSTOMER UPDATED
============================================= */

const handleCustomerUpdated = (
  customer
) => {
  if (
    typeof onCustomerUpdated ===
    "function"
  ) {
    onCustomerUpdated(customer);
  }

  setEditingCustomer(null);
};


  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <UserRound size={17} />
            </div>


            <div>
              <h3 className="text-[15px] font-bold text-gray-800">
                Customer
              </h3>

              <p className="mt-0.5 text-[12px] text-gray-400">
                Select the customer receiving
                this invoice.
              </p>
            </div>
          </div>


          {/* ADD CUSTOMER BUTTON */}

          <button
            type="button"
           onClick={() => {
  /*
    Add mode me old editing customer
    nahi rehna chahiye.
  */

  setEditingCustomer(null);

  setShowCustomerForm(true);
}}
            className="
              inline-flex
              items-center
              justify-center
              gap-1.5
              rounded-xl
              border border-green-200
              bg-green-50
              px-3.5 py-2
              text-[12px]
              font-semibold
              text-green-700
              transition

              hover:border-green-300
              hover:bg-green-100
            "
          >
            <Plus size={14} />

            Add Customer
          </button>

        </div>


        {/* =====================================
            CUSTOMER SELECT
        ===================================== */}

        <div>
          <label className="mb-2 block text-[12px] font-semibold text-gray-600">
            Select Customer
          </label>

          <div className="relative">

  {/* SELECT BUTTON */}

  <button
    type="button"
    onClick={() =>
      setCustomerDropdownOpen(
        (previous) => !previous
      )
    }
    className="
      flex w-full
      items-center
      justify-between
      gap-3
      rounded-xl
      border border-gray-200
      bg-white
      px-3 py-2.5
      text-left
      text-[13px]
      text-gray-700
      outline-none
      transition

      hover:border-gray-300

      focus:border-green-400
      focus:ring-2
      focus:ring-green-100
    "
  >
    <span
      className={
        selectedCustomer
          ? "truncate text-gray-700"
          : "truncate text-gray-400"
      }
    >
      {selectedCustomer
        ? selectedCustomer.companyName
        : "Choose customer"}
    </span>

    <ChevronDown
      size={16}
      className={`
        shrink-0
        text-gray-400
        transition-transform

        ${
          customerDropdownOpen
            ? "rotate-180"
            : ""
        }
      `}
    />
  </button>


  {/* DROPDOWN */}

  {customerDropdownOpen && (
    <div
      className="
        absolute left-0 right-0
        top-full z-30
        mt-1.5
        max-h-64
        overflow-y-auto
        rounded-xl
        border border-gray-200
        bg-white
        p-1.5
        shadow-xl
        shadow-gray-200/60
      "
    >

      {customers.length === 0 ? (
        <div className="px-3 py-4 text-center text-[12px] text-gray-400">
          No customers found.
        </div>
      ) : (
        customers.map(
          (customer) => {
            const isSelected =
              String(customer.id) ===
              String(customerId);

            return (
              <div
                key={customer.id}
                onClick={() =>
                  handleCustomerSelect(
                    customer
                  )
                }
                className={`
                  group
                  flex cursor-pointer
                  items-center
                  justify-between
                  gap-3
                  rounded-lg
                  px-3 py-2.5
                  transition

                  ${
                    isSelected
                      ? "bg-green-50"
                      : "hover:bg-gray-50"
                  }
                `}
              >

                {/* CUSTOMER NAME */}

                <div className="min-w-0">
                  <p
                    className={`
                      truncate
                      text-[13px]
                      font-medium

                      ${
                        isSelected
                          ? "text-green-700"
                          : "text-gray-700"
                      }
                    `}
                  >
                    {
                      customer.companyName
                    }
                  </p>

                  {customer.contactPerson && (
                    <p className="mt-0.5 truncate text-[10px] text-gray-400">
                      {
                        customer.contactPerson
                      }
                    </p>
                  )}
                </div>


                {/* EDIT BUTTON */}

                <button
                  type="button"
                  onClick={(event) =>
                    handleEditCustomer(
                      event,
                      customer
                    )
                  }
                  className="
                    flex h-8 w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    text-gray-400
                    transition

                    hover:bg-white
                    hover:text-green-600
                    hover:shadow-sm
                  "
                  title="Edit customer"
                >
                  <Pencil size={14} />
                </button>

              </div>
            );
          }
        )
      )}

    </div>
  )}

</div>
        </div>


        {/* =====================================
            SELECTED CUSTOMER DETAILS
        ===================================== */}

        {selectedCustomer && (
          <div className="mt-4 rounded-xl border border-green-100 bg-green-50/60 p-4">

            <div className="mb-3 flex items-center gap-2">
              <Building2
                size={15}
                className="text-green-600"
              />

              <p className="text-[13px] font-semibold text-gray-700">
                {
                  selectedCustomer.companyName
                }
              </p>
            </div>


            <div className="grid grid-cols-1 gap-3 text-[12px] sm:grid-cols-2">

              {/* CONTACT PERSON */}

              <div>
                <p className="text-[10px] font-semibold uppercase text-gray-400">
                  Contact Person
                </p>

                <p className="mt-1 text-gray-600">
                  {
                    selectedCustomer
                      .contactPerson ||
                    "—"
                  }
                </p>
              </div>


              {/* EMAIL */}

              <div>
                <p className="text-[10px] font-semibold uppercase text-gray-400">
                  Email
                </p>

                <p className="mt-1 break-all text-gray-600">
                  {
                    selectedCustomer
                      .email ||
                    "—"
                  }
                </p>
              </div>


              {/* PHONE */}

              <div>
                <p className="text-[10px] font-semibold uppercase text-gray-400">
                  Phone
                </p>

                <p className="mt-1 text-gray-600">
                  {
                    selectedCustomer
                      .phone ||
                    "—"
                  }
                </p>
              </div>


              {/* GSTIN */}

              <div>
                <p className="text-[10px] font-semibold uppercase text-gray-400">
                  GSTIN
                </p>

                <p className="mt-1 text-gray-600">
                  {
                    selectedCustomer
                      .gstin ||
                    "—"
                  }
                </p>
              </div>

            </div>


            {/* BILLING ADDRESS */}

            <div className="mt-3 border-t border-green-100 pt-3">
              <p className="text-[10px] font-semibold uppercase text-gray-400">
                Billing Address
              </p>

              <p className="mt-1 whitespace-pre-line text-[12px] leading-5 text-gray-600">
                {
                  selectedCustomer
                    .address ||
                  "—"
                }
              </p>
            </div>

          </div>
        )}

      </section>


      {/* =======================================
          ADD CUSTOMER FORM / MODAL
      ======================================= */}

      <CustomerForm
  open={showCustomerForm}

  customer={
    editingCustomer
  }

  onClose={() => {
    setShowCustomerForm(false);

    setEditingCustomer(null);
  }}

  onCustomerCreated={
    handleCustomerCreated
  }

  onCustomerUpdated={
    handleCustomerUpdated
  }
/>
    </>
  );
};


export default CustomerSection;