// src/components/admin/Navbar.jsx
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Marca o nombre de la app */}
        <Link to="/" className="navbar-brand">
          🏠 Scraper de Alquileres
        </Link>

        {/* Links de navegación */}
        <nav className="navbar-links">
          <Link to="/">Inicio</Link>
          <Link to="/admin/login" className="btn-login">Login</Link>
        </nav>
      </div>
    </header>
  );
}
