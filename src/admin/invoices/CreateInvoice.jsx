import React, { useMemo, useState, useEffect} from "react";
import { ArrowLeft, Pencil, Save } from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../../config/api";

import CustomerSection from "./components/CustomerSection";
import InvoiceDetailsSection from "./components/InvoiceDetailsSection";
import InvoiceItems from "./components/InvoiceItems";
import InvoiceSummary from "./components/InvoiceSummary";
import InvoicePreview from "./components/InvoicePreview";
import InvoiceNotesSection from "./components/InvoiceNotesSection";
import TemplateSelector from "./components/TemplateSelector";

import {
  DEFAULT_INVOICE_TEMPLATE,
} from "./invoice-document/templateRegistry";

import {
  getCustomers,
} from "./services/customerApi";
import {
  fetchInvoiceById,
   updateInvoice,
} from "./services/invoiceApi";

/* ---------------------------------------------
   Temporary customers
   Later ye MongoDB/backend API se aayenge.
---------------------------------------------- */



/* ---------------------------------------------
   Business Profile → Invoice Preview
---------------------------------------------- */

const formatBusinessAddress = (
  address = {}
) => {
  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .map((value) =>
      String(value || "").trim()
    )
    .filter(Boolean)
    .join(", ");
};

/* Today's date in YYYY-MM-DD format */
const getToday = () => {
  const date = new Date();

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().split("T")[0];
};

/* Add days to a date */
const addDays = (dateString, days) => {
  const date = new Date(dateString);

  date.setDate(date.getDate() + days);

  return date.toISOString().split("T")[0];
};

/* Date ko readable format me show karne ke liye */
const formatDate = (dateString) => {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};


const formatDateForInput = (
  dateString
) => {
  if (!dateString) {
    return "";
  }

  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .split("T")[0];
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);
};

const CreateInvoice = ({ onBack, invoiceId, businessProfile, onEditBusinessProfile, }) => {
  const today = getToday();
  const isEditMode =
    Boolean(invoiceId);

 const business = useMemo(
  () => ({
    name:
      businessProfile?.businessName ||
      "",

    logoUrl:
      businessProfile?.logoUrl ||
      "",

    email:
      businessProfile?.email ||
      "",

    phone:
      businessProfile?.phone ||
      "",

    address:
      formatBusinessAddress(
        businessProfile?.address
      ),

    gstin:
      businessProfile?.gstRegistered
        ? businessProfile?.gstin || ""
        : "",

    bank: {
      accountName:
        businessProfile?.bank
          ?.accountName || "",

      bankName:
        businessProfile?.bank
          ?.bankName || "",

      accountNumber:
        businessProfile?.bank
          ?.accountNumber || "",

      ifsc:
        businessProfile?.bank
          ?.ifsc || "",
    },

    authorizedSignatory:
      businessProfile
        ?.authorizedSignatory ||
      "",
  }),
  [businessProfile]
);

const [customers, setCustomers] =
  useState([]);

  const [isLoadingInvoice, setIsLoadingInvoice,] = useState(false);

const [isGenerating, setIsGenerating] =
  useState(false);

const [generatedInvoiceId, setGeneratedInvoiceId] =
  useState(null);

const [invoiceData, setInvoiceData] = useState({
  invoiceNumber: "INV-2026-0001",
  customerId: "",
  invoiceDate: today,
  dueDate: addDays(today, 15),

  items: [
    {
      id: Date.now(),
      description: "",
      quantity: 1,
      rate: "",
    },
  ],

  discountType: "percentage",
  discountValue: "",

  taxEnabled: true,
  taxRate: 18,

  additionalChargeName: "",
  additionalChargeAmount: "",

  template: {
      ...DEFAULT_INVOICE_TEMPLATE,
    },

  paymentTerms: "15",
  notes: "",
  terms:
    "Payment is due within the agreed payment period. Thank you for your business.",
});


/* ---------------------------------------------
   Load logged-in user's customers
---------------------------------------------- */

useEffect(() => {
  let isMounted = true;

  const loadCustomers = async () => {
    try {
      const customerList =
        await getCustomers();

      if (!isMounted) {
        return;
      }

      setCustomers(
        Array.isArray(customerList)
          ? customerList
          : []
      );
    } catch (error) {
      console.error(
        "Load customers error:",
        error
      );

      if (isMounted) {
        setCustomers([]);

        toast.error(
          error.message ||
            "Unable to load customers."
        );
      }
    }
  };

  loadCustomers();

  return () => {
    isMounted = false;
  };
}, []);

/* ---------------------------------------------
   Load invoice for edit mode
---------------------------------------------- */

useEffect(() => {
  /*
    Create mode me existing invoice
    fetch karne ki need nahi.
  */

  if (!invoiceId) {
    return;
  }


  const controller =
    new AbortController();


  const loadInvoice = async () => {
    try {
      setIsLoadingInvoice(true);

      const data =
        await fetchInvoiceById({
          invoiceId,
          signal:
            controller.signal,
        });

        if (controller.signal.aborted) {
  return;
}


      const invoice =
        data?.invoice;


      if (!invoice) {
        throw new Error(
          "Invoice data not found."
        );
      }


      /*
        Backend invoice ko existing
        CreateInvoice state structure me
        convert kar rahe hain.
      */

      setInvoiceData({
        invoiceNumber:
          invoice.invoiceNumber || "",

        customerId:
          invoice.customerId
            ? String(invoice.customerId)
            : "",

        invoiceDate:
          formatDateForInput(
            invoice.invoiceDate
          ),

        dueDate:
          formatDateForInput(
            invoice.dueDate
          ),

        items:
          Array.isArray(
            invoice.items
          ) &&
          invoice.items.length > 0
            ? invoice.items.map(
                (item, index) => ({
                  /*
                    Mongo invoice items me
                    frontend id stored nahi hai.

                    Ye sirf React/form handling
                    ke liye local id hai.
                  */
                  id:
                    `edit-${invoiceId}-${index}`,

                  description:
                    item.description || "",

                  quantity:
                    Number(
                      item.quantity
                    ) || 1,

                  rate:
                    Number(
                      item.rate
                    ) || 0,
                })
              )
            : [
                {
                  id: `edit-${invoiceId}-0`,
                  description: "",
                  quantity: 1,
                  rate: "",
                },
              ],

        discountType:
          invoice.discountType ||
          "percentage",

        discountValue:
          invoice.discountValue ??
          "",

        taxEnabled:
          Boolean(
            invoice.taxEnabled
          ),

        taxRate:
          invoice.taxRate ?? 0,

        additionalChargeName:
          invoice.additionalChargeName ||
          "",

        additionalChargeAmount:
          invoice.additionalChargeAmount ??
          "",

        template:
          invoice.template
            ? {
                key:
                  invoice.template
                    .key,

                version:
                  Number(
                    invoice.template
                      .version
                  ),
              }
            : {
                ...DEFAULT_INVOICE_TEMPLATE,
              },

        paymentTerms:
          invoice.paymentTerms ||
          "15",

        notes:
          invoice.notes || "",

        terms:
          invoice.terms || "",
      });

    } catch (error) {
      if (
  error?.name === "AbortError" ||
  controller.signal.aborted
) {
  return;
}

      console.error(
        "Load invoice for edit error:",
        error
      );

      toast.error(
        error.message ||
          "Unable to load invoice."
      );

      /*
        Invalid/foreign invoice ID ho to
        blank edit screen par user ko nahi
        chhodenge.
      */

      if (
        typeof onBack ===
        "function"
      ) {
        onBack();
      }

    } finally {
      if (
        !controller.signal
          .aborted
      ) {
        setIsLoadingInvoice(
          false
        );
      }
    }
  };


  loadInvoice();


  return () => {
    controller.abort();
  };
}, [invoiceId, onBack]);

  /*
    Selected customer find kar rahe hain.

    Agar customerId = "1"
    to CUSTOMERS me id = 1 wala customer milega.
  */

  const selectedCustomer = customers.find((customer) => 
    String(customer.id) === String(invoiceData.customerId)
  ) || null;

  /* ---------------------------------------------
   Newly created customer
---------------------------------------------- */

const handleCustomerCreated = (
  customer
) => {
  if (!customer?.id) {
    return;
  }


  /*
    Newly created customer ko dropdown list ke
    top par add kar rahe hain.
  */

  setCustomers((previous) => [
    customer,

    ...previous.filter(
      (item) =>
        String(item.id) !==
        String(customer.id)
    ),
  ]);


  /*
    Customer create hote hi automatically
    invoice me select ho jayega.
  */

  setInvoiceData((previous) => ({
    ...previous,

    customerId:
      String(customer.id),
  }));
};


/* ---------------------------------------------
   Updated customer
---------------------------------------------- */

const handleCustomerUpdated = (
  updatedCustomer
) => {
  if (!updatedCustomer?.id) {
    return;
  }

  setCustomers((previous) =>
    previous.map((customer) =>
      String(customer.id) ===
      String(updatedCustomer.id)
        ? updatedCustomer
        : customer
    )
  );
};


const handleChange = (event) => {
  const {
    name,
    value,
    type,
    checked,
  } = event.target;

  const finalValue =
    type === "checkbox"
      ? checked
      : value;

  setInvoiceData((previous) => {
    const updatedData = {
      ...previous,
      [name]: finalValue,
    };

    if (
      name === "invoiceDate" &&
      previous.paymentTerms !== "custom"
    ) {
      updatedData.dueDate = addDays(
        value,
        Number(previous.paymentTerms)
      );
    }

    return updatedData;
  });
};
/*
  ---------------------------------------------
  Invoice template selection
  ---------------------------------------------

  Nested template object ko generic handleChange
  se update nahi karenge.

  Ye handler sirf template selection ke liye hai.
*/
const handleTemplateSelect = (
  template
) => {
  if (
    !template?.key ||
    !template?.version
  ) {
    return;
  }


  setInvoiceData(
    (previous) => ({
      ...previous,

      template: {
        key:
          template.key,

        version:
          Number(
            template.version
          ),
      },
    })
  );
};


  const handleItemChange = (id, field, value) => {
  setInvoiceData((previous) => ({
    ...previous,

    items: previous.items.map((item) =>
      item.id === id
        ? {
            ...item,
            [field]: value,
          }
        : item
    ),
  }));
};


const addItem = () => {
  setInvoiceData((previous) => ({
    ...previous,

    items: [
      ...previous.items,
      {
        id: Date.now(),
        description: "",
        quantity: 1,
        rate: "",
      },
    ],
  }));
};



const removeItem = (id) => {
  setInvoiceData((previous) => {
    if (previous.items.length === 1) {
      return previous;
    }

    return {
      ...previous,

      items: previous.items.filter(
        (item) => item.id !== id
      ),
    };
  });
};



const calculateItemAmount = (item) => {
  const quantity = Number(item.quantity) || 0;
  const rate = Number(item.rate) || 0;

  return quantity * rate;
};

const subtotal = invoiceData.items.reduce(
  (total, item) => {
    return total + calculateItemAmount(item);
  },
  0
);


const rawDiscountValue =
  Number(invoiceData.discountValue) || 0;

const discountValue =
  invoiceData.discountType === "percentage"
    ? Math.min(Math.max(rawDiscountValue, 0), 100)
    : Math.max(rawDiscountValue, 0);

let discountAmount = 0;

if (invoiceData.discountType === "percentage") {
  discountAmount =
    subtotal * (discountValue / 100);
} else {
  discountAmount = discountValue;
}

discountAmount = Math.min(
  discountAmount,
  subtotal
);

const taxableAmount =
  subtotal - discountAmount;

  const taxRate =
  invoiceData.taxEnabled
    ? Number(invoiceData.taxRate) || 0
    : 0;

const taxAmount =
  taxableAmount * (taxRate / 100);

  const additionalChargeAmount =
  Number(invoiceData.additionalChargeAmount) || 0;

  const grandTotal =
  taxableAmount +
  taxAmount +
  additionalChargeAmount;


  const handlePaymentTermsChange = (event) => {
  const value = event.target.value;

  setInvoiceData((previous) => {
    let newDueDate = previous.dueDate;

    if (value !== "custom") {
      const days = Number(value);

      newDueDate = addDays(
        previous.invoiceDate,
        days
      );
    }

    return {
      ...previous,
      paymentTerms: value,
      dueDate: newDueDate,
    };
  });
};

const handleGenerateInvoice = async () => {
  if (generatedInvoiceId) {
    return;
  }

  /* ───────── Frontend basic validation ───────── */

  if (!selectedCustomer) {
    toast.error("Please select a customer.");
    return;
  }

  const validItems = invoiceData.items.filter(
    (item) =>
      item.description.trim() &&
      Number(item.quantity) > 0 &&
      Number(item.rate) >= 0
  );

  if (validItems.length !== invoiceData.items.length) {
    toast.error(
      "Please complete all invoice items."
    );
    return;
  }

  const token =
    localStorage.getItem("adminToken");

  if (!token) {
    toast.error(
      "Your session has expired. Please login again."
    );
    return;
  }

  try {
    setIsGenerating(true);

    const payload = {
     customerId: selectedCustomer.id,
    //   business: BUSINESS,

      invoiceDate:
        invoiceData.invoiceDate,

      dueDate:
        invoiceData.dueDate,

      paymentTerms:
        invoiceData.paymentTerms,

        template: {
  key:
    invoiceData.template.key,

  version:
    invoiceData.template.version,
},

      items: invoiceData.items.map(
        (item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
        })
      ),

      discountType:
        invoiceData.discountType,

      discountValue:
        Number(invoiceData.discountValue) || 0,

      taxEnabled:
        invoiceData.taxEnabled,

      taxRate:
        Number(invoiceData.taxRate) || 0,

      additionalChargeName:
        invoiceData.additionalChargeName,

      additionalChargeAmount:
        Number(
          invoiceData.additionalChargeAmount
        ) || 0,

      notes:
        invoiceData.notes,

      terms:
        invoiceData.terms,
    };

let data;


/* ---------------------------------------------
   EDIT MODE
---------------------------------------------- */

if (isEditMode) {
  data = await updateInvoice({
    invoiceId,
    payload,
  });
}


/* ---------------------------------------------
   CREATE MODE
---------------------------------------------- */

else {
  const response = await fetch(
    `${API_BASE_URL}/invoices`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(payload),
    }
  );

  data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to generate invoice."
    );
  }
}


if (isEditMode) {
  toast.success(
    `Invoice ${data.invoice.invoiceNumber} updated successfully`
  );

  if (
    typeof onBack ===
    "function"
  ) {
    onBack();
  }

  return;
}

    setGeneratedInvoiceId(
      data.invoice.id
    );

    /*
      Backend invoice number ko frontend
      preview me update kar rahe hain.
    */
   setInvoiceData(
  (previous) => ({
    ...previous,

    invoiceNumber:
      data.invoice.invoiceNumber,

    /*
      Backend validated/sanitized template
      ko final source of truth maan rahe hain.

      Fallback se backward compatibility
      preserve rahegi.
    */
    template:
      data.invoice.template
        ? {
            key:
              data.invoice
                .template.key,

            version:
              Number(
                data.invoice
                  .template
                  .version
              ),
          }
        : previous.template,
  })
);

    toast.success(
      `Invoice ${data.invoice.invoiceNumber} generated successfully`
    );
  } catch (error) {
    console.error(
      "Generate invoice error:",
      error
    );

    toast.error(
      error.message ||
        "Unable to generate invoice."
    );
  } finally {
    setIsGenerating(false);
  }
};

return (
  <div className="space-y-6">

    {/* HEADER */}

    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
        >
          <ArrowLeft size={17} />
        </button>

        <div>
         <h2 className="text-2xl font-black text-gray-800">
  {isEditMode
    ? "Edit Invoice"
    : "Create Invoice"}
</h2>

          <p className="mt-1 text-sm text-gray-400">
  {isEditMode
    ? "Update the existing invoice details and save your changes."
    : "Create a professional invoice and preview it instantly."}
</p>
        </div>
      </div>

     <div className="flex flex-wrap items-center gap-2">

  <button
    type="button"
    onClick={
      onEditBusinessProfile
    }
    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-600 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
  >
    <Pencil size={15} />

    Edit Business Profile
  </button>


  <button
    type="button"
    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-600 transition hover:bg-gray-50"
  >
    <Save size={16} />

    Save Draft
  </button>

</div>
    </div>


    {/* FORM + PREVIEW */}

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] xl:items-start">

      {/* LEFT */}

      <div className="space-y-5 xl:h-[calc(100vh-210px)] xl:overflow-y-auto xl:overscroll-contain xl:pr-2">

   <CustomerSection
          customers={customers}
  customerId={invoiceData.customerId}
  selectedCustomer={selectedCustomer}
  onChange={handleChange}
  onCustomerCreated={ handleCustomerCreated}
  onCustomerUpdated={
  handleCustomerUpdated
}
        />
l
        <InvoiceDetailsSection
          invoiceNumber={invoiceData.invoiceNumber}
  invoiceDate={invoiceData.invoiceDate}
  dueDate={invoiceData.dueDate}
  paymentTerms={invoiceData.paymentTerms}
  onChange={handleChange}
  onPaymentTermsChange={handlePaymentTermsChange}
        />

        <TemplateSelector
  selectedTemplate={
    invoiceData.template
  }
  onSelect={
    handleTemplateSelect
  }
/>

        <InvoiceItems
          items={invoiceData.items}
          addItem={addItem}
          removeItem={removeItem}
          handleItemChange={handleItemChange}
          calculateItemAmount={calculateItemAmount}
          formatCurrency={formatCurrency}
          subtotal={subtotal}
        />

        <InvoiceSummary
  invoiceData={invoiceData}
  onChange={handleChange}
  subtotal={subtotal}
  discountAmount={discountAmount}
  taxableAmount={taxableAmount}
  taxAmount={taxAmount}
  additionalChargeAmount={additionalChargeAmount}
  grandTotal={grandTotal}
  formatCurrency={formatCurrency}
/>


<InvoiceNotesSection
  notes={invoiceData.notes}
  terms={invoiceData.terms}
  onChange={handleChange}
/>

      </div>


      {/* RIGHT */}

    {/* RIGHT - INDEPENDENT SCROLL */}

<div className="xl:h-[calc(100vh-210px)] xl:overflow-y-auto xl:overscroll-contain xl:pr-2">

  <InvoicePreview
    business={business}
    invoiceData={invoiceData}
    selectedCustomer={selectedCustomer}
    formatDate={formatDate}
    formatCurrency={formatCurrency}
    calculateItemAmount={calculateItemAmount}
    subtotal={subtotal}
    discountAmount={discountAmount}
    taxableAmount={taxableAmount}
    taxAmount={taxAmount}
    additionalChargeAmount={additionalChargeAmount}
    grandTotal={grandTotal}
    onGenerate={handleGenerateInvoice}
    isGenerating={isGenerating}
    isGenerated={Boolean(generatedInvoiceId)}
    isEditMode={isEditMode}
  />
</div>

    </div>

  </div>
);
};

export default CreateInvoice;