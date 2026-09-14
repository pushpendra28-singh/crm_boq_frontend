import React from "react";

import {
  Document,
  Page,
  Text,
  View,
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

    paddingTop: 38,
    paddingRight: 38,
    paddingBottom: 56,
    paddingLeft: 38,
  },


  /* =========================================
     CORPORATE ACCENT
  ========================================= */

  topBar: {
    height: 6,

    backgroundColor: "#0F172A",

    marginLeft: -38,
    marginRight: -38,
    marginTop: -38,
    marginBottom: 24,
  },


  /* =========================================
     HEADER
  ========================================= */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",

    paddingBottom: 21,

    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
  },

  businessColumn: {
    width: "55%",
  },

  invoiceColumn: {
    width: "41%",

    alignItems: "flex-end",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandMark: {
    width: 38,
    height: 38,

    backgroundColor: "#0F172A",

    borderRadius: 5,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,
  },

  brandMarkText: {
    color: "#FFFFFF",

    fontSize: 16,
    fontWeight: 700,
  },

  businessName: {
    color: "#0F172A",

    fontSize: 16,
    fontWeight: 700,
  },

  businessDetails: {
    marginTop: 11,
  },

  businessText: {
    color: "#475569",

    fontSize: 9.25,

    lineHeight: 1.45,

    marginTop: 3,
  },


  /* =========================================
     INVOICE META
  ========================================= */

  invoiceTitle: {
    color: "#0F172A",

    fontSize: 25,
    fontWeight: 700,

    letterSpacing: 1.4,
  },

  invoiceNumber: {
    color: "#1D4ED8",

    fontSize: 10.5,
    fontWeight: 700,

    marginTop: 6,
    marginBottom: 5,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",

    width: 180,

    marginTop: 5,
  },

  metaLabel: {
    color: "#64748B",

    fontSize: 8.5,
  },

  metaValue: {
    color: "#1E293B",

    fontSize: 9,

    fontWeight: 600,
  },


  /* =========================================
     BILLING INFORMATION
  ========================================= */

  billingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",

    marginTop: 22,

    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 16,
    paddingRight: 16,

    backgroundColor: "#F8FAFC",

    borderWidth: 1,
    borderColor: "#CBD5E1",

    borderRadius: 4,
  },

  billingColumn: {
    width: "47%",
  },

  sectionLabel: {
    color: "#475569",

    fontSize: 8.5,
    fontWeight: 700,

    letterSpacing: 0.9,
  },

  customerName: {
    color: "#0F172A",

    fontSize: 12,
    fontWeight: 700,

    marginTop: 7,
  },

  bodyText: {
    color: "#475569",

    fontSize: 9.25,

    lineHeight: 1.5,

    marginTop: 3,
  },


  /* =========================================
     ITEMS TABLE
  ========================================= */

  table: {
    marginTop: 23,

    borderWidth: 1,
    borderColor: "#CBD5E1",

    borderRadius: 3,
  },

  tableHeader: {
    flexDirection: "row",

    backgroundColor: "#0F172A",

    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  tableHeaderText: {
    color: "#FFFFFF",

    fontSize: 8.25,
    fontWeight: 700,

    letterSpacing: 0.45,
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

  itemDescription: {
    color: "#1E293B",

    fontSize: 9.5,
    fontWeight: 600,

    lineHeight: 1.4,
  },

  tableText: {
    color: "#475569",

    fontSize: 9.4,

    lineHeight: 1.4,
  },

  tableAmount: {
    color: "#0F172A",

    fontSize: 9.5,
    fontWeight: 700,

    lineHeight: 1.4,
  },


  /* =========================================
     TOTALS
  ========================================= */

  totalsWrapper: {
    width: 255,

    marginLeft: "auto",
    marginTop: 21,
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

  discountText: {
    color: "#B91C1C",

    fontSize: 9.25,
  },

  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginTop: 8,

    paddingVertical: 11,
    paddingHorizontal: 12,

    backgroundColor: "#0F172A",

    borderRadius: 3,
  },

  grandTotalLabel: {
    color: "#E2E8F0",

    fontSize: 10.5,
    fontWeight: 700,
  },

  grandTotalValue: {
    color: "#FFFFFF",

    fontSize: 16,
    fontWeight: 700,
  },


  /* =========================================
     NOTE
  ========================================= */

  noteBox: {
    marginTop: 22,

    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 13,
    paddingRight: 13,

    backgroundColor: "#EFF6FF",

    borderLeftWidth: 3,
    borderLeftColor: "#1D4ED8",

    borderRadius: 3,
  },

  noteTitle: {
    color: "#1E40AF",

    fontSize: 8.5,
    fontWeight: 700,

    letterSpacing: 0.8,
  },

  noteText: {
    color: "#334155",

    fontSize: 9.25,

    lineHeight: 1.5,

    marginTop: 6,
  },


  /* =========================================
     PAYMENT + SIGNATURE
  ========================================= */

  paymentSection: {
    flexDirection: "row",
    justifyContent: "space-between",

    marginTop: 24,

    paddingTop: 18,

    borderTopWidth: 1,
    borderTopColor: "#CBD5E1",
  },

  paymentColumn: {
    width: "58%",
  },

  signatureColumn: {
    width: "34%",

    alignItems: "flex-end",
    justifyContent: "flex-end",
  },

  paymentRow: {
    flexDirection: "row",

    marginTop: 5,
  },

  paymentLabel: {
    width: 76,

    color: "#64748B",

    fontSize: 8.75,
  },

  paymentValue: {
    color: "#1E293B",

    fontSize: 9.25,
    fontWeight: 600,
  },

  signatureLine: {
    width: 115,

    marginTop: 30,
    marginBottom: 7,

    borderBottomWidth: 1,
    borderBottomColor: "#64748B",
  },

  signatureName: {
    color: "#0F172A",

    fontSize: 9.25,
    fontWeight: 700,
  },

  signatureFor: {
    color: "#64748B",

    fontSize: 8.25,

    marginTop: 3,
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

  termsText: {
    color: "#475569",

    fontSize: 8.75,

    marginTop: 7,

    lineHeight: 1.55,
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

    paddingTop: 7,

    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  footerText: {
    color: "#64748B",

    fontSize: 7.8,
  },

  pageNumber: {
    color: "#475569",

    fontSize: 7.8,
    fontWeight: 600,
  },
});


const CorporateV1 = ({
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
    Array.isArray(invoice.items)
      ? invoice.items
      : [];


  return (
    <Document>
      <Page
        size="A4"
        wrap
        style={styles.page}
      >
        {/* =====================================
            TOP ACCENT
        ===================================== */}

        <View
          style={styles.topBar}
          fixed
        />


        {/* =====================================
            HEADER
        ===================================== */}

        <View
          style={styles.header}
          wrap={false}
        >
          {/* BUSINESS */}

          <View
            style={
              styles.businessColumn
            }
          >
            <View
              style={styles.brandRow}
            >
              <View
                style={
                  styles.brandMark
                }
              >
                <Text
                  style={
                    styles.brandMarkText
                  }
                >
                  {business.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "B"}
                </Text>
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


            <View
              style={
                styles.businessDetails
              }
            >
              {business.address ? (
                <Text
                  style={
                    styles.businessText
                  }
                >
                  {business.address}
                </Text>
              ) : null}


              {business.email ? (
                <Text
                  style={
                    styles.businessText
                  }
                >
                  {business.email}
                </Text>
              ) : null}


              {business.phone ? (
                <Text
                  style={
                    styles.businessText
                  }
                >
                  {business.phone}
                </Text>
              ) : null}


              {business.gstin ? (
                <Text
                  style={
                    styles.businessText
                  }
                >
                  GSTIN:{" "}
                  {business.gstin}
                </Text>
              ) : null}
            </View>
          </View>


          {/* INVOICE META */}

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


            <View
              style={styles.metaRow}
            >
              <Text
                style={
                  styles.metaLabel
                }
              >
                Invoice Date
              </Text>

              <Text
                style={
                  styles.metaValue
                }
              >
                {formatInvoiceDate(
                  invoice.invoiceDate
                )}
              </Text>
            </View>


            <View
              style={styles.metaRow}
            >
              <Text
                style={
                  styles.metaLabel
                }
              >
                Due Date
              </Text>

              <Text
                style={
                  styles.metaValue
                }
              >
                {formatInvoiceDate(
                  invoice.dueDate
                )}
              </Text>
            </View>


            <View
              style={styles.metaRow}
            >
              <Text
                style={
                  styles.metaLabel
                }
              >
                Terms
              </Text>

              <Text
                style={
                  styles.metaValue
                }
              >
                {getPaymentTermsLabel(
                  invoice.paymentTerms
                )}
              </Text>
            </View>
          </View>
        </View>


        {/* =====================================
            BILLING INFORMATION
        ===================================== */}

        <View
          style={
            styles.billingContainer
          }
          wrap={false}
        >
          <View
            style={
              styles.billingColumn
            }
          >
            <Text
              style={
                styles.sectionLabel
              }
            >
              BILL TO
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
                style={styles.bodyText}
              >
                {
                  customer.contactPerson
                }
              </Text>
            ) : null}

            {customer.address ? (
              <Text
                style={styles.bodyText}
              >
                {customer.address}
              </Text>
            ) : null}

            {customer.email ? (
              <Text
                style={styles.bodyText}
              >
                {customer.email}
              </Text>
            ) : null}

            {customer.phone ? (
              <Text
                style={styles.bodyText}
              >
                {customer.phone}
              </Text>
            ) : null}

            {customer.gstin ? (
              <Text
                style={styles.bodyText}
              >
                GSTIN:{" "}
                {customer.gstin}
              </Text>
            ) : null}
          </View>


          <View
            style={
              styles.billingColumn
            }
          >
            <Text
              style={
                styles.sectionLabel
              }
            >
              FROM
            </Text>

            <Text
              style={
                styles.customerName
              }
            >
              {business.name ||
                "Business"}
            </Text>

            {business.address ? (
              <Text
                style={styles.bodyText}
              >
                {business.address}
              </Text>
            ) : null}

            {business.email ? (
              <Text
                style={styles.bodyText}
              >
                {business.email}
              </Text>
            ) : null}

            {business.phone ? (
              <Text
                style={styles.bodyText}
              >
                {business.phone}
              </Text>
            ) : null}
          </View>
        </View>


        {/* =====================================
            ITEMS TABLE
        ===================================== */}

        <View style={styles.table}>
          <View
            style={styles.tableHeader}
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
                      styles.itemDescription,
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
                      styles.tableAmount,
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


        {/* =====================================
            TOTALS
        ===================================== */}

        <View
          style={
            styles.totalsWrapper
          }
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
            <>
              <View
                style={
                  styles.totalRow
                }
              >
                <Text
                  style={
                    styles.discountText
                  }
                >
                  Discount
                  {invoice.discountType ===
                    "percentage" &&
                  invoice.discountValue
                    ? ` (${invoice.discountValue}%)`
                    : ""}
                </Text>

                <Text
                  style={
                    styles.discountText
                  }
                >
                  -
                  {formatInvoiceCurrency(
                    invoice.discountAmount
                  )}
                </Text>
              </View>


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
                  Taxable Amount
                </Text>

                <Text
                  style={
                    styles.totalValue
                  }
                >
                  {formatInvoiceCurrency(
                    invoice.taxableAmount
                  )}
                </Text>
              </View>
            </>
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
              TOTAL
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


        {/* =====================================
            NOTES
        ===================================== */}

        {invoice.notes ? (
          <View
            style={styles.noteBox}
          >
            <Text
              style={
                styles.noteTitle
              }
            >
              CUSTOMER NOTE
            </Text>

            <Text
              style={
                styles.noteText
              }
            >
              {invoice.notes}
            </Text>
          </View>
        ) : null}


        {/* =====================================
            PAYMENT + SIGNATURE
        ===================================== */}

        <View
          style={
            styles.paymentSection
          }
          wrap={false}
        >
          <View
            style={
              styles.paymentColumn
            }
          >
            <Text
              style={
                styles.sectionLabel
              }
            >
              PAYMENT DETAILS
            </Text>


            {business.bank
              ?.accountName ? (
              <View
                style={
                  styles.paymentRow
                }
              >
                <Text
                  style={
                    styles.paymentLabel
                  }
                >
                  Account
                </Text>

                <Text
                  style={
                    styles.paymentValue
                  }
                >
                  {
                    business.bank
                      .accountName
                  }
                </Text>
              </View>
            ) : null}


            {business.bank
              ?.bankName ? (
              <View
                style={
                  styles.paymentRow
                }
              >
                <Text
                  style={
                    styles.paymentLabel
                  }
                >
                  Bank
                </Text>

                <Text
                  style={
                    styles.paymentValue
                  }
                >
                  {
                    business.bank
                      .bankName
                  }
                </Text>
              </View>
            ) : null}


            {business.bank
              ?.accountNumber ? (
              <View
                style={
                  styles.paymentRow
                }
              >
                <Text
                  style={
                    styles.paymentLabel
                  }
                >
                  Account No.
                </Text>

                <Text
                  style={
                    styles.paymentValue
                  }
                >
                  {
                    business.bank
                      .accountNumber
                  }
                </Text>
              </View>
            ) : null}


            {business.bank?.ifsc ? (
              <View
                style={
                  styles.paymentRow
                }
              >
                <Text
                  style={
                    styles.paymentLabel
                  }
                >
                  IFSC
                </Text>

                <Text
                  style={
                    styles.paymentValue
                  }
                >
                  {
                    business.bank
                      .ifsc
                  }
                </Text>
              </View>
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
              style={
                styles.signatureName
              }
            >
              {business
                .authorizedSignatory ||
                "Authorized Signatory"}
            </Text>

            <Text
              style={
                styles.signatureFor
              }
            >
              For{" "}
              {business.name ||
                "Business"}
            </Text>
          </View>
        </View>


        {/* =====================================
            TERMS
        ===================================== */}

        {invoice.terms ? (
          <View
            style={styles.terms}
          >
            <Text
              style={
                styles.sectionLabel
              }
            >
              TERMS & CONDITIONS
            </Text>

            <Text
              style={
                styles.termsText
              }
            >
              {invoice.terms}
            </Text>
          </View>
        ) : null}


        {/* =====================================
            FOOTER
        ===================================== */}

        <View
          style={styles.footer}
          fixed
        >
          <Text
            style={
              styles.footerText
            }
          >
            {business.name ||
              "Business"}{" "}
            • Thank you for your business
          </Text>

          <Text
            style={
              styles.pageNumber
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


export default CorporateV1;