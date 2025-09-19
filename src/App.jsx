import React, { useState } from 'react'
import { Search, Home, ExternalLink, Bed, Bath, Square, Calendar } from 'lucide-react'
import axios from 'axios'
import './index.css'

// 👇 Base de la API: en producción se toma de la variable en Vercel
const API = import.meta.env.VITE_API_URL || '/api'

function App() {
  const [searchData, setSearchData] = useState({
    zona: '',
    dormitorios: '0',
    banos: '0',
    price_min: '',
    price_max: '',
    palabras_clave: '' 
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
      const params = {
        zona: searchData.zona,
        dormitorios: searchData.dormitorios,
        banos: searchData.banos,
        ...(searchData.price_min && { price_min: parseInt(searchData.price_min) }),
        ...(searchData.price_max && { price_max: parseInt(searchData.price_max) }),
        palabras_clave: searchData.palabras_clave
      }

      // 👇 ahora la llamada usa la URL de la API definida arriba
      const response = await axios.get(`${API}/search`, { params })

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
            {/* tus inputs igual que antes */}
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

        {error && <div className="error">⚠️ {error}</div>}
        {loading && <div className="loading">🔍 Buscando propiedades...</div>}
        {hasSearched && !loading && results.length === 0 && !error && (
          <div className="results-info">
            <h3>No se encontraron propiedades</h3>
            <p>Intenta ajustar los filtros</p>
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
                  <div className="property-image">
                    {property.imagen_url ? (
                      <img 
                        src={property.imagen_url} 
                        alt={property.titulo} 
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <Home size={64} />
                    )}
                  </div>
                  <div className="property-content">
                    <h3 className="property-title">{property.titulo}</h3>
                    <div className="property-price">{formatPrice(property.precio)}</div>
                    <div className="property-details">
                      <div className="detail-item"><Bed size={16}/> {property.dormitorios}</div>
                      <div className="detail-item"><Bath size={16}/> {property.baños}</div>
                      <div className="detail-item"><Square size={16}/> {property.m2}</div>
                    </div>
                    {property.descripcion && <p>{property.descripcion}</p>}
                    <div className="property-footer">
                      <span><Calendar size={14}/> {new Date(property.scraped_at).toLocaleDateString()} • Fuente: {property.fuente}</span>
                      <a href={property.link} target="_blank" rel="noopener noreferrer" className="visit-button">
                        <ExternalLink size={16}/> Visitar
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
