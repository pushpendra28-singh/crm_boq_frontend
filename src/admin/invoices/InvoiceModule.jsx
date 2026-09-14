import React, { useCallback, useState } from "react";

import InvoiceList from "./InvoiceList";
import CreateInvoice from "./CreateInvoice";
import ViewInvoice from "./ViewInvoice";

import BusinessProfileGate from "./components/business-profile/BusinessProfileGate";


const InvoiceModule = () => {
  const [view, setView] = useState("list");

  const [selectedInvoiceId, setSelectedInvoiceId] =
    useState(null);


  /* ─────────────────────────────────────────
     Open invoice
  ───────────────────────────────────────── */

  const handleViewInvoice = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);

    setView("view");
  };

  /* ─────────────────────────────────────────
   Edit invoice
───────────────────────────────────────── */

const handleEditInvoice = (invoiceId) => {
  setSelectedInvoiceId(invoiceId);

  setView("create");
};

/* ─────────────────────────────────────────
   Create new invoice
───────────────────────────────────────── */

const handleCreateInvoice = () => {
  setSelectedInvoiceId(null);

  setView("create");
};


  /* ─────────────────────────────────────────
     Back to invoice list
  ───────────────────────────────────────── */

 const handleBackToList =
  useCallback(() => {
    setSelectedInvoiceId(null);

    setView("list");
  }, []);


  /* CREATE */

if (view === "create") {
  return (
    <BusinessProfileGate>
      {({
        businessProfile,
        onEditBusinessProfile,
      }) => (
        <CreateInvoice
          onBack={handleBackToList}
          invoiceId={selectedInvoiceId}
          businessProfile={
            businessProfile
          }
          onEditBusinessProfile={
            onEditBusinessProfile
          }
        />
      )}
    </BusinessProfileGate>
  );
}


  /* VIEW */

  if (view === "view" && selectedInvoiceId) {
    return (
      <ViewInvoice
        invoiceId={selectedInvoiceId}
        onBack={handleBackToList}
      />
    );
  }


  /* LIST */

  return (
   <InvoiceList
  onCreate={
    handleCreateInvoice
  }

  onView={
    handleViewInvoice
  }

  onEdit={
    handleEditInvoice
  }
/>
  );
};


export default InvoiceModule;