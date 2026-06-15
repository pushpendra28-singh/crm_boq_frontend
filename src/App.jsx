import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./admin/Login";
import Dashboard from "./admin/Dashboard";
import ProtectedRoute from "./auth/ProtectedRoute";

import "./styles/index.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;