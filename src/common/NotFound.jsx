import { motion } from "framer-motion";
import { ArrowLeft, Compass, Home, RouteOff } from "lucide-react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";

const NotFound = () => {
  const navigate = useNavigate();
  const { admin } = useContext(AuthContext);
  const destination = admin ? "/dashboard" : "/admin";

  const goBack = () => {
    try {
      if (window.history.length > 1) {
        navigate(-1);
        return;
      }
      navigate(destination, { replace: true });
    } catch (error) {
      console.error("Unable to navigate back:", error);
      navigate(destination, { replace: true });
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <motion.div
        className="absolute left-[8%] top-[10%] h-52 w-52 rounded-full bg-green-500/10 blur-3xl"
        animate={{ x: [0, 24, 0], y: [0, -12, 0], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[8%] right-[4%] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
        animate={{ x: [0, -24, 0], y: [0, 18, 0], opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-4xl">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.055] p-7 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-400/60 to-transparent" />

            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72">
                <motion.div
                  className="absolute inset-5 rounded-full border border-green-300/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-9 rounded-full border border-dashed border-emerald-300/20"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                />

                <motion.div
                  className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-green-300 shadow-[0_0_24px_rgba(134,239,172,0.8)]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                  style={{ transformOrigin: "50% 128px" }}
                />

                <motion.div
                  initial={{ scale: 0.84, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-14 flex items-center justify-center rounded-[30px] border border-white/10 bg-slate-900/70 shadow-[0_0_70px_rgba(34,197,94,0.12)]"
                >
                  <div className="text-center">
                    <div className="text-[76px] font-black leading-none tracking-[-0.08em] text-white sm:text-[88px]">
                      4<span className="text-green-300">0</span>4
                    </div>
                    <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.28em] text-white/35">
                      Route lost
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute bottom-7 left-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-green-300"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <RouteOff size={17} />
                </motion.div>

                <motion.div
                  className="absolute right-2 top-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-200"
                  animate={{ y: [0, 9, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Compass size={18} />
                </motion.div>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-green-300/15 bg-green-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-green-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-300" />
                  Navigation checkpoint
                </div>

                <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                  This page wandered off.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
                  The address is valid-looking, but there is no workspace route
                  connected to it. Nothing is broken in your account—this page
                  simply does not exist here.
                </p>

                <div className="mt-7 rounded-2xl border border-white/8 bg-black/15 px-4 py-3 font-mono text-xs text-white/45">
                  {window.location.pathname || "/"}
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate(destination, { replace: true })}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-300/60"
                  >
                    <Home size={16} />
                    {admin ? "Go to dashboard" : "Go to sign in"}
                  </button>

                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <ArrowLeft size={16} />
                    Go back
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] font-medium tracking-wide text-white/25">
            Wheedle Tech · Secure Business Workspace
          </p>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
