import React, { useEffect, useRef } from 'react';

const LotDetails = ({ lot, onClose, adminOverrides, voiceEnabled }) => {
  const lastSpokenLotIdRef = useRef(null);

  const overrides = lot ? (adminOverrides[lot.id] || {}) : {};
  const status = overrides.status || 'Disponible';
  const areaM2 = lot?.area || 0;

  const speakInfo = () => {
    if (!lot || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const speechString = `
      Lote número ${lot.label}. 
      Extensión de ${Math.round(areaM2).toLocaleString('es-CO')} metros cuadrados. 
      Linderos de ${Math.round(lot.len || 0)} metros. 
      Estado: ${status === 'Disponible' ? 'Disponible para la venta.' : status === 'Reservado' ? 'Reservado.' : 'Vendido.'} 
      ${overrides.price ? `Precio de venta: ${Number(overrides.price).toLocaleString('es-CO')} pesos.` : 'Precio a consultar.'} 
    `;

    const utterance = new SpeechSynthesisUtterance(speechString);
    utterance.lang = 'es-CO';
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find((v) => v.lang.startsWith('es'));
    if (spanishVoice) utterance.voice = spanishVoice;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!voiceEnabled || !lot?.id) return;
    if (lastSpokenLotIdRef.current === lot.id) return;

    const timer = setTimeout(() => {
      lastSpokenLotIdRef.current = lot.id;
      speakInfo();
    }, 900);

    return () => clearTimeout(timer);
  }, [lot?.id, voiceEnabled, lot?.label, lot?.area, lot?.len, status, overrides.price]);

  if (!lot) return null;

  const price = overrides.price ? `$${Number(overrides.price).toLocaleString('es-CO')}` : 'Consultar Precio';
  const tags = overrides.tags ? overrides.tags.split(',').map((t) => t.trim()) : ['Zona Alta', 'Excelente Clima'];
  const description = overrides.description || 'Lote campestre privilegiado en San Pedro de Urabá, rodeado de naturaleza, ideal para descanso o inversión.';

  const areaFormatted = areaM2 > 10000
    ? `${(areaM2 / 10000).toFixed(2)} Ha (${Math.round(areaM2).toLocaleString('es-CO')} m²)`
    : `${Math.round(areaM2).toLocaleString('es-CO')} m²`;

  const perimeterFormatted = `${Math.round(lot.len || 0).toLocaleString('es-CO')} m`;

  // Status badge colors
  const statusColors = {
    'Disponible': { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.4)', text: '#4ade80' },
    'Reservado': { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)', text: '#fb923c' },
    'Vendido': { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#f87171' }
  };

  const currentStatusStyle = statusColors[status] || statusColors['Disponible'];

  return (
    <div className="lot-details-panel glass-panel animate-float" style={{
      position: 'absolute',
      bottom: '24px',
      right: '24px',
      zIndex: 10,
      width: '320px',
      maxHeight: 'calc(100vh - 48px)',
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
          ⛰️ Lote: <span style={{ color: 'var(--accent-gold)' }}>{lot.label}</span>
        </h3>
        <button 
          onClick={onClose}
          style={{
            fontSize: '1rem',
            padding: '4px 8px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-muted)',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)', margin: 0 }} />

      {/* Main Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Status & Price Row */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            flex: 1,
            padding: '6px',
            borderRadius: '6px',
            border: `1px solid ${currentStatusStyle.border}`,
            backgroundColor: currentStatusStyle.bg,
            color: currentStatusStyle.text,
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: '0.85rem'
          }}>
            {status}
          </div>
          <div style={{
            flex: 1.2,
            padding: '6px',
            borderRadius: '6px',
            backgroundColor: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            color: 'var(--accent-gold)',
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: '0.85rem'
          }}>
            {price}
          </div>
        </div>

        {/* Specs Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ color: 'var(--text-muted)' }}>📐 Tamaño (Área):</span>
            <strong style={{ color: '#ffffff' }}>{areaFormatted}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ color: 'var(--text-muted)' }}>📏 Linderos:</span>
            <strong style={{ color: '#ffffff' }}>{perimeterFormatted}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ color: 'var(--text-muted)' }}>🏡 Ubicación:</span>
            <strong style={{ color: '#ffffff' }}>{lot.direccion || 'Rural (San Pedro)'}</strong>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>🆔 Ficha Catastral (NPN):</span>
            <code style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '0.75rem', 
              backgroundColor: 'rgba(0,0,0,0.25)', 
              padding: '4px', 
              borderRadius: '4px',
              wordBreak: 'break-all'
            }}>
              {lot.npn}
            </code>
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
        {description}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {tags.map((tag, idx) => (
          <span key={idx} style={{
            fontSize: '0.72rem',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-secondary)'
          }}>
            🏷️ {tag}
          </span>
        ))}
      </div>

      {/* Speak Info Button */}
      <button
        onClick={speakInfo}
        className="glass-panel-interactive"
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          border: 'none',
          boxShadow: '0 4px 12px rgba(21, 128, 61, 0.3)'
        }}
      >
        🗣️ Escuchar en Voz Alta
      </button>
    </div>
  );
};

export default LotDetails;
