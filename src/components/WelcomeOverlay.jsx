import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronRight, Map, Sliders, Navigation } from 'lucide-react';
import QuerubeLogo from './QuerubeLogo';

export default function WelcomeOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('welcome_dismissed');
    if (!dismissed) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('welcome_dismissed', 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          className="admin-login-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(3, 7, 4, 0.88)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
              maxWidth: '500px',
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              borderRadius: '8px'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              {/* Logo SVG */}
              <div style={{
                margin: '0 auto 16px auto',
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(212, 168, 67, 0.08)',
                border: '1px solid rgba(212, 168, 67, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <QuerubeLogo width={34} height={34} />
              </div>

              <h2 style={{ fontSize: '1.7rem', color: 'var(--gold-300)', marginBottom: '8px', fontFamily: 'var(--font-header)' }}>
                Querube
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-200)', margin: '0 auto', maxWidth: '380px', lineHeight: 1.4 }}>
                Explora cada lote de la parcelación en 3D antes de visitarla en San Pedro de Urabá.
              </p>
            </div>

            <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)', margin: 0 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--gold-400)', marginTop: 2 }}><Map size={18} /></div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-100)', display: 'block' }}>Navegación 3D</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-400)', lineHeight: '1.4' }}>
                    Arrastra con el mouse para orbitar y rota la cámara. Usa la rueda del mouse para acercarte o alejarte.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--gold-400)', marginTop: 2 }}><Sliders size={18} /></div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-100)', display: 'block' }}>Ficha Catastral</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-400)', lineHeight: '1.4' }}>
                    Haz clic en cualquier predio para conocer su área, perímetro y plusvalía estimada, y compártelo directamente.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--gold-400)', marginTop: 2 }}><Navigation size={18} /></div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-100)', display: 'block' }}>Simulador e Información</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-400)', lineHeight: '1.4' }}>
                    Simula recorridos en coche, moto o a pie, cambia el clima y la hora del día, y solicita cotizaciones en un clic.
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="glass-panel-interactive"
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '8px',
                backgroundColor: 'var(--gold-500, #d4a843)',
                color: '#020617',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                marginTop: '8px'
              }}
            >
              Comenzar Exploración <ChevronRight size={16} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
