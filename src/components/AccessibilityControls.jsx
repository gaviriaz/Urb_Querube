import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ambientAudio } from '../utils/ambientAudio';
import {
  Layers, Compass, User, Volume2, VolumeX, Sun, CloudRain,
  ZoomIn, ZoomOut, RotateCcw, RotateCw, MapPin, Info,
  Settings, ChevronRight, ChevronLeft, Leaf, Droplets, TrendingUp
} from 'lucide-react';

const PANEL_SPRING = { type: 'spring', stiffness: 380, damping: 36 };

const Tab = ({ id, label, icon, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    style={{
      flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none',
      background: active ? 'rgba(212,168,67,0.15)' : 'transparent',
      color: active ? 'var(--gold-300)' : 'var(--text-400)',
      fontWeight: active ? 700 : 500,
      fontSize: '0.68rem', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      transition: 'all 0.2s ease',
      borderBottom: active ? '2px solid var(--gold-400)' : '2px solid transparent',
    }}
  >
    {icon}{label}
  </button>
);

const SectionTitle = ({ icon, children }) => (
  <div className="controls-section-title">
    {icon && <span>{icon}</span>}
    {children}
  </div>
);

const AccessibilityControls = ({
  mapRef, fontSize, setFontSize,
  voiceEnabled, setVoiceEnabled,
  flightActive, toggleFlight,
  timeOfDay, setTimeOfDay,
  environmentalLayer, setEnvironmentalLayer,
  weather, setWeather,
  cameraMode, setCameraMode,
  isCollapsed, setIsCollapsed,
  leftPosition = '360px',
  viewMode, setViewMode,
}) => {
  const [activeTab,    setActiveTab]    = useState('camera');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundVolume,  setSoundVolume]  = useState(0.4);

  const handleFontChange = (s) => {
    setFontSize(s);
    document.body.classList.remove('font-large', 'font-extra-large');
    if (s === 'large')  document.body.classList.add('font-large');
    if (s === 'xlarge') document.body.classList.add('font-extra-large');
  };

  useEffect(() => {
    if (soundEnabled) {
      ambientAudio.init(); ambientAudio.resume();
      ambientAudio.setMute(false); ambientAudio.setVolume(soundVolume);
      ambientAudio.setWeather(weather); ambientAudio.setTimeOfDay(timeOfDay);
    } else {
      ambientAudio.setMute(true);
    }
  }, [soundEnabled, soundVolume, weather, timeOfDay]);

  useEffect(() => () => ambientAudio.destroy(), []);

  const handleToggleSound = () => {
    if (!soundEnabled) { ambientAudio.init(); ambientAudio.resume(); }
    setSoundEnabled(s => !s);
  };

  /* ─ Collapsed FAB ─ */
  if (isCollapsed) {
    return (
      <motion.button
        className="fab animate-float"
        style={{ position: 'absolute', top: '50%', left: leftPosition, zIndex: 20, transform: 'translateY(-50%)' }}
        onClick={() => setIsCollapsed(false)}
        title="Controles"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={PANEL_SPRING}
      >
        <Settings size={19} />
      </motion.button>
    );
  }

  return (
    <motion.div
      className="controls-panel custom-scrollbar"
      style={{ left: leftPosition }}
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0,  opacity: 1 }}
      exit={{    x: 20, opacity: 0 }}
      transition={PANEL_SPRING}
    >
      {/* Header */}
      <div className="controls-section" style={{ paddingBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-100)', fontFamily: 'var(--font-header)' }}>
              Control Visor
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Querube · San Pedro de Urabá
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-400)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--glass-border)',
          gap: 0, marginBottom: -1,
        }}>
          <Tab id="camera" label="Cámara" icon={<Compass size={12}/>} active={activeTab==='camera'} onClick={setActiveTab}/>
          <Tab id="capas"  label="Capas"  icon={<Layers size={12}/>}  active={activeTab==='capas'}  onClick={setActiveTab}/>
          <Tab id="guia"   label="Guía"   icon={<User size={12}/>}    active={activeTab==='guia'}   onClick={setActiveTab}/>
        </div>
      </div>

      {/* ── TAB: Cámara ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'camera' && (
          <motion.div key="cam"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* 2D/3D toggle */}
            <div className="controls-section">
              <SectionTitle>Modo de Visualización</SectionTitle>
              <div className="view-toggle">
                {[{ id:'2d', lbl:'2D Catastral' },{ id:'3d', lbl:'3D Maqueta' }].map(m => (
                  <button key={m.id} className={`view-toggle-btn ${viewMode===m.id?'active':''}`}
                    onClick={() => setViewMode?.(m.id)}>{m.lbl}</button>
                ))}
              </div>
            </div>

            {/* Drone flight */}
            <div className="controls-section">
              <SectionTitle icon={<Compass size={11}/>}>Sobrevuelo Cinemático</SectionTitle>
              <motion.button
                className={`drone-btn ${flightActive ? 'active' : ''}`}
                onClick={toggleFlight}
                whileTap={{ scale: 0.97 }}
              >
                <Compass size={14} className={flightActive ? 'animate-spin' : ''}/>
                {flightActive ? 'Detener Sobrevuelo' : 'Iniciar Sobrevuelo'}
              </motion.button>
            </div>

            {/* Camera perspective */}
            <div className="controls-section">
              <SectionTitle>Perspectiva de Cámara</SectionTitle>
              <div className="controls-btn-grid">
                {[
                  { id:'first',  lbl:'1ª Persona', sub:'Inmersiva'  },
                  { id:'second', lbl:'2ª Persona', sub:'Cercana'    },
                  { id:'third',  lbl:'3ª Persona', sub:'Seguimiento'},
                  { id:'fourth', lbl:'4ª Persona', sub:'Orbital'    },
                ].map(({ id, lbl, sub }) => (
                  <button key={id}
                    className={`ctrl-chip ${cameraMode===id?'active':''}`}
                    onClick={() => setCameraMode?.(id)}
                  >
                    <span style={{ fontWeight: 800, fontSize: '0.78rem' }}>{lbl}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-400)' }}>{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual nav */}
            <div className="controls-section">
              <SectionTitle>Navegación Manual</SectionTitle>
              <div className="manual-nav-grid">
                <button className="mnav-btn" onClick={() => mapRef.current?.zoomIn()}>
                  <ZoomIn size={13}/> Acercar
                </button>
                <button className="mnav-btn" onClick={() => mapRef.current?.zoomOut()}>
                  <ZoomOut size={13}/> Alejar
                </button>
                <button className="mnav-btn" onClick={() => mapRef.current?.rotateLeft()}>
                  <RotateCcw size={13}/> Girar ←
                </button>
                <button className="mnav-btn" onClick={() => mapRef.current?.rotateRight()}>
                  <RotateCw size={13}/> Girar →
                </button>
              </div>
              <button className="center-btn" onClick={() => mapRef.current?.resetView()}>
                <MapPin size={14}/> Centrar Vista al Proyecto
              </button>
            </div>
          </motion.div>
        )}

        {/* ── TAB: Capas ──────────────────────────────────────── */}
        {activeTab === 'capas' && (
          <motion.div key="cap"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Env layers */}
            <div className="controls-section">
              <SectionTitle icon={<Layers size={11}/>}>Capas de Análisis Ambiental</SectionTitle>
              <div className="layer-grid">
                {[
                  { id:'satellite', icon: <Layers size={14} />, sub:'Vista Satelital'  },
                  { id:'ndvi',      icon: <Leaf size={14} />, sub:'Pureza de Aire'},
                  { id:'slope',     icon: <TrendingUp size={14} />, sub:'Mirador y Altura'},
                  { id:'moisture',  icon: <Droplets size={14} />, sub:'Frescura Térmica'   },
                ].map(({ id, icon, sub }) => (
                  <button key={id}
                    className={`layer-btn ${environmentalLayer===id?'active':''}`}
                    onClick={() => setEnvironmentalLayer(id)}
                  >
                    <span style={{ color: environmentalLayer===id ? 'var(--gold-300)' : 'var(--text-400)', display: 'flex', alignItems: 'center', height: 20 }}>
                      {icon}
                    </span>
                    <span style={{ fontSize: '0.66rem' }}>{sub}</span>
                  </button>
                ))}
              </div>

              {/* Legend */}
              <AnimatePresence>
                {environmentalLayer !== 'satellite' && (
                  <motion.div
                    className="legend-strip"
                    style={{ marginTop: 10, borderRadius: 8, border: '1px solid var(--glass-border)' }}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="legend-gradient" style={{
                      background: environmentalLayer==='ndvi'     ? 'linear-gradient(90deg,#fde047,#84cc16,#15803d)' :
                                  environmentalLayer==='slope'    ? 'linear-gradient(90deg,#22c55e,#eab308,#ef4444)' :
                                                                   'linear-gradient(90deg,#7c2d12,#84cc16,#0284c7)',
                    }}/>
                    <div className="legend-labels">
                      <span>{ environmentalLayer==='ndvi' ? 'Bajo Follaje' : environmentalLayer==='slope' ? 'Acceso Plano (0-5%)' : 'Suelo Firme/Seco' }</span>
                      <span>{ environmentalLayer==='ndvi' ? 'Aire Puro/Bosque' : environmentalLayer==='slope' ? 'Mirador Visual (25%+)' : 'Fresco/Zona Hídrica' }</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Time of day */}
            <div className="controls-section">
              <SectionTitle icon={<Sun size={11}/>}>Hora del Día (Sol 4D)</SectionTitle>
              <select
                className="time-select"
                value={timeOfDay}
                onChange={e => setTimeOfDay(e.target.value)}
              >
                <option value="sunrise">Amanecer</option>
                <option value="midday">Mediodía</option>
                <option value="sunset">Atardecer</option>
                <option value="night">Noche</option>
              </select>
            </div>

            {/* Weather */}
            <div className="controls-section">
              <SectionTitle>Clima Dinámico</SectionTitle>
              <div className="view-toggle">
                <button className={`view-toggle-btn ${weather==='clear'?'active':''}`}
                  onClick={() => setWeather('clear')}>
                  <Sun size={14}/> Despejado
                </button>
                <button className={`view-toggle-btn ${weather==='rain'?'active':''}`}
                  onClick={() => setWeather('rain')}>
                  <CloudRain size={14}/> Lluvia
                </button>
              </div>
            </div>

            {/* Ambient audio */}
            <div className="controls-section">
              <SectionTitle icon={<Volume2 size={11}/>}>Sonido Ambiental</SectionTitle>
              <div className="sound-row">
                <button className={`sound-btn ${soundEnabled?'on':''}`} onClick={handleToggleSound}>
                  {soundEnabled ? <Volume2 size={14}/> : <VolumeX size={14}/>}
                  {soundEnabled ? 'Activo' : 'Silencio'}
                </button>
                {soundEnabled && (
                  <input type="range" className="vol-slider" min="0" max="1" step="0.05"
                    value={soundVolume} onChange={e => setSoundVolume(parseFloat(e.target.value))}/>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB: Guía ──────────────────────────────────────── */}
        {activeTab === 'guia' && (
          <motion.div key="gui"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="controls-section">
              <SectionTitle>Tamaño de Texto</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
                {[
                  { id:'normal', s:'13px', lbl:'A'   },
                  { id:'large',  s:'16px', lbl:'A+'  },
                  { id:'xlarge', s:'20px', lbl:'A++' },
                ].map(item => (
                  <button key={item.id}
                    className={`font-chip ${fontSize===item.id?'active':''}`}
                    style={{ fontSize: item.s }}
                    onClick={() => handleFontChange(item.id)}
                  >{item.lbl}</button>
                ))}
              </div>
            </div>

            <div className="controls-section">
              <div className="guide-card">
                <Info size={18} style={{ color: 'var(--gold-400)', flexShrink: 0, marginTop: 2 }}/>
                <div>
                  <strong>Guía Rápida</strong>
                  <p>Seleccione un lote en el panel izquierdo o toque directamente el mapa para ver la ficha catastral. Use el botón de Dron para sobrevolar la parcelación, o elija un modo de recorrido vehicular para transitar las vías internas.</p>
                </div>
              </div>
            </div>

            <div className="controls-section" style={{ borderBottom: 'none' }}>
              <div style={{
                padding: '10px 12px', borderRadius: 10,
                background: 'rgba(62,207,142,0.06)',
                border: '1px solid rgba(62,207,142,0.15)',
                fontSize: '0.72rem', color: 'var(--text-400)', lineHeight: 1.6,
              }}>
                <strong style={{ color: 'var(--status-available)' }}>Tip:</strong> En el mapa, arrastra para rotar, desplaza para moverse, y usa la rueda del ratón para zoom. En modo 3D aparecen los modelos de casas y vegetación.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AccessibilityControls;
