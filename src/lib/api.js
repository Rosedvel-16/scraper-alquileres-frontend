// src/lib/api.js
import axios from "axios";

// ⚙️ Detección del entorno
const fromEnv = import.meta.env?.VITE_API_URL?.trim();   // en Vercel está
const isDev = import.meta.env?.DEV;

// ⛑️ Fallbacks seguros
const DEV_FALLBACK = "/api";  
const PROD_FALLBACK = "https://TU-BACKEND.vercel.app";  // <- cámbialo solo si NO usas VITE_API_URL en Vercel

// 🎯 Base URL final
export const API_BASE = fromEnv || (isDev ? DEV_FALLBACK : PROD_FALLBACK);

// Axios instance
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Token JWT (si lo usas)
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});
