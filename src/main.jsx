// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";

import App from "./App.jsx";
import Login from "./components/admin/Login.jsx";
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import RequireAuth from "./components/admin/RequireAuth.jsx";

function Root() {
  return (
    <React.StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Home (incluye el Navbar dentro de App.jsx) */}
            <Route path="/" element={<App />} />

            {/* Login del módulo admin */}
            <Route path="/admin/login" element={<Login />} />

            {/* Panel admin protegido */}
            <Route
              path="/admin"
              element={
                <RequireAuth allow={["ADMIN", "EDITOR", "VIEWER"]}>
                  <AdminDashboard />
                </RequireAuth>
              }
            />

            {/* 404 */}
            <Route path="*" element={<div style={{ padding: 24 }}>404</div>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
