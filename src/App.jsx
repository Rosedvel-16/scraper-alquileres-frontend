import React, { useEffect, useMemo, useState } from 'react'
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

// Normaliza URLs (https, evita //)
const normalizeUrl = (u) => {
  if (!u) return '#'
  if (u.startsWith('//')) return 'https:' + u
  if (!/^https?:\/\//i.test(u)) return 'https://' + u.replace(/^\/+/, '')
  return u
}

export default function App() {
  // filtros
  const [searchData, setSearchData] = useState({
    zona: '',
    dormitorios: '0',
    banos: '0',
    price_min: '',
    price_max: '',
    palabras_clave: ''
  })

  // resultados + meta (desde backend)
  const [results, setResults] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)

  // ui
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  // más buscados (opcional) + recientes (local)
  const [trending, setTrending] = useState([])
  const [recents, setRecents] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY_RECENTS)) || [] } catch { return [] }
  })

  // destacados para el home (exactamente 9, reales)
  const [featured, setFeatured] = useState([])
  const [homeLoading, setHomeLoading] = useState(false)

  // ---- NUEVA CONSTANTE: Determina si al menos un filtro es válido ----
  const isSearchValid = useMemo(() => {
    const { zona, dormitorios, banos, price_min, price_max, palabras_clave } = searchData;
    return (
      zona.trim() !== "" ||
      (dormitorios && dormitorios !== "0") ||
      (banos && banos !== "0") ||
      (price_min && price_min.trim() !== "") ||
      (price_max && price_max.trim() !== "") ||
      (palabras_clave && palabras_clave.trim() !== "")
    );
  }, [searchData]);

  // ---- handlers ----
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

  const goPrev = async () => meta?.has_prev && fetchPage(Math.max(1, (meta?.page || 1) - 1))
  const goNext = async () => meta?.has_next && fetchPage((meta?.page || 1) + 1)

  // ---- recientes ----
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

  // ---- trending (opcional) ----
  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        const res = await axios.get(`${API}/trending`)
        if (!cancel && Array.isArray(res.data?.items) && res.data.items.length) {
          setTrending(res.data.items)
        }
      } catch (_) {}
    })()
    return () => { cancel = true }
  }, [])

  // ---- home feed -> usa directamente "featured" (9 reales) ----
  useEffect(() => {
    let cancel = false
    ;(async () => {
      setHomeLoading(true)
      try {
        const res = await axios.get(`${API}/home-feed`)
        // Prioriza featured del backend; si no, intenta aplanar sections y cortar a 9
        let feats = Array.isArray(res.data?.featured) ? res.data.featured : []
        if ((!feats || feats.length === 0) && Array.isArray(res.data?.sections)) {
          const flat = []
          for (const sec of res.data.sections) {
            if (Array.isArray(sec.properties)) flat.push(...sec.properties)
          }
          feats = flat.slice(0, 9)
        }
        if (!cancel) setFeatured(feats.slice(0, 9))
      } catch (_) {
        if (!cancel) setFeatured([])
      } finally {
        if (!cancel) setHomeLoading(false)
      }
    })()
    return () => { cancel = true }
  }, [])

  // ---- helpers ui ----
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

  // derivados
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
      onKeyDown={(e) => { if (e.key === 'Enter') window.open(normalizeUrl(property.link), '_blank') }}
    >
      {property.is_featured && (
        <div className="featured-badge" title="Destacado">
          <Star size={16}/> Destacado
        </div>
      )}
      <div className="property-image">
        {property.imagen_url ? (
          <img
            src={normalizeUrl(property.imagen_url)}
            alt={property.titulo}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
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
          <a
            href={normalizeUrl(property.link)}
            target="_blank"
            rel="noopener noreferrer"
            className="visit-button"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={16}/> Visitar
          </a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1><Home size={32} /> Scraper de Alquileres</h1>
          <p>Encuentra el departamento perfecto en múltiples portales inmobiliarios</p>
        </div>
      </header>

      {/* === Filtros (DISEÑO ORIGINAL) === */}
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
              
              />
            </div>

            <div className="form-group">
              <label htmlFor="dormitorios">🛏️ Dormitorios</label>
              <select id="dormitorios" name="dormitorios" value={searchData.dormitorios} onChange={handleInputChange}>
                <option value="0">Selecionar</option>
                <option value="1">1 dormitorio</option>
                <option value="2">2 dormitorios</option>
                <option value="3">3 dormitorios</option>
                <option value="4">4+ dormitorios</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="banos">🚿 Baños</label>
              <select id="banos" name="banos" value={searchData.banos} onChange={handleInputChange}>
                <option value="0">Selecionar</option>
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

          {/* BOTÓN MODIFICADO: Usa isSearchValid en lugar de !searchData.zona */}
          <button
            type="submit"
            className="search-button"
            disabled={loading || !isSearchValid}
          >
            <Search size={20} /> {loading ? 'Buscando...' : 'Buscar Propiedades'}
          </button>
        </form>

        {/* chips “más buscados” y “recientes” (opcional) */}
        <section className="trending">
          {(trending?.length > 0) && (
            <div className="trend-block">
              <h3><TrendingUp size={18}/> Más buscados</h3>
              <div className="chip-wrap">
                {trending.map((t, i) => (
                  <button key={`t-${i}`} type="button" className="chip" onClick={() => applyQuickSearch(t)}>
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
                <button type="button" className="chip clear" onClick={clearRecents}><X size={14}/> Limpiar</button>
              </div>
              <div className="chip-wrap">
                {recents.map((r, i) => (
                  <button key={`r-${i}`} type="button" className="chip" onClick={() => applyQuickSearch(r)}>
                    {r.zona || 'Zona'}{r.dormitorios !== '0' && ` · ${r.dormitorios} hab`}{r.banos !== '0' && ` · ${r.banos} baños`}
                    {(r.price_min || r.price_max) && ` · S/ ${r.price_min || 0}–${r.price_max || '∞'}`}
                    {r.palabras_clave && ` · ${r.palabras_clave}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* === Resultados (cuando hay búsqueda) === */}
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
              <h3>✅ {meta?.total ?? 0} propiedades encontradas</h3>
              <p>Mostrando {results.length} de {meta?.total ?? 0}</p>
            </div>

            <div className="pagination">
              <button type="button" className="page-btn" disabled={!meta?.has_prev || loading} onClick={goPrev}>
                <ChevronLeft size={16}/> Anterior
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button type="button" className="page-btn" disabled={!meta?.has_next || loading} onClick={goNext}>
                Siguiente <ChevronRight size={16}/>
              </button>
            </div>

            <div className="properties-grid">
              {results.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            <div className="pagination bottom">
              <button type="button" className="page-btn" disabled={!meta?.has_prev || loading} onClick={goPrev}>
                <ChevronLeft size={16}/> Anterior
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button type="button" className="page-btn" disabled={!meta?.has_next || loading} onClick={goNext}>
                Siguiente <ChevronRight size={16}/>
              </button>
            </div>
          </>
        )}

        {/* === Destacados del HOME (exactamente 9) === */}
        {!hasSearched && featured.length > 0 && (
          <section>
            <h2>Publicaciones destacadas</h2>
            {homeLoading && <div className="loading">Cargando publicaciones...</div>}
            <div className="properties-grid">
              {featured.map((p, i) => (
                <PropertyCard key={`feat-${i}`} property={{ ...p, is_featured: true }} />
              ))}
            </div>
          </section>
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