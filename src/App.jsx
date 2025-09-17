import React, { useState } from 'react'
import { Search, Home, ExternalLink, Bed, Bath, Square, Calendar, Filter } from 'lucide-react'
import axios from 'axios'
import './index.css'

function App() {
  const [searchData, setSearchData] = useState({
    zona: '',
    dormitorios: '0',
    banos: '0',
    price_min: '',
    price_max: '',
    palabras_clave: '' // 👈 Campo para palabras clave
  })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setHasSearched(true)

    try {
      // Limpiar parámetros vacíos
      const params = {
        zona: searchData.zona,
        dormitorios: searchData.dormitorios,
        banos: searchData.banos,
        ...(searchData.price_min && { price_min: parseInt(searchData.price_min) }),
        ...(searchData.price_max && { price_max: parseInt(searchData.price_max) }),
        palabras_clave: searchData.palabras_clave // 👈 Enviar palabras clave
      }

      // Hacer la solicitud al backend
      // En desarrollo, usa el proxy de Vite: /api/search -> http://localhost:8000/search
      // En producción, apunta directamente a la URL de tu backend desplegado
      const response = await axios.get('/api/search', { params })

      if (response.data.success) {
        setResults(response.data.properties)
      } else {
        setError(response.data.message || 'Error en la búsqueda')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al conectar con el servidor')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return price.replace('S/', 'S/ ').replace('S/.', 'S/ ')
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1><Home size={32} /> Scraper de Alquileres</h1>
          <p>Encuentra el departamento perfecto en múltiples portales inmobiliarios</p>
        </div>
      </header>

      <main className="container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="zona">📍 Zona</label>
              <input
                type="text"
                id="zona"
                name="zona"
                value={searchData.zona}
                onChange={handleInputChange}
                placeholder="Ej: Miraflores, San Isidro..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dormitorios">🛏️ Dormitorios</label>
              <select
                id="dormitorios"
                name="dormitorios"
                value={searchData.dormitorios}
                onChange={handleInputChange}
              >
                <option value="0">Cualquier cantidad</option>
                <option value="1">1 dormitorio</option>
                <option value="2">2 dormitorios</option>
                <option value="3">3 dormitorios</option>
                <option value="4">4+ dormitorios</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="banos">🚿 Baños</label>
              <select
                id="banos"
                name="banos"
                value={searchData.banos}
                onChange={handleInputChange}
              >
                <option value="0">Cualquier cantidad</option>
                <option value="1">1 baño</option>
                <option value="2">2 baños</option>
                <option value="3">3+ baños</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="price_min">💰 Precio Mínimo (S/)</label>
              <input
                type="number"
                id="price_min"
                name="price_min"
                value={searchData.price_min}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="price_max">💰 Precio Máximo (S/)</label>
              <input
                type="number"
                id="price_max"
                name="price_max"
                value={searchData.price_max}
                onChange={handleInputChange}
                placeholder="5000"
                min="0"
              />
            </div>

            {/* 👇 NUEVO CAMPO: Palabras clave */}
            <div className="form-group">
              <label htmlFor="palabras_clave">🔍 Palabras clave</label>
              <input
                type="text"
                id="palabras_clave"
                name="palabras_clave"
                value={searchData.palabras_clave}
                onChange={handleInputChange}
                placeholder="Ej: piscina, mascotas, amoblado..."
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="search-button"
            disabled={loading || !searchData.zona}
          >
            <Search size={20} />
            {loading ? 'Buscando...' : 'Buscar Propiedades'}
          </button>
        </form>

        {error && (
          <div className="error">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="loading">
            🔍 Buscando propiedades en todos los portales...
          </div>
        )}

        {hasSearched && !loading && results.length === 0 && !error && (
          <div className="results-info">
            <h3>No se encontraron propiedades que coincidan con tus criterios</h3>
            <p>Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="results-info">
              <h3>✅ Se encontraron {results.length} propiedades</h3>
              <p>Resultados de múltiples portales inmobiliarios</p>
            </div>

            <div className="properties-grid">
              {results.map((property) => (
                <div key={property.id} className="property-card">
                  {/* 👇 Mostrar la imagen real */}
                  <div className="property-image">
                    {property.imagen_url ? (
                      <img 
                        src={property.imagen_url} 
                        alt={property.titulo} 
                        onError={(e) => {
                          e.target.style.display = 'none'; // Ocultar si falla
                          e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>';
                        }}
                      />
                    ) : (
                      <Home size={64} />
                    )}
                  </div>
                  
                  <div className="property-content">
                    <h3 className="property-title">{property.titulo}</h3>
                    
                    <div className="property-price">
                      {formatPrice(property.precio)}
                    </div>

                    <div className="property-details">
                      <div className="detail-item">
                        <div className="detail-label">
                          <Bed size={16} /> Dorms
                        </div>
                        <div className="detail-value">
                          {property.dormitorios || 'N/A'}
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">
                          <Bath size={16} /> Baños
                        </div>
                        <div className="detail-value">
                          {property.baños || 'N/A'}
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">
                          <Square size={16} /> m²
                        </div>
                        <div className="detail-value">
                          {property.m2 || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {property.descripcion && (
                      <p className="property-description">
                        {property.descripcion}
                      </p>
                    )}

                    <div className="property-footer">
                      <span className="property-source">
                        <Calendar size={14} /> {new Date(property.scraped_at).toLocaleDateString()} • 
                        Fuente: {property.fuente}
                      </span>
                      
                      <a 
                        href={property.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="visit-button"
                      >
                        <ExternalLink size={16} /> Visitar
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <p>© 2024 Scraper de Alquileres - Encuentra tu próximo hogar</p>
          <p>Datos obtenidos de múltiples portales inmobiliarios</p>
        </div>
      </footer>
    </div>
  )
}

export default App