import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, MapPin, TrendingUp, MessageSquare } from 'lucide-react';

const SPRING = { type: 'spring', stiffness: 400, damping: 38 };

export default function LotComparator({ lots, adminOverrides, onRemove, onClose, onSelectLot }) {
  if (!lots || lots.length < 2) return null;

  const baseM2Price = Number(import.meta.env.VITE_BASE_PRICE_M2) || 180000;
  const rate = 0.12;

  const getLotData = (lot) => {
    const ov = adminOverrides[lot.id] || {};
    const status = ov.status || 'Disponible';
    const areaM2 = parseFloat(lot.area) || 0;
    const price = ov.price || Math.round(areaM2 * baseM2Price);
    const priceM2 = areaM2 > 0 ? Math.round(price / areaM2) : 0;
    const roi3 = Math.round(price * Math.pow(1 + rate, 3));
    const roi5 = Math.round(price * Math.pow(1 + rate, 5));
    return { ...lot, status, areaM2, price, priceM2, roi3, roi5, overrides: ov };
  };

  const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const [a, b] = lots.map(getLotData);

  const rows = [
    { label: 'Estado',      a: a.status,             b: b.status,             icon: <MapPin size={12} /> },
    { label: 'Área',        a: `${a.areaM2.toFixed(1)} m²`, b: `${b.areaM2.toFixed(1)} m²`, icon: <Ruler size={12} />, better: a.areaM2 > b.areaM2 ? 'a' : b.areaM2 > a.areaM2 ? 'b' : null },
    { label: 'Precio',      a: formatCOP(a.price),   b: formatCOP(b.price),   icon: null, better: a.price < b.price ? 'a' : b.price < a.price ? 'b' : null },
    { label: 'Precio/m²',   a: formatCOP(a.priceM2), b: formatCOP(b.priceM2), icon: null, better: a.priceM2 < b.priceM2 ? 'a' : b.priceM2 < a.priceM2 ? 'b' : null },
    { label: 'Manzana',     a: a.manzana || '—',     b: b.manzana || '—',     icon: null },
    { label: 'ROI 3 años',  a: formatCOP(a.roi3),    b: formatCOP(b.roi3),    icon: <TrendingUp size={12} />, better: a.roi3 > b.roi3 ? 'a' : b.roi3 > a.roi3 ? 'b' : null },
    { label: 'ROI 5 años',  a: formatCOP(a.roi5),    b: formatCOP(b.roi5),    icon: null, better: a.roi5 > b.roi5 ? 'a' : b.roi5 > a.roi5 ? 'b' : null },
  ];

  const handleWhatsApp = (lot) => {
    const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "573123456789";
    const msg = `Hola, me interesa el Lote ${lot.id} de ${lot.areaM2.toFixed(1)}m² en la Urbanización Querube. Ver lote: ${window.location.origin}/#lote=${lot.id}`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(3, 7, 4, 0.85)', zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={SPRING}
        className="glass-panel"
        style={{
          width: '100%', maxWidth: 620, padding: '20px 16px',
          display: 'flex', flexDirection: 'column', gap: 16,
          maxHeight: '85vh', overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--gold-300)', fontFamily: 'var(--font-luxury)', margin: 0 }}>
            Comparador de Lotes
          </h3>
          <button onClick={onClose} className="glass-panel-interactive" style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)'
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Column Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 8, fontSize: '0.78rem' }}>
          <div />
          <div style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 6, border: '1px solid var(--glass-border)', background: 'rgba(199,168,109,0.05)' }}>
            <div style={{ fontWeight: 700, color: 'var(--gold-300)', fontFamily: 'var(--font-luxury)', fontSize: '1rem' }}>
              Lote {a.id}
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 6, border: '1px solid var(--glass-border)', background: 'rgba(199,168,109,0.05)' }}>
            <div style={{ fontWeight: 700, color: 'var(--gold-300)', fontFamily: 'var(--font-luxury)', fontSize: '1rem' }}>
              Lote {b.id}
            </div>
          </div>
        </div>

        {/* Comparison Rows */}
        {rows.map((row, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 8,
            fontSize: '0.78rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-400)' }}>
              {row.icon} {row.label}
            </div>
            <div style={{
              textAlign: 'center', fontWeight: 600,
              color: row.better === 'a' ? '#10b981' : 'var(--text-100)',
              fontFamily: row.label.includes('Precio') || row.label.includes('ROI') ? 'var(--font-luxury)' : 'inherit'
            }}>
              {row.a} {row.better === 'a' && '✓'}
            </div>
            <div style={{
              textAlign: 'center', fontWeight: 600,
              color: row.better === 'b' ? '#10b981' : 'var(--text-100)',
              fontFamily: row.label.includes('Precio') || row.label.includes('ROI') ? 'var(--font-luxury)' : 'inherit'
            }}>
              {row.b} {row.better === 'b' && '✓'}
            </div>
          </div>
        ))}

        {/* CTA Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            onClick={() => handleWhatsApp(a)}
            className="glass-panel-interactive"
            style={{
              padding: '10px 8px', borderRadius: 6,
              background: 'var(--gold-400)', color: '#020617',
              fontWeight: 'bold', fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
            <MessageSquare size={13} /> Lote {a.id}
          </button>
          <button
            onClick={() => handleWhatsApp(b)}
            className="glass-panel-interactive"
            style={{
              padding: '10px 8px', borderRadius: 6,
              background: 'var(--gold-400)', color: '#020617',
              fontWeight: 'bold', fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
            <MessageSquare size={13} /> Lote {b.id}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
