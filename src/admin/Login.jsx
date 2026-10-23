import { useState, useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API_BASE_URL from "../config/api";
import { AuthContext } from "../auth/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */

const MailIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect
      width="20"
      height="16"
      x="2"
      y="4"
      rx="2"
    />

    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect
      width="18"
      height="11"
      x="3"
      y="11"
      rx="2"
      ry="2"
    />

    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />

    <line
      x1="2"
      x2="22"
      y1="2"
      y2="22"
    />
  </svg>
);

const EyeOnIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />

    <circle
      cx="12"
      cy="12"
      r="3"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m5 12 4 4L19 6" />
  </svg>
);

/* UI-only: shared easing + decorative animation helpers */
const EASE = [0.22, 1, 0.36, 1];

const floatAnimation = (delay = 0, distance = 10) => ({
  animate: { y: [0, -distance, 0] },
  transition: {
    duration: 5 + delay,
    repeat: Infinity,
    ease: "easeInOut",
    delay,
  },
});

/* ─────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────── */

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [errors, setErrors] = useState({});

  const [apiMessage, setApiMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (searchParams.get("reason") === "session-expired") {
      setApiMessage("Your session has expired. Please sign in again.");
    }
  }, [searchParams]);


  /* ─────────────────────────────────────────
     MESSAGE RESET
     Existing logic remains same
  ───────────────────────────────────────── */

  useEffect(() => {
    if (

      Object.keys(errors).length > 0 ||
      apiMessage ||
      successMessage
    ) {
      const timer = setTimeout(() => {
        setErrors({});
        setApiMessage("");
        setSuccessMessage("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [
    errors,
    apiMessage,
    successMessage,
  ]);

  /* ─────────────────────────────────────────
     INPUT CHANGE
  ───────────────────────────────────────── */

  const handleChange = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  /* ─────────────────────────────────────────
     LOGIN SUBMIT

     LOGIC UNCHANGED
  ───────────────────────────────────────── */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});
    setApiMessage("");
    setSuccessMessage("");

    const newErrors = {};

    if (!form.email) {
      newErrors.email =
        "Email is required";
    }

    if (!form.password) {
      newErrors.password =
        "Password is required";
    }

    if (
      Object.keys(newErrors).length > 0
    ) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (
          data.message ===
          "Email not found"
        ) {
          setErrors({
            email:
              "This email is not registered",
          });
        } else if (
          data.message ===
          "Password is incorrect"
        ) {
          setErrors({
            password:
              "Incorrect password",
          });
        } else {
          setApiMessage(
            data.message ||
              "Something went wrong"
          );
        }

        return;
      }

      setSuccessMessage(
        "Login successful. Redirecting..."
      );

      login(data);

      setTimeout(
        () => navigate("/dashboard"),
        1200
      );
    } catch {
      setApiMessage(
        "Unable to connect to server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#e8eefc] via-[#f1f5fd] to-[#e9e6fb]">
      {/* ===============================
          BACKGROUND DECORATION
      =============================== */}

      <motion.div
        {...floatAnimation(0, 18)}
        className="pointer-events-none absolute -left-32 -top-32 h-[440px] w-[440px] rounded-full bg-blue-300/40 blur-3xl"
      />

      <motion.div
        {...floatAnimation(1.5, 22)}
        className="pointer-events-none absolute -bottom-40 -right-32 h-[480px] w-[480px] rounded-full bg-violet-300/40 blur-3xl"
      />

      <motion.div
        {...floatAnimation(0.8, 14)}
        className="pointer-events-none absolute right-1/4 top-10 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl"
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">

        {/* ===============================
            LOGIN CONTAINER
        =============================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 24,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.6,
            ease: EASE,
          }}
          className="grid w-full max-w-[1080px] overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-[0_30px_90px_rgba(15,23,80,0.18)] lg:grid-cols-[0.95fr_1.05fr]"
        >

          {/* ===============================
              LEFT BRAND PANEL
          =============================== */}

          <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0a1230] via-[#0f1d4d] to-[#13287a] p-10 text-white lg:flex lg:min-h-[660px] lg:flex-col lg:justify-between">

            {/* decoration */}

            <motion.div
              {...floatAnimation(0, 12)}
              className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10 bg-blue-500/10"
            />

            <motion.div
              {...floatAnimation(1.2, 16)}
              className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full border border-white/10 bg-violet-500/10"
            />

            <div className="absolute right-10 top-1/3 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="absolute bottom-24 left-10 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />

            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",

                backgroundSize:
                  "42px 42px",
              }}
            />

            {/* BRAND */}

            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
              className="relative z-10"
            >

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 shadow-lg shadow-orange-500/30">
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>

                <div>
                  <h1 className="text-[20px] font-black tracking-tight">
                    Wheedle Tech
                  </h1>

                  <p className="mt-0.5 text-[11px] font-medium text-blue-100/70">
                    Business Management Platform
                  </p>
                </div>

              </div>

            </motion.div>


            {/* MAIN CONTENT */}

            <div className="relative z-10 max-w-[390px]">

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200 backdrop-blur-sm"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Secure Business Workspace
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE, delay: 0.4 }}
                className="text-[38px] font-black leading-[1.12] tracking-tight"
              >
                Everything you need
                <br />

                <span className="bg-gradient-to-r from-amber-200 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                  to manage your work.
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE, delay: 0.5 }}
                className="mt-5 max-w-sm text-[14px] leading-6 text-blue-100/75"
              >
                Manage your business operations,
                customers, invoices and daily
                workflow from one secure and
                organized workspace.
              </motion.p>


              {/* BENEFITS */}

              <div className="mt-8 space-y-3">

                {[
                  { text: "Role-based secure access", grad: "from-indigo-500 to-violet-600" },
                  { text: "Centralized business workspace", grad: "from-blue-500 to-sky-600" },
                  { text: "Professional invoice management", grad: "from-emerald-500 to-green-600" },
                ].map((item, index) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.65 + index * 0.12 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-sm transition-colors hover:bg-white/10"
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.grad} text-white shadow-md`}>
                      <CheckIcon />
                    </div>

                    <span className="text-[13px] font-medium text-blue-50">
                      {item.text}
                    </span>
                  </motion.div>
                ))}

              </div>

            </div>


            {/* FOOTER */}

            <div className="relative z-10">

              <div className="border-t border-white/15 pt-5">

                <p className="text-[11px] leading-5 text-blue-100/60">
                  Secure access powered by
                  role-based permissions and
                  authenticated sessions.
                </p>

              </div>

            </div>

          </div>


          {/* ===============================
              RIGHT LOGIN PANEL
          =============================== */}

          <div className="relative flex min-h-[620px] items-center justify-center px-6 py-10 sm:px-10 lg:px-14">

            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-bl-[100px] bg-gradient-to-bl from-blue-50 to-transparent" />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE, delay: 0.25 }}
              className="relative w-full max-w-[400px]"
            >

              {/* MOBILE LOGO */}

              <div className="mb-9 flex items-center gap-3 lg:hidden">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-md shadow-orange-500/30">

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>

                </div>

                <div>
                  <p className="text-[16px] font-black text-[#0b1437]">
                    Wheedle Tech
                  </p>

                  <p className="text-[10px] text-slate-400">
                    Business Management Platform
                  </p>
                </div>

              </div>


              {/* HEADING */}

              <div className="mb-8">

                <div className="mb-3 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
                  Welcome Back
                </div>

                <h2 className="text-[30px] font-black tracking-tight text-[#0b1437]">
                  Sign in to your account
                </h2>

                <p className="mt-2 text-[13px] leading-5 text-slate-400">
                  Enter your registered email and
                  password to continue to your
                  dashboard.
                </p>

              </div>


              {/* ===============================
                  FORM
              =============================== */}

              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5"
              >

                {/* EMAIL */}

                <div>

                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Email Address
                  </label>

                  <div className="group relative">

                    <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center text-slate-400 transition-colors group-focus-within:text-blue-500">
                      <MailIcon />
                    </span>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      placeholder="you@company.com"
                      onChange={handleChange}
                      autoComplete="email"
                      className={`w-full rounded-xl border bg-slate-50/60 py-3.5 pl-11 pr-4 text-[13px] text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-300 ${
                        errors.email
                          ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-50"
                          : "border-slate-200 hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      }`}
                    />

                  </div>


                  <AnimatePresence>

                    {errors.email && (
                      <motion.p
                        initial={{
                          opacity: 0,
                          y: -3,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                        }}
                        className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-red-500"
                      >

                        <span className="h-1 w-1 rounded-full bg-red-500" />

                        {errors.email}

                      </motion.p>
                    )}

                  </AnimatePresence>

                </div>


                {/* PASSWORD */}

                <div>

                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Password
                  </label>

                  <div className="group relative">

                    <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center text-slate-400 transition-colors group-focus-within:text-blue-500">
                      <LockIcon />
                    </span>

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={form.password}
                      placeholder="Enter your password"
                      onChange={handleChange}
                      autoComplete="current-password"
                      className={`w-full rounded-xl border bg-slate-50/60 py-3.5 pl-11 pr-12 text-[13px] text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-300 ${
                        errors.password
                          ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-50"
                          : "border-slate-200 hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      }`}
                    />


                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                      }
                      className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center text-slate-400 transition hover:text-blue-600"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOnIcon />
                      ) : (
                        <EyeOffIcon />
                      )}
                    </button>

                  </div>


                  <AnimatePresence>

                    {errors.password && (
                      <motion.p
                        initial={{
                          opacity: 0,
                          y: -3,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                        }}
                        className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-red-500"
                      >

                        <span className="h-1 w-1 rounded-full bg-red-500" />

                        {errors.password}

                      </motion.p>
                    )}

                  </AnimatePresence>

                </div>


                {/* API ERROR */}

                <AnimatePresence>

                  {apiMessage && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                      }}
                      className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-600"
                    >

                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />

                      {apiMessage}

                    </motion.div>
                  )}

                </AnimatePresence>


                {/* SUCCESS */}

                <AnimatePresence>

                  {successMessage && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                      }}
                      className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[12px] font-medium text-emerald-700"
                    >

                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <CheckIcon />
                      </div>

                      {successMessage}

                    </motion.div>
                  )}

                </AnimatePresence>


                {/* LOGIN BUTTON */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 px-5 py-3.5 text-[13px] font-bold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/40 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >

                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  {loading ? (
                    <span className="relative flex items-center gap-2">

                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-30"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />

                        <path
                          className="opacity-90"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z"
                        />
                      </svg>

                      Signing in...

                    </span>
                  ) : (
                    <span className="relative flex items-center gap-2">

                      Sign in to Dashboard

                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-transform group-hover:translate-x-0.5"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>

                    </span>
                  )}

                </button>

              </form>


              {/* ===============================
                  REGISTER CTA
              =============================== */}

              <div className="mt-7 border-t border-slate-100 pt-6">

                <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-violet-50/60 px-4 py-3.5 text-center">

                  <p className="text-[12px] text-slate-500">
                    New to the platform?{" "}

                    <button
                      type="button"
                      onClick={() =>
                        navigate("/register")
                      }
                      className="font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
                    >
                      Register first
                    </button>
                  </p>

                </div>

              </div>


              {/* FOOTER */}

              <p className="mt-7 text-center text-[10px] leading-5 text-slate-300">
                © 2026 Wheedle Technologies
                <span className="mx-1.5">
                  •
                </span>
                Secure CRM Access
              </p>

            </motion.div>

          </div>

        </motion.div>

      </div>
    </div>
  );
};

export default Login;




// import { useState, useContext, useEffect } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import API_BASE_URL from "../config/api";
// import { AuthContext } from "../auth/AuthContext";
// import { motion, AnimatePresence } from "framer-motion";

// /* ─────────────────────────────────────────────
//    ICONS
// ───────────────────────────────────────────── */

// const MailIcon = () => (
//   <svg
//     width="16"
//     height="16"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <rect
//       width="20"
//       height="16"
//       x="2"
//       y="4"
//       rx="2"
//     />

//     <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
//   </svg>
// );

// const LockIcon = () => (
//   <svg
//     width="16"
//     height="16"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <rect
//       width="18"
//       height="11"
//       x="3"
//       y="11"
//       rx="2"
//       ry="2"
//     />

//     <path d="M7 11V7a5 5 0 0 1 10 0v4" />
//   </svg>
// );

// const EyeOffIcon = () => (
//   <svg
//     width="16"
//     height="16"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
//     <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
//     <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />

//     <line
//       x1="2"
//       x2="22"
//       y1="2"
//       y2="22"
//     />
//   </svg>
// );

// const EyeOnIcon = () => (
//   <svg
//     width="16"
//     height="16"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />

//     <circle
//       cx="12"
//       cy="12"
//       r="3"
//     />
//   </svg>
// );

// const CheckIcon = () => (
//   <svg
//     width="15"
//     height="15"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2.4"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <path d="m5 12 4 4L19 6" />
//   </svg>
// );

// /* ─────────────────────────────────────────────
//    LOGIN
// ───────────────────────────────────────────── */

// const Login = () => {
//   const navigate = useNavigate();
// const [searchParams] = useSearchParams();
//   const { login } = useContext(AuthContext);

//   const [form, setForm] = useState({
//     email: "",
//     password: "",
//   });

//   const [showPassword, setShowPassword] =
//     useState(false);

//   const [errors, setErrors] = useState({});

//   const [apiMessage, setApiMessage] =
//     useState("");

//   const [successMessage, setSuccessMessage] =
//     useState("");

//   const [loading, setLoading] =
//     useState(false);

//     useEffect(() => {
//   if (searchParams.get("reason") === "session-expired") {
//     setApiMessage("Your session has expired. Please sign in again.");
//   }
// }, [searchParams]);


//   /* ─────────────────────────────────────────
//      MESSAGE RESET
//      Existing logic remains same
//   ───────────────────────────────────────── */

//   useEffect(() => {
//     if (
      
//       Object.keys(errors).length > 0 ||
//       apiMessage ||
//       successMessage
//     ) {
//       const timer = setTimeout(() => {
//         setErrors({});
//         setApiMessage("");
//         setSuccessMessage("");
//       }, 2000);

//       return () => clearTimeout(timer);
//     }
//   }, [
//     errors,
//     apiMessage,
//     successMessage,
//   ]);

//   /* ─────────────────────────────────────────
//      INPUT CHANGE
//   ───────────────────────────────────────── */

//   const handleChange = (e) =>
//     setForm({
//       ...form,
//       [e.target.name]: e.target.value,
//     });

//   /* ─────────────────────────────────────────
//      LOGIN SUBMIT

//      LOGIC UNCHANGED
//   ───────────────────────────────────────── */

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     setErrors({});
//     setApiMessage("");
//     setSuccessMessage("");

//     const newErrors = {};

//     if (!form.email) {
//       newErrors.email =
//         "Email is required";
//     }

//     if (!form.password) {
//       newErrors.password =
//         "Password is required";
//     }

//     if (
//       Object.keys(newErrors).length > 0
//     ) {
//       setErrors(newErrors);
//       return;
//     }

//     try {
//       setLoading(true);

//       const res = await fetch(
//         `${API_BASE_URL}/auth/login`,
//         {
//           method: "POST",

//           headers: {
//             "Content-Type":
//               "application/json",
//           },

//           body: JSON.stringify(form),
//         }
//       );

//       const data = await res.json();

//       if (!res.ok) {
//         if (
//           data.message ===
//           "Email not found"
//         ) {
//           setErrors({
//             email:
//               "This email is not registered",
//           });
//         } else if (
//           data.message ===
//           "Password is incorrect"
//         ) {
//           setErrors({
//             password:
//               "Incorrect password",
//           });
//         } else {
//           setApiMessage(
//             data.message ||
//               "Something went wrong"
//           );
//         }

//         return;
//       }

//       setSuccessMessage(
//         "Login successful. Redirecting..."
//       );

//       login(data);

//       setTimeout(
//         () => navigate("/dashboard"),
//         1200
//       );
//     } catch {
//       setApiMessage(
//         "Unable to connect to server. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="relative min-h-screen overflow-hidden bg-gray-50">
//       {/* ===============================
//           BACKGROUND DECORATION
//       =============================== */}

//       <div className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-green-100/70 blur-3xl" />

//       <div className="pointer-events-none absolute -bottom-40 -right-32 h-[460px] w-[460px] rounded-full bg-emerald-100/60 blur-3xl" />

//       <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">

//         {/* ===============================
//             LOGIN CONTAINER
//         =============================== */}

//         <motion.div
//           initial={{
//             opacity: 0,
//             y: 20,
//           }}
//           animate={{
//             opacity: 1,
//             y: 0,
//           }}
//           transition={{
//             duration: 0.45,
//             ease: [0.22, 1, 0.36, 1],
//           }}
//           className="grid w-full max-w-[1080px] overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[0.95fr_1.05fr]"
//         >

//           {/* ===============================
//               LEFT BRAND PANEL
//           =============================== */}

//           <div className="relative hidden overflow-hidden bg-gradient-to-br from-green-500 via-green-500 to-emerald-600 p-10 text-white lg:flex lg:min-h-[660px] lg:flex-col lg:justify-between">

//             {/* decoration */}

//             <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10 bg-white/5" />

//             <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full border border-white/10 bg-white/5" />

//             <div
//               className="absolute inset-0 opacity-[0.07]"
//               style={{
//                 backgroundImage:
//                   "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",

//                 backgroundSize:
//                   "42px 42px",
//               }}
//             />

//             {/* BRAND */}

//             <div className="relative z-10">

//               <div className="flex items-center gap-3">

//                 <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur-sm">
//                   <svg
//                     width="21"
//                     height="21"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="white"
//                     strokeWidth="2.4"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   >
//                     <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
//                   </svg>
//                 </div>

//                 <div>
//                   <h1 className="text-[20px] font-black tracking-tight">
//                     Wheedle Tech
//                   </h1>

//                   <p className="mt-0.5 text-[11px] font-medium text-green-100">
//                     Business Management Platform
//                   </p>
//                 </div>

//               </div>

//             </div>


//             {/* MAIN CONTENT */}

//             <div className="relative z-10 max-w-[390px]">

//               <div className="mb-5 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-green-50 backdrop-blur-sm">
//                 Secure Business Workspace
//               </div>

//               <h2 className="text-[38px] font-black leading-[1.12] tracking-tight">
//                 Everything you need
//                 <br />

//                 <span className="text-green-100">
//                   to manage your work.
//                 </span>
//               </h2>

//               <p className="mt-5 max-w-sm text-[14px] leading-6 text-green-50/80">
//                 Manage your business operations,
//                 customers, invoices and daily
//                 workflow from one secure and
//                 organized workspace.
//               </p>


//               {/* BENEFITS */}

//               <div className="mt-8 space-y-3">

//                 {[
//                   "Role-based secure access",
//                   "Centralized business workspace",
//                   "Professional invoice management",
//                 ].map((item) => (
//                   <div
//                     key={item}
//                     className="flex items-center gap-3"
//                   >
//                     <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
//                       <CheckIcon />
//                     </div>

//                     <span className="text-[13px] font-medium text-green-50">
//                       {item}
//                     </span>
//                   </div>
//                 ))}

//               </div>

//             </div>


//             {/* FOOTER */}

//             <div className="relative z-10">

//               <div className="border-t border-white/15 pt-5">

//                 <p className="text-[11px] leading-5 text-green-100/70">
//                   Secure access powered by
//                   role-based permissions and
//                   authenticated sessions.
//                 </p>

//               </div>

//             </div>

//           </div>


//           {/* ===============================
//               RIGHT LOGIN PANEL
//           =============================== */}

//           <div className="flex min-h-[620px] items-center justify-center px-6 py-10 sm:px-10 lg:px-14">

//             <div className="w-full max-w-[400px]">

//               {/* MOBILE LOGO */}

//               <div className="mb-9 flex items-center gap-3 lg:hidden">

//                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 text-white shadow-md shadow-green-500/20">

//                   <svg
//                     width="18"
//                     height="18"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="white"
//                     strokeWidth="2.5"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   >
//                     <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
//                   </svg>

//                 </div>

//                 <div>
//                   <p className="text-[16px] font-black text-gray-800">
//                     Wheedle Tech
//                   </p>

//                   <p className="text-[10px] text-gray-400">
//                     Business Management Platform
//                   </p>
//                 </div>

//               </div>


//               {/* HEADING */}

//               <div className="mb-8">

//                 <div className="mb-3 inline-flex items-center rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-green-600">
//                   Welcome Back
//                 </div>

//                 <h2 className="text-[30px] font-black tracking-tight text-gray-800">
//                   Sign in to your account
//                 </h2>

//                 <p className="mt-2 text-[13px] leading-5 text-gray-400">
//                   Enter your registered email and
//                   password to continue to your
//                   dashboard.
//                 </p>

//               </div>


//               {/* ===============================
//                   FORM
//               =============================== */}

//               <form
//                 onSubmit={handleSubmit}
//                 noValidate
//                 className="space-y-5"
//               >

//                 {/* EMAIL */}

//                 <div>

//                   <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
//                     Email Address
//                   </label>

//                   <div className="relative">

//                     <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center text-gray-400">
//                       <MailIcon />
//                     </span>

//                     <input
//                       type="email"
//                       name="email"
//                       value={form.email}
//                       placeholder="you@company.com"
//                       onChange={handleChange}
//                       autoComplete="email"
//                       className={`w-full rounded-xl border bg-white py-3.5 pl-11 pr-4 text-[13px] text-gray-700 outline-none transition placeholder:text-gray-300 ${
//                         errors.email
//                           ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-50"
//                           : "border-gray-200 hover:border-gray-300 focus:border-green-400 focus:ring-4 focus:ring-green-50"
//                       }`}
//                     />

//                   </div>


//                   <AnimatePresence>

//                     {errors.email && (
//                       <motion.p
//                         initial={{
//                           opacity: 0,
//                           y: -3,
//                         }}
//                         animate={{
//                           opacity: 1,
//                           y: 0,
//                         }}
//                         exit={{
//                           opacity: 0,
//                         }}
//                         className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-red-500"
//                       >

//                         <span className="h-1 w-1 rounded-full bg-red-500" />

//                         {errors.email}

//                       </motion.p>
//                     )}

//                   </AnimatePresence>

//                 </div>


//                 {/* PASSWORD */}

//                 <div>

//                   <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
//                     Password
//                   </label>

//                   <div className="relative">

//                     <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center text-gray-400">
//                       <LockIcon />
//                     </span>

//                     <input
//                       type={
//                         showPassword
//                           ? "text"
//                           : "password"
//                       }
//                       name="password"
//                       value={form.password}
//                       placeholder="Enter your password"
//                       onChange={handleChange}
//                       autoComplete="current-password"
//                       className={`w-full rounded-xl border bg-white py-3.5 pl-11 pr-12 text-[13px] text-gray-700 outline-none transition placeholder:text-gray-300 ${
//                         errors.password
//                           ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-50"
//                           : "border-gray-200 hover:border-gray-300 focus:border-green-400 focus:ring-4 focus:ring-green-50"
//                       }`}
//                     />


//                     <button
//                       type="button"
//                       tabIndex={-1}
//                       onClick={() =>
//                         setShowPassword(
//                           (previous) =>
//                             !previous
//                         )
//                       }
//                       className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center text-gray-400 transition hover:text-gray-600"
//                       aria-label={
//                         showPassword
//                           ? "Hide password"
//                           : "Show password"
//                       }
//                     >
//                       {showPassword ? (
//                         <EyeOnIcon />
//                       ) : (
//                         <EyeOffIcon />
//                       )}
//                     </button>

//                   </div>


//                   <AnimatePresence>

//                     {errors.password && (
//                       <motion.p
//                         initial={{
//                           opacity: 0,
//                           y: -3,
//                         }}
//                         animate={{
//                           opacity: 1,
//                           y: 0,
//                         }}
//                         exit={{
//                           opacity: 0,
//                         }}
//                         className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-red-500"
//                       >

//                         <span className="h-1 w-1 rounded-full bg-red-500" />

//                         {errors.password}

//                       </motion.p>
//                     )}

//                   </AnimatePresence>

//                 </div>


//                 {/* API ERROR */}

//                 <AnimatePresence>

//                   {apiMessage && (
//                     <motion.div
//                       initial={{
//                         opacity: 0,
//                         y: -5,
//                       }}
//                       animate={{
//                         opacity: 1,
//                         y: 0,
//                       }}
//                       exit={{
//                         opacity: 0,
//                       }}
//                       className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-600"
//                     >

//                       <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />

//                       {apiMessage}

//                     </motion.div>
//                   )}

//                 </AnimatePresence>


//                 {/* SUCCESS */}

//                 <AnimatePresence>

//                   {successMessage && (
//                     <motion.div
//                       initial={{
//                         opacity: 0,
//                         y: -5,
//                       }}
//                       animate={{
//                         opacity: 1,
//                         y: 0,
//                       }}
//                       exit={{
//                         opacity: 0,
//                       }}
//                       className="flex items-start gap-2.5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-[12px] font-medium text-green-700"
//                     >

//                       <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
//                         <CheckIcon />
//                       </div>

//                       {successMessage}

//                     </motion.div>
//                   )}

//                 </AnimatePresence>


//                 {/* LOGIN BUTTON */}

//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-green-500 px-5 py-3.5 text-[13px] font-bold text-white shadow-lg shadow-green-500/15 transition hover:bg-green-600 hover:shadow-green-500/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
//                 >

//                   {loading ? (
//                     <span className="flex items-center gap-2">

//                       <svg
//                         className="h-4 w-4 animate-spin"
//                         viewBox="0 0 24 24"
//                         fill="none"
//                       >
//                         <circle
//                           className="opacity-30"
//                           cx="12"
//                           cy="12"
//                           r="10"
//                           stroke="currentColor"
//                           strokeWidth="4"
//                         />

//                         <path
//                           className="opacity-90"
//                           fill="currentColor"
//                           d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z"
//                         />
//                       </svg>

//                       Signing in...

//                     </span>
//                   ) : (
//                     <span className="flex items-center gap-2">

//                       Sign in to Dashboard

//                       <svg
//                         width="15"
//                         height="15"
//                         viewBox="0 0 24 24"
//                         fill="none"
//                         stroke="currentColor"
//                         strokeWidth="2.5"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         className="transition-transform group-hover:translate-x-0.5"
//                       >
//                         <path d="M5 12h14M12 5l7 7-7 7" />
//                       </svg>

//                     </span>
//                   )}

//                 </button>

//               </form>


//               {/* ===============================
//                   REGISTER CTA
//               =============================== */}

//               <div className="mt-7 border-t border-gray-100 pt-6">

//                 <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3.5 text-center">

//                   <p className="text-[12px] text-gray-500">
//                     New to the platform?{" "}

//                     <button
//                       type="button"
//                       onClick={() =>
//                         navigate("/register")
//                       }
//                       className="font-bold text-green-600 transition hover:text-green-700 hover:underline"
//                     >
//                       Register first
//                     </button>
//                   </p>

//                 </div>

//               </div>


//               {/* FOOTER */}

//               <p className="mt-7 text-center text-[10px] leading-5 text-gray-300">
//                 © 2026 Wheedle Technologies
//                 <span className="mx-1.5">
//                   •
//                 </span>
//                 Secure CRM Access
//               </p>

//             </div>

//           </div>

//         </motion.div>

//       </div>
//     </div>
//   );
// };

// export default Login;