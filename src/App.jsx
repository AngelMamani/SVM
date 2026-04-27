import { useEffect, useState } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'
import appLogo from './assets/logo.png'

const cityCenter = [-12.5932, -69.1891]
const STORAGE_KEY = 'pmaldonado-custom-map-points'
const POINT_TYPE_COLORS = {
  'Capa 1': '#dc2626',
  'Capa 2': '#2563eb',
  'Capa 3': '#16a34a',
  'Capa 4': '#7c3aed'
}
const surveillanceRings = [
  {
    id: 'Capa 1 - Perimetro externo',
    center: [-12.603, -69.201],
    color: '#1d4ed8',
    radius: 4200
  },
  {
    id: 'Capa 2 - Intersecciones principales',
    center: [-12.5935, -69.189],
    color: '#2563eb',
    radius: 2600
  },
  {
    id: 'Capa 3 - Manzanas y callejones',
    center: [-12.5905, -69.185],
    color: '#0ea5e9',
    radius: 1450
  },
  {
    id: 'Capa 4 - Puntos de interes',
    center: [-12.5912, -69.1844],
    color: '#14b8a6',
    radius: 720
  }
]

const MARKER_SHADOW_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
const pointTypeIconUrls = {
  'Capa 1': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  'Capa 2': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  'Capa 3': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  'Capa 4': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png'
}

const pointTypeIcons = Object.fromEntries(
  Object.entries(pointTypeIconUrls).map(([type, iconUrl]) => [
    type,
    new L.Icon({
      iconUrl,
      shadowUrl: MARKER_SHADOW_URL,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  ])
)

function AddPointOnMap({ onSelectLocation }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng
      onSelectLocation([Number(lat.toFixed(6)), Number(lng.toFixed(6))])
    }
  })
  return null
}

function normalizePointType(type) {
  const validTypes = Object.keys(POINT_TYPE_COLORS)
  if (validTypes.includes(type)) {
    return type
  }
  if (type === 'Camara') {
    return 'Capa 1'
  }
  if (type === 'Acceso V') {
    return 'Capa 3'
  }
  if (type === 'Punto de interes') {
    return 'Capa 4'
  }
  return 'Capa 1'
}

function App() {
  const [points, setPoints] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }
    return JSON.parse(stored).map((point) => ({
      ...point,
      type: normalizePointType(point.type)
    }))
  })
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [pointName, setPointName] = useState('')
  const [pointType, setPointType] = useState('Capa 1')
  const [visibleRings, setVisibleRings] = useState(() =>
    surveillanceRings.map((ring) => ring.id)
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points))
  }, [points])

  useEffect(() => {
    document.title = 'SVM | Sistema de Vigilancia Metrical'

    let favicon = document.querySelector("link[rel='icon']")
    if (!favicon) {
      favicon = document.createElement('link')
      favicon.setAttribute('rel', 'icon')
      document.head.appendChild(favicon)
    }
    favicon.setAttribute('type', 'image/png')
    favicon.setAttribute('href', appLogo)
  }, [])

  const savePoint = () => {
    if (!selectedLocation || !pointName.trim()) {
      return
    }

    const newPoint = {
      id: crypto.randomUUID(),
      name: pointName.trim(),
      type: pointType,
      position: selectedLocation
    }

    setPoints((current) => [...current, newPoint])
    setPointName('')
    setSelectedLocation(null)
  }

  const deletePoint = (pointId) => {
    setPoints((current) => current.filter((point) => point.id !== pointId))
  }

  const clearAllPoints = () => {
    setPoints([])
    setSelectedLocation(null)
  }

  const toggleRingVisibility = (ringId) => {
    setVisibleRings((current) =>
      current.includes(ringId)
        ? current.filter((id) => id !== ringId)
        : [...current, ringId]
    )
  }

  return (
    <main className="app-shell">
      <header className="panel top-header">
        <h1>Mapa de Vigilancia - Puerto Maldonado</h1>
        <p>
          Proyecto en modo edicion manual: haz clic en el mapa, agrega nombre y guarda.
        </p>
      </header>

      <section className="layout">
        <aside className="panel legend-panel">
          <h2>Agregar punto</h2>

          <section className="panel-block">
            <h3>1. Capas visibles</h3>
            <p className="helper-text">
              Activa solo las capas que deseas visualizar.
            </p>
            <ul className="layer-selector">
              {surveillanceRings.map((ring) => (
                <li key={ring.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={visibleRings.includes(ring.id)}
                      onChange={() => toggleRingVisibility(ring.id)}
                    />
                    <span className="layer-dot" style={{ backgroundColor: ring.color }} />
                    {ring.id}
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel-block">
            <h3>2. Datos del punto</h3>
            <p className="helper-text">
              Haz clic en el mapa para seleccionar coordenadas.
            </p>
            <label htmlFor="point-name">Nombre</label>
            <input
              id="point-name"
              value={pointName}
              onChange={(event) => setPointName(event.target.value)}
              placeholder="Ejemplo: Punto A - Mercado"
            />

            <label htmlFor="point-type">Capa</label>
            <select
              id="point-type"
              value={pointType}
              onChange={(event) => setPointType(event.target.value)}
            >
              <option>Capa 1</option>
              <option>Capa 2</option>
              <option>Capa 3</option>
              <option>Capa 4</option>
            </select>

            <p className="coordinates-preview">
              Coordenadas:{' '}
              <strong>
                {selectedLocation ? `${selectedLocation[0]}, ${selectedLocation[1]}` : 'Ninguna seleccionada'}
              </strong>
            </p>

            <div className="button-row">
              <button type="button" onClick={savePoint}>
                Guardar punto
              </button>
              <button type="button" className="secondary" onClick={clearAllPoints}>
                Limpiar todo
              </button>
            </div>
          </section>

          <section className="panel-block">
            <h3>3. Puntos guardados ({points.length})</h3>
            <p className="helper-text">
              Gestiona los puntos que agregaste manualmente.
            </p>
            <ul className="saved-points">
              {points.map((point) => (
                <li key={point.id}>
                  <div>
                    <strong>{point.name}</strong>
                    <p>
                      <span
                        className="type-dot"
                        style={{ backgroundColor: POINT_TYPE_COLORS[point.type] || '#6b7280' }}
                      />
                      {point.type}
                    </p>
                  </div>
                  <button type="button" className="danger" onClick={() => deletePoint(point.id)}>
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <article className="map-card">
          <MapContainer center={cityCenter} zoom={13} scrollWheelZoom className="map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {surveillanceRings
              .filter((ring) => visibleRings.includes(ring.id))
              .map((ring) => (
                <Circle
                  key={ring.id}
                  center={ring.center}
                  radius={ring.radius}
                  pathOptions={{ color: ring.color, fillOpacity: 0.08, weight: 2 }}
                >
                  <Popup>
                    <strong>{ring.id}</strong>
                    <br />
                    Radio: {ring.radius} m
                  </Popup>
                </Circle>
              ))}
            <AddPointOnMap onSelectLocation={setSelectedLocation} />
            {points.map((point) => (
              <Marker
                key={point.id}
                position={point.position}
                icon={pointTypeIcons[point.type] || pointTypeIcons['Capa 1']}
              >
                <Popup>
                  <strong>{point.name}</strong>
                  <br />
                  Capa: {point.type}
                  <br />
                  {point.position[0]}, {point.position[1]}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </article>
      </section>
    </main>
  )
}

export default App
