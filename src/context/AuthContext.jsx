// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const Ctx = createContext();

export function AuthProvider({ children }) {
  const [isLogged, setIsLogged] = useState(!!localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role") || "VIEWER");

  // opcional: validar token al cargar
  useEffect(() => {
    // api.get('/auth/me').then(...).catch(() => logout());
  }, []);

  async function login(email, password) {
    // adapta los nombres según tu backend
    const { data } = await api.post("/auth/login", { email, password });
    const token = data?.access_token || data?.token;
    const r = data?.role || "ADMIN";
    if (!token) throw new Error("Login inválido (sin token)");
    localStorage.setItem("token", token);
    localStorage.setItem("role", r);
    setIsLogged(true);
    setRole(r);
    return data;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLogged(false);
    setRole("VIEWER");
  }

  return (
    <Ctx.Provider value={{ isLogged, role, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
