import {
  DEFAULT_INVOICE_TEMPLATE,
} from "./templateRegistry";
import {
  resolveInvoiceAssetUrl,
} from "./invoiceDocumentUtils";

import API_BASE_URL from "../../../config/api";
// const DEFAULT_TEMPLATE = {
//   key: "modern",
//   version: 1,
// };


/*
  -----------------------------------------------
  Internal helpers
  -----------------------------------------------

  Template ko clean aur predictable data dene ke
  liye values normalize kar rahe hain.
*/

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};


const normalizeTemplate = ( template) => {
  return {
    key:
      template?.key ||
      DEFAULT_INVOICE_TEMPLATE.key,

    version:
      Number(template?.version) ||
      DEFAULT_INVOICE_TEMPLATE.version,
  };
};


const normalizeItems = (items = []) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const quantity =
      toNumber(item.quantity);

    const rate =
      toNumber(item.rate);

    return {
      id:
        item.id ||
        item._id ||
        `invoice-item-${index}`,

      description:
        item.description || "",

      quantity,

      rate,

      /*
        Saved invoice me amount available hoga.

        Live preview me amount normally nahi hota,
        isliye quantity × rate fallback hai.
      */
      amount:
        item.amount !== undefined &&
        item.amount !== null
          ? toNumber(item.amount)
          : quantity * rate,
    };
  });
};


/*
  =================================================
  LIVE CREATE INVOICE → NORMALIZED INVOICE
  =================================================

  CreateInvoice ke scattered state/props ko
  ek single invoice object me convert karta hai.
*/

export const normalizePreviewInvoice = ({
  invoiceData,
  selectedCustomer,
  business,

  subtotal,
  discountAmount,
  taxableAmount,
  taxAmount,
  additionalChargeAmount,
  grandTotal,
}) => {
  return {
    id: null,

    invoiceNumber:
      invoiceData?.invoiceNumber || "",

    invoiceDate:
      invoiceData?.invoiceDate || null,

    dueDate:
      invoiceData?.dueDate || null,

    paymentTerms:
      invoiceData?.paymentTerms ?? "",

    status: "unpaid",

    customer: {
      companyName:
        selectedCustomer?.companyName || "",

      contactPerson:
        selectedCustomer?.contactPerson || "",

      email:
        selectedCustomer?.email || "",

      phone:
        selectedCustomer?.phone || "",

      address:
        selectedCustomer?.address || "",

      gstin:
        selectedCustomer?.gstin || "",
    },

    business: {
      name:
        business?.name || "",

       logoUrl:
  resolveInvoiceAssetUrl(
    business?.logoUrl,
    API_BASE_URL
  ),

      email:
        business?.email || "",

      phone:
        business?.phone || "",

      address:
        business?.address || "",

      gstin:
        business?.gstin || "",

      bank: {
        accountName:
          business?.bank?.accountName || "",

        bankName:
          business?.bank?.bankName || "",

        accountNumber:
          business?.bank?.accountNumber || "",

        ifsc:
          business?.bank?.ifsc || "",
      },

      authorizedSignatory:
        business?.authorizedSignatory || "",
    },

    items:
      normalizeItems(
        invoiceData?.items
      ),

    discountType:
      invoiceData?.discountType ||
      "percentage",

    discountValue:
      toNumber(
        invoiceData?.discountValue
      ),

    subtotal:
      toNumber(subtotal),

    discountAmount:
      toNumber(discountAmount),

    taxableAmount:
      toNumber(taxableAmount),

    taxEnabled:
      Boolean(
        invoiceData?.taxEnabled
      ),

    taxRate:
      toNumber(
        invoiceData?.taxRate
      ),

    taxAmount:
      toNumber(taxAmount),

    additionalChargeName:
      invoiceData
        ?.additionalChargeName || "",

    additionalChargeAmount:
      toNumber(
        additionalChargeAmount
      ),

    grandTotal:
      toNumber(grandTotal),

    notes:
      invoiceData?.notes || "",

    terms:
      invoiceData?.terms || "",

    /*
      Abhi CreateInvoice me template field nahi hai.

      Next step me selector add karenge.
    */
    template:
      normalizeTemplate(
        invoiceData?.template
      ),

    createdBy: null,

    createdAt: null,
  };
};


/*
  =================================================
  SAVED DB INVOICE → NORMALIZED INVOICE
  =================================================

  ViewInvoice ko database structure samajhne ki
  zarurat nahi padegi.

  Template ko exactly wahi shape milegi jo live
  preview me milti hai.
*/

export const normalizeStoredInvoice = (
  invoice
) => {
  if (!invoice) {
    return null;
  }

  const customer =
    invoice.customerSnapshot || {};

  const business =
    invoice.businessSnapshot || {};

  return {
    id:
      invoice.id ||
      invoice._id ||
      null,

    invoiceNumber:
      invoice.invoiceNumber || "",

    invoiceDate:
      invoice.invoiceDate || null,

    dueDate:
      invoice.dueDate || null,

    paymentTerms:
      invoice.paymentTerms ?? "",

    status:
      invoice.status || "unpaid",

    customer: {
      companyName:
        customer.companyName || "",

      contactPerson:
        customer.contactPerson || "",

      email:
        customer.email || "",

      phone:
        customer.phone || "",

      address:
        customer.address || "",

      gstin:
        customer.gstin || "",
    },

    business: {
      name:
        business.name || "",

        logoUrl:
  resolveInvoiceAssetUrl(
    business.logoUrl,
    API_BASE_URL
  ),


      email:
        business.email || "",

      phone:
        business.phone || "",

      address:
        business.address || "",

      gstin:
        business.gstin || "",

      bank: {
        accountName:
          business.bank?.accountName || "",

        bankName:
          business.bank?.bankName || "",

        accountNumber:
          business.bank?.accountNumber || "",

        ifsc:
          business.bank?.ifsc || "",
      },

      authorizedSignatory:
        business.authorizedSignatory ||
        "",
    },

    items:
      normalizeItems(
        invoice.items
      ),

    discountType:
      invoice.discountType ||
      "percentage",

    discountValue:
      toNumber(
        invoice.discountValue
      ),

    subtotal:
      toNumber(
        invoice.subtotal
      ),

    discountAmount:
      toNumber(
        invoice.discountAmount
      ),

    taxableAmount:
      toNumber(
        invoice.taxableAmount
      ),

    taxEnabled:
      Boolean(
        invoice.taxEnabled
      ),

    taxRate:
      toNumber(
        invoice.taxRate
      ),

    taxAmount:
      toNumber(
        invoice.taxAmount
      ),

    additionalChargeName:
      invoice.additionalChargeName ||
      "",

    additionalChargeAmount:
      toNumber(
        invoice.additionalChargeAmount
      ),

    grandTotal:
      toNumber(
        invoice.grandTotal
      ),

    notes:
      invoice.notes || "",

    terms:
      invoice.terms || "",

    template:
      normalizeTemplate(
        invoice.template
      ),

    createdBy:
      invoice.createdBy || null,

    createdAt:
      invoice.createdAt || null,
  };
};


