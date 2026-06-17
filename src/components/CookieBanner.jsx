import React, { useState, useEffect } from 'react';
import { initAnalytics } from '../utils/analytics';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  const GA4_ID = import.meta.env.VITE_GA4_ID || "";
  const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "";

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (consent === null) {
      setShow(true);
    } else if (consent === 'true') {
      initAnalytics(GA4_ID, PIXEL_ID);
    }
  }, [GA4_ID, PIXEL_ID]);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    initAnalytics(GA4_ID, PIXEL_ID);
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'false');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      width: 'calc(100% - 48px)',
      maxWidth: '650px',
      padding: '16px 20px',
      background: 'rgba(15, 23, 42, 0.95)',
      border: '1px solid var(--glass-border)',
      borderRadius: '8px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      fontFamily: 'var(--font-body)',
      color: 'var(--text-100)',
      fontSize: '0.78rem',
      lineHeight: '1.4'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <strong style={{ color: 'var(--gold-400)', fontSize: '0.82rem' }}>
          🛡️ Consentimiento de Datos & Cookies (Ley 1581 de 2012)
        </strong>
        <p style={{ margin: 0, color: 'var(--text-300)' }}>
          En cumplimiento de la Ley 1581 de 2012 de Protección de Datos Personales en Colombia, solicitamos su autorización para almacenar cookies en su navegador y analizar el comportamiento de uso en nuestro visualizador 3D. Esto nos permite mejorar la experiencia de cotización y asesoría.
        </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button 
          onClick={handleDecline}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--glass-border)',
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--text-300)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
        >
          Rechazar
        </button>
        <button 
          onClick={handleAccept}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--gold-500, #d4a843)',
            color: '#020617',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 700,
            transition: 'all 0.2s'
          }}
        >
          Aceptar y Continuar
        </button>
      </div>
    </div>
  );
}
