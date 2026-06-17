import { useEffect, useState, useRef } from 'react';
import { AntiGeleo } from '../core/AntiGeleo';

/**
 * FPSMonitorOptimized component
 * Renders a premium, glassmorphic FPS counter.
 * Warns the user when stutters are detected.
 */
export function FPSMonitorOptimized() {
  const [fps, setFps] = useState(60);
  const [isGeleo, setIsGeleo] = useState(false);
  const antiGeleo = AntiGeleo.getInstance();
  const requestRef = useRef(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const loop = (timestamp) => {
      const { fps: currentFps, isGeleo: currentGeleo } = antiGeleo.checkFrame();

      // Throttle React state updates to 300ms for performance
      if (timestamp - lastUpdateRef.current >= 300) {
        setFps(Math.round(currentFps));
        setIsGeleo(currentGeleo);
        lastUpdateRef.current = timestamp;
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: '80px',
      right: '20px',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '4px',
      pointerEvents: 'none',
      fontFamily: 'monospace'
    }}>
      <div style={{
        background: isGeleo ? 'rgba(239, 68, 68, 0.82)' : 'rgba(10, 16, 9, 0.85)',
        backdropFilter: 'blur(10px)',
        border: isGeleo ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--glass-border)',
        borderRadius: '8px',
        padding: '6px 12px',
        color: '#ffffff',
        fontSize: '0.78rem',
        fontWeight: 'bold',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.3s ease'
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: fps >= 45 ? '#10b981' : fps >= 30 ? '#f59e0b' : '#ef4444',
          display: 'inline-block',
          boxShadow: fps >= 45 ? '0 0 8px #10b981' : fps >= 30 ? '0 0 8px #f59e0b' : '0 0 8px #ef4444'
        }} />
        <span>FPS: {fps}</span>
      </div>
      
      {isGeleo && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '4px',
          padding: '2px 8px',
          color: '#fca5a5',
          fontSize: '0.62rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          ⚠️ Geleo Detectado
        </div>
      )}
    </div>
  );
}
export default FPSMonitorOptimized;
