import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, SlidersHorizontal, Compass, X, Film } from 'lucide-react';
import LotComparator from './components/LotComparator';
import Map3D from './components/Map3D';
import { useWebSocket } from './hooks/useWebSocket';
import AccessibilityControls from './components/AccessibilityControls';
import SearchStatsPanel from './components/SearchStatsPanel';
import LotDetails from './components/LotDetails';
import AdminPortal from './components/AdminPortal';
import CookieBanner from './components/CookieBanner';
import WelcomeOverlay from './components/WelcomeOverlay';
import HeroLanding from './components/HeroLanding';
import VideoExportPanel from './components/VideoExportPanel';
import QuerubeLogo from './components/QuerubeLogo';
import { extractLotInfo } from './utils/lotUtils';
import { ErrorBoundary, detectWebGLContext, WebGLFallbackScreen } from './components/ErrorBoundary';
import { playBrandTone, playTourStart, playPanelClose, enableOnInteraction, setMuted as setBrandMuted } from './utils/brandAudio';

function App() {
  const map3dRef = useRef(null);

  // Generate a unique anonymous session ID for tracing leads/flight metrics
  const [sessionId] = useState(() => {
    let sId = sessionStorage.getItem('querube_session_id');
    if (!sId) {
      sId = Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      sessionStorage.setItem('querube_session_id', sId);
    }
    return sId;
  });

  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    if (!detectWebGLContext()) {
      setWebglSupported(false);
    }
  }, []);

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
  const [flightMode,          setFlightMode]         = useState('full'); // 'full' or 'short'
  const [showFlightCTA,       setShowFlightCTA]       = useState(false);
  const [catalogSearch,       setCatalogSearch]       = useState('');
  const [compareList,         setCompareList]         = useState([]);
  const [lotClicks,           setLotClicks]           = useState({});
  const [videoPanelOpen,      setVideoPanelOpen]      = useState(false);
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);

  useEffect(() => {
    const fetchClicks = async () => {
      try {
        const res = await fetch('/api/clicks');
        if (res.ok) {
          const data = await res.json();
          setLotClicks(data);
        }
      } catch (e) {
        console.warn("No se pudo cargar clicks:", e);
      }
    };
    fetchClicks();
    const interval = setInterval(fetchClicks, 30000);
    return () => clearInterval(interval);
  }, []);
  const [showComparator,      setShowComparator]      = useState(false);

  const handleCompareLot = (lotData) => {
    setCompareList(prev => {
      const exists = prev.some(l => l.id === lotData.id);
      if (exists) {
        return prev.filter(l => l.id !== lotData.id);
      }
      if (prev.length >= 2) {
        return [prev[0], lotData];
      }
      return [...prev, lotData];
    });
  };
  const [catalogStatus,       setCatalogStatus]       = useState('Todos');
  const [catalogArea,         setCatalogArea]         = useState('Todos');
  const [adminOpen,           setAdminOpen]          = useState(false);
  const [timeOfDay,           setTimeOfDay]          = useState('midday');
  const [viewMode,            setViewMode]           = useState('3d');
  const [environmentalLayer,  setEnvironmentalLayer] = useState('satellite');
  const [weather,             setWeather]            = useState('clear');
  const [searchCollapsed,     setSearchCollapsed]    = useState(false);
  const [accessCollapsed,     setAccessCollapsed]    = useState(true);
  const [cameraMode,          setCameraMode]         = useState('third');
  const [loadProgress,        setLoadProgress]       = useState(0);
  const [showHeroLanding,     setShowHeroLanding]    = useState(() => {
    // Skip hero on deep links or returning sessions (within 10 min)
    if (window.location.hash && window.location.hash.startsWith('#lote=')) return false;
    const lastVisit = sessionStorage.getItem('querube_hero_dismissed');
    if (lastVisit && (Date.now() - Number(lastVisit)) < 600000) return false;
    return true;
  });
  const [performanceMode,     setPerformanceMode]    = useState(() => {
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    return (isMobile || lowCores) ? 'low' : 'high';
  });

  /* ─ Admin overrides (API with localStorage fallback cache) ─ */
  const [adminOverrides, setAdminOverrides] = useState({});
  const { loteEstadoActualizado } = useWebSocket();

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
  }, []);

  // Listen to real-time status updates via WebSockets
  useEffect(() => {
    if (loteEstadoActualizado) {
      const { loteId, estado } = loteEstadoActualizado;
      const uiStatus = estado === 'DISPONIBLE' ? 'Disponible' : estado === 'RESERVADO' ? 'Reservado' : 'Vendido';
      setAdminOverrides(prev => ({
        ...prev,
        [loteId]: {
          ...prev[loteId],
          status: uiStatus
        }
      }));
      console.log(`[WebSocket] Lote ${loteId} actualizado a: ${uiStatus}`);
    }
  }, [loteEstadoActualizado]);

  /* ─ Sync body data-time for CSS themes ─ */
  useEffect(() => {
    document.body.setAttribute('data-time', timeOfDay);
    return () => document.body.removeAttribute('data-time');
  }, [timeOfDay]);

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
    if (!isAutomated && map3dRef.current && lotData.geomCoordinates) {
      map3dRef.current.flyToLot(lotData.id, lotData.geomCoordinates, lotData.geometryType);
      
      // Register click in DB to feed click heatmap in real-time
      fetch(`/api/clicks/${lotData.id}`, { method: 'POST' })
        .then(() => {
          setLotClicks(prev => ({ ...prev, [lotData.id]: (prev[lotData.id] || 0) + 1 }));
        })
        .catch(err => console.error("Error logging click:", err));
    }
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
    if (flightActive) {
      map3dRef.current?.stopStreetFlight();
      setFlightActive(false);
    } else {
      setShowFlightCTA(false);
      setSelectedLot(null);
      map3dRef.current?.startStreetFlight();
      setFlightActive(true);
      playTourStart();
    }
  };

  /* ─ Controls panel left offset ─ */
  const ctrlLeft = searchCollapsed ? '80px' : '356px';

  if (!webglSupported) {
    return <WebGLFallbackScreen />;
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>

      {/* ── 3D Map canvas — full screen background ── */}
      <ErrorBoundary>
        <Map3D
          ref={map3dRef}
          onSelectLot={handleSelectLot}
          selectedLotId={selectedLot?.id || null}
          adminOverrides={adminOverrides}
          lotClicks={lotClicks}
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
          sessionId={sessionId}
          flightMode={flightMode}
          onFlightComplete={() => {
            setFlightActive(false);
            setCatalogStatus('Disponible');
            setCatalogArea('Grande');
            setCatalogSearch('');
            setSearchCollapsed(false);
            setShowFlightCTA(true);
          }}
        />
      </ErrorBoundary>

      {/* ── Top Navbar ── */}
      {!isPreparingRecording && (
        <nav className="vr-navbar">
          {/* Brand */}
          <div className="vr-brand">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
              borderRadius: 6, width: 34, height: 34
            }}>
              <QuerubeLogo width={22} height={22} />
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

            {/* Video export toggle */}
            <button className="vr-nav-btn" onClick={() => setVideoPanelOpen(s => !s)}>
              <Film size={13} />
              <span>Generar Video</span>
            </button>

            {/* Drone */}
            {flightActive ? (
              <button
                className="vr-nav-btn gold"
                onClick={handleToggleFlight}
              >
                <Compass size={13} className="animate-spin" />
                Detener ({flightMode === 'short' ? 'Rápido' : 'Completo'})
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  className="vr-nav-btn"
                  onClick={handleToggleFlight}
                  style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Compass size={13} />
                  Sobrevuelo {flightMode === 'short' ? 'Rápido' : 'Completo'}
                </button>
                <button
                  className="vr-nav-btn"
                  onClick={() => setFlightMode(m => m === 'full' ? 'short' : 'full')}
                  style={{
                    borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
                    paddingLeft: 10, paddingRight: 10,
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    color: 'var(--gold-400)',
                    backgroundColor: 'rgba(212,168,67,0.05)',
                    borderLeft: 'none'
                  }}
                  title="Cambiar a recorrido rápido (30s) / completo (2m)"
                >
                  {flightMode === 'full' ? '⚡ RÁPIDO' : '⏳ COMPLETO'}
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* ── Catalog Side Panel ── */}
      <AnimatePresence>
        {!isPreparingRecording && !searchCollapsed && (
          <SearchStatsPanel
            key="catalog"
            loteoGeojson={loteoGeojson}
            adminOverrides={adminOverrides}
            onSelectLot={handleSelectLot}
            onNavigateToLot={handleNavigateToLot}
            selectedLotId={selectedLot?.id || null}
            isCollapsed={false}
            setIsCollapsed={setSearchCollapsed}
            searchTerm={catalogSearch}
            setSearchTerm={setCatalogSearch}
            statusFilter={catalogStatus}
            setStatusFilter={setCatalogStatus}
            areaFilter={catalogArea}
            setAreaFilter={setCatalogArea}
          />
        )}
      </AnimatePresence>

      {/* ── Controls Panel ── */}
      <AnimatePresence>
        {!isPreparingRecording && !accessCollapsed && (
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
        {!isPreparingRecording && searchCollapsed && (
          <SearchStatsPanel
            key="catalog-fab"
            loteoGeojson={loteoGeojson}
            adminOverrides={adminOverrides}
            onSelectLot={handleSelectLot}
            onNavigateToLot={handleNavigateToLot}
            selectedLotId={selectedLot?.id || null}
            isCollapsed={true}
            setIsCollapsed={setSearchCollapsed}
            searchTerm={catalogSearch}
            setSearchTerm={setCatalogSearch}
            statusFilter={catalogStatus}
            setStatusFilter={setCatalogStatus}
            areaFilter={catalogArea}
            setAreaFilter={setCatalogArea}
          />
        )}
      </AnimatePresence>

      {/* ── Lot Detail Panel ── */}
      <AnimatePresence>
        {!isPreparingRecording && selectedLot && (
          <LotDetails
            key={selectedLot.id}
            lot={selectedLot}
            adminOverrides={adminOverrides}
            voiceEnabled={voiceEnabled}
            sessionId={sessionId}
            onClose={() => { playPanelClose(); setSelectedLot(null); }}
            onCompare={handleCompareLot}
            compareList={compareList}
          />
        )}
      </AnimatePresence>

      {/* ── Floating Compare Bar ── */}
      <AnimatePresence>
        {!isPreparingRecording && compareList.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 80, opacity: 0, x: '-50%' }}
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              zIndex: 9999,
              background: 'rgba(10, 16, 9, 0.92)',
              border: '1px solid var(--gold-400)',
              borderRadius: '30px',
              padding: '8px 24px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              color: '#fff',
              fontSize: '0.82rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--gold-400)', fontWeight: 'bold' }}>Comparar:</span>
              <span>{compareList.length} {compareList.length === 1 ? 'lote' : 'lotes'}</span>
            </div>
            
            <div style={{ display: 'flex', gap: 6 }}>
              {compareList.map(l => (
                <div
                  key={l.id}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.75rem'
                  }}
                >
                  <span>Lote {l.id}</span>
                  <button
                    onClick={() => handleCompareLot(l)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
            
            {compareList.length === 2 && (
              <button
                onClick={() => {
                  setShowComparator(true);
                  if (window.trackEvent) {
                    window.trackEvent('comparison_viewed', { lots: compareList.map(l => l.id) });
                  }
                }}
                className="drone-btn"
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  background: 'var(--gold-400)',
                  color: '#020617',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.78rem'
                }}
              >
                Comparar Ahora
              </button>
            )}
            
            <button
              onClick={() => setCompareList([])}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-400)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              Limpiar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lot Comparator Modal ── */}
      <AnimatePresence>
        {!isPreparingRecording && showComparator && (
          <LotComparator
            lots={compareList}
            adminOverrides={adminOverrides}
            onClose={() => setShowComparator(false)}
            onSelectLot={(lot) => {
              setShowComparator(false);
              handleSelectLot(lot);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Admin Portal ── */}
      <AnimatePresence>
        {!isPreparingRecording && adminOpen && (
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

      {/* ── Peak-End Flight CTA Modal ── */}
      <AnimatePresence>
        {showFlightCTA && (
          <motion.div
            className="admin-login-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(3, 7, 4, 0.82)',
              zIndex: 10000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              className="glass-panel"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                width: '100%',
                maxWidth: '460px',
                padding: '30px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                borderRadius: '8px',
                textAlign: 'center'
              }}
            >
              <div>
                <div style={{
                  margin: '0 auto 16px auto',
                  width: 50, height: 50, borderRadius: '50%',
                  background: 'rgba(199, 168, 109, 0.08)',
                  border: '1px solid rgba(199, 168, 109, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <QuerubeLogo width={28} height={28} />
                </div>
                <h2 style={{ fontSize: '1.45rem', color: 'var(--gold-300)', marginBottom: '8px', fontFamily: 'var(--font-header)' }}>
                  ¿Te gustó el recorrido?
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-200)', lineHeight: '1.4' }}>
                  Hable con un asesor de ventas de Querube ahora para recibir información catastral personalizada o coordinar una visita.
                </p>
              </div>

              <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)', margin: 0 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => {
                    // Trigger lead metrics log
                    fetch('/api/leads', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ lot_id: 'flight_cta', session_id: sessionId })
                    }).catch(err => console.error("Error logging flight CTA lead:", err));

                    const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "573123456789";
                    const message = `Hola, acabo de terminar el sobrevuelo virtual en 3D de Querube. Me gustaría recibir asesoría sobre la disponibilidad de lotes y las facilidades de financiación.`;
                    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
                    setShowFlightCTA(false);
                  }}
                  className="glass-panel-interactive"
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--gold-500, #d4a843)',
                    color: '#020617',
                    fontWeight: 'bold',
                    fontSize: '0.88rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  Hablar con un Asesor
                </button>

                <button
                  onClick={() => {
                    setCatalogStatus('Disponible');
                    setCatalogArea('Grande'); // Show Available featured lots
                    setCatalogSearch('');
                    setSearchCollapsed(false);
                    setShowFlightCTA(false);
                  }}
                  className="glass-panel-interactive"
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-100)',
                    fontSize: '0.88rem',
                    fontWeight: 600
                  }}
                >
                  Explorar Lotes Disponibles
                </button>

                <button
                  onClick={() => setShowFlightCTA(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-400)',
                    fontSize: '0.78rem',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  Volver al mapa interactivo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cookie Consent Banner */}
      <CookieBanner />

      {/* ── Video Export Panel ── */}
      <AnimatePresence>
        {videoPanelOpen && (
          <VideoExportPanel
            mapRef={map3dRef}
            loteoGeojson={loteoGeojson}
            selectedLotId={selectedLot?.id || null}
            onClose={() => setVideoPanelOpen(false)}
            onPrepareRecording={setIsPreparingRecording}
          />
        )}
      </AnimatePresence>

      {/* Welcome Intro Overlay (only if hero is NOT showing) */}
      {!showHeroLanding && <WelcomeOverlay />}

      {/* Hero Landing Page — first visit immersive overlay */}
      <AnimatePresence>
        {showHeroLanding && loadProgress >= 5 && (
          <HeroLanding
            key="hero-landing"
            onEnterExplorer={() => {
              setShowHeroLanding(false);
              sessionStorage.setItem('querube_hero_dismissed', String(Date.now()));
              // Enable brand audio on user interaction
              enableOnInteraction();
              playBrandTone();
              // Open the catalog to guide the user
              setSearchCollapsed(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Cartographic Progress Loader */}
      {loadProgress < 5 && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
          background: '#020617', zIndex: 99999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20
        }}>
          <div style={{ animation: 'pulse 1.5s infinite alternate' }}>
            <QuerubeLogo width={60} height={60} />
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
