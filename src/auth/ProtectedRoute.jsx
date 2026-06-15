import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../auth/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useContext(AuthContext);

  // wait until profile loads
 if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070712] text-white">
      Loading...
    </div>
  );
}

  // no logged in admin
  if (!admin) {
    return <Navigate to="/admin" replace />;
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