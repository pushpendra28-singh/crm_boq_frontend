import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import { rememberLeaveLink } from "../admin/leaves/leaveLink";

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070712] text-white">
        <div className="flex items-center gap-3 text-sm text-white/80" role="status" aria-live="polite">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />
          Restoring your session...
        </div>
      </div>
    );
  }

  if (!admin) {
    // Preserve the existing leave-link behavior before redirecting to login.
    rememberLeaveLink();

    const hadToken = Boolean(localStorage.getItem("adminToken"));
    const params = new URLSearchParams();

    if (hadToken) {
      params.set("reason", "session-expired");
    }

    if (location.pathname !== "/admin") {
      params.set("from", location.pathname);
    }

    const query = params.toString();
    return <Navigate to={`/admin${query ? `?${query}` : ""}`} replace />;
  }

  return children;
};

export default ProtectedRoute;


// import { Navigate } from "react-router-dom";

// const ProtectedRoute = ({ children }) => {
//   const token = localStorage.getItem("adminToken");
//   if (!token) {
//     return <Navigate to="/admin" />;
//   }

//   return children;
// };

// export default ProtectedRoute;