import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Carlos M.',
    location: 'Medellín, Colombia',
    text: 'Comprar en Querube fue la mejor decisión para asegurar el patrimonio de mi familia. El visor 3D me permitió escoger la manzana B que tiene la mejor brisa, y la atención por WhatsApp fue inmediata y transparente.',
    rating: 5
  },
  {
    name: 'Liliana P.',
    location: 'Montería, Colombia',
    text: 'Buscaba un lote campestre con escrituras públicas al día y seguridad jurídica en San Pedro de Urabá. La herramienta de plusvalía y la vista 3D me dieron la confianza necesaria para separar mi lote Lt 25 desde mi celular.',
    rating: 5
  },
  {
    name: 'Andrés G.',
    location: 'San Pedro, Colombia',
    text: 'Excelente proyecto de inversión inmobiliaria. El recorrido aéreo con dron interactivo me convenció de la distribución de las vías. Totalmente recomendado por la seriedad jurídica y facilidad de pago.',
    rating: 5
  }
];

export default function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const current = TESTIMONIALS[index];

  return (
    <div style={{
      padding: '40px 24px',
      background: 'rgba(10, 16, 9, 0.94)',
      maxWidth: 600,
      margin: '0 auto',
      width: '100%',
      textAlign: 'center',
      minHeight: 240,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 12 }}>
        {[...Array(current.rating)].map((_, i) => (
          <Star key={i} size={15} fill="var(--gold-400)" stroke="none" />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <p style={{
            fontSize: '0.92rem',
            color: 'var(--text-100)',
            fontStyle: 'italic',
            lineHeight: 1.6,
            maxWidth: '480px',
            fontFamily: 'var(--font-luxury)'
          }}>
            "{current.text}"
          </p>
          <div>
            <strong style={{ fontSize: '0.8rem', color: 'var(--gold-300)', display: 'block' }}>{current.name}</strong>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-600)' }}>{current.location}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: i === index ? 'var(--gold-400)' : 'rgba(255,255,255,0.2)',
              padding: 0
            }}
          />
        ))}
      </div>
    </div>
  );
}
