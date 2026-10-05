import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./admin/Login";
import Dashboard from "./admin/Dashboard";
import ProtectedRoute from "./auth/ProtectedRoute";
import Register from "./admin/Register";
import NotFound from "./common/NotFound";
import AppErrorBoundary from "./common/AppErrorBoundary";

import "./styles/index.css";

function App() {
  return (
    <AppErrorBoundary>
      <Routes>
        {/* Keep the existing root URL working, but use /admin as the canonical login URL. */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<Login />} />

        <Route
          path="/register"
          element={<Register title="Register" />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Never render a blank screen for an unknown client-side URL. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppErrorBoundary>
  );
}

export default App;
