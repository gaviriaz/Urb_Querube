import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Compass, MapPin, X, FileText, Tag, Share2, Check, MessageSquare, TrendingUp, Sparkles, Scale, Calendar } from 'lucide-react';
import ROIVisualizer from './ROIVisualizer';
import QuickQualifier from './QuickQualifier';
import ShareMenu from './ShareMenu';
import ReservaForm from './ReservaForm';
import { playLotSelect } from '../utils/brandAudio';

const STATUS_STYLE = {
  Disponible: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
  Reservado:  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
  Vendido:    { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
};

const PANEL_SPRING = { type: 'spring', stiffness: 340, damping: 36 };

const LotDetails = ({ lot, adminOverrides, sessionId, onClose, onCompare, compareList = [] }) => {
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState('Enlace de catastro copiado');
  const [requestedInfo, setRequestedInfo] = useState(false);
  const [projectionYears, setProjectionYears] = useState(3);
  const [showQualifier, setShowQualifier] = useState(false);
  const [showReservaForm, setShowReservaForm] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCommitment, setShowCommitment] = useState(false);
  const [customLotName, setCustomLotName] = useState(() => {
    return localStorage.getItem(`querube_custom_name_${lot.id}`) || '';
  });

  const handleSaveCustomName = (name) => {
    setCustomLotName(name);
    if (name.trim()) {
      localStorage.setItem(`querube_custom_name_${lot.id}`, name);
    } else {
      localStorage.removeItem(`querube_custom_name_${lot.id}`);
    }
  };

  // Play lot select chime on mount
  useEffect(() => {
    playLotSelect();
  }, []);

  // Micro-compromiso popup después de 8 segundos
  useEffect(() => {
    if (!lot) return;
    const decided = localStorage.getItem(`querube_commitment_${lot.id}`);
    if (!decided) {
      const timer = setTimeout(() => {
        setShowCommitment(true);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [lot?.id]);

  if (!lot) return null;

  const overrides = adminOverrides[lot.id] || {};
  const status    = overrides.status || 'Disponible';
  const sSt       = STATUS_STYLE[status] || STATUS_STYLE.Disponible;

  const hasPrice = !!overrides.price;
  const priceVal = hasPrice ? Number(overrides.price) : null;
  const price = hasPrice
    ? `$${priceVal.toLocaleString('es-CO')} COP`
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

  // Base price logic
  const baseM2Price = Number(import.meta.env.VITE_BASE_PRICE_M2) || 180000;
  const initialValue = priceVal || Math.round(areaM2 * baseM2Price);

  const handleShareCopied = (text = 'Enlace de catastro copiado') => {
    setCopiedText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    // Track share event
    if (window.trackEvent) {
      window.trackEvent('lot_shared', { lot_id: lot.id });
    }
  };

  const handleAcceptUpdates = () => {
    localStorage.setItem(`querube_commitment_${lot.id}`, 'accepted');
    setShowCommitment(false);
    
    // Registrar micro-compromiso en backend
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lot_id: lot.id,
        session_id: sessionId,
        event_type: 'micro_commitment_accepted'
      })
    }).catch(err => console.error(err));

    handleShareCopied('Suscrito a actualizaciones de precio ✅');
  };

  const handleDeclineUpdates = () => {
    localStorage.setItem(`querube_commitment_${lot.id}`, 'declined');
    setShowCommitment(false);
  };

  const handleQualifierComplete = (answers) => {
    setRequestedInfo(true);

    // Enviar Lead calificado al servidor
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lot_id: lot.id,
        session_id: sessionId,
        qualifier: answers,
        custom_name: customLotName || null
      })
    }).catch(err => console.error("Error logging lead:", err));

    // Track analytics lead event
    if (window.trackEvent) {
      window.trackEvent('whatsapp_clicked', { lot_id: lot.id, qualifier_answers: answers, custom_name: customLotName || null });
    }

    // Rotación de Asesores por Manzana
    const ADVISORS = {
      'A': { name: 'Juan Carlos', phone: '573002222222' },
      'B': { name: 'María Elena', phone: '573013333333' },
      default: { name: 'Asesor Querube', phone: import.meta.env.VITE_WHATSAPP_NUMBER || '573123456789' }
    };
    const advisor = ADVISORS[lot.manzana] || ADVISORS.default;

    const lotLabel = lot.label;
    const lotArea = Math.round(areaM2);
    const lotManzana = lot.manzana || "—";
    const shareUrl = `${window.location.origin}${window.location.pathname}#lote=${lot.id}`;

    const customNameText = customLotName ? `\nProyecto: "*${customLotName.trim()}*"` : '';

    const message = `Hola ${advisor.name}, me interesa el lote *${lotLabel}* (Manzana: ${lotManzana}) de ${lotArea} m² en Querube.${customNameText}
Propósito: ${answers.q1}
Decisión: ${answers.q2}
Financiamiento: ${answers.q3}
Ver lote: ${shareUrl}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${advisor.phone}?text=${encodedMessage}`;

    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      setRequestedInfo(false);
      setShowQualifier(false);
    }, 1200);
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}#lote=${lot.id}`;

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <motion.div
      className="lot-detail-panel"
      key={lot.id}
      initial={isMobile ? { y: '100%', opacity: 1 } : { y: 30, opacity: 0 }}
      animate={isMobile ? { y: 0, opacity: 1 } : { y: 0, opacity: 1 }}
      exit={isMobile ? { y: '100%', opacity: 1 } : { y: 30, opacity: 0 }}
      transition={PANEL_SPRING}
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {/* Quick Qualifier Overlay */}
      <AnimatePresence>
        {showQualifier && (
          <QuickQualifier
            onClose={() => setShowQualifier(false)}
            onComplete={handleQualifierComplete}
          />
        )}
      </AnimatePresence>

      {/* Reservation Form Overlay */}
      <AnimatePresence>
        {showReservaForm && (
          <ReservaForm
            lotId={lot.id}
            lotLabel={lot.label}
            onClose={() => setShowReservaForm(false)}
            onComplete={() => {
              setShowReservaForm(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Hero header ── */}
      <div className="detail-hero" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: 16, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6 }}>
          {/* Compare button */}
          {onCompare && (
            <button
              className={`detail-close ${compareList.some(l => l.id === lot.id) ? 'active' : ''}`}
              onClick={() => onCompare(lot)}
              title={compareList.some(l => l.id === lot.id) ? "Quitar de comparación" : "Comparar lote"}
              style={{
                position: 'static',
                width: 30,
                height: 30,
                color: compareList.some(l => l.id === lot.id) ? 'var(--gold-300)' : 'var(--text-300)',
                background: compareList.some(l => l.id === lot.id) ? 'rgba(199, 168, 109, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: compareList.some(l => l.id === lot.id) ? '1px solid var(--gold-400)' : '1px solid var(--glass-border)'
              }}
            >
              <Scale size={13} />
            </button>
          )}
          {/* Share button */}
          <button
            className="detail-close"
            onClick={() => setShowShareMenu(s => !s)}
            title="Compartir lote"
            style={{ position: 'static', width: 30, height: 30 }}
          >
            <Share2 size={14} />
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

        {/* Share Dropdown Menu */}
        <AnimatePresence>
          {showShareMenu && (
            <ShareMenu
              url={shareUrl}
              lotLabel={lot.label}
              npn={lot.npn}
              onCopied={handleShareCopied}
              onClose={() => setShowShareMenu(false)}
            />
          )}
        </AnimatePresence>

        <div className="detail-eyebrow" style={{ fontFamily: 'var(--font-body)' }}>
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
          style={{ fontSize: '1.7rem', fontWeight: 800, marginTop: 4, fontFamily: 'var(--font-luxury)' }}
        >
          {lot.label}
        </motion.div>

        {/* Nombra tu lote (Endowment Effect) */}
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 10 }}>
          <label style={{ fontSize: '0.62rem', color: 'var(--gold-400)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={11} /> Nombra tu futuro proyecto:
          </label>
          <input
            type="text"
            value={customLotName}
            onChange={(e) => handleSaveCustomName(e.target.value)}
            placeholder="Ej: Villa Hermosa, Mi Cabaña..."
            maxLength={32}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--glass-border)',
              borderRadius: 6,
              padding: '6px 10px',
              color: '#fff',
              fontSize: '0.78rem',
              outline: 'none',
              width: '100%',
              transition: 'border-color 0.2s'
            }}
          />
        </div>

        <div className="detail-status-row">
          <span className="detail-status-badge" style={{
            background: sSt.bg, border: `1px solid ${sSt.border}`,
            color: sSt.text, fontSize: '0.65rem'
          }}>
            {status}
          </span>
          <span className="detail-price" style={{ color: 'var(--gold-300)', fontFamily: 'var(--font-luxury)', fontSize: '1.15rem' }}>{price}</span>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="detail-body custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Share toast inside panel */}
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: 'rgba(199, 168, 109, 0.12)',
                borderBottom: '1px solid rgba(199, 168, 109, 0.25)',
                padding: '8px 16px',
                fontSize: '0.72rem',
                color: 'var(--gold-300)',
                textAlign: 'center',
                fontWeight: 600
              }}
            >
              {copiedText}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Micro-commitment popup */}
        <AnimatePresence>
          {showCommitment && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              style={{
                margin: '12px',
                padding: '12px',
                background: 'linear-gradient(135deg, rgba(20, 31, 18, 0.95) 0%, rgba(10, 16, 9, 0.98) 100%)',
                border: '1px solid rgba(199, 168, 109, 0.25)',
                borderRadius: 8,
                boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-300)', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: 6 }}>
                <Sparkles size={13} />
                <span>¿Te interesa este lote?</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-200)', lineHeight: 1.3, marginBottom: 10 }}>
                Suscríbete para recibir alertas instantáneas si el precio baja o si cambia su disponibilidad.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleAcceptUpdates}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: 'var(--gold-400)',
                    color: '#020617',
                    borderRadius: 4,
                    fontSize: '0.68rem',
                    fontWeight: 700
                  }}
                >
                  Sí, avísame
                </button>
                <button
                  onClick={handleDeclineUpdates}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-400)',
                    borderRadius: 4,
                    fontSize: '0.68rem'
                  }}
                >
                  Ahora no
                </button>
              </div>
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

        {/* Proyección de Valorización (ROIVisualizer) */}
        <div className="detail-section" style={{ background: 'rgba(199, 168, 109, 0.02)', borderBottom: '1px solid var(--glass-border)', padding: '16px' }}>
          <div className="detail-section-title" style={{ color: 'var(--gold-300)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <TrendingUp size={13} />
            <span style={{ fontFamily: 'var(--font-luxury)', fontSize: '1rem', letterSpacing: '0.02em' }}>Calculadora de Plusvalía Cognitiva</span>
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
              onChange={(e) => {
                setProjectionYears(Number(e.target.value));
                if (window.trackEvent) {
                  window.trackEvent('roi_viewed', { lot_id: lot.id, years: Number(e.target.value) });
                }
              }}
              style={{
                width: '100%',
                accentColor: 'var(--gold-400)',
                cursor: 'pointer',
                height: 4
              }}
            />
            <ROIVisualizer initialValue={initialValue} years={projectionYears} />
          </div>
        </div>

        {/* NPN Section */}
        <div className="detail-section">
          <div className="detail-section-title">Código Predial (NPN)</div>
          <div className="detail-npn" style={{ letterSpacing: '0.04em' }}>{lot.npn || '—'}</div>
        </div>

        {/* Description */}
        <div className="detail-section">
          <div className="detail-section-title">Descripción Física</div>
          <p className="detail-description" style={{ lineHeight: 1.5 }}>{description}</p>
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
        {status === 'Vendido' ? (
          <button
            disabled
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.05)',
              color: '#ef4444',
              fontWeight: 700,
              cursor: 'not-allowed',
              textAlign: 'center'
            }}
          >
            Lote no disponible (Vendido)
          </button>
        ) : status === 'Reservado' ? (
          <button
            disabled
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              background: 'rgba(245, 158, 11, 0.05)',
              color: '#f59e0b',
              fontWeight: 700,
              cursor: 'not-allowed',
              textAlign: 'center'
            }}
          >
            Lote no disponible (Reservado)
          </button>
        ) : !requestedInfo ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="drone-btn"
              onClick={() => setShowQualifier(true)}
              style={{
                padding: '10px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                border: '1px solid var(--gold-400)',
                background: 'rgba(199, 168, 109, 0.1)',
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
            <button
              className="drone-btn"
              onClick={() => setShowReservaForm(true)}
              style={{
                padding: '10px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                border: '1px solid var(--gold-400)',
                background: 'linear-gradient(135deg, var(--gold-400), var(--gold-500))',
                color: '#020617',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(212, 168, 67, 0.15)'
              }}
            >
              <Calendar size={13} />
              Reservar Lote Campestre
            </button>
          </div>
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
