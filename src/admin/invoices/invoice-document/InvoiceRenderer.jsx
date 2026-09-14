import React from "react";

import {
  getInvoiceTemplate,
} from "./templateRegistry";


const InvoiceRenderer = ({
  invoice,
  template,
}) => {
  /*
    Invoice ke bina document render
    karne ka koi meaning nahi.
  */
  if (!invoice) {
    return null;
  }


  /*
    Priority:

    1. Explicit template prop
       → useful for live CreateInvoice preview

    2. invoice.template
       → useful for stored ViewInvoice

    3. Registry automatically default
       → modern v1
  */
  const selectedTemplate =
    template ||
    invoice.template;


  const {
    component:
      TemplateComponent,

  } = getInvoiceTemplate(
    selectedTemplate
  );


  /*
    Every invoice template ka common contract:

    <Template invoice={invoice} />

    Template ko:
    - CreateInvoice
    - MongoDB
    - customerSnapshot
    - BUSINESS constant

    ke baare me kuch pata nahi.
  */
  return (
    <TemplateComponent
      invoice={invoice}
    />
  );
};


export default InvoiceRenderer;