import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Keep the application from becoming a blank screen while preserving
    // useful diagnostics in development/browser logs.
    console.error("Application render error:", error, errorInfo);
  }

  handleReload = () => {
    try {
      window.location.reload();
    } catch (error) {
      console.error("Unable to reload the application:", error);
    }
  };

  handleLogin = () => {
    try {
      window.location.assign("/admin");
    } catch (error) {
      console.error("Unable to navigate to login:", error);
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <motion.div
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-green-500/15 blur-3xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl"
          animate={{ scale: [1.05, 1, 1.05], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl rounded-[30px] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-300">
              <AlertTriangle size={30} />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-green-300/80">
              Workspace Recovery
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Something went off track
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/60">
              The page could not be rendered safely. Your data has not been
              changed. Reload the workspace or return to the secure sign-in page.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-300/60"
              >
                <RefreshCw size={16} />
                Reload workspace
              </button>
              <button
                type="button"
                onClick={this.handleLogin}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <ArrowLeft size={16} />
                Go to sign in
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
