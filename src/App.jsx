import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Map, SlidersHorizontal, Compass } from 'lucide-react';
import Map3D from './components/Map3D';
import AccessibilityControls from './components/AccessibilityControls';
import SearchStatsPanel from './components/SearchStatsPanel';
import LotDetails from './components/LotDetails';
import AdminPortal from './components/AdminPortal';
import CookieBanner from './components/CookieBanner';
import WelcomeOverlay from './components/WelcomeOverlay';
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
  const [loadProgress,        setLoadProgress]       = useState(0);
  const [performanceMode,     setPerformanceMode]    = useState(() => {
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    return (isMobile || lowCores) ? 'low' : 'high';
  });

  /* ─ Admin overrides (API with localStorage fallback cache) ─ */
  const [adminOverrides, setAdminOverrides] = useState({});

  useEffect(() => {
    const fetchOverrides = async () => {
      try {
        const res = await fetch('/api/overrides');
        if (res.ok) {
          const data = await res.json();
          setAdminOverrides(data);
          localStorage.setItem('admin_overrides_cache', JSON.stringify(data));
        }
      } catch (e) {
        console.warn("No se pudo conectar a la API de overrides, usando caché local:", e);
        const cached = localStorage.getItem('admin_overrides_cache');
        if (cached) setAdminOverrides(JSON.parse(cached));
      }
    };
    fetchOverrides();
    const interval = setInterval(fetchOverrides, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ─ Load GeoJSON ─ */
  useEffect(() => {
    let loaded = 0;
    const load = async (file, setter) => {
      try {
        const res = await fetch(`/data/${file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setter(data);
      } catch (e) {
        console.error(`GeoJSON load error [${file}]:`, e.message);
      } finally {
        loaded++;
        setLoadProgress(loaded);
      }
    };
    Promise.all([
      load('loteo.geojson',   setLoteoGeojson),
      load('manzana.geojson', setManzanaGeojson),
      load('vias.geojson',    setViasGeojson),
      load('predio.geojson',  setPredioGeojson),
      load('cotas.geojson',   setCotasGeojson),
    ]);
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
    localStorage.setItem('admin_overrides_cache', JSON.stringify(updated));
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
        performanceMode={performanceMode}
      />

      {/* ── Top Navbar ── */}
      <nav className="vr-navbar">
        {/* Brand */}
        <div className="vr-brand">
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
            borderRadius: 6, width: 34, height: 34
          }}>
            <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="46" cy="44" r="30" stroke="var(--gold-400, #d4a843)" strokeWidth="9" />
              <path d="M68 66 L88 86" stroke="var(--gold-400, #d4a843)" strokeWidth="12" strokeLinecap="round" />
              <path d="M46 25 C46 25 54 33 54 44 C54 55 46 63 46 63 C46 63 38 55 38 44 C38 33 46 25 46 25 Z" fill="var(--gold-400, #d4a843)" opacity="0.95" />
            </svg>
          </div>
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
            performanceMode={performanceMode}
            setPerformanceMode={setPerformanceMode}
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

      {/* Cookie Consent Banner */}
      <CookieBanner />

      {/* Welcome Intro Overlay */}
      <WelcomeOverlay />

      {/* Cartographic Progress Loader */}
      {loadProgress < 5 && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
          background: '#020617', zIndex: 99999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20
        }}>
          <div style={{ animation: 'pulse 1.5s infinite alternate' }}>
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="46" cy="44" r="30" stroke="var(--gold-400, #d4a843)" strokeWidth="9" />
              <path d="M68 66 L88 86" stroke="var(--gold-400, #d4a843)" strokeWidth="12" strokeLinecap="round" />
              <path d="M46 25 C46 25 54 33 54 44 C54 55 46 63 46 63 C46 63 38 55 38 44 C38 33 46 25 46 25 Z" fill="var(--gold-400, #d4a843)" opacity="0.95" />
            </svg>
          </div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-header)', color: 'var(--text-100)' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-300)', letterSpacing: '0.04em' }}>Querube 3D</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', marginTop: 6 }}>
              Cargando cartografía y datos SIG ({Math.round(loadProgress / 5 * 100)}%)
            </div>
          </div>
          <div style={{ width: 180, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${loadProgress / 5 * 100}%`, height: '100%', background: 'var(--gold-400, #d4a843)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}
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
