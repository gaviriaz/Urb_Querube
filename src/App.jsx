import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Map, SlidersHorizontal, Compass } from 'lucide-react';
import Map3D from './components/Map3D';
import AccessibilityControls from './components/AccessibilityControls';
import SearchStatsPanel from './components/SearchStatsPanel';
import LotDetails from './components/LotDetails';
import AdminPortal from './components/AdminPortal';
import { extractLotInfo } from './utils/lotUtils';

function App() {
  const map3dRef = useRef(null);

  /* ─ GeoJSON data ─ */
  const [loteoGeojson,   setLoteoGeojson]   = useState(null);
  const [manzanaGeojson, setManzanaGeojson] = useState(null);
  const [viasGeojson,    setViasGeojson]    = useState(null);
  const [predioGeojson,  setPredioGeojson]  = useState(null);
  const [cotasGeojson,   setCotasGeojson]   = useState(null);

  /* ─ UI state ─ */
  const [selectedLot,        setSelectedLot]        = useState(null);
  const [fontSize,            setFontSize]           = useState('normal');
  const [voiceEnabled,        setVoiceEnabled]       = useState(false);
  const [flightActive,        setFlightActive]       = useState(false);
  const [adminOpen,           setAdminOpen]          = useState(false);
  const [timeOfDay,           setTimeOfDay]          = useState('midday');
  const [viewMode,            setViewMode]           = useState('3d');
  const [environmentalLayer,  setEnvironmentalLayer] = useState('satellite');
  const [weather,             setWeather]            = useState('clear');
  const [searchCollapsed,     setSearchCollapsed]    = useState(false);
  const [accessCollapsed,     setAccessCollapsed]    = useState(true);
  const [cameraMode,          setCameraMode]         = useState('third');

  /* ─ Admin overrides (localStorage) ─ */
  const [adminOverrides, setAdminOverrides] = useState(() => {
    const saved = localStorage.getItem('admin_overrides');
    return saved ? JSON.parse(saved) : {};
  });

  /* ─ Load GeoJSON ─ */
  useEffect(() => {
    const load = async (file, setter) => {
      try {
        const res = await fetch(`/data/${file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setter(await res.json());
      } catch (e) {
        console.error(`GeoJSON load error [${file}]:`, e.message);
      }
    };
    load('loteo.geojson',   setLoteoGeojson);
    load('manzana.geojson', setManzanaGeojson);
    load('vias.geojson',    setViasGeojson);
    load('predio.geojson',  setPredioGeojson);
    load('cotas.geojson',   setCotasGeojson);
  }, []);

  /* ─ Deep linking on load ─ */
  useEffect(() => {
    if (!loteoGeojson) return;
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#lote=')) {
        const idStr = hash.replace('#lote=', '');
        const idNum = Number(idStr);
        const feat = loteoGeojson.features.find(f => {
          const info = extractLotInfo(f);
          return Number(info.id) === idNum || String(info.id) === idStr;
        });
        if (feat) {
          const info = extractLotInfo(feat);
          setTimeout(() => {
            handleSelectLot(info, false);
          }, 1000);
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [loteoGeojson]);

  /* ─ Admin handlers ─ */
  const handleSaveOverrides = (lotId, overrides) => {
    const updated = { ...adminOverrides, [lotId]: { ...adminOverrides[lotId], ...overrides } };
    setAdminOverrides(updated);
    localStorage.setItem('admin_overrides', JSON.stringify(updated));
    if (selectedLot?.id === lotId) setSelectedLot(prev => ({ ...prev, ...overrides }));
  };

  /* ─ Lot interaction ─ */
  const handleSelectLot = (lotData, isAutomated = false) => {
    setSelectedLot(prev => (prev?.id === lotData.id ? prev : lotData));
    if (!isAutomated && map3dRef.current && lotData.geomCoordinates)
      map3dRef.current.flyToLot(lotData.id, lotData.geomCoordinates, lotData.geometryType);
  };

  const handleNavigateToLot = (lotData, vehicleType) => {
    if (!map3dRef.current || !lotData?.geomCoordinates) return;
    setSelectedLot(lotData);
    const pts = [];
    const collect = (arr) => {
      if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number') { pts.push(arr); return; }
      if (Array.isArray(arr)) arr.forEach(collect);
    };
    collect(lotData.geomCoordinates);
    if (!pts.length) return;
    const centroid = [
      pts.reduce((s, p) => s + p[0], 0) / pts.length,
      pts.reduce((s, p) => s + p[1], 0) / pts.length,
    ];
    map3dRef.current.startRouteToLot(centroid, vehicleType || 'car');
  };

  const handleToggleFlight = () => {
    if (flightActive) { map3dRef.current?.stopStreetFlight();  setFlightActive(false); }
    else              { setSelectedLot(null); map3dRef.current?.startStreetFlight(); setFlightActive(true); }
  };

  /* ─ Controls panel left offset ─ */
  const ctrlLeft = searchCollapsed ? '80px' : '356px';

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>

      {/* ── 3D Map canvas — full screen background ── */}
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
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* ── Top Navbar ── */}
      <nav className="vr-navbar">
        {/* Brand */}
        <div className="vr-brand">
          <div className="vr-brand-mark">Q</div>
          <div>
            <div className="vr-brand-name">Querube</div>
            <div className="vr-brand-sub">Parcelación · San Pedro de Urabá</div>
          </div>
        </div>

        {/* Actions */}
        <div className="vr-navbar-actions">
          {/* Catalog toggle */}
          <button className="vr-nav-btn" onClick={() => setSearchCollapsed(s => !s)}>
            <Map size={13} />
            {searchCollapsed ? 'Catálogo' : 'Ocultar'}
          </button>

          {/* Controls toggle */}
          <button className="vr-nav-btn" onClick={() => setAccessCollapsed(s => !s)}>
            <SlidersHorizontal size={13} />
            {accessCollapsed ? 'Controles' : 'Ocultar'}
          </button>

          {/* Drone */}
          <button
            className={`vr-nav-btn ${flightActive ? 'gold' : ''}`}
            onClick={handleToggleFlight}
          >
            <Compass size={13} className={flightActive ? 'animate-spin' : ''} />
            {flightActive ? 'Detener Sobrevuelo' : 'Sobrevuelo 3D'}
          </button>

          {/* Admin — hidden behind double-click (Ctrl+A) */}
        </div>
      </nav>

      {/* ── Catalog Side Panel ── */}
      <AnimatePresence>
        {!searchCollapsed && (
          <SearchStatsPanel
            key="catalog"
            loteoGeojson={loteoGeojson}
            adminOverrides={adminOverrides}
            onSelectLot={handleSelectLot}
            onNavigateToLot={handleNavigateToLot}
            selectedLotId={selectedLot?.id || null}
            isCollapsed={false}
            setIsCollapsed={setSearchCollapsed}
          />
        )}
      </AnimatePresence>

      {/* ── Controls Panel ── */}
      <AnimatePresence>
        {!accessCollapsed && (
          <AccessibilityControls
            key="controls"
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
            isCollapsed={false}
            setIsCollapsed={setAccessCollapsed}
            leftPosition={ctrlLeft}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        )}
      </AnimatePresence>

      {/* Catalog collapsed FAB */}
      <AnimatePresence>
        {searchCollapsed && (
          <SearchStatsPanel
            key="catalog-fab"
            loteoGeojson={loteoGeojson}
            adminOverrides={adminOverrides}
            onSelectLot={handleSelectLot}
            onNavigateToLot={handleNavigateToLot}
            selectedLotId={selectedLot?.id || null}
            isCollapsed={true}
            setIsCollapsed={setSearchCollapsed}
          />
        )}
      </AnimatePresence>

      {/* ── Lot Detail Panel ── */}
      <AnimatePresence>
        {selectedLot && (
          <LotDetails
            key={selectedLot.id}
            lot={selectedLot}
            adminOverrides={adminOverrides}
            voiceEnabled={voiceEnabled}
            onClose={() => setSelectedLot(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Admin Portal ── */}
      <AnimatePresence>
        {adminOpen && (
          <AdminPortal
            key="admin"
            loteoGeojson={loteoGeojson}
            adminOverrides={adminOverrides}
            onSaveOverrides={handleSaveOverrides}
            onClose={() => setAdminOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Hidden admin opener — Ctrl+Shift+A ── */}
      <HiddenAdminTrigger onOpen={() => setAdminOpen(true)} />
    </div>
  );
}

/* Admin triggered by Ctrl+Shift+A — invisible to end users */
function HiddenAdminTrigger({ onOpen }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); onOpen(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
  return null;
}

export default App;
