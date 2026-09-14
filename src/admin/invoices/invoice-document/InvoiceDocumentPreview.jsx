import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Download,
  Printer,
} from "lucide-react";

import {
  pdf,
} from "@react-pdf/renderer";

import {
  Document as PdfDocument,
  Page as PdfPage,
  pdfjs,
} from "react-pdf";

import InvoiceRenderer from "./InvoiceRenderer";


/*
  =====================================================
  PDF.JS WORKER
  =====================================================
*/

pdfjs.GlobalWorkerOptions.workerSrc =
  new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();


const InvoiceDocumentPreview = ({
  invoice,

  /*
    Create/Edit live preview me normally
    actions nahi dikhayenge.

    ViewInvoice specifically true pass karega.
  */
  showActions = false,

  /*
    Download filename.
  */
  fileName = "invoice",
}) => {
  const containerRef =
    useRef(null);


  /*
    Latest PDF generation identify karne ke liye.

    Existing anti-stale logic preserve hai.
  */
  const generationRef =
    useRef(0);


  /*
    Current Blob URL cleanup.
  */
  const pdfUrlRef =
    useRef(null);


  const [pdfUrl, setPdfUrl] =
    useState(null);

  const [numPages, setNumPages] =
    useState(0);

  const [pageWidth, setPageWidth] =
    useState(560);

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [error, setError] =
    useState("");


  /*
    =====================================================
    RESPONSIVE PAGE WIDTH
    =====================================================

    PDF actual A4 hi hai.

    Browser me maximum A4-like width
    tak render kar rahe hain.
  */

  useEffect(() => {
    const element =
      containerRef.current;

    if (!element) {
      return;
    }


    const updateWidth = () => {
      /*
        Outer preview ka actual available width.

        794px approx A4 width @ 96 DPI.
      */

      const availableWidth =
        element.clientWidth - 48;


      const resolvedWidth =
        Math.min(
          794,

          Math.max(
            320,
            availableWidth
          )
        );


      setPageWidth(
        resolvedWidth
      );
    };


    updateWidth();


    const observer =
      new ResizeObserver(
        updateWidth
      );


    observer.observe(
      element
    );


    return () => {
      observer.disconnect();
    };
  }, []);


  /*
    =====================================================
    GENERATE PDF
    =====================================================

    Existing central InvoiceRenderer hi use ho raha hai.

    Isliye:
    - preview
    - download
    - print

    teeno SAME PDF use karenge.
  */

  useEffect(() => {
    if (!invoice) {
      return;
    }


    const generationId =
      ++generationRef.current;


    /*
      Live editing ke time unnecessary
      generation avoid karne ke liye
      existing debounce preserve.
    */

    const timer =
      setTimeout(
        async () => {
          try {
            setIsUpdating(true);

            setError("");


            const blob =
              await pdf(
                <InvoiceRenderer
                  invoice={
                    invoice
                  }
                />
              ).toBlob();


            /*
              Agar meanwhile invoice change
              ho gaya hai to stale result
              apply nahi karna.
            */

            if (
              generationId !==
              generationRef.current
            ) {
              return;
            }


            const nextUrl =
              URL.createObjectURL(
                blob
              );


            const previousUrl =
              pdfUrlRef.current;


            pdfUrlRef.current =
              nextUrl;


            setPdfUrl(
              nextUrl
            );


            /*
              Previous Blob URL cleanup.
            */

            if (previousUrl) {
              setTimeout(
                () => {
                  URL.revokeObjectURL(
                    previousUrl
                  );
                },
                1000
              );
            }
          } catch (error) {
            if (
              generationId !==
              generationRef.current
            ) {
              return;
            }


            console.error(
              "Invoice preview generation error:",
              error
            );


            setError(
              "Unable to update invoice preview."
            );
          } finally {
            if (
              generationId ===
              generationRef.current
            ) {
              setIsUpdating(
                false
              );
            }
          }
        },
        300
      );


    return () => {
      clearTimeout(
        timer
      );
    };
  }, [invoice]);


  /*
    =====================================================
    DOWNLOAD
    =====================================================

    IMPORTANT:

    Naya PDF generate nahi kar rahe.

    Preview ke liye jo exact Blob bana hua hai
    wahi download ho raha hai.
  */

  const handleDownload = () => {
    if (!pdfUrl) {
      return;
    }


    const safeFilename =
      String(
        fileName ||
          invoice?.invoiceNumber ||
          "invoice"
      )
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        )
        .slice(
          0,
          100
        );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      pdfUrl;

    link.download =
      `${safeFilename}.pdf`;


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();
  };


  /*
    =====================================================
    PRINT
    =====================================================

    Same already generated PDF ko
    browser print window me open karenge.
  */

  const handlePrint = () => {
    if (!pdfUrl) {
      return;
    }


    const printWindow =
      window.open(
        pdfUrl,
        "_blank"
      );


    if (!printWindow) {
      setError(
        "Unable to open print preview. Please allow pop-ups for this site."
      );

      return;
    }


    /*
      Parent page reference remove kar rahe hain.
    */

    printWindow.opener =
      null;


    /*
      PDF viewer ko thoda load time
      dene ke baad browser print dialog.
    */

    setTimeout(
      () => {
        try {
          printWindow.focus();

          printWindow.print();
        } catch (error) {
          console.error(
            "Invoice print error:",
            error
          );
        }
      },
      800
    );
  };


  /*
    =====================================================
    FINAL CLEANUP
    =====================================================
  */

  useEffect(() => {
    return () => {
      generationRef.current +=
        1;


      if (
        pdfUrlRef.current
      ) {
        URL.revokeObjectURL(
          pdfUrlRef.current
        );


        pdfUrlRef.current =
          null;
      }
    };
  }, []);


  return (
    <div
      ref={containerRef}
      className="
        relative
        min-h-[720px]
        overflow-y-auto
        overflow-x-hidden
        bg-slate-200/70
        px-4
        py-5
        sm:px-6
      "
    >

      {/* =====================================
          DOCUMENT TOOLBAR
      ===================================== */}

      {showActions && (
        <div
          className="
            mx-auto
            mb-5
            flex
            w-full
            max-w-[794px]
            flex-col
            gap-3
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            py-3
            shadow-sm
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-[13px]
                font-bold
                text-slate-800
              "
            >
              Invoice Preview
            </p>

            <p
              className="
                mt-0.5
                text-[11px]
                text-slate-500
              "
            >
              Preview, download or
              print this invoice.
            </p>
          </div>


          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            {/* DOWNLOAD */}

            <button
              type="button"
              onClick={
                handleDownload
              }
              disabled={
                !pdfUrl ||
                isUpdating
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-slate-200
                bg-white
                px-3.5
                py-2
                text-[12px]
                font-semibold
                text-slate-700
                transition
                hover:border-slate-300
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Download
                size={15}
              />

              Download PDF
            </button>


            {/* PRINT */}

            <button
              type="button"
              onClick={
                handlePrint
              }
              disabled={
                !pdfUrl ||
                isUpdating
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-slate-800
                px-3.5
                py-2
                text-[12px]
                font-semibold
                text-white
                transition
                hover:bg-slate-900
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Printer
                size={15}
              />

              Print
            </button>
          </div>
        </div>
      )}


      {/* =====================================
          UPDATE INDICATOR
      ===================================== */}

      {isUpdating &&
        pdfUrl && (
          <div
            className="
              sticky
              top-2
              z-20
              mx-auto
              mb-3
              w-fit
              rounded-full
              border
              border-slate-200
              bg-white/95
              px-3
              py-1.5
              text-[10px]
              font-semibold
              text-slate-500
              shadow-sm
              backdrop-blur
            "
          >
            Updating preview...
          </div>
        )}


      {/* =====================================
          CENTERED DOCUMENT AREA
      ===================================== */}

      <div
        className="
          mx-auto
          w-full
          max-w-[820px]
        "
      >

        {/* ERROR */}

        {error && (
          <div
            className="
              mb-4
              rounded-xl
              border
              border-red-100
              bg-red-50
              px-4
              py-3
              text-[12px]
              font-medium
              text-red-600
            "
          >
            {error}
          </div>
        )}


        {/* INITIAL LOADING */}

        {!pdfUrl &&
          !error && (
            <div
              className="
                flex
                min-h-[680px]
                items-center
                justify-center
              "
            >
              <div className="text-center">
                <div
                  className="
                    mx-auto
                    h-7
                    w-7
                    animate-spin
                    rounded-full
                    border-2
                    border-slate-300
                    border-t-green-500
                  "
                />

                <p
                  className="
                    mt-3
                    text-[12px]
                    font-medium
                    text-slate-500
                  "
                >
                  Preparing invoice
                  preview...
                </p>
              </div>
            </div>
          )}


        {/* =================================
            PDF PREVIEW
        ================================= */}

        {pdfUrl && (
          <PdfDocument
            file={pdfUrl}

            onLoadSuccess={({
              numPages,
            }) => {
              setNumPages(
                numPages
              );
            }}

            onLoadError={(
              error
            ) => {
              console.error(
                "PDF preview load error:",
                error
              );


              setError(
                "Unable to display invoice preview."
              );
            }}

            loading={
              <div
                className="
                  flex
                  min-h-[680px]
                  items-center
                  justify-center
                "
              >
                <div className="text-center">
                  <div
                    className="
                      mx-auto
                      h-7
                      w-7
                      animate-spin
                      rounded-full
                      border-2
                      border-slate-300
                      border-t-green-500
                    "
                  />

                  <p
                    className="
                      mt-3
                      text-[12px]
                      text-slate-500
                    "
                  >
                    Loading preview...
                  </p>
                </div>
              </div>
            }
          >
            {Array.from(
              {
                length:
                  numPages,
              },

              (_, index) => {
                const pageNumber =
                  index + 1;


                return (
                  <div
                    key={
                      pageNumber
                    }
                    className="
                      flex
                      w-full
                      justify-center
                    "
                  >
                    <PdfPage
                      pageNumber={
                        pageNumber
                      }

                      width={
                        pageWidth
                      }

                      renderTextLayer={
                        false
                      }

                      renderAnnotationLayer={
                        false
                      }

                      className="
                        mb-6
                        overflow-hidden
                        bg-white
                        shadow-xl
                        ring-1
                        ring-slate-300/50
                      "
                    />
                  </div>
                );
              }
            )}
          </PdfDocument>
        )}
      </div>
    </div>
  );
};


export default InvoiceDocumentPreview;