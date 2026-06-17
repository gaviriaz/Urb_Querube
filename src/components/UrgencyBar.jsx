import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function UrgencyBar({ availableCount = 45 }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const targetDateStr = import.meta.env.VITE_URGENCY_DATE || '2026-12-31T23:59:59';
    const targetTime = new Date(targetDateStr).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const distance = targetTime - now;

      if (distance <= 0) {
        setExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      width: '100%',
      background: 'rgba(239, 68, 68, 0.9)',
      color: '#ffffff',
      padding: '8px 16px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
      boxShadow: '0 -4px 15px rgba(0, 0, 0, 0.3)',
      borderTop: '1px solid rgba(255, 255, 255, 0.2)',
      fontSize: '0.85rem',
      fontWeight: 600,
      zIndex: 1000,
      fontFamily: 'var(--font-display)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>🔥 Oferta de Lanzamiento</span>
        <span style={{ padding: '2px 6px', background: '#ffffff', color: '#dc2626', borderRadius: 4, fontSize: '0.72rem', fontWeight: 800 }}>
          Solo {availableCount} lotes disp.
        </span>
      </div>

      {!expired ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>Cierra en:</span>
          <div style={{ display: 'flex', gap: 3, fontWeight: 800 }}>
            <span style={{ padding: '2px 4px', background: 'rgba(0,0,0,0.2)', borderRadius: 3 }}>{timeLeft.days}d</span>
            <span style={{ padding: '2px 4px', background: 'rgba(0,0,0,0.2)', borderRadius: 3 }}>{timeLeft.hours}h</span>
            <span style={{ padding: '2px 4px', background: 'rgba(0,0,0,0.2)', borderRadius: 3 }}>{timeLeft.minutes}m</span>
            <span style={{ padding: '2px 4px', background: 'rgba(0,0,0,0.2)', borderRadius: 3 }}>{timeLeft.seconds}s</span>
          </div>
        </div>
      ) : (
        <span>¡Precio de segunda etapa en vigencia!</span>
      )}
    </div>
  );
}
