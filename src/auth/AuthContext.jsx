import { createContext, useState, useEffect } from "react";
import API_BASE_URL from "../config/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  fetchProfile();
}, []);

  const login = async (data) => {
  const adminData = {
    id: data.admin.id,
    name: data.admin.name,
    email: data.admin.email,
    role: data.admin.role,
    permissions: data.admin.permissions || [],
    avatar: data.admin.avatar || null,
  };

  localStorage.setItem("adminToken", data.token);
  localStorage.setItem("adminData", JSON.stringify(adminData));

  await fetchProfile(data.token);
};



 const fetchProfile = async (passedToken = null) => {
  try {
    const token = passedToken || localStorage.getItem("adminToken");

    if (!token) {
      setLoading(false);
      return;
    }

    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error();

    const data = await res.json();

    const adminData = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      permissions: data.permissions || [],
      avatar: data.avatar || null,
    };

    localStorage.setItem("adminData", JSON.stringify(adminData));

    setAdmin(adminData);
  } catch (err) {
    logout();
  } finally {
    setLoading(false);
  }
};

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setAdmin(null);
  };

  // Check if admin has a specific permission
  const hasPermission = (permission) => {

    if (!admin) return false;
    if (admin.role === "superadmin") return true;
    return Array.isArray(admin.permissions)
  ? admin.permissions.includes(permission)
  : false;
  };

  // Check if admin has a specific role
  const hasRole = (...roles) => {
    if (!admin) return false;
    return roles.includes(admin.role);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, hasPermission, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};



// import { createContext, useState } from "react";

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [admin, setAdmin] = useState(
//     JSON.parse(localStorage.getItem("admin")) || null
//   );

//   const login = (data) => {
//     localStorage.setItem("token", data.token);
//     localStorage.setItem("admin", JSON.stringify(data.admin));
//     setAdmin(data.admin);
//   };

//   const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("admin");
//     setAdmin(null);
//   };

//   return (
//     <AuthContext.Provider value={{ admin, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };