import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Building2,
  Upload,
  UserRound,
  Mail,
  Phone,
  Globe2,
  MapPin,
  Landmark,
  FileText,
  ImageIcon,
  CheckCircle2,
} from "lucide-react";

import {
  normalizeBusinessProfileForm,
  updateBusinessProfileField,
  updateBusinessAddressField,
  updateBusinessBankField,
  validateBusinessProfileForm,
  isBusinessProfileFieldMissing,
} from "./businessProfileFormUtils";

import {
  resolveBusinessLogoUrl,
} from "../../services/businessProfileApi";


const ALLOWED_LOGO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_LOGO_SIZE =
  2 * 1024 * 1024;


/* ─────────────────────────────────────────────
   Small reusable field components
───────────────────────────────────────────── */

const FieldLabel = ({
  children,
  required = false,
}) => {
  return (
    <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
      {children}

      {required && (
        <span className="ml-1 text-red-500">
          *
        </span>
      )}
    </label>
  );
};


const FieldError = ({
  message,
}) => {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-1.5 text-[11px] font-medium text-red-500">
      {message}
    </p>
  );
};


const SectionHeader = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Icon size={18} />
      </div>

      <div>
        <h3 className="text-[15px] font-bold text-slate-800">
          {title}
        </h3>

        <p className="mt-0.5 text-[12px] leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
};


/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */

const BusinessProfileForm = ({
  initialData,
  missingFields = [],
  serverErrors = {},
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Business Profile",
  showSubmitButton = true,
}) => {
  const fileInputRef =
    useRef(null);


  const [
    form,
    setForm,
  ] = useState(() =>
    normalizeBusinessProfileForm(
      initialData
    )
  );


  const [
    logoFile,
    setLogoFile,
  ] = useState(null);


  const [
    logoPreviewUrl,
    setLogoPreviewUrl,
  ] = useState("");


  const [
    clientErrors,
    setClientErrors,
  ] = useState({});


  /* ─────────────────────────────────────────────
     Sync API data into form
  ───────────────────────────────────────────── */

  useEffect(() => {
    setForm(
      normalizeBusinessProfileForm(
        initialData
      )
    );

    setLogoFile(null);

    setClientErrors({});
  }, [initialData]);


  /* ─────────────────────────────────────────────
     Logo preview
  ───────────────────────────────────────────── */

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl("");

      return undefined;
    }


    const objectUrl =
      URL.createObjectURL(
        logoFile
      );

    setLogoPreviewUrl(
      objectUrl
    );


    return () => {
      URL.revokeObjectURL(
        objectUrl
      );
    };
  }, [logoFile]);


  const existingLogoUrl =
    useMemo(() => {
      return resolveBusinessLogoUrl(
        form.logoUrl
      );
    }, [form.logoUrl]);


  const displayedLogoUrl =
    logoPreviewUrl ||
    existingLogoUrl;


  /* ─────────────────────────────────────────────
     Error helpers
  ───────────────────────────────────────────── */

  const getFieldError =
    (field) => {
      if (
        clientErrors[field]
      ) {
        return clientErrors[
          field
        ];
      }


      if (
        serverErrors?.[field]
      ) {
        return serverErrors[
          field
        ];
      }


      return "";
    };


  const hasFieldProblem =
    (field) => {
      return Boolean(
        getFieldError(field)
      ) ||
        isBusinessProfileFieldMissing(
          missingFields,
          field
        );
    };


  const getInputClasses =
    (field) => {
      const base =
        "w-full rounded-xl border bg-white px-3.5 py-2.5 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2";

      if (
        hasFieldProblem(
          field
        )
      ) {
        return `${base} border-red-300 focus:border-red-400 focus:ring-red-100`;
      }

      return `${base} border-slate-200 focus:border-emerald-400 focus:ring-emerald-100`;
    };


  /* ─────────────────────────────────────────────
     Change handlers
  ───────────────────────────────────────────── */

  const handleFieldChange =
    (
      field,
      value
    ) => {
      setForm(
        (previous) =>
          updateBusinessProfileField(
            previous,
            field,
            value
          )
      );


      setClientErrors(
        (previous) => {
          if (
            !previous[field]
          ) {
            return previous;
          }

          const next = {
            ...previous,
          };

          delete next[field];

          return next;
        }
      );
    };


  const handleAddressChange =
    (
      field,
      value
    ) => {
      setForm(
        (previous) =>
          updateBusinessAddressField(
            previous,
            field,
            value
          )
      );


      const errorKey =
        `address.${field}`;


      setClientErrors(
        (previous) => {
          if (
            !previous[
              errorKey
            ]
          ) {
            return previous;
          }

          const next = {
            ...previous,
          };

          delete next[
            errorKey
          ];

          return next;
        }
      );
    };


  const handleBankChange =
    (
      field,
      value
    ) => {
      setForm(
        (previous) =>
          updateBusinessBankField(
            previous,
            field,
            value
          )
      );


      const errorKey =
        `bank.${field}`;


      setClientErrors(
        (previous) => {
          if (
            !previous[
              errorKey
            ]
          ) {
            return previous;
          }

          const next = {
            ...previous,
          };

          delete next[
            errorKey
          ];

          return next;
        }
      );
    };


  /* ─────────────────────────────────────────────
     Logo selection
  ───────────────────────────────────────────── */

  const handleLogoChange =
    (event) => {
      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      if (
        !ALLOWED_LOGO_TYPES.includes(
          file.type
        )
      ) {
        setClientErrors(
          (previous) => ({
            ...previous,

            logoUrl:
              "Only JPG, PNG and WebP logo files are allowed.",
          })
        );

        event.target.value =
          "";

        return;
      }


      if (
        file.size >
        MAX_LOGO_SIZE
      ) {
        setClientErrors(
          (previous) => ({
            ...previous,

            logoUrl:
              "Business logo cannot exceed 2 MB.",
          })
        );

        event.target.value =
          "";

        return;
      }


      setLogoFile(
        file
      );


      setClientErrors(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next.logoUrl;

          return next;
        }
      );
    };


  /* ─────────────────────────────────────────────
     GST
  ───────────────────────────────────────────── */

  const handleGSTChange =
    (isRegistered) => {
      setForm(
        (previous) => ({
          ...previous,

          gstRegistered:
            isRegistered,

          gstin:
            isRegistered
              ? previous.gstin
              : "",
        })
      );


      setClientErrors(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next.gstin;
          delete next.gstRegistered;

          return next;
        }
      );
    };


  /* ─────────────────────────────────────────────
     Submit
  ───────────────────────────────────────────── */

  const handleSubmit =
    async (event) => {
      event.preventDefault();


      if (isSubmitting) {
        return;
      }


      const validation =
        validateBusinessProfileForm(
          form
        );


      const errors = {
        ...validation.errors,
      };


      /*
       * New profile ke liye uploaded logo required.
       *
       * Existing saved logo ho to new file
       * select karna required nahi.
       */
      if (
        !form.logoUrl &&
        !logoFile
      ) {
        errors.logoUrl =
          "Business logo is required.";
      }


      if (
        Object.keys(
          errors
        ).length > 0
      ) {
        setClientErrors(
          errors
        );

        return;
      }


      setClientErrors({});


      if (
        typeof onSubmit ===
        "function"
      ) {
        await onSubmit({
          formData: form,
          logoFile,
        });
      }
    };


  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-6"
      noValidate
    >
      {/* =========================================
          BUSINESS IDENTITY
      ========================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <SectionHeader
          icon={
            Building2
          }
          title="Business Identity"
          description="Add the business information that will appear on your invoices."
        />


        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <FieldLabel required>
              Business Name
            </FieldLabel>

            <input
              type="text"
              value={
                form.businessName
              }
              onChange={(
                event
              ) =>
                handleFieldChange(
                  "businessName",
                  event.target.value
                )
              }
              placeholder="Enter business name"
              className={getInputClasses(
                "businessName"
              )}
            />

            <FieldError
              message={getFieldError(
                "businessName"
              )}
            />
          </div>


          <div>
            <FieldLabel>
              Business Type
            </FieldLabel>

            <input
              type="text"
              value={
                form.businessType
              }
              onChange={(
                event
              ) =>
                handleFieldChange(
                  "businessType",
                  event.target.value
                )
              }
              placeholder="e.g. Software Development"
              className={getInputClasses(
                "businessType"
              )}
            />

            <FieldError
              message={getFieldError(
                "businessType"
              )}
            />
          </div>


          <div className="md:col-span-2">
            <FieldLabel required>
              Authorized Signatory
            </FieldLabel>

            <div className="relative">
              <UserRound
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={
                  form.authorizedSignatory
                }
                onChange={(
                  event
                ) =>
                  handleFieldChange(
                    "authorizedSignatory",
                    event.target.value
                  )
                }
                placeholder="Name of authorized signatory"
                className={`${getInputClasses(
                  "authorizedSignatory"
                )} pl-10`}
              />
            </div>

            <FieldError
              message={getFieldError(
                "authorizedSignatory"
              )}
            />
          </div>
        </div>
      </section>


      {/* =========================================
          LOGO
      ========================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <SectionHeader
          icon={
            ImageIcon
          }
          title="Business Logo"
          description="Upload the logo that should appear on your professional invoices."
        />


        <div
          className={`rounded-2xl border-2 border-dashed p-5 transition ${
            hasFieldProblem(
              "logoUrl"
            )
              ? "border-red-300 bg-red-50/30"
              : "border-slate-200 bg-slate-50/60"
          }`}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {displayedLogoUrl ? (
                <img
                  src={
                    displayedLogoUrl
                  }
                  alt="Business logo preview"
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <Building2
                  size={28}
                  className="text-slate-300"
                />
              )}
            </div>


            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-700">
                {logoFile
                  ? logoFile.name
                  : form.logoUrl
                    ? "Current business logo"
                    : "No logo uploaded"}
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                JPG, PNG or WebP. Maximum file size 2 MB.
              </p>


              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-600"
              >
                <Upload size={15} />

                {displayedLogoUrl
                  ? "Change Logo"
                  : "Upload Logo"}
              </button>


              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={
                  handleLogoChange
                }
                className="hidden"
              />
            </div>
          </div>
        </div>

        <FieldError
          message={getFieldError(
            "logoUrl"
          )}
        />
      </section>


      {/* =========================================
          CONTACT
      ========================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <SectionHeader
          icon={Mail}
          title="Contact Information"
          description="These details will be shown as your business contact information."
        />


        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <FieldLabel required>
              Business Email
            </FieldLabel>

            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="email"
                value={
                  form.email
                }
                onChange={(
                  event
                ) =>
                  handleFieldChange(
                    "email",
                    event.target.value
                  )
                }
                placeholder="accounts@company.com"
                className={`${getInputClasses(
                  "email"
                )} pl-10`}
              />
            </div>

            <FieldError
              message={getFieldError(
                "email"
              )}
            />
          </div>


          <div>
            <FieldLabel required>
              Phone Number
            </FieldLabel>

            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="tel"
                value={
                  form.phone
                }
                onChange={(
                  event
                ) =>
                  handleFieldChange(
                    "phone",
                    event.target.value
                  )
                }
                placeholder="+91 98765 43210"
                className={`${getInputClasses(
                  "phone"
                )} pl-10`}
              />
            </div>

            <FieldError
              message={getFieldError(
                "phone"
              )}
            />
          </div>


          <div className="md:col-span-2">
            <FieldLabel>
              Website
            </FieldLabel>

            <div className="relative">
              <Globe2
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={
                  form.website
                }
                onChange={(
                  event
                ) =>
                  handleFieldChange(
                    "website",
                    event.target.value
                  )
                }
                placeholder="https://yourcompany.com"
                className={`${getInputClasses(
                  "website"
                )} pl-10`}
              />
            </div>

            <FieldError
              message={getFieldError(
                "website"
              )}
            />
          </div>
        </div>
      </section>


      {/* =========================================
          ADDRESS
      ========================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <SectionHeader
          icon={
            MapPin
          }
          title="Business Address"
          description="Provide the registered or billing address that should appear on invoices."
        />


        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <FieldLabel required>
              Address Line 1
            </FieldLabel>

            <input
              type="text"
              value={
                form.address.line1
              }
              onChange={(
                event
              ) =>
                handleAddressChange(
                  "line1",
                  event.target.value
                )
              }
              placeholder="Building, street, area"
              className={getInputClasses(
                "address.line1"
              )}
            />

            <FieldError
              message={getFieldError(
                "address.line1"
              )}
            />
          </div>


          <div className="md:col-span-2">
            <FieldLabel>
              Address Line 2
            </FieldLabel>

            <input
              type="text"
              value={
                form.address.line2
              }
              onChange={(
                event
              ) =>
                handleAddressChange(
                  "line2",
                  event.target.value
                )
              }
              placeholder="Landmark, floor, locality"
              className={getInputClasses(
                "address.line2"
              )}
            />
          </div>


          <div>
            <FieldLabel required>
              City
            </FieldLabel>

            <input
              type="text"
              value={
                form.address.city
              }
              onChange={(
                event
              ) =>
                handleAddressChange(
                  "city",
                  event.target.value
                )
              }
              placeholder="City"
              className={getInputClasses(
                "address.city"
              )}
            />

            <FieldError
              message={getFieldError(
                "address.city"
              )}
            />
          </div>


          <div>
            <FieldLabel required>
              State
            </FieldLabel>

            <input
              type="text"
              value={
                form.address.state
              }
              onChange={(
                event
              ) =>
                handleAddressChange(
                  "state",
                  event.target.value
                )
              }
              placeholder="State"
              className={getInputClasses(
                "address.state"
              )}
            />

            <FieldError
              message={getFieldError(
                "address.state"
              )}
            />
          </div>


          <div>
            <FieldLabel required>
              PIN Code
            </FieldLabel>

            <input
              type="text"
              inputMode="numeric"
              value={
                form.address.postalCode
              }
              onChange={(
                event
              ) =>
                handleAddressChange(
                  "postalCode",
                  event.target.value
                )
              }
              placeholder="201301"
              className={getInputClasses(
                "address.postalCode"
              )}
            />

            <FieldError
              message={getFieldError(
                "address.postalCode"
              )}
            />
          </div>


          <div>
            <FieldLabel required>
              Country
            </FieldLabel>

            <input
              type="text"
              value={
                form.address.country
              }
              onChange={(
                event
              ) =>
                handleAddressChange(
                  "country",
                  event.target.value
                )
              }
              placeholder="India"
              className={getInputClasses(
                "address.country"
              )}
            />

            <FieldError
              message={getFieldError(
                "address.country"
              )}
            />
          </div>
        </div>
      </section>


      {/* =========================================
          GST
      ========================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <SectionHeader
          icon={
            FileText
          }
          title="Tax Information"
          description="Configure GST information that should be printed on invoices."
        />


        <div>
          <FieldLabel required>
            Is your business GST registered?
          </FieldLabel>


          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                handleGSTChange(
                  true
                )
              }
              className={`rounded-xl border px-4 py-2.5 text-[12px] font-semibold transition ${
                form.gstRegistered
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              Yes, GST Registered
            </button>


            <button
              type="button"
              onClick={() =>
                handleGSTChange(
                  false
                )
              }
              className={`rounded-xl border px-4 py-2.5 text-[12px] font-semibold transition ${
                !form.gstRegistered
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              No
            </button>
          </div>
        </div>


        {form.gstRegistered && (
          <div className="mt-5">
            <FieldLabel required>
              GSTIN
            </FieldLabel>

            <input
              type="text"
              value={
                form.gstin
              }
              onChange={(
                event
              ) =>
                handleFieldChange(
                  "gstin",
                  event.target.value.toUpperCase()
                )
              }
              placeholder="09ABCDE1234F1Z5"
              maxLength={15}
              className={getInputClasses(
                "gstin"
              )}
            />

            <FieldError
              message={getFieldError(
                "gstin"
              )}
            />
          </div>
        )}
      </section>


      {/* =========================================
          BANK
      ========================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <SectionHeader
          icon={
            Landmark
          }
          title="Bank & Payment Details"
          description="These payment details will be available on generated invoices."
        />


        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <FieldLabel required>
              Account Holder Name
            </FieldLabel>

            <input
              type="text"
              value={
                form.bank.accountName
              }
              onChange={(
                event
              ) =>
                handleBankChange(
                  "accountName",
                  event.target.value
                )
              }
              placeholder="Account holder name"
              className={getInputClasses(
                "bank.accountName"
              )}
            />

            <FieldError
              message={getFieldError(
                "bank.accountName"
              )}
            />
          </div>


          <div>
            <FieldLabel required>
              Bank Name
            </FieldLabel>

            <input
              type="text"
              value={
                form.bank.bankName
              }
              onChange={(
                event
              ) =>
                handleBankChange(
                  "bankName",
                  event.target.value
                )
              }
              placeholder="Bank name"
              className={getInputClasses(
                "bank.bankName"
              )}
            />

            <FieldError
              message={getFieldError(
                "bank.bankName"
              )}
            />
          </div>


          <div>
            <FieldLabel required>
              Account Number
            </FieldLabel>

            <input
              type="text"
              inputMode="numeric"
              value={
                form.bank.accountNumber
              }
              onChange={(
                event
              ) =>
                handleBankChange(
                  "accountNumber",
                  event.target.value
                )
              }
              placeholder="Account number"
              className={getInputClasses(
                "bank.accountNumber"
              )}
            />

            <FieldError
              message={getFieldError(
                "bank.accountNumber"
              )}
            />
          </div>


          <div>
            <FieldLabel required>
              IFSC Code
            </FieldLabel>

            <input
              type="text"
              value={
                form.bank.ifsc
              }
              onChange={(
                event
              ) =>
                handleBankChange(
                  "ifsc",
                  event.target.value.toUpperCase()
                )
              }
              placeholder="HDFC0001234"
              className={getInputClasses(
                "bank.ifsc"
              )}
            />

            <FieldError
              message={getFieldError(
                "bank.ifsc"
              )}
            />
          </div>
        </div>
      </section>


      {/* =========================================
          SUBMIT
      ========================================== */}

      {showSubmitButton && (
        <div className="sticky bottom-0 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur">
          <button
            type="submit"
            disabled={
              isSubmitting
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[13px] font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                Saving Business Profile...
              </>
            ) : (
              <>
                <CheckCircle2
                  size={17}
                />

                {submitLabel}
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
};


export default BusinessProfileForm;