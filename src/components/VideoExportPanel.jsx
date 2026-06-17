import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, X, Loader, Award, Film, Download } from 'lucide-react';
import { extractLotInfo } from '../utils/lotUtils.js';

export default function VideoExportPanel({
  mapRef,
  loteoGeojson,
  selectedLotId,
  onClose,
  onPrepareRecording
}) {
  const [resolution, setResolution] = useState('1920x1080');
  const [fps, setFps] = useState(30);
  const [duration, setDuration] = useState(15);
  const [mode, setMode] = useState('cinematic'); // 'cinematic' | 'orbit'
  const [lotId, setLotId] = useState(selectedLotId || 'center');
  
  // Progress states polled from Map3D
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);

  // Extract non-remanente lots for orbit target selection
  const lots = React.useMemo(() => {
    if (!loteoGeojson?.features) return [];
    return loteoGeojson.features
      .filter(f => f.properties?.LOTE !== 'REMANENTE')
      .map(extractLotInfo)
      .sort((a, b) => String(a.label).localeCompare(String(b.label), undefined, { numeric: true }));
  }, [loteoGeojson]);

  // Set default lotId to selected lot on mount or when selection changes
  useEffect(() => {
    if (selectedLotId) {
      setLotId(selectedLotId);
      setMode('orbit');
    }
  }, [selectedLotId]);

  // Poll recording progress from Map3D ref
  useEffect(() => {
    let interval;
    if (active) {
      interval = setInterval(() => {
        if (mapRef.current && typeof mapRef.current.getRecordingProgress === 'function') {
          const rec = mapRef.current.getRecordingProgress();
          setProgress(rec.progress);
          setStatus(rec.status);
          setActive(rec.active);
          if (rec.progress === 100) {
            setHasVideo(true);
          }
        }
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [active, mapRef]);

  const handleStart = () => {
    if (!mapRef.current) return;
    setHasVideo(false);
    setActive(true);
    
    // Call the Map3D imperative API
    mapRef.current.startVideoRecording({
      resolution,
      fps,
      duration,
      mode: mode === 'orbit' && lotId === 'center' ? 'general' : mode,
      lotId: lotId === 'center' ? null : lotId,
      autoDownload: true,
      onPrepare: (isPreparing) => {
        // Callback to hide ambient panels during record
        if (onPrepareRecording) onPrepareRecording(isPreparing);
      }
    });
  };

  const handleStop = () => {
    if (!mapRef.current) return;
    mapRef.current.stopVideoRecording();
    setActive(false);
    if (onPrepareRecording) onPrepareRecording(false);
  };

  const handleDownload = () => {
    if (mapRef.current && typeof mapRef.current.downloadGeneratedVideo === 'function') {
      mapRef.current.downloadGeneratedVideo(resolution);
    }
  };

  return (
    <motion.div
      className="panel-exportacion"
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        width: 320,
        background: 'rgba(10, 16, 9, 0.92)',
        border: '1px solid var(--gold-400)',
        borderRadius: 16,
        padding: '24px 20px',
        color: '#fff',
        zIndex: 2000,
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{
          fontSize: '1.2rem',
          color: 'var(--gold-300)',
          fontFamily: 'var(--font-luxury)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Film size={18} />
          <span>Exportar Video 3D</span>
        </h3>
        <button
          onClick={onClose}
          disabled={active}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--glass-border)',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-400)',
            cursor: active ? 'not-allowed' : 'pointer'
          }}
        >
          <X size={12} />
        </button>
      </div>

      {!active ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Resolution Option */}
          <div className="opcion-grupo" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-400)', textTransform: 'uppercase', fontWeight: 600 }}>Resolución</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="glass-panel-interactive"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--glass-border)',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            >
              <option value="1920x1080" style={{ background: '#0a1009' }}>Full HD (1080p) — 1920×1080</option>
              <option value="2560x1440" style={{ background: '#0a1009' }}>2K QHD — 2560×1440</option>
              <option value="3840x2160" style={{ background: '#0a1009' }}>4K Ultra HD — 3840×2160</option>
            </select>
          </div>

          {/* FPS Option */}
          <div className="opcion-grupo" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-400)', textTransform: 'uppercase', fontWeight: 600 }}>Frames Por Segundo (FPS)</label>
            <select
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              className="glass-panel-interactive"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--glass-border)',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            >
              <option value="30" style={{ background: '#0a1009' }}>30 FPS (Estándar)</option>
              <option value="60" style={{ background: '#0a1009' }}>60 FPS (Cinemático Fluido)</option>
            </select>
          </div>

          {/* Duration Option */}
          <div className="opcion-grupo" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-400)', textTransform: 'uppercase', fontWeight: 600 }}>Duración del Video</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="glass-panel-interactive"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--glass-border)',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            >
              <option value="10" style={{ background: '#0a1009' }}>10 segundos</option>
              <option value="15" style={{ background: '#0a1009' }}>15 segundos</option>
              <option value="30" style={{ background: '#0a1009' }}>30 segundos</option>
              <option value="60" style={{ background: '#0a1009' }}>60 segundos</option>
            </select>
          </div>

          {/* Recorrido Type Option */}
          <div className="opcion-grupo" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-400)', textTransform: 'uppercase', fontWeight: 600 }}>Tipo de Recorrido</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="glass-panel-interactive"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--glass-border)',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            >
              <option value="cinematic" style={{ background: '#0a1009' }}>Vuelo Cinemático (Dron)</option>
              <option value="orbit" style={{ background: '#0a1009' }}>Órbita Centrada</option>
              <option value="sequential" style={{ background: '#0a1009' }}>Tour Secuencial (Lotes Disponibles)</option>
            </select>
          </div>

          {/* Target selection if orbit mode */}
          {mode === 'orbit' && (
            <div className="opcion-grupo" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-400)', textTransform: 'uppercase', fontWeight: 600 }}>Enfocar Lote/Objetivo</label>
              <select
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
                className="glass-panel-interactive"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              >
                <option value="center" style={{ background: '#0a1009' }}>Centro de Urbanización</option>
                {lots.map(l => (
                  <option key={l.id} value={l.id} style={{ background: '#0a1009' }}>Lote {l.label} ({Math.round(l.area)} m²)</option>
                ))}
              </select>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleStart}
            className="btn-exportar"
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, var(--gold-400), var(--gold-500))',
              border: 'none',
              borderRadius: 8,
              color: '#020617',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 15px rgba(212, 168, 67, 0.25)',
              marginTop: 10
            }}
          >
            <Video size={15} />
            <span>Iniciar Grabación</span>
          </button>
          
          {hasVideo && (
            <button
              onClick={handleDownload}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: 8,
                color: 'var(--gold-300)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Download size={13} />
              <span>Descargar última toma</span>
            </button>
          )}

          <p style={{ fontSize: '0.64rem', color: 'var(--text-400)', lineHeight: 1.4, margin: '4px 0 0 0', textAlign: 'center' }}>
            ⚠️ La grabación en alta resolución (2K/4K) redimensiona el lienzo temporalmente. No interactúes durante el proceso.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', py: 10 }}>
          {/* Animated recording icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 8px #ef4444'
            }} className="animate-pulse" />
            <span style={{ fontSize: '0.82rem', fontWeight: 'bold', letterSpacing: '0.05em', color: 'var(--text-100)' }}>
              {status}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-400)' }}>
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--gold-400), #fff)',
                borderRadius: 3,
                transition: 'width 0.1s linear'
              }} />
            </div>
          </div>

          {/* Stop button */}
          <button
            onClick={handleStop}
            style={{
              width: '100%',
              padding: '10px',
              background: '#ef4444',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Detener y Cancelar
          </button>
        </div>
      )}
    </motion.div>
  );
}
