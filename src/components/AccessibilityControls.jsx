import React, { useState, useEffect } from 'react';
import { ambientAudio } from '../utils/ambientAudio';

const AccessibilityControls = ({ 
  mapRef, 
  fontSize, 
  setFontSize, 
  voiceEnabled, 
  setVoiceEnabled, 
  flightActive, 
  toggleFlight,
  timeOfDay,
  setTimeOfDay,
  environmentalLayer,
  setEnvironmentalLayer,
  weather,
  setWeather,
  cameraMode,
  setCameraMode,
  isCollapsed,
  setIsCollapsed,
  leftPosition = '360px'
}) => {
  const [activeTab, setActiveTab] = useState('climate'); // climate, camera, accessibility
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.4);

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    document.body.classList.remove('font-large', 'font-extra-large');
    if (size === 'large') {
      document.body.classList.add('font-large');
    } else if (size === 'xlarge') {
      document.body.classList.add('font-extra-large');
    }
  };

  // Sync audio state with volume, weather, and time of day
  useEffect(() => {
    if (soundEnabled) {
      ambientAudio.init();
      ambientAudio.resume();
      ambientAudio.setMute(false);
      ambientAudio.setVolume(soundVolume);
      ambientAudio.setWeather(weather);
      ambientAudio.setTimeOfDay(timeOfDay);
    } else {
      ambientAudio.setMute(true);
    }
  }, [soundEnabled, soundVolume, weather, timeOfDay]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      ambientAudio.destroy();
    };
  }, []);

  const handleToggleSound = () => {
    // Resume audio context first for browser security policies
    if (!soundEnabled) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        ambientAudio.init();
        ambientAudio.resume();
      }
    }
    setSoundEnabled(!soundEnabled);
  };

  // If collapsed, render a mini floating trigger button
  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="glass-panel glass-panel-interactive animate-float"
        style={{
          position: 'absolute',
          top: '24px',
          left: leftPosition,
          zIndex: 10,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
          border: '1px solid var(--glass-border)',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
        title="Mostrar Panel de Controles"
      >
        🛠️
      </button>
    );
  }

  return (
    <div className="accessibility-panel glass-panel animate-float" style={{
      position: 'absolute',
      top: '24px',
      left: leftPosition,
      zIndex: 10,
      width: '320px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxHeight: 'calc(100vh - 48px)',
      overflowY: 'auto'
    }}>
      {/* Header with collapse button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--accent-gold)', margin: 0, fontWeight: 'bold' }}>
            📍 San Pedro de Urabá
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Proyecto de Loteo & Parcelación
          </p>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Colapsar Panel"
        >
          ◀
        </button>
      </div>

      {/* Tabs bar */}
      <div style={{
        display: 'flex',
        borderRadius: '8px',
        backgroundColor: 'rgba(0,0,0,0.25)',
        padding: '2px',
        border: '1px solid var(--glass-border)'
      }}>
        {[
          { id: 'climate', label: '🌍 Capas & Clima' },
          { id: 'camera', label: '🚁 Cámara' },
          { id: 'accessibility', label: '👵 Guía' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '6px 2px',
              fontSize: '0.75rem',
              fontWeight: activeTab === tab.id ? 'bold' : '500',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Capas Ambientales, Clima y Audio Atmosférico */}
      {activeTab === 'climate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* A. Capas Ambientales GEE */}
          <div>
            <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', marginTop: 0, fontWeight: '600' }}>
              Capas Ambientales (Simulación GEE):
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { id: 'satellite', label: '🛰️ Satélite' },
                { id: 'ndvi', label: '🍃 NDVI (Vigor)' },
                { id: 'slope', label: '📈 Pendientes' },
                { id: 'moisture', label: '💧 Humedad' }
              ].map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setEnvironmentalLayer(layer.id)}
                  className="glass-panel-interactive"
                  style={{
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: environmentalLayer === layer.id ? '2px solid var(--accent-gold)' : '1px solid var(--glass-border)',
                    backgroundColor: environmentalLayer === layer.id ? 'var(--primary-dark)' : 'rgba(255,255,255,0.03)',
                    color: '#ffffff',
                    fontWeight: environmentalLayer === layer.id ? 'bold' : 'normal',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* B. Clima (4D) */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1.2 }}>
              <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', marginTop: 0, fontWeight: '600' }}>
                Hora del Día (4D):
              </h4>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--glass-border)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="sunrise">🌅 Amanecer</option>
                <option value="midday">☀️ Mediodía</option>
                <option value="sunset">🌇 Atardecer</option>
                <option value="night">🌌 Noche</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', marginTop: 0, fontWeight: '600' }}>
                Clima:
              </h4>
              <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <button
                  onClick={() => setWeather('clear')}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    fontSize: '0.78rem',
                    backgroundColor: weather === 'clear' ? 'var(--primary)' : 'rgba(0,0,0,0.3)',
                    color: '#ffffff',
                    fontWeight: weather === 'clear' ? 'bold' : 'normal'
                  }}
                  title="Cielo Despejado"
                >
                  ☀️
                </button>
                <button
                  onClick={() => setWeather('rain')}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    fontSize: '0.78rem',
                    backgroundColor: weather === 'rain' ? 'var(--primary)' : 'rgba(0,0,0,0.3)',
                    color: '#ffffff',
                    fontWeight: weather === 'rain' ? 'bold' : 'normal'
                  }}
                  title="Lluvia / Selva Húmeda"
                >
                  🌧️
                </button>
              </div>
            </div>
          </div>

          {/* C. Audio Atmosférico */}
          <div>
            <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', marginTop: 0, fontWeight: '600' }}>
              Sonido de Selva Tropical (4D):
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleToggleSound}
                className="glass-panel-interactive"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--glass-border)',
                  backgroundColor: soundEnabled ? 'var(--primary)' : 'rgba(239, 68, 68, 0.15)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {soundEnabled ? '🔊 Activo' : '🔇 Silencio'}
              </button>
              
              {soundEnabled && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vol:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundVolume}
                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: 'var(--primary-light)',
                      height: '4px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* D. Asistente de Voz */}
          <div>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="glass-panel-interactive"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid var(--glass-border)',
                backgroundColor: voiceEnabled ? 'var(--primary)' : 'rgba(239, 68, 68, 0.1)',
                color: '#ffffff',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {voiceEnabled ? '🟢 Lectora de Lotes Activa' : '🔴 Lectora de Lotes Apagada'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Camera & Drone Flight */}
      {activeTab === 'camera' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', marginTop: 0, fontWeight: '600' }}>
              Recorrido Dron:
            </h4>
            <button
              onClick={toggleFlight}
              className="glass-panel-interactive animate-pulse-gold"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '2px solid var(--accent-gold)',
                backgroundColor: flightActive ? 'var(--accent-gold)' : 'rgba(234, 179, 8, 0.1)',
                color: flightActive ? '#000000' : '#ffffff',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {flightActive ? '⏹️ Detener Recorrido' : '🚀 Iniciar Vuelo 3D'}
            </button>
          </div>

          <div>
            <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', marginTop: 0, fontWeight: '600' }}>
              Perspectiva de Cámara (Ruta):
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
              {[
                { id: 'first', label: '👁️ 1ª Persona' },
                { id: 'second', label: '🎥 2ª Persona' },
                { id: 'third', label: '🚁 3ª Persona' },
                { id: 'fourth', label: '🛰️ 4ª Persona' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setCameraMode && setCameraMode(mode.id)}
                  className="glass-panel-interactive"
                  style={{
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: cameraMode === mode.id ? '2px solid var(--accent-gold)' : '1px solid var(--glass-border)',
                    backgroundColor: cameraMode === mode.id ? 'var(--primary-dark)' : 'rgba(255,255,255,0.03)',
                    color: '#ffffff',
                    fontWeight: cameraMode === mode.id ? 'bold' : 'normal',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', marginTop: 0, fontWeight: '600' }}>
              Controles Manuales:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
              <button onClick={() => mapRef.current?.zoomIn()} className="glass-panel-interactive" style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: '#ffffff', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>➕ Acercar</button>
              <button onClick={() => mapRef.current?.zoomOut()} className="glass-panel-interactive" style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: '#ffffff', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>➖ Alejar</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
              <button onClick={() => mapRef.current?.rotateLeft()} className="glass-panel-interactive" style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: '#ffffff', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>🔄 Girar Izq</button>
              <button onClick={() => mapRef.current?.rotateRight()} className="glass-panel-interactive" style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: '#ffffff', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>🔄 Girar Der</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
              <button onClick={() => mapRef.current?.tiltUp()} className="glass-panel-interactive" style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: '#ffffff', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>📐 Vista 3D</button>
              <button onClick={() => mapRef.current?.tiltDown()} className="glass-panel-interactive" style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: '#ffffff', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>🗺️ Vista Plana</button>
            </div>
            <button
              onClick={() => mapRef.current?.resetView()}
              className="glass-panel-interactive"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid var(--primary-light)',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              🏡 Centrar Vista
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Text Size & Senior Guide */}
      {activeTab === 'accessibility' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px', marginTop: 0, fontWeight: '600' }}>
              Tamaño del Texto:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[
                { id: 'normal', size: '13px', label: 'A' },
                { id: 'large', size: '16px', label: 'A+' },
                { id: 'xlarge', size: '20px', label: 'A++' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => handleFontSizeChange(item.id)}
                  className="glass-panel-interactive"
                  style={{
                    padding: '6px 4px',
                    borderRadius: '6px',
                    border: fontSize === item.id ? '2px solid var(--accent-gold)' : '1px solid var(--glass-border)',
                    backgroundColor: fontSize === item.id ? 'var(--primary-dark)' : 'rgba(255,255,255,0.03)',
                    color: '#ffffff',
                    fontWeight: fontSize === item.id ? 'bold' : 'normal',
                    fontSize: item.size,
                    cursor: 'pointer'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            backgroundColor: 'rgba(234, 179, 8, 0.04)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.4rem', lineHeight: '1.1' }}>👵</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
              <strong>Doña María:</strong>
              <p style={{ margin: '2px 0 0 0' }}>
                "Haz clic en cualquier lote verde en el mapa para ver sus detalles, o dale al botón del dron para volar."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Environmental Layer Legends Block */}
      {environmentalLayer && environmentalLayer !== 'satellite' && (
        <div className="glass-panel" style={{
          marginTop: '6px',
          padding: '10px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
            📊 Leyenda de Capa Activa
          </span>
          {environmentalLayer === 'ndvi' && (
            <div>
              <div style={{
                height: '8px',
                borderRadius: '4px',
                background: 'linear-gradient(to right, #fde047, #84cc16, #15803d)',
                marginBottom: '4px'
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>0.4 (Suelo/Seco)</span>
                <span>0.85 (Follaje Alto)</span>
              </div>
            </div>
          )}
          {environmentalLayer === 'slope' && (
            <div>
              <div style={{
                height: '8px',
                borderRadius: '4px',
                background: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)',
                marginBottom: '4px'
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Flat (0-5%)</span>
                <span>Alerta (25%+)</span>
              </div>
            </div>
          )}
          {environmentalLayer === 'moisture' && (
            <div>
              <div style={{
                height: '8px',
                borderRadius: '4px',
                background: 'linear-gradient(to right, #7c2d12, #84cc16, #0284c7)',
                marginBottom: '4px'
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Dry (15%)</span>
                <span>Saturated (80%+)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccessibilityControls;
