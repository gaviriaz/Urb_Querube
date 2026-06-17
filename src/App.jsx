import React, { useState, useEffect, useRef } from 'react';
import Map3D from './components/Map3D';
import AccessibilityControls from './components/AccessibilityControls';
import SearchStatsPanel from './components/SearchStatsPanel';
import LotDetails from './components/LotDetails';
import AdminPortal from './components/AdminPortal';

function App() {
  const map3dRef = useRef(null);

  // GeoJSON data states
  const [loteoGeojson, setLoteoGeojson] = useState(null);
  const [manzanaGeojson, setManzanaGeojson] = useState(null);
  const [viasGeojson, setViasGeojson] = useState(null);
  const [predioGeojson, setPredioGeojson] = useState(null);
  const [cotasGeojson, setCotasGeojson] = useState(null);

  // Interactive UI states
  const [selectedLot, setSelectedLot] = useState(null);
  const [fontSize, setFontSize] = useState('normal');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [flightActive, setFlightActive] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('midday');

  // Siguiente level states
  const [environmentalLayer, setEnvironmentalLayer] = useState('satellite');
  const [weather, setWeather] = useState('clear');
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const [accessCollapsed, setAccessCollapsed] = useState(true);
  const [cameraMode, setCameraMode] = useState('third');

  // Admin overrides state (persisted in localStorage)
  const [adminOverrides, setAdminOverrides] = useState(() => {
    const saved = localStorage.getItem('admin_overrides');
    return saved ? JSON.parse(saved) : {};
  });

  // Load GeoJSON data from public folder on mount
  useEffect(() => {
    const loadGeojson = async (file, setter) => {
      try {
        const response = await fetch(`/data/${file}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setter(data);
      } catch (e) {
        console.error(`Error loading GeoJSON /data/${file}:`, e.message);
      }
    };

    loadGeojson('loteo.geojson', setLoteoGeojson);
    loadGeojson('manzana.geojson', setManzanaGeojson);
    loadGeojson('vias.geojson', setViasGeojson);
    loadGeojson('predio.geojson', setPredioGeojson);
    loadGeojson('cotas.geojson', setCotasGeojson);
  }, []);

  // Reload GeoJSON files with timestamp cache-buster to bypass browser/CDN caches
  const reloadGeojsons = async () => {
    const loadGeojson = async (file, setter) => {
      try {
        const response = await fetch(`/data/${file}?t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setter(data);
      } catch (e) {
        console.error(`Error reloading GeoJSON /data/${file}:`, e.message);
      }
    };

    await Promise.all([
      loadGeojson('loteo.geojson', setLoteoGeojson),
      loadGeojson('manzana.geojson', setManzanaGeojson),
      loadGeojson('vias.geojson', setViasGeojson),
      loadGeojson('predio.geojson', setPredioGeojson),
      loadGeojson('cotas.geojson', setCotasGeojson)
    ]);
  };

  // Save admin overrides to localStorage
  const handleSaveOverrides = (lotId, overrides) => {
    const updated = {
      ...adminOverrides,
      [lotId]: {
        ...adminOverrides[lotId],
        ...overrides
      }
    };
    setAdminOverrides(updated);
    localStorage.setItem('admin_overrides', JSON.stringify(updated));

    // Update current selected lot if we edited it, so the card changes immediately
    if (selectedLot && selectedLot.id === lotId) {
      setSelectedLot(prev => ({
        ...prev,
        ...overrides
      }));
    }
  };

  const handleSelectLot = (lotData, isAutomated = false) => {
    setSelectedLot((prev) => (prev?.id === lotData.id ? prev : lotData));
    if (!isAutomated && map3dRef.current && lotData.geomCoordinates) {
      map3dRef.current.flyToLot(lotData.id, lotData.geomCoordinates, lotData.geometryType);
    }
  };

  // Navigate to lot with animated vehicle route
  const handleNavigateToLot = (lotData, vehicleType) => {
    if (!map3dRef.current || !lotData) return;
    setSelectedLot(lotData);
    // Calculate centroid for the lot
    const coords = lotData.geomCoordinates;
    if (!coords) return;
    // Use the getCentroid from Map3D via the route animation
    // We pass the centroid as [lng, lat]
    const getCentroidSimple = (c) => {
      const pts = [];
      const collect = (arr) => {
        if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') { pts.push(arr); return; }
        if (Array.isArray(arr)) arr.forEach(collect);
      };
      collect(c);
      if (pts.length === 0) return null;
      return [pts.reduce((s,p) => s+p[0], 0)/pts.length, pts.reduce((s,p) => s+p[1], 0)/pts.length];
    };
    const centroid = getCentroidSimple(coords);
    if (centroid) {
      map3dRef.current.startRouteToLot(centroid, vehicleType || 'car');
    }
  };

  const handleToggleFlight = () => {
    if (flightActive) {
      map3dRef.current?.stopStreetFlight();
      setFlightActive(false);
    } else {
      setSelectedLot(null); // Close active lot card during fly tour
      map3dRef.current?.startStreetFlight();
      setFlightActive(true);
    }
  };

  // Calculate next-to-next panel offsets
  const accessLeft = searchCollapsed ? '88px' : '360px';

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      {/* 3D Map canvas background */}
      <Map3D 
        ref={map3dRef}
        onSelectLot={handleSelectLot}
        selectedLotId={selectedLot?.id || null}
        adminOverrides={adminOverrides}
        loteoGeojson={loteoGeojson}
        manzanaGeojson={manzanaGeojson}
        viasGeojson={viasGeojson}
        predioGeojson={predioGeojson}
        cotasGeojson={cotasGeojson}
        voiceEnabled={voiceEnabled}
        timeOfDay={timeOfDay}
        environmentalLayer={environmentalLayer}
        cameraMode={cameraMode}
        setCameraMode={setCameraMode}
      />

      {/* Search, Filter & Stats panel */}
      <SearchStatsPanel 
        loteoGeojson={loteoGeojson}
        adminOverrides={adminOverrides}
        onSelectLot={handleSelectLot}
        onNavigateToLot={handleNavigateToLot}
        selectedLotId={selectedLot?.id || null}
        isCollapsed={searchCollapsed}
        setIsCollapsed={setSearchCollapsed}
      />

      {/* Senior-friendly floating Accessibility Dashboard */}
      <AccessibilityControls 
        mapRef={map3dRef}
        fontSize={fontSize}
        setFontSize={setFontSize}
        voiceEnabled={voiceEnabled}
        setVoiceEnabled={setVoiceEnabled}
        flightActive={flightActive}
        toggleFlight={handleToggleFlight}
        timeOfDay={timeOfDay}
        setTimeOfDay={setTimeOfDay}
        environmentalLayer={environmentalLayer}
        setEnvironmentalLayer={setEnvironmentalLayer}
        weather={weather}
        setWeather={setWeather}
        cameraMode={cameraMode}
        setCameraMode={setCameraMode}
        isCollapsed={accessCollapsed}
        setIsCollapsed={setAccessCollapsed}
        leftPosition={accessLeft}
      />

      {/* Lot metrics details sidebar */}
      {selectedLot && (
        <LotDetails 
          lot={selectedLot}
          adminOverrides={adminOverrides}
          voiceEnabled={voiceEnabled}
          onClose={() => setSelectedLot(null)}
        />
      )}

      {/* Admin Portal Overlay */}
      {adminOpen && (
        <AdminPortal 
          loteoGeojson={loteoGeojson}
          adminOverrides={adminOverrides}
          onSaveOverrides={handleSaveOverrides}
          onClose={() => setAdminOpen(false)}
        />
      )}

      {/* Top Right Admin Access & Refresh SIG Buttons */}
      <div style={{
        position: 'absolute',
        top: '24px',
        right: '24px',
        zIndex: 5,
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={reloadGeojsons}
          className="glass-panel glass-panel-interactive"
          style={{
            padding: '12px 20px',
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: '12px',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🔄 Refrescar Capas SIG (QGIS)
        </button>
        <button
          onClick={() => setAdminOpen(true)}
          className="glass-panel glass-panel-interactive"
          style={{
            padding: '12px 20px',
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: '12px',
            color: 'var(--accent-gold)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ⚙️ Modificar Lotes (Admin)
        </button>
      </div>

      {/* Ambient local audio player instructions */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        borderRadius: '12px',
        backgroundColor: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <span>📢 Zona: Rural - San Pedro de Urabá</span>
      </div>

    </div>
  );
}

export default App;
