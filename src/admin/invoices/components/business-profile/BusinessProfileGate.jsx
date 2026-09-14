import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Building2,
  RefreshCw,
  ShieldCheck,
  FileText,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import BusinessProfileModal from "./BusinessProfileModal";

import {
  BusinessProfileApiError,
  getBusinessProfile,
} from "../../services/businessProfileApi";

import {
  getMissingBusinessProfileLabels,
} from "./businessProfileFormUtils";


const BusinessProfileGate = ({
  children,
}) => {
  const [
    profileData,
    setProfileData,
  ] = useState(null);


  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  const [
    loadError,
    setLoadError,
  ] = useState("");


  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);


  /*
   * Incomplete profile par modal first load
   * me automatically ek baar open hoga.
   *
   * User manually close kare to instantly
   * dobara force-open nahi karenge.
   */
  const hasAutoOpenedRef =
    useRef(false);


  /* ─────────────────────────────────────────────
     Load profile
  ───────────────────────────────────────────── */

  const loadBusinessProfile =
    useCallback(
      async ({
        allowAutoOpen = true,
      } = {}) => {
        setIsLoading(true);
        setLoadError("");


        try {
          const response =
            await getBusinessProfile();


          setProfileData(
            response
          );


          /*
           * Complete profile:
           * CreateInvoice directly render hoga.
           */
          if (
            response?.isComplete
          ) {
            setIsModalOpen(
              false
            );

            return;
          }


          /*
           * First incomplete load:
           * onboarding modal automatically open.
           */
          if (
            allowAutoOpen &&
            !hasAutoOpenedRef.current
          ) {
            hasAutoOpenedRef.current =
              true;

            setIsModalOpen(
              true
            );
          }
        } catch (error) {
          console.error(
            "Load business profile error:",
            error
          );


          if (
            error instanceof
            BusinessProfileApiError
          ) {
            if (
              error.code ===
              "AUTHENTICATION_REQUIRED"
            ) {
              setLoadError(
                "Your session has expired. Please login again."
              );

              return;
            }


            setLoadError(
              error.message ||
                "Unable to load your business profile."
            );

            return;
          }


          setLoadError(
            "Unable to load your business profile. Please try again."
          );
        } finally {
          setIsLoading(
            false
          );
        }
      },
      []
    );


  /* ─────────────────────────────────────────────
     Initial load
  ───────────────────────────────────────────── */

  useEffect(() => {
    loadBusinessProfile();
  }, [loadBusinessProfile]);


  /* ─────────────────────────────────────────────
     Modal callbacks
  ───────────────────────────────────────────── */

  const handleProfileUpdated =
    (updatedProfile) => {
      if (!updatedProfile) {
        return;
      }

      setProfileData(
        updatedProfile
      );
    };


  const handleProfileCompleted =
    (completedProfile) => {
      if (!completedProfile) {
        return;
      }


      setProfileData(
        completedProfile
      );

      setIsModalOpen(
        false
      );
    };


  const handleModalClose =
    () => {
      setIsModalOpen(
        false
      );
    };


  const openProfileModal =
    () => {
      setIsModalOpen(
        true
      );
    };


  /* ─────────────────────────────────────────────
     Loading State
  ───────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <RefreshCw
              size={22}
              className="animate-spin text-emerald-600"
            />
          </div>

          <h3 className="mt-4 text-[15px] font-bold text-slate-800">
            Preparing Invoice Workspace
          </h3>

          <p className="mt-1 text-[12px] text-slate-500">
            Checking your business profile...
          </p>
        </div>
      </div>
    );
  }


  /* ─────────────────────────────────────────────
     API Load Error
  ───────────────────────────────────────────── */

  if (loadError) {
    return (
      <div className="flex min-h-[520px] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle
              size={22}
            />
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-800">
            Unable to Load Business Profile
          </h3>

          <p className="mt-2 text-[13px] leading-6 text-slate-500">
            {loadError}
          </p>


          <button
            type="button"
            onClick={() =>
              loadBusinessProfile({
                allowAutoOpen:
                  false,
              })
            }
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-slate-800"
          >
            <RefreshCw
              size={15}
            />

            Try Again
          </button>
        </div>
      </div>
    );
  }


  /* ─────────────────────────────────────────────
     Complete Profile
  ───────────────────────────────────────────── */

 if (profileData?.isComplete) {
  return (
    <>
      {typeof children === "function"
        ? children({
            businessProfile:
              profileData.formData,

            onEditBusinessProfile:
              openProfileModal,
          })
        : children}

      <BusinessProfileModal
        open={isModalOpen}
        profileData={profileData}
        onClose={handleModalClose}
        onProfileUpdated={
          handleProfileUpdated
        }
        onCompleted={
          handleProfileCompleted
        }
      />
    </>
  );
}


  /* ─────────────────────────────────────────────
     Incomplete / Missing Profile
  ───────────────────────────────────────────── */

  const missingLabels =
    getMissingBusinessProfileLabels(
      profileData?.missingFields ||
        []
    );


  return (
    <>
      {/* LOCKED CREATE INVOICE STATE */}

      <div className="flex min-h-[540px] items-center justify-center px-3 py-10 sm:px-6">
        <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          {/* TOP ACCENT */}

          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />


          <div className="p-6 sm:p-9">
            {/* ICON */}

            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <Building2
                  size={25}
                />
              </div>


              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                    Complete Your Business Profile
                  </h2>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    <ShieldCheck
                      size={12}
                    />

                    Required
                  </span>
                </div>


                <p className="mt-2 max-w-xl text-[13px] leading-6 text-slate-500">
                  Before creating invoices, add the business information that should appear on your invoice documents.
                </p>
              </div>
            </div>


            {/* WHY REQUIRED */}

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Building2
                  size={18}
                  className="text-emerald-600"
                />

                <p className="mt-3 text-[12px] font-bold text-slate-700">
                  Business Identity
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Company name, logo and contact information.
                </p>
              </div>


              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <FileText
                  size={18}
                  className="text-emerald-600"
                />

                <p className="mt-3 text-[12px] font-bold text-slate-700">
                  Tax Information
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  GST and registered business details.
                </p>
              </div>


              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <ShieldCheck
                  size={18}
                  className="text-emerald-600"
                />

                <p className="mt-3 text-[12px] font-bold text-slate-700">
                  Payment Details
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Secure bank details for invoice payments.
                </p>
              </div>
            </div>


            {/* MISSING FIELDS */}

            {missingLabels.length >
              0 && (
              <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>
                    <p className="text-[12px] font-bold text-amber-800">
                      Information still required
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-amber-700">
                      {missingLabels
                        .slice(
                          0,
                          6
                        )
                        .join(
                          ", "
                        )}

                      {missingLabels.length >
                      6
                        ? ` and ${
                            missingLabels.length -
                            6
                          } more`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}


            {/* CTA */}

            <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-[11px] leading-5 text-slate-500">
                Your saved registration information will be pre-filled where available. You can edit it before saving your business profile.
              </p>


              <button
                type="button"
                onClick={
                  openProfileModal
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[12px] font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Complete Business Profile

                <ArrowRight
                  size={16}
                />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* PROFILE MODAL */}

      <BusinessProfileModal
        open={
          isModalOpen
        }
        profileData={
          profileData
        }
        onClose={
          handleModalClose
        }
        onProfileUpdated={
          handleProfileUpdated
        }
        onCompleted={
          handleProfileCompleted
        }
      />
    </>
  );
};


export default BusinessProfileGate;