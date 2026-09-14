import React, {
  useEffect,
  useState,
} from "react";

import {
  LoaderCircle,
  Mail,
  Send,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  sendInvoiceEmail,
} from "../services/invoiceApi";


const SendInvoiceModal = ({
  open,
  onClose,
  invoiceId,
  invoiceNumber,
  defaultEmail = "",
}) => {

  const [
    recipientEmail,
    setRecipientEmail,
  ] = useState("");

  const [
    subject,
    setSubject,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    isSending,
    setIsSending,
  ] = useState(false);


  useEffect(() => {
    if (!open) {
      return;
    }


    setRecipientEmail(
      defaultEmail || ""
    );


    setSubject(
      `Invoice ${
        invoiceNumber || ""
      }`
    );


    setMessage(
      `Hello,

Please find attached invoice ${
        invoiceNumber || ""
      }.

Kindly review the attached invoice.

Thank you.`
    );

  }, [
    open,
    defaultEmail,
    invoiceNumber,
  ]);


  if (!open) {
    return null;
  }


  const handleSubmit =
    async (event) => {
      event.preventDefault();


      const email =
        recipientEmail.trim();


      if (!email) {
        toast.error(
          "Please enter recipient email."
        );

        return;
      }


      try {
        setIsSending(true);


        const data =
          await sendInvoiceEmail({
            invoiceId,

            recipientEmail:
              email,

            subject:
              subject.trim(),

            message:
              message.trim(),
          });


        toast.success(
          data.message ||
            "Invoice sent successfully."
        );


        onClose();

      } catch (error) {
        console.error(
          "Send invoice error:",
          error
        );

        toast.error(
          error.message ||
            "Unable to send invoice."
        );

      } finally {
        setIsSending(false);
      }
    };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">

      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Mail size={18} />
            </div>

            <div>
              <h3 className="text-[16px] font-bold text-gray-800">
                Send Invoice
              </h3>

              <p className="mt-0.5 text-[11px] text-gray-400">
                {invoiceNumber}
              </p>
            </div>

          </div>


          <button
            type="button"
            disabled={isSending}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={17} />
          </button>

        </div>


        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >

          {/* EMAIL */}

          <div>
            <label className="mb-2 block text-[12px] font-semibold text-gray-600">
              Send To
            </label>

            <input
              type="email"
              required
              value={
                recipientEmail
              }
              onChange={(event) =>
                setRecipientEmail(
                  event.target.value
                )
              }
              placeholder="client@example.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />

            {defaultEmail && (
              <p className="mt-1.5 text-[10px] text-gray-400">
                Customer registered email is prefilled. You can change it if required.
              </p>
            )}
          </div>


          {/* SUBJECT */}

          <div>
            <label className="mb-2 block text-[12px] font-semibold text-gray-600">
              Subject
            </label>

            <input
              type="text"
              maxLength={200}
              value={subject}
              onChange={(event) =>
                setSubject(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />
          </div>


          {/* MESSAGE */}

          <div>
            <label className="mb-2 block text-[12px] font-semibold text-gray-600">
              Message
            </label>

            <textarea
              rows={6}
              maxLength={5000}
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm leading-6 text-gray-700 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />
          </div>


          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">

            <button
              type="button"
              disabled={isSending}
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={isSending}
              className="inline-flex min-w-[135px] items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-300"
            >
              {isSending ? (
                <>
                  <LoaderCircle
                    size={15}
                    className="animate-spin"
                  />

                  Sending...
                </>
              ) : (
                <>
                  <Send size={15} />

                  Send Invoice
                </>
              )}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};


export default SendInvoiceModal;