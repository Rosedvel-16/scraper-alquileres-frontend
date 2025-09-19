import React, { useEffect, useMemo, useState } from 'react'
import { Search, Home, ExternalLink, Bed, Bath, Square, Calendar, TrendingUp, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react'
import axios from 'axios'
import './index.css'

// === Config API ===
const API = import.meta.env.VITE_API_URL
if (!API) {
  console.error('VITE_API_URL no está definida')
  alert('Configura VITE_API_URL en Vercel (frontend) y redeploya.')
}

// === Constantes UI ===
const PAGE_SIZE = 20 // Máximo 20 por página
const LS_KEY_RECENTS = 'scraper_recents_v1'

export default function App() {
  // --- Estado de búsqueda (SIN filtro por m2) ---
  const [searchData, setSearchData] = useState({
    zona: '',
    dormitorios: '0',
    banos: '0',
    price_min: '',
    price_max: '',
    palabras_clave: ''
  })

  // --- Resultados y UI ---
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  // Paginación
  const [page, setPage] = useState(1)

  // "Datos más buscados" (desde API si existe) y "últimas búsquedas" locales
  const [trending, setTrending] = useState([]) // viene del backend si existe
  const [recents, setRecents] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY_RECENTS)) || [] } catch { return [] }
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchData(prev => ({ ...prev, [name]: value }))
  }

  // --- Búsqueda principal ---
  const handleSearch = async (e) => {
    e?.preventDefault?.()
    setLoading(true)
    setError('')
    setHasSearched(true)
    setPage(1) // reset page en cada nueva búsqueda

    try {
      const params = {
        zona: searchData.zona,
        dormitorios: searchData.dormitorios,
        banos: searchData.banos,
        ...(searchData.price_min && { price_min: parseInt(searchData.price_min) }),
        ...(searchData.price_max && { price_max: parseInt(searchData.price_max) }),
        palabras_clave: searchData.palabras_clave
      }

      const response = await axios.get(`${API}/search`, { params })

      if (response.data.success) {
        const props = Array.isArray(response.data.properties) ? response.data.properties : []
        setResults(props)
        // Guardar búsqueda localmente como "Últimas búsquedas" (no inventa datos)
        saveRecent(params)
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

  // --- Utilidades recents ---
  function saveRecent(params) {
    const entry = {
      zona: params.zona || '',
      dormitorios: String(params.dormitorios || '0'),
      banos: String(params.banos || '0'),
      price_min: params.price_min || '',
      price_max: params.price_max || '',
      palabras_clave: params.palabras_clave || '',
      ts: Date.now()
    }
    const cleaned = dedupeRecents([entry, ...recents]).slice(0, 8)
    setRecents(cleaned)
    try { localStorage.setItem(LS_KEY_RECENTS, JSON.stringify(cleaned)) } catch {}
  }

  function dedupeRecents(list) {
    const seen = new Set()
    return list.filter(r => {
      const key = `${r.zona}|${r.dormitorios}|${r.banos}|${r.price_min}|${r.price_max}|${r.palabras_clave}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // --- Cargar "más buscados" desde el backend si tienen endpoint ---
  useEffect(() => {
    let cancel = false
    const fetchTrending = async () => {
      try {
        // Endpoint opcional: si no existe o falla, simplemente no mostramos nada
        const url = `${API}/trending` // Ajusta si tu backend expone /stats o similar
        const res = await axios.get(url)
        if (!cancel && Array.isArray(res.data?.items) && res.data.items.length) {
          // Esperamos items del tipo { zona, dormitorios, banos, price_min, price_max, palabras_clave, count }
          setTrending(res.data.items)
        }
      } catch (_) {
        // Silencioso: no inventamos data
      }
    }
    fetchTrending()
    return () => { cancel = true }
  }, [])

  // --- Derivados de paginación ---
  const total = results.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pagedResults = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return results.slice(start, end)
  }, [results, page])

  // --- Helpers UI ---
  const formatPrice = (price) => price?.replace?.('S/', 'S/ ').replace?.('S/.', 'S/ ') || price

  const applyQuickSearch = (payload) => {
    setSearchData(prev => ({
      ...prev,
      zona: payload.zona || '',
      dormitorios: String(payload.dormitorios ?? '0'),
      banos: String(payload.banos ?? '0'),
      price_min: payload.price_min || '',
      price_max: payload.price_max || '',
      palabras_clave: payload.palabras_clave || ''
    }))
    // Ejecuta búsqueda con esos parámetros
    setTimeout(() => handleSearch(), 0)
  }

  const clearRecents = () => {
    setRecents([])
    try { localStorage.removeItem(LS_KEY_RECENTS) } catch {}
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1><Home size={32} /> Scraper de Alquileres</h1>
          <p>Encuentra el departamento perfecto en múltiples portales inmobiliarios</p>
        </div>
      </header>

      {/* Sección: Más buscados / Recientes (no inventamos datos) */}
      <section className="container trending">
        {(trending?.length > 0) && (
          <div className="trend-block">
            <h3><TrendingUp size={18}/> Más buscados</h3>
            <div className="chip-wrap">
              {trending.map((t, i) => (
                <button key={`t-${i}`} className="chip" onClick={() => applyQuickSearch(t)}>
                  {t.zona || 'Zona'}{t.dormitorios && ` · ${t.dormitorios} hab`}{t.banos && ` · ${t.banos} baños`}
                  {(t.price_min || t.price_max) && ` · S/ ${t.price_min || 0}–${t.price_max || '∞'}`}
                  {t.palabras_clave && ` · ${t.palabras_clave}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {(recents?.length > 0) && (
          <div className="trend-block">
            <div className="trend-head">
              <h3><Clock size={18}/> Tus últimas búsquedas</h3>
              <button className="chip clear" onClick={clearRecents}><X size={14}/> Limpiar</button>
            </div>
            <div className="chip-wrap">
              {recents.map((r, i) => (
                <button key={`r-${i}`} className="chip" onClick={() => applyQuickSearch(r)}>
                  {r.zona || 'Zona'}{r.dormitorios !== '0' && ` · ${r.dormitorios} hab`}{r.banos !== '0' && ` · ${r.banos} baños`}
                  {(r.price_min || r.price_max) && ` · S/ ${r.price_min || 0}–${r.price_max || '∞'}`}
                  {r.palabras_clave && ` · ${r.palabras_clave}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Formulario */}
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
              <select id="dormitorios" name="dormitorios" value={searchData.dormitorios} onChange={handleInputChange}>
                <option value="0">Cualquier cantidad</option>
                <option value="1">1 dormitorio</option>
                <option value="2">2 dormitorios</option>
                <option value="3">3 dormitorios</option>
                <option value="4">4+ dormitorios</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="banos">🚿 Baños</label>
              <select id="banos" name="banos" value={searchData.banos} onChange={handleInputChange}>
                <option value="0">Cualquier cantidad</option>
                <option value="1">1 baño</option>
                <option value="2">2 baños</option>
                <option value="3">3+ baños</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="price_min">💰 Precio Mínimo (S/)</label>
              <input type="number" id="price_min" name="price_min" value={searchData.price_min} onChange={handleInputChange} placeholder="0" min="0" />
            </div>

            <div className="form-group">
              <label htmlFor="price_max">💰 Precio Máximo (S/)</label>
              <input type="number" id="price_max" name="price_max" value={searchData.price_max} onChange={handleInputChange} placeholder="5000" min="0" />
            </div>

            <div className="form-group">
              <label htmlFor="palabras_clave">🔍 Palabras clave</label>
              <input type="text" id="palabras_clave" name="palabras_clave" value={searchData.palabras_clave} onChange={handleInputChange} placeholder="Ej: piscina, mascotas, amoblado..." />
            </div>
          </div>

          <button type="submit" className="search-button" disabled={loading || !searchData.zona}>
            <Search size={20} /> {loading ? 'Buscando...' : 'Buscar Propiedades'}
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

        {/* Resumen + Paginación */}
        {results.length > 0 && (
          <>
            <div className="results-info">
              <h3>✅ {total} propiedades encontradas</h3>
              <p>Mostrando {pagedResults.length} de {total}</p>
            </div>

            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft size={16}/> Anterior
              </button>
              <span>Página {page} de {totalPages}</span>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Siguiente <ChevronRight size={16}/>
              </button>
            </div>

            <div className="properties-grid">
              {pagedResults.map((property) => (
                <div key={property.id} className="property-card">
                  <div className="property-image">
                    {property.imagen_url ? (
                      <img src={property.imagen_url} alt={property.titulo} onError={(e) => { e.currentTarget.style.display = 'none' }} />
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

            <div className="pagination bottom">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft size={16}/> Anterior
              </button>
              <span>Página {page} de {totalPages}</span>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Siguiente <ChevronRight size={16}/>
              </button>
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
