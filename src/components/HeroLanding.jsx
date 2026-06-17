import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QuerubeLogo from './QuerubeLogo';
import ValueProposition from './ValueProposition';
import TestimonialsCarousel from './TestimonialsCarousel';
import UrgencyBar from './UrgencyBar';
import PushPullSlider from './PushPullSlider';

export default function HeroLanding({ onEnterExplorer }) {
  const [stats, setStats] = useState({ activeSessions: 3, soldCount: 12, soldThisMonth: 3 });

  // Cargar estadísticas en tiempo real desde el backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.warn("Error cargando stats de landing, usando fallback:", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  // Texto letra por letra para el Tagline
  const taglineText = "Donde la naturaleza y tu hogar comienzan a ser la misma cosa.";
  const taglineWords = taglineText.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(3, 7, 4, 0.90)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        fontFamily: 'var(--font-body)'
      }}
      className="custom-scrollbar"
    >
      {/* Urgency countdown bar fixed at top of landing */}
      <UrgencyBar availableCount={73 - stats.soldCount} />

      {/* Main Hero Section */}
      <div style={{
        flexMinHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
        position: 'relative',
        maxWidth: 800,
        margin: '0 auto',
        width: '100%',
        gap: 28
      }}>
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, delay: 0.2 }}
          style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(199, 168, 109, 0.08)',
            border: '1px solid rgba(199, 168, 109, 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          className="animate-pulse"
        >
          <QuerubeLogo width={42} height={42} />
        </motion.div>

        {/* Brand Name */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: '3rem',
            color: 'var(--gold-300)',
            fontFamily: 'var(--font-luxury)',
            letterSpacing: '0.05em',
            margin: 0
          }}
        >
          QUERUBE
        </motion.h1>

        {/* Tagline Reveal Word-by-Word */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            fontSize: '1.6rem',
            color: 'var(--text-100)',
            fontFamily: 'var(--font-luxury)',
            fontWeight: 500,
            lineHeight: 1.4,
            maxWidth: '560px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {taglineWords.map((word, i) => (
            <motion.span
              key={i}
              variants={childVariants}
              style={{ display: 'inline-block' }}
            >
              {word}
            </motion.span>
          ))}
        </motion.div>

        {/* Sub eslogan */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{ fontSize: '0.92rem', color: 'var(--text-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          San Pedro de Urabá · Lotes Campestres Organizados
        </motion.p>

        {/* Primary CTA */}
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, type: 'spring' }}
          onClick={onEnterExplorer}
          className="glass-panel-interactive"
          style={{
            padding: '14px 28px',
            borderRadius: '8px',
            background: 'var(--gold-400)',
            color: '#020617',
            fontWeight: 'bold',
            fontSize: '0.98rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(199, 168, 109, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'transform 0.2s'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          Explorar mi lote en 3D →
        </motion.button>

        {/* Social Proof Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-400)',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--glass-border)',
            padding: '8px 16px',
            borderRadius: 20,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} className="animate-ping" />
          <span>{stats.activeSessions} personas explorando ahora · {stats.soldThisMonth} lotes vendidos este mes</span>
        </motion.div>
      </div>

      {/* Value Proposition Block */}
      <ValueProposition />

      {/* Push Pull Contrast Slider */}
      <PushPullSlider />

      {/* Testimonials Carousel Block */}
      <div style={{ padding: '40px 0', background: 'rgba(10, 16, 9, 0.94)' }}>
        <h3 style={{ textAlign: 'center', fontSize: '1.4rem', color: 'var(--gold-300)', fontFamily: 'var(--font-luxury)', marginBottom: 20 }}>
          Lo que dicen nuestros inversores
        </h3>
        <TestimonialsCarousel />
      </div>

      {/* Landing Page Footer */}
      <footer style={{
        padding: '30px 24px',
        textAlign: 'center',
        fontSize: '0.72rem',
        color: 'var(--text-600)',
        borderTop: '1px solid var(--glass-border)',
        background: '#0a1009'
      }}>
        © 2026 Urbanización Querube SAS · San Pedro de Urabá, Antioquia. Todos los derechos reservados.
        <br />
        Las representaciones y proyecciones son meramente de carácter ilustrativo y comercial.
      </footer>
    </motion.div>
  );
}
