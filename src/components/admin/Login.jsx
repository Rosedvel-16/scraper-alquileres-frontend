// src/components/admin/Login.jsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./login.css";

export default function Login() {
  const { login } = useAuth();
  const [username, setU] = useState("admin@local");
  const [password, setP] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  // si RequireAuth mandó "from", regresa allí; si no, va a /admin
  const from = location.state?.from || "/admin";

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(username, password); // debe guardar token/estado en el AuthContext
      // Si tu login no retorna nada, usa el token del storage como verificación mínima:
      // if (!data && !localStorage.getItem("token")) throw new Error("Login inválido");
      navigate(from, { replace: true }); // navega sin recargar
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "No se pudo iniciar sesión";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <h1 className="login-title">Iniciar sesión</h1>
        <p className="login-sub">Accede al panel de administración</p>

        {error && <div className="login-error">⚠️ {error}</div>}

        <form className={`login-form ${loading ? "is-loading" : ""}`} onSubmit={onSubmit}>
          <div className="login-field">
            <label className="login-label" htmlFor="email">Correo</label>
            <input
              className="login-input"
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={username}
              onChange={(e) => setU(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">Contraseña</label>
            <div style={{ position: "relative" }}>
              <input
                className="login-input"
                id="password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setP(e.target.value)}
                required
              />
              <button
                type="button"
                aria-label="Mostrar/ocultar contraseña"
                onClick={() => setShowPass((s) => !s)}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: 0,
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? <span className="login-spinner" /> : "Entrar"}
          </button>

          {/* Volver al inicio */}
          <div style={{ display: "grid", placeItems: "center", marginTop: 8 }}>
            <Link to="/" className="login-link">← Volver al inicio</Link>
          </div>
        </form>

        <p className="login-hint">
          Si no avanza, abre F12 → Network y revisa <code>POST /auth/login</code>.
        </p>
      </div>
    </div>
  );
}
