// src/components/admin/AdminDashboard.jsx
import "./admin.css";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { role, logout } = useAuth();

  return (
    <div className="admin-shell">
      <div className="admin-container">

        {/* Header */}
        <div className="admin-header">
          <h2 className="admin-title">Panel Admin</h2>
          <div className="admin-right">
            <span className="role-badge">Rol: {role || "ADMIN"}</span>
            <button className="btn btn-ghost" onClick={logout}>Salir</button>
          </div>
        </div>

        {/* Grid superior: importar / top consultados */}
        <section className="admin-grid">
          {/* Importar */}
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Importar CSV/JSON</h3>
            </div>

            {/* Controles de import */}
            <div className="form-row">
              <input type="file" className="file" accept=".csv,.json" />
              <button className="btn btn-primary">Subir</button>
            </div>

            <div className="divider" />

            <p className="help">Encabezados: <code>external_id,titulo,precio,moneda,m2,dormitorios,banos,descripcion,link,imagen_url,fuente,distrito,activo</code></p>
          </div>

          {/* Top consultados */}
          <aside className="card">
            <div className="card-head">
              <h3 className="card-title">Top consultados (7 días)</h3>
            </div>
            <div className="list">
              {/* Mapea tus datos reales aquí */}
              <div className="small">Aún sin datos</div>
            </div>
          </aside>
        </section>

        {/* Toolbar de búsqueda */}
        <div className="toolbar">
          <input className="input" placeholder="Buscar por título..." />
          <button className="btn btn-ghost">Buscar</button>
        </div>

        {/* Tabla de resultados */}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{width:100}}>ID</th>
                <th>Título</th>
                <th style={{width:160}}>Fuente</th>
                <th style={{width:120}}>Precio</th>
              </tr>
            </thead>
            <tbody>
              {/* Renderiza filas cuando tengas datos */}
              <tr><td colSpan={4} className="empty">Sin resultados</td></tr>
            </tbody>
          </table>
          <div className="pagination">
            <button className="page-btn" disabled>«</button>
            <span className="small">Total: 0</span>
            <button className="page-btn" disabled>»</button>
          </div>
        </div>

      </div>
    </div>
  );
}
