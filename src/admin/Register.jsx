import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Landmark,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import API_BASE_URL from "../config/api";


const INITIAL_FORM = {
  accountType: "",

  name: "",
  email: "",
  password: "",
  confirmPassword: "",

  phone: "",

  businessName: "",
  businessType: "",

  profession: "",

  gstin: "",
  address: "",

  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
};


const Register = ({ title }) => {
    console.log("Register component rendered with title:", title);
  const navigate = useNavigate();

  const [step, setStep] =
    useState(1);

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [errors, setErrors] =
    useState({});

  const [apiMessage, setApiMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  const updateField = (
    name,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setApiMessage("");
  };


  /* ─────────────────────────────────────────
     STEP VALIDATION
  ───────────────────────────────────────── */

  const validateStep = () => {
    const nextErrors = {};


    /* STEP 1 */

    if (step === 1) {
      if (!form.accountType) {
        nextErrors.accountType =
          "Please select how you want to use the CRM.";
      }
    }


    /* STEP 2 */

    if (step === 2) {
      if (!form.name.trim()) {
        nextErrors.name =
          "Your name is required.";
      }

      if (!form.email.trim()) {
        nextErrors.email =
          "Email is required.";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.email.trim()
        )
      ) {
        nextErrors.email =
          "Enter a valid email address.";
      }

      if (!form.password) {
        nextErrors.password =
          "Password is required.";
      } else if (
        form.password.length < 8
      ) {
        nextErrors.password =
          "Use at least 8 characters.";
      }

      if (
        !form.confirmPassword
      ) {
        nextErrors.confirmPassword =
          "Please confirm your password.";
      } else if (
        form.password !==
        form.confirmPassword
      ) {
        nextErrors.confirmPassword =
          "Passwords do not match.";
      }
    }


    /* STEP 3 */

    if (step === 3) {
      if (
        form.accountType ===
          "business" &&
        !form.businessName.trim()
      ) {
        nextErrors.businessName =
          "Business name is required.";
      }

      if (form.phone.trim()) {
        const digits =
          form.phone.replace(
            /\D/g,
            ""
          );

        if (
          digits.length < 10 ||
          digits.length > 15
        ) {
          nextErrors.phone =
            "Enter a valid phone number.";
        }
      }
    }


    /* STEP 4 */

    if (step === 4) {
      if (
        form.accountType ===
          "business" &&
        form.gstin.trim() &&
        form.gstin.trim().length !==
          15
      ) {
        nextErrors.gstin =
          "GSTIN should contain 15 characters.";
      }

      const bankValues = [
        form.accountHolderName,
        form.bankName,
        form.accountNumber,
        form.ifsc,
      ];

      const hasAnyBankDetail =
        bankValues.some(
          (value) =>
            value.trim()
        );

      const hasAllBankDetails =
        bankValues.every(
          (value) =>
            value.trim()
        );

      if (
        hasAnyBankDetail &&
        !hasAllBankDetails
      ) {
        nextErrors.bank =
          "Complete all bank fields or skip bank setup.";
      }
    }


    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  };


  /* ─────────────────────────────────────────
     NEXT
  ───────────────────────────────────────── */

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    setStep((previous) =>
      Math.min(
        previous + 1,
        4
      )
    );
  };


  /* ─────────────────────────────────────────
     BACK
  ───────────────────────────────────────── */

  const handleBack = () => {
    setErrors({});
    setApiMessage("");

    if (step === 1) {
      navigate("/");
      return;
    }

    setStep((previous) =>
      Math.max(
        previous - 1,
        1
      )
    );
  };


  /* ─────────────────────────────────────────
     REGISTER
  ───────────────────────────────────────── */

  const handleRegister = async (
    includeInvoiceDetails = true
  ) => {
    if (
      includeInvoiceDetails &&
      !validateStep()
    ) {
      return;
    }

    try {
      setLoading(true);
      setApiMessage("");

      const payload = {
        accountType:
          form.accountType,

        name:
          form.name.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        password:
          form.password,

        profile: {
          phone:
            form.phone.trim(),

          businessName:
            form.accountType ===
            "business"
              ? form.businessName.trim()
              : "",

          businessType:
            form.accountType ===
            "business"
              ? form.businessType.trim()
              : "",

          profession:
            form.accountType ===
            "personal"
              ? form.profession.trim()
              : "",

          /*
            Skip for now use kiya,
            to invoice related fields send nahi honge.
          */
          gstin:
            includeInvoiceDetails &&
            form.accountType ===
              "business"
              ? form.gstin
                  .trim()
                  .toUpperCase()
              : "",

          address:
            includeInvoiceDetails
              ? form.address.trim()
              : "",

          bankDetails:
            includeInvoiceDetails
              ? {
                  accountHolderName:
                    form.accountHolderName.trim(),

                  bankName:
                    form.bankName.trim(),

                  accountNumber:
                    form.accountNumber.trim(),

                  ifsc:
                    form.ifsc
                      .trim()
                      .toUpperCase(),
                }
              : {},
        },
      };


      const response =
        await fetch(
          `${API_BASE_URL}/auth/register`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );


      let data = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }


      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to create your account."
        );
      }


      setSuccess(true);


      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setApiMessage(
        error.message ||
          "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  };


  const progress =
    (step / 4) * 100;


  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50">

      {/* BACKGROUND */}

      <div className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-green-100/70 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[460px] w-[460px] rounded-full bg-emerald-100/60 blur-3xl" />


      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">

        <motion.div
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="grid w-full max-w-[1080px] overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[0.85fr_1.15fr]"
        >

          {/* ==============================
              LEFT BRAND
          ============================== */}

          <div className="relative hidden min-h-[680px] overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">

            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",

                backgroundSize:
                  "42px 42px",
              }}
            />


            <div className="relative z-10 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <ShieldCheck
                  size={21}
                />
              </div>

              <div>
                <h2 className="text-lg font-black">
                  Wheedle Tech
                </h2>

                <p className="text-[11px] text-green-100">
                  Business Management Platform
                </p>
              </div>

            </div>


            <div className="relative z-10 max-w-sm">

              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-green-100">
                Create your workspace
              </p>

              <h1 className="text-[38px] font-black leading-[1.15] tracking-tight">
                Built around
                <br />

                <span className="text-green-100">
                  the way you work.
                </span>
              </h1>

              <p className="mt-5 text-[14px] leading-6 text-green-50/80">
                Start with only the details we
                need. You can complete your
                business and invoice setup later
                whenever you're ready.
              </p>


              <div className="mt-8 space-y-4">

                {[
                  "Your own secure workspace",
                  "Role-based CRM access",
                  "Complete optional details later",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                      <Check
                        size={14}
                      />
                    </div>

                    <span className="text-[13px] font-medium text-green-50">
                      {item}
                    </span>
                  </div>
                ))}

              </div>

            </div>


            <p className="relative z-10 text-[11px] text-green-100/70">
              You stay in control of your
              workspace and information.
            </p>

          </div>


          {/* ==============================
              RIGHT WIZARD
          ============================== */}

          <div className="flex min-h-[680px] justify-center px-6 py-8 sm:px-10 lg:px-14">

            <div className="w-full max-w-[470px]">

              {/* TOP */}

              <div className="flex items-center justify-between">

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
                >
                  <ArrowLeft
                    size={17}
                  />
                </button>


                <p className="text-[11px] font-semibold text-gray-400">
                  Step {step} of 4
                </p>

              </div>


              {/* PROGRESS */}

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">

                <motion.div
                  animate={{
                    width:
                      `${progress}%`,
                  }}
                  className="h-full rounded-full bg-green-500"
                />

              </div>


              {/* ==============================
                  SUCCESS
              ============================== */}

              {success ? (

                <div className="flex min-h-[500px] flex-col items-center justify-center text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-500">

                    <CheckCircle2
                      size={31}
                    />

                  </div>

                  <h2 className="mt-5 text-2xl font-black text-gray-800">
                    Account created
                  </h2>

                  <p className="mt-2 max-w-sm text-[13px] leading-5 text-gray-400">
                    Your account is ready.
                    Redirecting you to sign in...
                  </p>

                </div>

              ) : (

                <>

                  <AnimatePresence
                    mode="wait"
                  >

                    {/* =====================
                        STEP 1
                    ===================== */}

                    {step === 1 && (

                      <motion.div
                        key="purpose"
                        initial={{
                          opacity: 0,
                          x: 18,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        exit={{
                          opacity: 0,
                          x: -18,
                        }}
                        className="mt-9"
                      >

                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-green-600">
                          Getting Started
                        </p>

                        <h2 className="mt-2 text-[27px] font-black text-gray-800">
                          How will you use the CRM?
                        </h2>

                        <p className="mt-2 text-[13px] leading-5 text-gray-400">
                          We'll personalize the
                          setup based on your use.
                        </p>


                        <div className="mt-7 grid gap-4 sm:grid-cols-2">

                          {/* BUSINESS */}

                          <button
                            type="button"
                            onClick={() =>
                              updateField(
                                "accountType",
                                "business"
                              )
                            }
                            className={`rounded-2xl border p-5 text-left transition ${
                              form.accountType ===
                              "business"
                                ? "border-green-400 bg-green-50/70 ring-4 ring-green-50"
                                : "border-gray-200 hover:border-green-200 hover:bg-gray-50"
                            }`}
                          >

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
                              <Building2
                                size={21}
                              />
                            </div>

                            <h3 className="mt-5 text-[15px] font-bold text-gray-800">
                              Business
                            </h3>

                            <p className="mt-1 text-[12px] leading-5 text-gray-400">
                              For a company,
                              startup or professional
                              business.
                            </p>

                          </button>


                          {/* PERSONAL */}

                          <button
                            type="button"
                            onClick={() =>
                              updateField(
                                "accountType",
                                "personal"
                              )
                            }
                            className={`rounded-2xl border p-5 text-left transition ${
                              form.accountType ===
                              "personal"
                                ? "border-green-400 bg-green-50/70 ring-4 ring-green-50"
                                : "border-gray-200 hover:border-green-200 hover:bg-gray-50"
                            }`}
                          >

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                              <UserRound
                                size={21}
                              />
                            </div>

                            <h3 className="mt-5 text-[15px] font-bold text-gray-800">
                              Personal
                            </h3>

                            <p className="mt-1 text-[12px] leading-5 text-gray-400">
                              For freelancers,
                              individuals or personal
                              work.
                            </p>

                          </button>

                        </div>


                        {errors.accountType && (
                          <p className="mt-3 text-[11px] font-medium text-red-500">
                            {errors.accountType}
                          </p>
                        )}

                      </motion.div>

                    )}


                    {/* =====================
                        STEP 2
                    ===================== */}

                    {step === 2 && (

                      <motion.div
                        key="account"
                        initial={{
                          opacity: 0,
                          x: 18,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        exit={{
                          opacity: 0,
                          x: -18,
                        }}
                        className="mt-9"
                      >

                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-green-600">
                          Your Account
                        </p>

                        <h2 className="mt-2 text-[27px] font-black text-gray-800">
                          Create your login
                        </h2>

                        <p className="mt-2 text-[13px] text-gray-400">
                          These credentials will
                          be used to access your
                          workspace.
                        </p>


                        <div className="mt-7 space-y-4">

                          <Field
                            label="Full Name"
                            icon={
                              <UserRound
                                size={16}
                              />
                            }
                            value={
                              form.name
                            }
                            error={
                              errors.name
                            }
                            onChange={(value) =>
                              updateField(
                                "name",
                                value
                              )
                            }
                            placeholder="Your full name"
                          />


                          <Field
                            label="Email Address"
                            type="email"
                            icon={
                              <Mail
                                size={16}
                              />
                            }
                            value={
                              form.email
                            }
                            error={
                              errors.email
                            }
                            onChange={(value) =>
                              updateField(
                                "email",
                                value
                              )
                            }
                            placeholder="you@example.com"
                          />


                          <PasswordField
                            label="Password"
                            value={
                              form.password
                            }
                            error={
                              errors.password
                            }
                            visible={
                              showPassword
                            }
                            onToggle={() =>
                              setShowPassword(
                                (value) =>
                                  !value
                              )
                            }
                            onChange={(value) =>
                              updateField(
                                "password",
                                value
                              )
                            }
                          />


                          <PasswordField
                            label="Confirm Password"
                            value={
                              form.confirmPassword
                            }
                            error={
                              errors.confirmPassword
                            }
                            visible={
                              showConfirmPassword
                            }
                            onToggle={() =>
                              setShowConfirmPassword(
                                (value) =>
                                  !value
                              )
                            }
                            onChange={(value) =>
                              updateField(
                                "confirmPassword",
                                value
                              )
                            }
                          />

                        </div>

                      </motion.div>

                    )}


                    {/* =====================
                        STEP 3
                    ===================== */}

                    {step === 3 && (

                      <motion.div
                        key="profile"
                        initial={{
                          opacity: 0,
                          x: 18,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        exit={{
                          opacity: 0,
                          x: -18,
                        }}
                        className="mt-9"
                      >

                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-green-600">
                          Basic Profile
                        </p>

                        <h2 className="mt-2 text-[27px] font-black text-gray-800">

                          {form.accountType ===
                          "business"
                            ? "Tell us about your business"
                            : "A little about you"}

                        </h2>

                        <p className="mt-2 text-[13px] leading-5 text-gray-400">
                          Only the essential
                          details for now.
                        </p>


                        <div className="mt-7 space-y-4">

                          {form.accountType ===
                            "business" && (
                            <>

                              <Field
                                label="Business Name"
                                icon={
                                  <Building2
                                    size={16}
                                  />
                                }
                                value={
                                  form.businessName
                                }
                                error={
                                  errors.businessName
                                }
                                onChange={(value) =>
                                  updateField(
                                    "businessName",
                                    value
                                  )
                                }
                                placeholder="Your business name"
                              />


                              <Field
                                label="Business Type"
                                optional
                                icon={
                                  <BriefcaseBusiness
                                    size={16}
                                  />
                                }
                                value={
                                  form.businessType
                                }
                                onChange={(value) =>
                                  updateField(
                                    "businessType",
                                    value
                                  )
                                }
                                placeholder="e.g. Software, Consulting, Retail"
                              />

                            </>
                          )}


                          {form.accountType ===
                            "personal" && (

                            <Field
                              label="Profession"
                              optional
                              icon={
                                <BriefcaseBusiness
                                  size={16}
                                />
                              }
                              value={
                                form.profession
                              }
                              onChange={(value) =>
                                updateField(
                                  "profession",
                                  value
                                )
                              }
                              placeholder="e.g. Freelancer, Consultant"
                            />

                          )}


                          <Field
                            label="Phone Number"
                            optional
                            icon={
                              <Phone
                                size={16}
                              />
                            }
                            value={
                              form.phone
                            }
                            error={
                              errors.phone
                            }
                            onChange={(value) =>
                              updateField(
                                "phone",
                                value
                              )
                            }
                            placeholder="+91 98765 43210"
                          />

                        </div>

                      </motion.div>

                    )}


                    {/* =====================
                        STEP 4
                    ===================== */}

                    {step === 4 && (

                      <motion.div
                        key="invoice"
                        initial={{
                          opacity: 0,
                          x: 18,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        exit={{
                          opacity: 0,
                          x: -18,
                        }}
                        className="mt-9"
                      >

                        <div className="flex items-center justify-between gap-4">

                          <div>

                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-green-600">
                              Optional
                            </p>

                            <h2 className="mt-2 text-[27px] font-black text-gray-800">
                              Invoice setup
                            </h2>

                          </div>


                          <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold text-gray-500">
                            Can be done later
                          </span>

                        </div>


                        <p className="mt-2 text-[13px] leading-5 text-gray-400">
                          Add these now for
                          faster invoice creation,
                          or skip this step.
                        </p>


                        <div className="mt-7 space-y-4">

                          {form.accountType ===
                            "business" && (

                            <Field
                              label="GSTIN"
                              optional
                              icon={
                                <ShieldCheck
                                  size={16}
                                />
                              }
                              value={
                                form.gstin
                              }
                              error={
                                errors.gstin
                              }
                              onChange={(value) =>
                                updateField(
                                  "gstin",
                                  value.toUpperCase()
                                )
                              }
                              placeholder="15-character GSTIN"
                            />

                          )}


                          <Field
                            label="Billing Address"
                            optional
                            icon={
                              <MapPin
                                size={16}
                              />
                            }
                            value={
                              form.address
                            }
                            onChange={(value) =>
                              updateField(
                                "address",
                                value
                              )
                            }
                            placeholder="Business or billing address"
                          />


                          <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">

                            <div className="mb-4 flex items-center gap-2">

                              <Landmark
                                size={17}
                                className="text-green-500"
                              />

                              <div>

                                <p className="text-[12px] font-bold text-gray-700">
                                  Bank Details
                                </p>

                                <p className="text-[10px] text-gray-400">
                                  Optional
                                </p>

                              </div>

                            </div>


                            <div className="grid gap-3 sm:grid-cols-2">

                              <MiniField
                                placeholder="Account holder"
                                value={
                                  form.accountHolderName
                                }
                                onChange={(value) =>
                                  updateField(
                                    "accountHolderName",
                                    value
                                  )
                                }
                              />

                              <MiniField
                                placeholder="Bank name"
                                value={
                                  form.bankName
                                }
                                onChange={(value) =>
                                  updateField(
                                    "bankName",
                                    value
                                  )
                                }
                              />

                              <MiniField
                                placeholder="Account number"
                                value={
                                  form.accountNumber
                                }
                                onChange={(value) =>
                                  updateField(
                                    "accountNumber",
                                    value
                                  )
                                }
                              />

                              <MiniField
                                placeholder="IFSC"
                                value={
                                  form.ifsc
                                }
                                onChange={(value) =>
                                  updateField(
                                    "ifsc",
                                    value.toUpperCase()
                                  )
                                }
                              />

                            </div>


                            {errors.bank && (
                              <p className="mt-3 text-[11px] font-medium text-red-500">
                                {errors.bank}
                              </p>
                            )}

                          </div>

                        </div>

                      </motion.div>

                    )}

                  </AnimatePresence>


                  {/* API MESSAGE */}

                  {apiMessage && (
                    <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-600">
                      {apiMessage}
                    </div>
                  )}


                  {/* ==============================
                      ACTIONS
                  ============================== */}

                  <div className="mt-8">

                    {step < 4 ? (

                      <button
                        type="button"
                        onClick={
                          handleNext
                        }
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3.5 text-[13px] font-bold text-white transition hover:bg-green-600"
                      >
                        Continue

                        <ArrowRight
                          size={16}
                          className="transition group-hover:translate-x-0.5"
                        />
                      </button>

                    ) : (

                      <div className="space-y-3">

                        <button
                          type="button"
                          disabled={
                            loading
                          }
                          onClick={() =>
                            handleRegister(
                              true
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3.5 text-[13px] font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                          {loading
                            ? "Creating account..."
                            : "Create Account"}

                        </button>


                        <button
                          type="button"
                          disabled={
                            loading
                          }
                          onClick={() =>
                            handleRegister(
                              false
                            )
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-[12px] font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
                        >
                          Skip for now & Create Account
                        </button>

                      </div>

                    )}

                  </div>


                  <p className="mt-6 text-center text-[11px] text-gray-400">
                    Already have an account?{" "}

                    <button
                      type="button"
                      onClick={() =>
                        navigate("/")
                      }
                      className="font-bold text-green-600 hover:underline"
                    >
                      Sign in
                    </button>
                  </p>

                </>

              )}

            </div>

          </div>

        </motion.div>

      </div>

    </div>
  );
};


/* ─────────────────────────────────────────────
   REUSABLE FIELD
───────────────────────────────────────────── */

const Field = ({
  label,
  optional = false,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}) => (
  <div>

    <label className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.07em] text-gray-500">

      {label}

      {optional && (
        <span className="font-medium normal-case tracking-normal text-gray-300">
          Optional
        </span>
      )}

    </label>


    <div className="relative">

      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className={`w-full rounded-xl border bg-white py-3.5 pl-11 pr-4 text-[13px] text-gray-700 outline-none transition placeholder:text-gray-300 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
            : "border-gray-200 hover:border-gray-300 focus:border-green-400 focus:ring-4 focus:ring-green-50"
        }`}
      />

    </div>


    {error && (
      <p className="mt-1.5 text-[11px] font-medium text-red-500">
        {error}
      </p>
    )}

  </div>
);


/* ─────────────────────────────────────────────
   PASSWORD FIELD
───────────────────────────────────────────── */

const PasswordField = ({
  label,
  value,
  onChange,
  visible,
  onToggle,
  error,
}) => (
  <div>

    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.07em] text-gray-500">
      {label}
    </label>


    <div className="relative">

      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        <LockKeyhole
          size={16}
        />
      </span>


      <input
        type={
          visible
            ? "text"
            : "password"
        }
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder="Minimum 8 characters"
        className={`w-full rounded-xl border bg-white py-3.5 pl-11 pr-12 text-[13px] text-gray-700 outline-none transition placeholder:text-gray-300 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
            : "border-gray-200 hover:border-gray-300 focus:border-green-400 focus:ring-4 focus:ring-green-50"
        }`}
      />


      <button
        type="button"
        tabIndex={-1}
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
      >

        {visible ? (
          <Eye size={16} />
        ) : (
          <EyeOff size={16} />
        )}

      </button>

    </div>


    {error && (
      <p className="mt-1.5 text-[11px] font-medium text-red-500">
        {error}
      </p>
    )}

  </div>
);


/* ─────────────────────────────────────────────
   SMALL OPTIONAL FIELD
───────────────────────────────────────────── */

const MiniField = ({
  value,
  onChange,
  placeholder,
}) => (
  <input
    type="text"
    value={value}
    onChange={(event) =>
      onChange(
        event.target.value
      )
    }
    placeholder={placeholder}
    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-[12px] text-gray-700 outline-none transition placeholder:text-gray-300 hover:border-gray-300 focus:border-green-400 focus:ring-4 focus:ring-green-50"
  />
);


export default Register;