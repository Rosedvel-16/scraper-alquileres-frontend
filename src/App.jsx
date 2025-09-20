import React, { useEffect, useState } from 'react'
import {
  Search, Home, ExternalLink, Bed, Bath, Square,
  Calendar, TrendingUp, Clock, X, ChevronLeft, ChevronRight, Star
} from 'lucide-react'
import axios from 'axios'
import './index.css'

// === Config API ===
const API = import.meta.env.VITE_API_URL
if (!API) {
  console.error('VITE_API_URL no está definida')
  alert('Configura VITE_API_URL en el .env (Vercel) y redeploya.')
}

// === Constantes UI ===
const PAGE_SIZE = 20
const LS_KEY_RECENTS = 'scraper_recents_v1'

// Normaliza URLs
const normalizeUrl = (u) => {
  if (!u) return '#'
  if (u.startsWith('//')) return 'https:' + u
  if (!/^https?:\/\//i.test(u)) return 'https://' + u.replace(/^\/+/, '')
  return u
}

export default function App() {
  const [searchData, setSearchData] = useState({
    zona: '',
    dormitorios: '0',
    banos: '0',
    price_min: '',
    price_max: '',
    palabras_clave: ''
  })

  const [results, setResults] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const [trending, setTrending] = useState([])
  const [recents, setRecents] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY_RECENTS)) || [] } catch { return [] }
  })

  const [homeSections, setHomeSections] = useState([])
  const [homeLoading, setHomeLoading] = useState(false)

  // ---- Inputs ----
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchData(prev => ({ ...prev, [name]: value }))
  }

  const handleSearch = async (e) => {
    e?.preventDefault?.()
    setError('')
    setHasSearched(true)
    setPage(1)
    await fetchPage(1)
    saveRecent({
      zona: searchData.zona,
      dormitorios: searchData.dormitorios,
      banos: searchData.banos,
      price_min: searchData.price_min ? parseInt(searchData.price_min) : '',
      price_max: searchData.price_max ? parseInt(searchData.price_max) : '',
      palabras_clave: searchData.palabras_clave
    })
  }

  const fetchPage = async (targetPage) => {
    setLoading(true)
    setError('')
    try {
      const params = {
        zona: searchData.zona,
        dormitorios: searchData.dormitorios,
        banos: searchData.banos,
        ...(searchData.price_min && { price_min: parseInt(searchData.price_min) }),
        ...(searchData.price_max && { price_max: parseInt(searchData.price_max) }),
        palabras_clave: searchData.palabras_clave,
        page: targetPage,
        page_size: PAGE_SIZE
      }
      const res = await axios.get(`${API}/search`, { params })
      const data = res.data
      if (data?.success) {
        setResults(Array.isArray(data.properties) ? data.properties : [])
        setMeta(data.meta || null)
        setPage(data.meta?.page || targetPage)
      } else {
        setResults([])
        setMeta(null)
        setError(data?.message || 'Error en la búsqueda')
      }
    } catch (err) {
      console.error(err)
      setResults([])
      setMeta(null)
      setError(err.response?.data?.detail || 'Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const goPrev = async () => {
    if (!meta?.has_prev) return
    await fetchPage(Math.max(1, (meta?.page || 1) - 1))
  }
  const goNext = async () => {
    if (!meta?.has_next) return
    await fetchPage((meta?.page || 1) + 1)
  }

  // ---- Recientes ----
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
  const clearRecents = () => {
    setRecents([])
    try { localStorage.removeItem(LS_KEY_RECENTS) } catch {}
  }

  // ---- Más buscados ----
  useEffect(() => {
    let cancel = false
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${API}/trending`)
        if (!cancel && Array.isArray(res.data?.items) && res.data.items.length) {
          setTrending(res.data.items)
        }
      } catch (_) {}
    }
    fetchTrending()
    return () => { cancel = true }
  }, [])

  // ---- Home feed ----
  useEffect(() => {
    let cancel = false
    const getHome = async () => {
      setHomeLoading(true)
      try {
        const res = await axios.get(`${API}/home-feed`)
        if (!cancel && Array.isArray(res.data?.sections)) {
          setHomeSections(res.data.sections || [])
        }
      } catch (_) {} finally {
        if (!cancel) setHomeLoading(false)
      }
    }
    getHome()
    return () => { cancel = true }
  }, [])

  // ---- Helpers ----
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
    setTimeout(() => handleSearch(), 0)
  }

  const total = meta?.total ?? 0
  const totalPages = meta?.total_pages ?? 1
  const showing = results.length
  const currentPage = meta?.page ?? page

  const PropertyCard = ({ property }) => (
    <div
      className={`property-card ${property.is_featured ? 'featured' : ''}`}
      onClick={() => window.open(normalizeUrl(property.link), '_blank')}
      role="button"
      tabIndex={0}
    >
      {property.is_featured && (
        <div className="featured-badge">
          <Star size={16}/> Destacado
        </div>
      )}
      <div className="property-image">
        {property.imagen_url ? (
          <img src={normalizeUrl(property.imagen_url)} alt={property.titulo} />
        ) : (<Home size={64} />)}
      </div>
      <div className="property-content">
        <h3>{property.titulo}</h3>
        <div className="property-price">{formatPrice(property.precio)}</div>
        <div className="property-details">
          <div><Bed size={16}/> {property.dormitorios}</div>
          <div><Bath size={16}/> {property.baños}</div>
          <div><Square size={16}/> {property.m2}</div>
        </div>
        <p>{property.descripcion}</p>
        <div className="property-footer">
          <span><Calendar size={14}/> {new Date(property.scraped_at).toLocaleDateString()} • Fuente: {property.fuente}</span>
          <a href={normalizeUrl(property.link)} target="_blank" rel="noopener noreferrer" className="visit-button">
            <ExternalLink size={16}/> Visitar
          </a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1><Home size={32}/> Scraper de Alquileres</h1>
          <p>Encuentra el departamento perfecto en múltiples portales inmobiliarios</p>
        </div>
      </header>

      {/* --- Filtros siempre arriba --- */}
      <main className="container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-grid">
            <input type="text" name="zona" value={searchData.zona} onChange={handleInputChange} placeholder="📍 Zona (ej: Miraflores)" required />
            <select name="dormitorios" value={searchData.dormitorios} onChange={handleInputChange}>
              <option value="0">Dormitorios</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option>
            </select>
            <select name="banos" value={searchData.banos} onChange={handleInputChange}>
              <option value="0">Baños</option><option value="1">1</option><option value="2">2</option><option value="3">3+</option>
            </select>
            <input type="number" name="price_min" value={searchData.price_min} onChange={handleInputChange} placeholder="💰 Precio mín" />
            <input type="number" name="price_max" value={searchData.price_max} onChange={handleInputChange} placeholder="💰 Precio máx" />
            <input type="text" name="palabras_clave" value={searchData.palabras_clave} onChange={handleInputChange} placeholder="🔍 Palabras clave" />
          </div>
          <button type="submit" className="search-button" disabled={loading || !searchData.zona}>
            <Search size={20}/> {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {error && <div className="error">⚠️ {error}</div>}

        {/* Resultados después de buscar */}
        {hasSearched && results.length > 0 && (
          <>
            <div className="results-info">
              <h3>✅ {total} propiedades encontradas</h3>
              <p>Mostrando {showing} de {total}</p>
            </div>

            <div className="pagination">
              <button type="button" onClick={goPrev} disabled={!meta?.has_prev}> <ChevronLeft size={16}/> Anterior</button>
              <span>Página {currentPage} de {totalPages}</span>
              <button type="button" onClick={goNext} disabled={!meta?.has_next}>Siguiente <ChevronRight size={16}/></button>
            </div>

            <div className="properties-grid">
              {results.map((p, i) => <PropertyCard key={i} property={p}/>)}
            </div>
          </>
        )}

        {/* Home feed destacado solo si no hay búsqueda */}
        {!hasSearched && homeSections?.length > 0 && (
          <section>
            <h2>Publicaciones destacadas</h2>
            {homeLoading && <div className="loading">Cargando...</div>}
            {homeSections.map((sec, idx) => (
              <div key={idx} className="home-section">
                <h3>{sec.title}</h3>
                <div className="properties-grid">
                  {sec.properties.map((p, i) => <PropertyCard key={`${idx}-${i}`} property={p}/>)}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
