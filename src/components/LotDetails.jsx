import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Compass, MapPin, X, FileText, Tag, Link2, Check, MessageSquare, TrendingUp } from 'lucide-react';

const STATUS_STYLE = {
  Disponible: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
  Reservado:  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
  Vendido:    { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
};

const PANEL_SPRING = { type: 'spring', stiffness: 340, damping: 36 };

const LotDetails = ({ lot, adminOverrides, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [requestedInfo, setRequestedInfo] = useState(false);
  const [projectionYears, setProjectionYears] = useState(3);

  if (!lot) return null;

  const overrides = adminOverrides[lot.id] || {};
  const status    = overrides.status || 'Disponible';
  const sSt       = STATUS_STYLE[status] || STATUS_STYLE.Disponible;

  const hasPrice = !!overrides.price;
  const price = hasPrice
    ? `$${Number(overrides.price).toLocaleString('es-CO')} COP`
    : 'Precio a Consultar';

  const description = overrides.description ||
    'Lote de topografía regular en San Pedro de Urabá. Apto para construcción residencial o parcelación campestre con viabilidad de servicios públicos.';
  const tags = overrides.tags
    ? overrides.tags.split(',').map(t => t.trim())
    : ['Zona Alta', 'Excelente Clima', 'Vía Pavimentada', 'Escritura Pública'];

  const areaM2  = lot.area || 0;
  const areaFmt = areaM2 > 10000
    ? `${(areaM2/10000).toFixed(2)} Ha`
    : `${Math.round(areaM2).toLocaleString('es-CO')} m²`;
  const perimFmt = `${Math.round(lot.len || 0).toLocaleString('es-CO')} m`;

  const metrics = [
    { icon: <Ruler size={13}/>,   label: 'Área total',    value: areaFmt                           },
    { icon: <Compass size={13}/>, label: 'Perímetro',     value: perimFmt                          },
    { icon: <MapPin size={13}/>,  label: 'Sector',        value: lot.direccion || 'Querube Rural'  },
    { icon: <FileText size={13}/>,label: 'Manzana',       value: lot.manzana   || '—'              },
  ];

  // Price calculations for ROI projection
  const baseM2Price = 180000; // COP per m²
  const initialValue = overrides.price ? Number(overrides.price) : Math.round(areaM2 * baseM2Price);
  const futureValue = initialValue * Math.pow(1.12, projectionYears); // 12% annual appreciation
  const capitalGain = futureValue - initialValue;

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#lote=${lot.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRequestInfo = () => {
    setRequestedInfo(true);

    const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "573123456789"; // Sales advisor WhatsApp number
    const lotLabel = lot.label;
    const lotArea = Math.round(areaM2);
    const lotManzana = lot.manzana || "—";
    
    const message = `Hola, estoy explorando el visor 3D de Querube y me encuentro muy interesado en la adquisición del lote *${lotLabel}* (Manzana: ${lotManzana}) de ${lotArea} m². Me gustaría recibir asesoría personalizada sobre cotización, formas de pago y disponibilidad.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      setRequestedInfo(false);
    }, 1200);
  };

  return (
    <motion.div
      className="lot-detail-panel"
      key={lot.id}
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0,  opacity: 1 }}
      exit={{    y: 30, opacity: 0 }}
      transition={PANEL_SPRING}
    >
      {/* ── Hero header ── */}
      <div className="detail-hero" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: 16 }}>
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6 }}>
          {/* Share button */}
          <button
            className="detail-close"
            onClick={handleShare}
            title="Copiar enlace directo"
            style={{ position: 'static', width: 30, height: 30 }}
          >
            {copied ? <Check size={14} style={{ color: 'var(--status-available)' }} /> : <Link2 size={14} />}
          </button>
          {/* Close button */}
          <button
            className="detail-close"
            onClick={onClose}
            aria-label="Cerrar ficha"
            style={{ position: 'static', width: 30, height: 30 }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="detail-eyebrow">
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: sSt.text, display: 'inline-block',
            boxShadow: `0 0 6px ${sSt.text}`,
          }} />
          Ficha Catastral
        </div>

        <motion.div
          className="detail-lot-name"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, ...PANEL_SPRING }}
          style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 4 }}
        >
          {lot.label}
        </motion.div>

        <div className="detail-status-row">
          <span className="detail-status-badge" style={{
            background: sSt.bg, border: `1px solid ${sSt.border}`,
            color: sSt.text, fontSize: '0.65rem'
          }}>
            {status}
          </span>
          <span className="detail-price" style={{ color: 'var(--gold-300)' }}>{price}</span>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="detail-body custom-scrollbar">
        {/* Share notification toast-like indicator inside panel */}
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: 'rgba(2, 132, 199, 0.15)',
                borderBottom: '1px solid rgba(2, 132, 199, 0.3)',
                padding: '8px 16px',
                fontSize: '0.72rem',
                color: 'var(--gold-300)',
                textAlign: 'center',
                fontWeight: 600
              }}
            >
              Enlace de catastro copiado al portapapeles
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metric 2×2 grid */}
        <div className="detail-metrics">
          {metrics.map(({ icon, label, value }, i) => (
            <motion.div
              key={label}
              className="detail-metric-cell"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.06, ...PANEL_SPRING }}
            >
              <div className="detail-metric-label" style={{ color: 'var(--gold-400)' }}>
                {icon}
                <span style={{ color: 'var(--text-400)', fontWeight: 600 }}>{label}</span>
              </div>
              <div className="detail-metric-value" style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}>{value}</div>
            </motion.div>
          ))}
        </div>

        {/* Proyección de Valorización (Calculadora de Plusvalía) */}
        <div className="detail-section" style={{ background: 'rgba(2, 132, 199, 0.04)', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="detail-section-title" style={{ color: 'var(--gold-300)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <TrendingUp size={13} />
            <span>Plusvalía Proyectada (12% Anual)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-400)' }}>Período de Inversión:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-100)' }}>{projectionYears} {projectionYears === 1 ? 'Año' : 'Años'}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={projectionYears}
              onChange={(e) => setProjectionYears(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'var(--gold-400)',
                cursor: 'pointer',
                height: 4
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-400)', textTransform: 'uppercase' }}>Valor Proyectado</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-200)', marginTop: 2 }}>
                  ${Math.round(futureValue).toLocaleString('es-CO')}
                </div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '8px 10px', borderRadius: 4, border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--status-available)', textTransform: 'uppercase' }}>Plusvalía Estimada</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--status-available)', marginTop: 2 }}>
                  +${Math.round(capitalGain).toLocaleString('es-CO')}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-400)', marginTop: 4, fontStyle: 'italic', lineHeight: 1.3 }}>
              * Esta es una proyección estimada basada en tendencias históricas de la zona. No constituye una garantía de rentabilidad ni una promesa de valorización.
            </div>
          </div>
        </div>

        {/* NPN Section */}
        <div className="detail-section">
          <div className="detail-section-title">Código Predial (NPN)</div>
          <div className="detail-npn">{lot.npn || '—'}</div>
        </div>

        {/* Description */}
        <div className="detail-section">
          <div className="detail-section-title">Descripción Física</div>
          <p className="detail-description">{description}</p>
        </div>

        {/* Tags */}
        <div className="detail-section" style={{ borderBottom: 'none', paddingBottom: 24 }}>
          <div className="detail-section-title">Características Físicas</div>
          <div className="detail-tags">
            {tags.map((t, i) => (
              <motion.span
                key={t}
                className="detail-tag"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.04, ...PANEL_SPRING }}
                style={{ borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}
              >
                <Tag size={9} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} />
                <span style={{ verticalAlign: 'middle' }}>{t}</span>
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Button at bottom */}
      <div style={{ padding: 16, borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!requestedInfo ? (
          <button
            className="drone-btn"
            onClick={handleRequestInfo}
            style={{
              padding: '10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              border: '1px solid var(--gold-400)',
              background: 'rgba(2, 132, 199, 0.1)',
              color: 'var(--gold-300)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <MessageSquare size={13} />
            Solicitar Información Catastral
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              padding: '10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              textAlign: 'center',
              fontWeight: 600
            }}
          >
            Redireccionando a WhatsApp de Asesoría...
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default LotDetails;
