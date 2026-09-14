import React from "react";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

import {
  formatInvoiceCurrency,
  formatInvoiceDate,
  getPaymentTermsLabel,
} from "../../invoiceDocumentUtils";


const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: "#334155",

    fontSize: 9.5,
    lineHeight: 1.5,

    paddingTop: 36,
    paddingRight: 38,
    paddingBottom: 54,
    paddingLeft: 38,
  },


  /* =========================================
     HEADER
  ========================================= */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",

    paddingBottom: 20,

    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
  },

  businessColumn: {
    width: "55%",
  },

  invoiceColumn: {
    width: "40%",
    alignItems: "flex-end",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 10,
  },

  logoBox: {
  width: 38,
  height: 38,

  alignItems: "center",
  justifyContent: "center",

  marginRight: 8,
},

  logoImage: {
  width: 24,
  height: 24,
  objectFit: "contain",
},

  logoText: {
    color: "#FFFFFF",

    fontSize: 14,
    fontWeight: 700,
  },

  businessName: {
    color: "#0F172A",

    fontSize: 15.5,
    fontWeight: 700,
  },


  /* =========================================
     INVOICE META
  ========================================= */

  invoiceTitle: {
    color: "#0F172A",

    fontSize: 24,
    fontWeight: 700,

    letterSpacing: 1.2,
  },

  invoiceNumber: {
    color: "#15803D",

    fontSize: 10.5,
    fontWeight: 700,

    marginTop: 12,
    marginBottom: 5,
  },

  label: {
    color: "#64748B",

    fontSize: 8.5,
  },

  value: {
    color: "#1E293B",

    fontSize: 9.25,
    fontWeight: 600,
  },

  infoLine: {
    marginTop: 4,
  },


  /* =========================================
     CUSTOMER / BILL TO
  ========================================= */

  section: {
    marginTop: 22,

    paddingBottom: 2,
  },

  sectionLabel: {
    color: "#475569",

    fontSize: 8.5,
    fontWeight: 700,

    textTransform: "uppercase",

    letterSpacing: 0.9,
  },

  customerName: {
    color: "#0F172A",

    fontSize: 12,
    fontWeight: 700,

    marginTop: 8,
  },

  customerText: {
    color: "#475569",

    fontSize: 9.25,

    lineHeight: 1.45,

    marginTop: 3,
  },


  /* =========================================
     ITEMS TABLE
  ========================================= */

  table: {
    marginTop: 22,

    borderWidth: 1,
    borderColor: "#CBD5E1",

    borderRadius: 4,
  },

  tableHeader: {
    flexDirection: "row",

    backgroundColor: "#F0FDF4",

    paddingVertical: 9,
    paddingHorizontal: 10,

    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "flex-start",

    paddingVertical: 10,
    paddingHorizontal: 10,

    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  descriptionColumn: {
    width: "48%",
    paddingRight: 8,
  },

  quantityColumn: {
    width: "12%",
    textAlign: "center",
  },

  rateColumn: {
    width: "20%",
    textAlign: "right",
  },

  amountColumn: {
    width: "20%",
    textAlign: "right",
  },

  tableHeaderText: {
    color: "#334155",

    fontSize: 8.25,
    fontWeight: 700,

    letterSpacing: 0.35,
  },

  tableText: {
    color: "#475569",

    fontSize: 9.4,

    lineHeight: 1.4,
  },

  tableStrong: {
    color: "#1E293B",

    fontSize: 9.5,
    fontWeight: 600,

    lineHeight: 1.4,
  },


  /* =========================================
     TOTALS
  ========================================= */

  totals: {
    width: 250,

    marginTop: 20,
    marginLeft: "auto",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",

    paddingVertical: 4.5,
  },

  totalLabel: {
    color: "#475569",

    fontSize: 9.5,
  },

  totalValue: {
    color: "#1E293B",

    fontSize: 9.5,
    fontWeight: 600,
  },

  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginTop: 8,

    paddingTop: 10,
    paddingBottom: 4,

    borderTopWidth: 1.5,
    borderTopColor: "#16A34A",
  },

  grandTotalLabel: {
    color: "#0F172A",

    fontSize: 11,
    fontWeight: 700,
  },

  grandTotalValue: {
    color: "#15803D",

    fontSize: 16,
    fontWeight: 700,
  },


  /* =========================================
     NOTE
  ========================================= */

  noteBox: {
    marginTop: 22,

    backgroundColor: "#F8FAFC",

    padding: 12,

    borderRadius: 5,

    borderLeftWidth: 3,
    borderLeftColor: "#22C55E",
  },

  bodyText: {
    color: "#475569",

    fontSize: 9,

    lineHeight: 1.55,

    marginTop: 6,
  },


  /* =========================================
     PAYMENT DETAILS
  ========================================= */

  paymentBlock: {
    flexDirection: "row",
    justifyContent: "space-between",

    marginTop: 24,

    paddingTop: 18,

    borderTopWidth: 1,
    borderTopColor: "#CBD5E1",
  },

  bankColumn: {
    width: "58%",
  },

  signatureColumn: {
    width: "34%",

    alignItems: "flex-end",
    justifyContent: "flex-end",
  },

  signatureLine: {
    width: 112,

    marginTop: 30,
    marginBottom: 7,

    borderBottomWidth: 1,
    borderBottomColor: "#64748B",
  },


  /* =========================================
     TERMS
  ========================================= */

  terms: {
    marginTop: 22,

    paddingTop: 16,

    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },


  /* =========================================
     FOOTER
  ========================================= */

  footer: {
    position: "absolute",

    left: 38,
    right: 38,
    bottom: 18,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",

    paddingTop: 7,
  },

  footerText: {
    color: "#64748B",

    fontSize: 7.8,
  },
});


const ModernV1 = ({
  invoice,
}) => {
  if (!invoice) {
    return null;
  }

  const business =
    invoice.business || {};

  const customer =
    invoice.customer || {};

  const items =
    invoice.items || [];

  return (
    <Document>
      <Page
        size="A4"
        wrap
        style={styles.page}
      >
        {/* HEADER */}

        <View
          style={styles.header}
          wrap={false}
        >
          <View
            style={
              styles.businessColumn
            }
          >
            <View
              style={
                styles.brandRow
              }
            >
              <View
  style={
    styles.logoBox
  }
>
  {business.logoUrl ? (
    <Image
      src={
        business.logoUrl
      }
      style={
        styles.logoImage
      }
    />
  ) : (
    <Text
      style={
        styles.logoText
      }
    >
      {business.name
        ?.charAt(0)
        ?.toUpperCase() ||
        "B"}
    </Text>
  )}
</View>

              <Text
                style={
                  styles.businessName
                }
              >
                {business.name ||
                  "Business"}
              </Text>
            </View>

            {business.address ? (
              <Text
                style={
                  styles.customerText
                }
              >
                {business.address}
              </Text>
            ) : null}

            {business.email ? (
              <Text
                style={
                  styles.customerText
                }
              >
                {business.email}
              </Text>
            ) : null}

            {business.phone ? (
              <Text
                style={
                  styles.customerText
                }
              >
                {business.phone}
              </Text>
            ) : null}

            {business.gstin ? (
              <Text
                style={
                  styles.customerText
                }
              >
                GSTIN:{" "}
                {business.gstin}
              </Text>
            ) : null}
          </View>


          <View
            style={
              styles.invoiceColumn
            }
          >
            <Text
              style={
                styles.invoiceTitle
              }
            >
              INVOICE
            </Text>

            <Text
              style={
                styles.invoiceNumber
              }
            >
              #
              {invoice.invoiceNumber ||
                "—"}
            </Text>

            <Text
              style={
                styles.infoLine
              }
            >
              <Text
                style={styles.label}
              >
                Invoice Date:{" "}
              </Text>

              <Text
                style={styles.value}
              >
                {formatInvoiceDate(
                  invoice.invoiceDate
                )}
              </Text>
            </Text>

            <Text
              style={
                styles.infoLine
              }
            >
              <Text
                style={styles.label}
              >
                Due Date:{" "}
              </Text>

              <Text
                style={styles.value}
              >
                {formatInvoiceDate(
                  invoice.dueDate
                )}
              </Text>
            </Text>

            <Text
              style={
                styles.infoLine
              }
            >
              <Text
                style={styles.label}
              >
                Payment Terms:{" "}
              </Text>

              <Text
                style={styles.value}
              >
                {getPaymentTermsLabel(
                  invoice.paymentTerms
                )}
              </Text>
            </Text>
          </View>
        </View>


        {/* BILL TO */}

        <View
          style={styles.section}
          wrap={false}
        >
          <Text
            style={
              styles.sectionLabel
            }
          >
            Bill To
          </Text>

          <Text
            style={
              styles.customerName
            }
          >
            {customer.companyName ||
              "Customer Name"}
          </Text>

          {customer.contactPerson ? (
            <Text
              style={
                styles.customerText
              }
            >
              {customer.contactPerson}
            </Text>
          ) : null}

          {customer.address ? (
            <Text
              style={
                styles.customerText
              }
            >
              {customer.address}
            </Text>
          ) : null}

          {customer.email ? (
            <Text
              style={
                styles.customerText
              }
            >
              {customer.email}
            </Text>
          ) : null}

          {customer.phone ? (
            <Text
              style={
                styles.customerText
              }
            >
              {customer.phone}
            </Text>
          ) : null}

          {customer.gstin ? (
            <Text
              style={
                styles.customerText
              }
            >
              GSTIN:{" "}
              {customer.gstin}
            </Text>
          ) : null}
        </View>


        {/* ITEMS */}

        <View style={styles.table}>
          <View
            style={
              styles.tableHeader
            }
            wrap={false}
          >
            <Text
              style={[
                styles.descriptionColumn,
                styles.tableHeaderText,
              ]}
            >
              DESCRIPTION
            </Text>

            <Text
              style={[
                styles.quantityColumn,
                styles.tableHeaderText,
              ]}
            >
              QTY
            </Text>

            <Text
              style={[
                styles.rateColumn,
                styles.tableHeaderText,
              ]}
            >
              RATE
            </Text>

            <Text
              style={[
                styles.amountColumn,
                styles.tableHeaderText,
              ]}
            >
              AMOUNT
            </Text>
          </View>

          {items.length > 0 ? (
            items.map(
              (item, index) => (
                <View
                  key={
                    item.id ||
                    index
                  }
                  style={
                    styles.tableRow
                  }
                  wrap={false}
                >
                  <Text
                    style={[
                      styles.descriptionColumn,
                      styles.tableStrong,
                    ]}
                  >
                    {item.description ||
                      "Untitled Item"}
                  </Text>

                  <Text
                    style={[
                      styles.quantityColumn,
                      styles.tableText,
                    ]}
                  >
                    {item.quantity}
                  </Text>

                  <Text
                    style={[
                      styles.rateColumn,
                      styles.tableText,
                    ]}
                  >
                    {formatInvoiceCurrency(
                      item.rate
                    )}
                  </Text>

                  <Text
                    style={[
                      styles.amountColumn,
                      styles.tableStrong,
                    ]}
                  >
                    {formatInvoiceCurrency(
                      item.amount
                    )}
                  </Text>
                </View>
              )
            )
          ) : (
            <View
              style={
                styles.tableRow
              }
            >
              <Text
                style={
                  styles.tableText
                }
              >
                No invoice items added.
              </Text>
            </View>
          )}
        </View>


        {/* TOTALS */}

        <View
          style={styles.totals}
          wrap={false}
        >
          <View
            style={
              styles.totalRow
            }
          >
            <Text
              style={
                styles.totalLabel
              }
            >
              Subtotal
            </Text>

            <Text
              style={
                styles.totalValue
              }
            >
              {formatInvoiceCurrency(
                invoice.subtotal
              )}
            </Text>
          </View>

          {invoice.discountAmount >
          0 ? (
            <View
              style={
                styles.totalRow
              }
            >
              <Text
                style={
                  styles.totalLabel
                }
              >
                Discount
              </Text>

              <Text
                style={
                  styles.totalValue
                }
              >
                -
                {formatInvoiceCurrency(
                  invoice.discountAmount
                )}
              </Text>
            </View>
          ) : null}

          {invoice.taxEnabled ? (
            <View
              style={
                styles.totalRow
              }
            >
              <Text
                style={
                  styles.totalLabel
                }
              >
                GST (
                {invoice.taxRate}%)
              </Text>

              <Text
                style={
                  styles.totalValue
                }
              >
                {formatInvoiceCurrency(
                  invoice.taxAmount
                )}
              </Text>
            </View>
          ) : null}

          {invoice
            .additionalChargeAmount >
          0 ? (
            <View
              style={
                styles.totalRow
              }
            >
              <Text
                style={
                  styles.totalLabel
                }
              >
                {invoice
                  .additionalChargeName ||
                  "Additional Charge"}
              </Text>

              <Text
                style={
                  styles.totalValue
                }
              >
                {formatInvoiceCurrency(
                  invoice.additionalChargeAmount
                )}
              </Text>
            </View>
          ) : null}

          <View
            style={
              styles.grandTotal
            }
          >
            <Text
              style={
                styles.grandTotalLabel
              }
            >
              Total
            </Text>

            <Text
              style={
                styles.grandTotalValue
              }
            >
              {formatInvoiceCurrency(
                invoice.grandTotal
              )}
            </Text>
          </View>
        </View>


        {/* NOTES */}

        {invoice.notes ? (
          <View
            style={styles.noteBox}
          >
            <Text
              style={
                styles.sectionLabel
              }
            >
              Note
            </Text>

            <Text
              style={
                styles.bodyText
              }
            >
              {invoice.notes}
            </Text>
          </View>
        ) : null}


        {/* PAYMENT + SIGNATURE */}

        <View
          style={
            styles.paymentBlock
          }
          wrap={false}
        >
          <View
            style={
              styles.bankColumn
            }
          >
            <Text
              style={
                styles.sectionLabel
              }
            >
              Payment Details
            </Text>

            {business.bank
              ?.accountName ? (
              <Text
                style={
                  styles.bodyText
                }
              >
                Account Name:{" "}
                {
                  business.bank
                    .accountName
                }
              </Text>
            ) : null}

            {business.bank
              ?.bankName ? (
              <Text
                style={
                  styles.bodyText
                }
              >
                Bank:{" "}
                {
                  business.bank
                    .bankName
                }
              </Text>
            ) : null}

            {business.bank
              ?.accountNumber ? (
              <Text
                style={
                  styles.bodyText
                }
              >
                Account No:{" "}
                {
                  business.bank
                    .accountNumber
                }
              </Text>
            ) : null}

            {business.bank
              ?.ifsc ? (
              <Text
                style={
                  styles.bodyText
                }
              >
                IFSC:{" "}
                {
                  business.bank
                    .ifsc
                }
              </Text>
            ) : null}
          </View>

          <View
            style={
              styles.signatureColumn
            }
          >
            <View
              style={
                styles.signatureLine
              }
            />

            <Text
              style={styles.value}
            >
              {business
                .authorizedSignatory ||
                "Authorized Signatory"}
            </Text>

            <Text
              style={
                styles.label
              }
            >
              For{" "}
              {business.name ||
                "Business"}
            </Text>
          </View>
        </View>


        {/* TERMS */}

        {invoice.terms ? (
          <View
            style={styles.terms}
          >
            <Text
              style={
                styles.sectionLabel
              }
            >
              Terms & Conditions
            </Text>

            <Text
              style={
                styles.bodyText
              }
            >
              {invoice.terms}
            </Text>
          </View>
        ) : null}


        {/* FIXED FOOTER */}

        <View
          style={styles.footer}
          fixed
        >
          <Text
            style={
              styles.footerText
            }
          >
            Thank you for your
            business.
          </Text>

          <Text
            style={
              styles.footerText
            }
            render={({
              pageNumber,
              totalPages,
            }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};


export const templateMeta = {
  key: "modern",
  version: 1,
  name: "Modern",
  description:
    "Clean, modern and professional invoice layout.",
  isDefault: true,
};

export default ModernV1;