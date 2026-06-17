import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, HelpCircle } from 'lucide-react';

export default function QuickQualifier({ onClose, onComplete }) {
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete({ q1, q2, q3 });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isNextDisabled = () => {
    if (step === 1 && !q1) return true;
    if (step === 2 && !q2) return true;
    if (step === 3 && !q3) return true;
    return false;
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(3, 7, 4, 0.95)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px',
      borderRadius: '8px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-300)' }}>
          <HelpCircle size={15} />
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Perfil de Asesoría</span>
        </div>
        <button onClick={onClose} style={{ padding: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-400)' }}>
          <X size={14} />
        </button>
      </div>

      {/* Progress indicators */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: s <= step ? 'var(--gold-400)' : 'rgba(255,255,255,0.1)',
              transition: 'background-color 0.3s'
            }}
          />
        ))}
      </div>

      {/* Step Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-100)', marginBottom: 16, fontWeight: 700 }}>
              ¿Cuál es tu propósito principal para este lote?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '🏠 Construir mi casa campestre', value: 'Construir casa' },
                { label: '🌿 Inversión y valorización', value: 'Inversión' },
                { label: '🤔 Todavía explorando opciones', value: 'Explorando' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setQ1(opt.value)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    borderRadius: 6,
                    border: '1px solid ' + (q1 === opt.value ? 'var(--gold-400)' : 'var(--glass-border)'),
                    background: q1 === opt.value ? 'rgba(199,168,109,0.12)' : 'rgba(255,255,255,0.02)',
                    color: q1 === opt.value ? 'var(--gold-300)' : 'var(--text-200)',
                    fontSize: '0.82rem',
                    fontWeight: q1 === opt.value ? 600 : 400
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-100)', marginBottom: 16, fontWeight: 700 }}>
              ¿En cuánto tiempo planeas tomar una decisión?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '⚡ Este mes', value: 'Este mes' },
                { label: '📅 En los próximos 3 meses', value: 'En 3 meses' },
                { label: '🔭 Más adelante / Planeación', value: 'Más adelante' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setQ2(opt.value)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    borderRadius: 6,
                    border: '1px solid ' + (q2 === opt.value ? 'var(--gold-400)' : 'var(--glass-border)'),
                    background: q2 === opt.value ? 'rgba(199,168,109,0.12)' : 'rgba(255,255,255,0.02)',
                    color: q2 === opt.value ? 'var(--gold-300)' : 'var(--text-200)',
                    fontSize: '0.82rem',
                    fontWeight: q2 === opt.value ? 600 : 400
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-100)', marginBottom: 16, fontWeight: 700 }}>
              ¿Cómo tienes planeado financiar la compra?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '✅ Sí, recursos propios listos', value: 'Listo / Recursos Propios' },
                { label: '🏦 Crédito hipotecario preaprobado', value: 'Crédito Hipotecario' },
                { label: '💬 Necesito orientación de financiación', value: 'Necesito financiación' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setQ3(opt.value)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    borderRadius: 6,
                    border: '1px solid ' + (q3 === opt.value ? 'var(--gold-400)' : 'var(--glass-border)'),
                    background: q3 === opt.value ? 'rgba(199,168,109,0.12)' : 'rgba(255,255,255,0.02)',
                    color: q3 === opt.value ? 'var(--gold-300)' : 'var(--text-200)',
                    fontSize: '0.82rem',
                    fontWeight: q3 === opt.value ? 600 : 400
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        {step > 1 && (
          <button
            onClick={handleBack}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 6,
              border: '1px solid var(--glass-border)',
              color: 'var(--text-200)',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            Atrás
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={isNextDisabled()}
          style={{
            flex: 2,
            padding: '10px',
            borderRadius: 6,
            background: isNextDisabled() ? 'rgba(255,255,255,0.05)' : 'var(--gold-400)',
            color: isNextDisabled() ? 'var(--text-600)' : '#020617',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          {step === 3 ? (
            <>
              <span>Contactar Asesor</span>
              <Send size={12} />
            </>
          ) : (
            'Siguiente'
          )}
        </button>
      </div>
    </div>
  );
}
