// src/components/admin/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function RequireAuth({ allow = [], children }) {
  const { isLogged, role } = useAuth();
  const location = useLocation();
  if (!isLogged) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  if (allow.length && !allow.includes(role)) return <Navigate to="/" replace />;
  return children;
}
