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


/*
  =====================================================
  PROFESSIONAL INVOICE THEME
  =====================================================

  Purpose:
  - Proper printable business invoice
  - No dashboard-style cards
  - Professional accounting/document layout
  - Clean PDF + print output
  - Fixed header/footer
  - Automatic page numbering
*/

const COLORS = {
  /*
    Main text
  */
  ink: "#172033",
  text: "#344054",
  muted: "#667085",
  lightText: "#98A2B3",

  /*
    Brand / professional theme
  */
  primary: "#244765",
  primaryDark: "#18344D",

  accent: "#2F6F70",
  accentDark: "#24595A",
  accentSoft: "#EDF7F6",

  /*
    Surfaces
  */
  headerSoft: "#F3F7FA",
  tableSoft: "#F8FAFC",
  alternateRow: "#FAFCFD",

  /*
    Borders
  */
  border: "#CBD5E1",
  softBorder: "#E7ECF2",

  white: "#FFFFFF",
};


/*
  =====================================================
  STYLES
  =====================================================
*/

const styles = StyleSheet.create({
  /*
    ===================================================
    PAGE
    ===================================================
  */

  page: {
    backgroundColor:
      COLORS.white,

    color:
      COLORS.text,

    fontSize: 8.5,

    /*
      Header aur footer fixed hain.

      Isliye main document content ko
      safe space de rahe hain.
    */
    paddingTop: 98,
    paddingRight: 40,
    paddingBottom: 72,
    paddingLeft: 40,
  },


  /*
    ===================================================
    FIXED PAGE HEADER
    ===================================================
  */

  header: {
    position: "absolute",

    top: 20,
    left: 40,
    right: 40,

    height: 56,

    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "center",

    backgroundColor:
      COLORS.headerSoft,

    /*
      Left accent line document ko
      premium letterhead feel deti hai.
    */
    borderLeftWidth: 4,
    borderLeftColor:
      COLORS.accent,

    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.softBorder,

    paddingTop: 8,
    paddingBottom: 8,

    paddingLeft: 12,
    paddingRight: 12,
  },


  headerBrand: {
    width: "65%",

    flexDirection: "row",

    alignItems: "center",
  },


  logoContainer: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 10,
  },


  logoImage: {
    width: 34,
    height: 34,

    objectFit: "contain",
  },


  logoFallback: {
    width: 34,
    height: 34,

    backgroundColor:
      COLORS.primary,

    color:
      COLORS.white,

    borderRadius: 4,

    textAlign: "center",

    fontSize: 14,
    fontWeight: 700,

    paddingTop: 8,
  },


  headerBusinessContent: {
    flexGrow: 1,
  },


  headerBusinessName: {
    color:
      COLORS.ink,

    fontSize: 12.5,

    fontWeight: 700,

    lineHeight: 1.2,
  },


  headerBusinessMeta: {
    color:
      COLORS.muted,

    fontSize: 6.8,

    lineHeight: 1.3,

    marginTop: 2,
  },


  headerRight: {
    width: "31%",

    alignItems: "flex-end",
  },


  taxInvoiceLabel: {
    color:
      COLORS.primaryDark,

    fontSize: 11.5,

    fontWeight: 700,

    letterSpacing: 0.7,

    lineHeight: 1.2,
  },


  headerInvoiceNumber: {
    color:
      COLORS.accentDark,

    fontSize: 7.5,

    fontWeight: 700,

    marginTop: 4,
  },


  /*
    ===================================================
    DOCUMENT TOP SECTION
    ===================================================
  */

  topSection: {
    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "flex-start",

    marginBottom: 22,
  },


  titleArea: {
    width: "43%",

    paddingTop: 2,
  },


  invoiceTitle: {
    color:
      COLORS.primaryDark,

    fontSize: 20,

    fontWeight: 700,

    letterSpacing: 0.35,

    /*
      Explicit lineHeight + marginBottom
      title/subtitle overlap ko prevent karta hai.
    */
    lineHeight: 1.15,

    marginBottom: 9,
  },


  invoiceSubtitle: {
    color:
      COLORS.muted,

    fontSize: 7.5,

    lineHeight: 1.45,

    maxWidth: 190,
  },


  /*
    ===================================================
    INVOICE META TABLE
    ===================================================
  */

  invoiceMetaTable: {
    width: "48%",

    borderWidth: 1,
    borderColor:
      COLORS.border,

    backgroundColor:
      COLORS.white,
  },


  invoiceMetaRow: {
    flexDirection: "row",

    minHeight: 23,

    borderBottomWidth: 1,

    borderBottomColor:
      COLORS.softBorder,
  },


  invoiceMetaRowLast: {
    flexDirection: "row",

    minHeight: 23,
  },


  invoiceMetaLabel: {
    width: "46%",

    backgroundColor:
      COLORS.tableSoft,

    color:
      COLORS.text,

    fontSize: 7.4,

    fontWeight: 600,

    paddingTop: 6,
    paddingBottom: 5,

    paddingLeft: 7,
    paddingRight: 6,

    borderRightWidth: 1,

    borderRightColor:
      COLORS.softBorder,
  },


  invoiceMetaValue: {
    width: "54%",

    color:
      COLORS.ink,

    fontSize: 7.6,

    fontWeight: 700,

    textAlign: "right",

    paddingTop: 6,
    paddingBottom: 5,

    paddingLeft: 6,
    paddingRight: 7,
  },


  /*
    ===================================================
    BILL FROM / BILL TO
    ===================================================
  */

  partiesSection: {
    flexDirection: "row",

    justifyContent:
      "space-between",

    borderTopWidth: 1,
    borderBottomWidth: 1,

    borderTopColor:
      COLORS.softBorder,

    borderBottomColor:
      COLORS.softBorder,

    paddingTop: 14,
    paddingBottom: 14,

    marginBottom: 22,
  },


  partyColumn: {
    width: "46%",
  },


  partyDivider: {
    width: 1,

    backgroundColor:
      COLORS.softBorder,

    marginHorizontal: 12,
  },


  sectionEyebrow: {
    color:
      COLORS.accentDark,

    fontSize: 7,

    fontWeight: 700,

    letterSpacing: 0.9,

    textTransform: "uppercase",

    lineHeight: 1.2,
  },


  partyName: {
    color:
      COLORS.ink,

    fontSize: 10,

    fontWeight: 700,

    lineHeight: 1.3,

    marginTop: 7,
  },


  partyText: {
    color:
      COLORS.text,

    fontSize: 7.7,

    lineHeight: 1.45,

    marginTop: 3,
  },


  gstText: {
    color:
      COLORS.ink,

    fontSize: 7.6,

    fontWeight: 600,

    lineHeight: 1.4,

    marginTop: 4,
  },


  /*
    ===================================================
    ITEMS TABLE
    ===================================================
  */

  table: {
    marginBottom: 20,

    borderWidth: 1,

    borderColor:
      COLORS.border,
  },


  tableHeader: {
    flexDirection: "row",

    backgroundColor:
      COLORS.primary,

    paddingTop: 8.5,
    paddingBottom: 8.5,

    paddingLeft: 8,
    paddingRight: 8,

    /*
      Subtle teal accent.
    */
    borderBottomWidth: 2,

    borderBottomColor:
      COLORS.accent,
  },


  tableRow: {
    flexDirection: "row",

    alignItems: "flex-start",

    paddingTop: 9,
    paddingBottom: 9,

    paddingLeft: 8,
    paddingRight: 8,

    borderBottomWidth: 1,

    borderBottomColor:
      COLORS.softBorder,
  },


  alternateTableRow: {
    backgroundColor:
      COLORS.alternateRow,
  },


  serialColumn: {
    width: "7%",

    textAlign: "center",
  },


  descriptionColumn: {
    width: "43%",

    paddingRight: 8,
  },


  quantityColumn: {
    width: "12%",

    textAlign: "center",
  },


  rateColumn: {
    width: "18%",

    textAlign: "right",
  },


  amountColumn: {
    width: "20%",

    textAlign: "right",
  },


  tableHeaderText: {
    color:
      COLORS.white,

    fontSize: 7,

    fontWeight: 700,

    letterSpacing: 0.35,

    lineHeight: 1.25,
  },


  tableText: {
    color:
      COLORS.text,

    fontSize: 8,

    lineHeight: 1.4,
  },


  tableStrong: {
    color:
      COLORS.ink,

    fontSize: 8.2,

    fontWeight: 600,

    lineHeight: 1.4,
  },


  emptyTableText: {
    color:
      COLORS.muted,

    fontSize: 8,

    paddingVertical: 3,
  },


  /*
    ===================================================
    FINANCIAL SUMMARY
    ===================================================
  */

  financialSection: {
    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "flex-start",

    marginBottom: 22,
  },


  financialLeft: {
    width: "48%",

    paddingTop: 5,
  },


  financialLeftLabel: {
    color:
      COLORS.muted,

    fontSize: 7,
  },


  financialLeftValue: {
    color:
      COLORS.primaryDark,

    fontSize: 9,

    fontWeight: 700,

    marginTop: 5,
  },


  totalsTable: {
    width: "43%",

    borderWidth: 1,

    borderColor:
      COLORS.border,
  },


  totalRow: {
    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "center",

    minHeight: 23,

    backgroundColor:
      COLORS.tableSoft,

    paddingTop: 5,
    paddingBottom: 5,

    paddingLeft: 8,
    paddingRight: 8,

    borderBottomWidth: 1,

    borderBottomColor:
      COLORS.softBorder,
  },


  totalLabel: {
    color:
      COLORS.muted,

    fontSize: 7.8,
  },


  totalValue: {
    color:
      COLORS.ink,

    fontSize: 7.9,

    fontWeight: 600,
  },


  grandTotalRow: {
    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "center",

    backgroundColor:
      COLORS.accentSoft,

    paddingTop: 8,
    paddingBottom: 8,

    paddingLeft: 8,
    paddingRight: 8,

    borderTopWidth: 2,

    borderTopColor:
      COLORS.accent,
  },


  grandTotalLabel: {
    color:
      COLORS.primaryDark,

    fontSize: 9,

    fontWeight: 700,
  },


  grandTotalValue: {
    color:
      COLORS.primaryDark,

    fontSize: 11.5,

    fontWeight: 700,
  },


  /*
    ===================================================
    PAYMENT + SIGNATURE
    ===================================================
  */

  paymentArea: {
    flexDirection: "row",

    justifyContent:
      "space-between",

    backgroundColor:
      COLORS.headerSoft,

    borderWidth: 1,

    borderColor:
      COLORS.softBorder,

    paddingTop: 12,
    paddingBottom: 12,

    paddingLeft: 12,
    paddingRight: 12,

    marginBottom: 18,
  },


  paymentColumn: {
    width: "56%",
  },


  signatureColumn: {
    width: "35%",

    alignItems: "flex-end",
  },


  blockTitle: {
    color:
      COLORS.primaryDark,

    fontSize: 7.6,

    fontWeight: 700,

    letterSpacing: 0.55,

    textTransform: "uppercase",

    lineHeight: 1.25,
  },


  detailRow: {
    flexDirection: "row",

    marginTop: 5,
  },


  detailLabel: {
    width: 72,

    color:
      COLORS.muted,

    fontSize: 7.2,
  },


  detailValue: {
    flex: 1,

    color:
      COLORS.ink,

    fontSize: 7.3,

    fontWeight: 600,
  },


  signatureLine: {
    width: 125,

    marginTop: 25,

    borderBottomWidth: 0.8,

    borderBottomColor:
      COLORS.muted,
  },


  /*
    Different standard PDF font.

    Custom .ttf ki zarurat nahi,
    isliye frontend + backend/email
    dono me automatically work karega.
  */
  signatureName: {
    color:
      COLORS.primaryDark,

    fontFamily:
      "Times-Italic",

    fontSize: 13,

    lineHeight: 1.2,

    marginTop: 6,
  },


  signatureCaption: {
    color:
      COLORS.muted,

    fontSize: 6.8,

    marginTop: 3,
  },


  /*
    ===================================================
    NOTES
    ===================================================
  */

  notesBlock: {
    backgroundColor:
      COLORS.tableSoft,

    borderLeftWidth: 3,

    borderLeftColor:
      COLORS.accent,

    paddingTop: 10,
    paddingBottom: 10,

    paddingLeft: 11,
    paddingRight: 11,

    marginBottom: 14,
  },


  bodyText: {
    color:
      COLORS.text,

    fontSize: 7.5,

    lineHeight: 1.5,

    marginTop: 6,
  },


  /*
    ===================================================
    TERMS
    ===================================================
  */

  termsBlock: {
    paddingTop: 11,

    borderTopWidth: 1,

    borderTopColor:
      COLORS.softBorder,
  },


  /*
    ===================================================
    FIXED PAGE FOOTER
    ===================================================
  */

  footer: {
    position: "absolute",

    left: 40,
    right: 40,

    bottom: 16,

    minHeight: 30,

    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "center",

    backgroundColor:
      COLORS.headerSoft,

    borderTopWidth: 2,

    borderTopColor:
      COLORS.primary,

    paddingTop: 7,
    paddingBottom: 6,

    paddingLeft: 10,
    paddingRight: 10,
  },


  footerLeft: {
    width: "42%",
  },


  footerCenter: {
    width: "30%",

    textAlign: "center",
  },


  footerRight: {
    width: "28%",

    textAlign: "right",
  },


  footerText: {
    color:
      COLORS.muted,

    fontSize: 6.7,

    lineHeight: 1.25,
  },


  footerInvoice: {
    color:
      COLORS.text,

    fontSize: 6.7,

    fontWeight: 600,
  },


  pageNumber: {
    color:
      COLORS.primaryDark,

    fontSize: 6.8,

    fontWeight: 700,
  },
});


/*
  =====================================================
  PROFESSIONAL TEMPLATE
  =====================================================
*/

const ProfessionalV1 = ({
  invoice,
}) => {
  /*
    Template ko invoice nahi mila
    to kuch render nahi karna.
  */

  if (!invoice) {
    return null;
  }


  /*
    Normalized invoice object se
    clean references.
  */

  const business =
    invoice.business || {};

  const customer =
    invoice.customer || {};

  const items =
    Array.isArray(
      invoice.items
    )
      ? invoice.items
      : [];


  return (
    <Document>
      <Page
        size="A4"
        wrap
        style={styles.page}
      >

        {/* =================================================
            FIXED HEADER
        ================================================= */}

        <View
          style={styles.header}
          fixed
        >
          <View
            style={
              styles.headerBrand
            }
          >
            <View
              style={
                styles.logoContainer
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
                    styles.logoFallback
                  }
                >
                  {business.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "B"}
                </Text>
              )}
            </View>


            <View
              style={
                styles
                  .headerBusinessContent
              }
            >
              <Text
                style={
                  styles
                    .headerBusinessName
                }
              >
                {business.name ||
                  "Business"}
              </Text>


              {business.email ? (
                <Text
                  style={
                    styles
                      .headerBusinessMeta
                  }
                >
                  {business.email}
                </Text>
              ) : null}


              {!business.email &&
              business.phone ? (
                <Text
                  style={
                    styles
                      .headerBusinessMeta
                  }
                >
                  {business.phone}
                </Text>
              ) : null}
            </View>
          </View>


          <View
            style={
              styles.headerRight
            }
          >
            <Text
              style={
                styles.taxInvoiceLabel
              }
            >
              TAX INVOICE
            </Text>

            <Text
              style={
                styles
                  .headerInvoiceNumber
              }
            >
              {invoice.invoiceNumber ||
                "—"}
            </Text>
          </View>
        </View>


        {/* =================================================
            INVOICE TITLE + META TABLE
        ================================================= */}

        <View
          style={styles.topSection}
          wrap={false}
        >
          <View
            style={styles.titleArea}
          >
            <Text
              style={
                styles.invoiceTitle
              }
            >
              Invoice
            </Text>

            <Text
              style={
                styles.invoiceSubtitle
              }
            >
              Invoice details and
              billing information
            </Text>
          </View>


          <View
            style={
              styles
                .invoiceMetaTable
            }
          >
            {/* Invoice Number */}

            <View
              style={
                styles
                  .invoiceMetaRow
              }
            >
              <Text
                style={
                  styles
                    .invoiceMetaLabel
                }
              >
                Invoice Number
              </Text>

              <Text
                style={
                  styles
                    .invoiceMetaValue
                }
              >
                {invoice.invoiceNumber ||
                  "—"}
              </Text>
            </View>


            {/* Invoice Date */}

            <View
              style={
                styles
                  .invoiceMetaRow
              }
            >
              <Text
                style={
                  styles
                    .invoiceMetaLabel
                }
              >
                Invoice Date
              </Text>

              <Text
                style={
                  styles
                    .invoiceMetaValue
                }
              >
                {formatInvoiceDate(
                  invoice.invoiceDate
                )}
              </Text>
            </View>


            {/* Due Date */}

            <View
              style={
                styles
                  .invoiceMetaRow
              }
            >
              <Text
                style={
                  styles
                    .invoiceMetaLabel
                }
              >
                Due Date
              </Text>

              <Text
                style={
                  styles
                    .invoiceMetaValue
                }
              >
                {formatInvoiceDate(
                  invoice.dueDate
                )}
              </Text>
            </View>


            {/* Payment Terms */}

            <View
              style={
                styles
                  .invoiceMetaRowLast
              }
            >
              <Text
                style={
                  styles
                    .invoiceMetaLabel
                }
              >
                Payment Terms
              </Text>

              <Text
                style={
                  styles
                    .invoiceMetaValue
                }
              >
                {getPaymentTermsLabel(
                  invoice.paymentTerms
                )}
              </Text>
            </View>
          </View>
        </View>


        {/* =================================================
            BILL FROM / BILL TO
        ================================================= */}

        <View
          style={
            styles.partiesSection
          }
          wrap={false}
        >
          {/* BILL FROM */}

          <View
            style={
              styles.partyColumn
            }
          >
            <Text
              style={
                styles.sectionEyebrow
              }
            >
              Bill From
            </Text>


            <Text
              style={styles.partyName}
            >
              {business.name ||
                "Business"}
            </Text>


            {business.address ? (
              <Text
                style={
                  styles.partyText
                }
              >
                {business.address}
              </Text>
            ) : null}


            {business.email ? (
              <Text
                style={
                  styles.partyText
                }
              >
                {business.email}
              </Text>
            ) : null}


            {business.phone ? (
              <Text
                style={
                  styles.partyText
                }
              >
                {business.phone}
              </Text>
            ) : null}


            {business.gstin ? (
              <Text
                style={
                  styles.gstText
                }
              >
                GSTIN:{" "}
                {business.gstin}
              </Text>
            ) : null}
          </View>


          {/* DIVIDER */}

          <View
            style={
              styles.partyDivider
            }
          />


          {/* BILL TO */}

          <View
            style={
              styles.partyColumn
            }
          >
            <Text
              style={
                styles.sectionEyebrow
              }
            >
              Bill To
            </Text>


            <Text
              style={styles.partyName}
            >
              {customer.companyName ||
                "Customer"}
            </Text>


            {customer.contactPerson ? (
              <Text
                style={
                  styles.partyText
                }
              >
                {customer.contactPerson}
              </Text>
            ) : null}


            {customer.address ? (
              <Text
                style={
                  styles.partyText
                }
              >
                {customer.address}
              </Text>
            ) : null}


            {customer.email ? (
              <Text
                style={
                  styles.partyText
                }
              >
                {customer.email}
              </Text>
            ) : null}


            {customer.phone ? (
              <Text
                style={
                  styles.partyText
                }
              >
                {customer.phone}
              </Text>
            ) : null}


            {customer.gstin ? (
              <Text
                style={
                  styles.gstText
                }
              >
                GSTIN:{" "}
                {customer.gstin}
              </Text>
            ) : null}
          </View>
        </View>


        {/* =================================================
            ITEMS TABLE
        ================================================= */}

        <View style={styles.table}>

          {/* TABLE HEADER */}

          <View
            style={
              styles.tableHeader
            }
            wrap={false}
          >
            <Text
              style={[
                styles.serialColumn,
                styles
                  .tableHeaderText,
              ]}
            >
              #
            </Text>


            <Text
              style={[
                styles
                  .descriptionColumn,
                styles
                  .tableHeaderText,
              ]}
            >
              DESCRIPTION
            </Text>


            <Text
              style={[
                styles
                  .quantityColumn,
                styles
                  .tableHeaderText,
              ]}
            >
              QTY
            </Text>


            <Text
              style={[
                styles.rateColumn,
                styles
                  .tableHeaderText,
              ]}
            >
              RATE
            </Text>


            <Text
              style={[
                styles.amountColumn,
                styles
                  .tableHeaderText,
              ]}
            >
              AMOUNT
            </Text>
          </View>


          {/* TABLE ITEMS */}

          {items.length > 0 ? (
            items.map(
              (
                item,
                index
              ) => (
                <View
                  key={
                    item.id ||
                    index
                  }
                  style={[
                    styles.tableRow,

                    index % 2 === 1
                      ? styles
                          .alternateTableRow
                      : null,
                  ]}
                  wrap={false}
                >
                  {/* SERIAL */}

                  <Text
                    style={[
                      styles
                        .serialColumn,

                      styles
                        .tableText,
                    ]}
                  >
                    {index + 1}
                  </Text>


                  {/* DESCRIPTION */}

                  <Text
                    style={[
                      styles
                        .descriptionColumn,

                      styles
                        .tableStrong,
                    ]}
                  >
                    {item.description ||
                      "Untitled Item"}
                  </Text>


                  {/* QUANTITY */}

                  <Text
                    style={[
                      styles
                        .quantityColumn,

                      styles
                        .tableText,
                    ]}
                  >
                    {item.quantity}
                  </Text>


                  {/* RATE */}

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


                  {/* AMOUNT */}

                  <Text
                    style={[
                      styles
                        .amountColumn,

                      styles
                        .tableStrong,
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
                  styles
                    .emptyTableText
                }
              >
                No invoice items
                available.
              </Text>
            </View>
          )}
        </View>


        {/* =================================================
            FINANCIAL SUMMARY
        ================================================= */}

        <View
          style={
            styles.financialSection
          }
          wrap={false}
        >

          {/* LEFT SUMMARY */}

          <View
            style={
              styles.financialLeft
            }
          >
            <Text
              style={
                styles
                  .financialLeftLabel
              }
            >
              Invoice Amount
            </Text>

            <Text
              style={
                styles
                  .financialLeftValue
              }
            >
              {formatInvoiceCurrency(
                invoice.grandTotal
              )}
            </Text>
          </View>


          {/* TOTALS TABLE */}

          <View
            style={
              styles.totalsTable
            }
          >

            {/* SUBTOTAL */}

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


            {/* DISCOUNT */}

            {Number(
              invoice.discountAmount
            ) > 0 ? (
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
                    invoice
                      .discountAmount
                  )}
                </Text>
              </View>
            ) : null}


            {/* TAX */}

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
                  {invoice.taxRate}
                  %)
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


            {/* ADDITIONAL CHARGE */}

            {Number(
              invoice
                .additionalChargeAmount
            ) > 0 ? (
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
                    invoice
                      .additionalChargeAmount
                  )}
                </Text>
              </View>
            ) : null}


            {/* GRAND TOTAL */}

            <View
              style={
                styles.grandTotalRow
              }
            >
              <Text
                style={
                  styles
                    .grandTotalLabel
                }
              >
                Grand Total
              </Text>

              <Text
                style={
                  styles
                    .grandTotalValue
                }
              >
                {formatInvoiceCurrency(
                  invoice.grandTotal
                )}
              </Text>
            </View>
          </View>
        </View>


        {/* =================================================
            PAYMENT DETAILS + SIGNATURE
        ================================================= */}

        <View
          style={
            styles.paymentArea
          }
          wrap={false}
        >

          {/* PAYMENT DETAILS */}

          <View
            style={
              styles.paymentColumn
            }
          >
            <Text
              style={
                styles.blockTitle
              }
            >
              Bank / Payment Details
            </Text>


            {business.bank
              ?.accountName ? (
              <View
                style={
                  styles.detailRow
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Account Name
                </Text>

                <Text
                  style={
                    styles.detailValue
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
                  styles.detailRow
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Bank
                </Text>

                <Text
                  style={
                    styles.detailValue
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
                  styles.detailRow
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Account No.
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {
                    business.bank
                      .accountNumber
                  }
                </Text>
              </View>
            ) : null}


            {business.bank
              ?.ifsc ? (
              <View
                style={
                  styles.detailRow
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  IFSC
                </Text>

                <Text
                  style={
                    styles.detailValue
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


          {/* SIGNATURE */}

          <View
            style={
              styles.signatureColumn
            }
          >
            <Text
              style={
                styles.blockTitle
              }
            >
              Authorized Signatory
            </Text>


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
                styles
                  .signatureCaption
              }
            >
              For{" "}
              {business.name ||
                "Business"}
            </Text>
          </View>
        </View>


        {/* =================================================
            NOTES
        ================================================= */}

        {invoice.notes ? (
          <View
            style={
              styles.notesBlock
            }
          >
            <Text
              style={
                styles.blockTitle
              }
            >
              Notes
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


        {/* =================================================
            TERMS & CONDITIONS
        ================================================= */}

        {invoice.terms ? (
          <View
            style={
              styles.termsBlock
            }
          >
            <Text
              style={
                styles.blockTitle
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


        {/* =================================================
            FIXED FOOTER
        ================================================= */}

        <View
          style={styles.footer}
          fixed
        >
          {/* LEFT */}

          <View
            style={
              styles.footerLeft
            }
          >
            <Text
              style={
                styles.footerText
              }
            >
              {business.email ||
                business.phone ||
                business.name ||
                "Business"}
            </Text>
          </View>


          {/* CENTER */}

          <View
            style={
              styles.footerCenter
            }
          >
            <Text
              style={
                styles.footerInvoice
              }
            >
              {invoice.invoiceNumber ||
                ""}
            </Text>
          </View>


          {/* RIGHT / PAGE NUMBER */}

          <View
            style={
              styles.footerRight
            }
          >
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
        </View>
      </Page>
    </Document>
  );
};


/*
  =====================================================
  TEMPLATE METADATA
  =====================================================

  Dynamic template discovery system
  automatically is file ko detect karega.

  Registry / TemplateSelector / InvoiceRenderer
  ko manually touch nahi karna.
*/

export const templateMeta = {
  key: "professional",

  version: 1,

  name:
    "Professional",

  description:
    "Professional business invoice with structured invoice metadata, formal billing sections, accounting-style totals, payment details, signature styling, fixed header and footer, and automatic page numbering.",
};


export default ProfessionalV1;