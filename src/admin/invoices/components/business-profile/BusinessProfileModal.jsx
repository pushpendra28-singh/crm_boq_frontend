import React, {
  useEffect,
  useState,
} from "react";

import {
  X,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import toast from "react-hot-toast";

import BusinessProfileForm from "./BusinessProfileForm";

import {
  BusinessProfileApiError,
  saveBusinessProfile,
  uploadBusinessLogo,
} from "../../services/businessProfileApi";


const BusinessProfileModal = ({
  open,

  profileData,

  onClose,

  onProfileUpdated,

  onCompleted,
}) => {
  const [
    isSaving,
    setIsSaving,
  ] = useState(false);


  const [
    serverErrors,
    setServerErrors,
  ] = useState({});


  const [
    currentProfileData,
    setCurrentProfileData,
  ] = useState(
    profileData || null
  );


  /* ─────────────────────────────────────────────
     Sync latest profile from parent
  ───────────────────────────────────────────── */

  useEffect(() => {
    if (!open) {
      return;
    }

    setCurrentProfileData(
      profileData || null
    );

    setServerErrors({});
  }, [
    open,
    profileData,
  ]);


  /* ─────────────────────────────────────────────
     Prevent background page scrolling
  ───────────────────────────────────────────── */

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";


    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);


  /* ─────────────────────────────────────────────
     Escape key
  ───────────────────────────────────────────── */

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown =
      (event) => {
        if (
          event.key ===
            "Escape" &&
          !isSaving
        ) {
          onClose?.();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    isSaving,
    onClose,
  ]);


  if (!open) {
    return null;
  }


  /* ─────────────────────────────────────────────
     Helper:
     update local + parent profile state
  ───────────────────────────────────────────── */

  const syncProfileData =
    (data) => {
      if (!data) {
        return;
      }

      setCurrentProfileData(
        data
      );

      if (
        typeof onProfileUpdated ===
        "function"
      ) {
        onProfileUpdated(
          data
        );
      }
    };


  /* ─────────────────────────────────────────────
     Save orchestration
  ───────────────────────────────────────────── */

  const handleSave =
    async ({
      formData,
      logoFile,
    }) => {
      if (isSaving) {
        return;
      }


      setIsSaving(true);

      setServerErrors({});


      try {
        /*
         * STEP 1
         *
         * Save normal business data first.
         *
         * Backend will create/update the current
         * user's own BusinessProfile.
         */
        const savedProfile =
          await saveBusinessProfile(
            formData
          );


        syncProfileData(
          savedProfile
        );


        let finalProfile =
          savedProfile;


        /*
         * STEP 2
         *
         * If user selected a new logo,
         * upload it through dedicated multipart API.
         */
        if (logoFile) {
          const logoResponse =
            await uploadBusinessLogo(
              logoFile
            );


          finalProfile =
            logoResponse;


          syncProfileData(
            logoResponse
          );
        }


        /*
         * STEP 3
         *
         * Backend completion state is authoritative.
         */
        if (
          finalProfile
            ?.isComplete
        ) {
          toast.success(
            "Business profile completed successfully."
          );


          if (
            typeof onCompleted ===
            "function"
          ) {
            onCompleted(
              finalProfile
            );
          }


          /*
           * Complete profile ke baad
           * modal automatically close.
           */
          onClose?.();

          return;
        }


        /*
         * Partial profile successfully saved,
         * but invoice-ready nahi.
         *
         * Modal open hi rahega.
         */
        toast.error(
          "Please complete the remaining business details."
        );
      } catch (error) {
        console.error(
          "Business profile save error:",
          error
        );


        /*
         * Backend validation errors:
         *
         * {
         *   email: "...",
         *   "bank.ifsc": "..."
         * }
         */
        if (
          error instanceof
          BusinessProfileApiError
        ) {
          if (
            error.errors &&
            Object.keys(
              error.errors
            ).length > 0
          ) {
            setServerErrors(
              error.errors
            );
          }


          if (
            error.code ===
            "AUTHENTICATION_REQUIRED"
          ) {
            toast.error(
              "Your session has expired. Please login again."
            );

            return;
          }


          if (
            error.code ===
              "BUSINESS_LOGO_TOO_LARGE" ||
            error.code ===
              "INVALID_BUSINESS_LOGO" ||
            error.code ===
              "BUSINESS_LOGO_REQUIRED"
          ) {
            setServerErrors(
              (previous) => ({
                ...previous,

                logoUrl:
                  error.message,
              })
            );

            return;
          }


          toast.error(
            error.message ||
              "Unable to save business profile."
          );

          return;
        }


        toast.error(
          "Unable to save business profile. Please try again."
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };


  const missingFields =
    Array.isArray(
      currentProfileData
        ?.missingFields
    )
      ? currentProfileData
          .missingFields
      : [];


  const initialData =
    currentProfileData
      ?.formData || {};


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close business profile modal"
        onClick={() => {
          if (!isSaving) {
            onClose?.();
          }
        }}
        className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-[3px]"
      />


      {/* MODAL */}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-profile-modal-title"
        className="relative z-10 flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 shadow-2xl"
      >
        {/* HEADER */}

        <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <Building2
                  size={22}
                />
              </div>


              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="business-profile-modal-title"
                    className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl"
                  >
                    Complete Your Business Profile
                  </h2>


                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    <ShieldCheck
                      size={12}
                    />

                    Secure
                  </span>
                </div>


                <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-slate-500">
                  Add the business, tax and payment details that will appear on your professional invoices.
                </p>
              </div>
            </div>


            <button
              type="button"
              disabled={
                isSaving
              }
              onClick={() =>
                onClose?.()
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>


          {/* STATUS */}

          <div className="mt-5">
            {currentProfileData
              ?.isComplete ? (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <div>
                  <p className="text-[12px] font-bold text-emerald-800">
                    Business profile complete
                  </p>

                  <p className="mt-0.5 text-[11px] text-emerald-700">
                    Your business information is ready for invoice generation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <div>
                  <p className="text-[12px] font-bold text-amber-800">
                    Business profile required
                  </p>

                  <p className="mt-0.5 text-[11px] leading-5 text-amber-700">
                    Complete the required information before creating a new invoice.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* SCROLLABLE FORM */}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">
          <BusinessProfileForm
            initialData={
              initialData
            }
            missingFields={
              missingFields
            }
            serverErrors={
              serverErrors
            }
            isSubmitting={
              isSaving
            }
            submitLabel={
              currentProfileData
                ?.profileExists
                ? "Save & Continue"
                : "Create Business Profile"
            }
            onSubmit={
              handleSave
            }
          />
        </div>
      </div>
    </div>
  );
};


export default BusinessProfileModal;