import { createContext, useState, useEffect } from "react";
import API_BASE_URL from "../config/api";

export const AuthContext = createContext();

const readStoredAdmin = () => {
  try {
    const raw = localStorage.getItem("adminData");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Unable to restore saved admin session:", error);
    localStorage.removeItem("adminData");
    return null;
  }
};

const buildAdminData = (data) => ({
  id: data.id,
  name: data.name,
  email: data.email,
  role: data.role,
  permissions: Array.isArray(data.permissions)
    ? data.permissions
    : [],
  avatar: data.avatar || null,
  employment: data.employment || null,
});

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (data) => {
    try {
      const adminData = buildAdminData(data.admin);

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminData", JSON.stringify(adminData));

      setAdmin(adminData);

      await fetchProfile(data.token);
    } catch (error) {
      console.error("Login session setup failed:", error);
      logout();
      throw error;
    }
  };

  const fetchProfile = async (passedToken = null) => {
    let timeoutId;

    try {
      const token =
        passedToken || localStorage.getItem("adminToken");

      if (!token) {
        setAdmin(null);
        setLoading(false);
        return false;
      }

      const controller = new AbortController();

      timeoutId = window.setTimeout(() => {
        controller.abort();
      }, 10000);

      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        console.warn("Authentication session expired.");
        logout();
        return false;
      }

      if (!res.ok) {
        console.error(
          `Profile request failed with status ${res.status}.`
        );

        // Keep the existing locally stored session for
        // temporary server/network problems.
        const storedAdmin = readStoredAdmin();

        if (storedAdmin) {
          setAdmin(storedAdmin);
        }

        return false;
      }

      const data = await res.json();
      const adminData = buildAdminData(data);

      localStorage.setItem(
        "adminData",
        JSON.stringify(adminData)
      );

      setAdmin(adminData);

      return true;
    } catch (error) {
      if (error?.name === "AbortError") {
        console.error("Profile request timed out.");
      } else {
        console.error("Unable to restore profile:", error);
      }

      // Do not logout for temporary network/server problems.
      const storedAdmin = readStoredAdmin();

      if (storedAdmin) {
        setAdmin(storedAdmin);
      }

      return false;
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

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
    <AuthContext.Provider
      value={{
        admin,
        login,
        logout,
        hasPermission,
        hasRole,
        loading,
        refreshProfile: fetchProfile,
      }}
    >
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