import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, TrendingUp, Users, Smartphone, Star, MapPin, Calendar, User, Mail, Phone, Lock, Check, Clock, Eye, Sparkles } from 'lucide-react';
import QuerubeLogo from './QuerubeLogo';
import ValueProposition from './ValueProposition';
import TestimonialsCarousel from './TestimonialsCarousel';
import UrgencyBar from './UrgencyBar';
import PushPullSlider from './PushPullSlider';
import { API_BASE_URL } from '../utils/config';
import { validateEmail, validateColombiaPhone } from '../utils/validation';
import { getLotes, crearReserva } from '../services/apiLotes';

// Realistic social proof alerts that rotate to trigger scarcity (FOMO)
const LIVE_ALERTS = [
  "Familia Ramírez reservó el Lote 12 hace 2 horas",
  "Inversionista de Medellín separó 2 lotes de manzana 4 ayer",
  "Familia Gómez reservó el Lote 34 hace 45 minutos",
  "Dr. Carlos Méndez reservó el Lote 8 hace 4 horas",
  "Liliana P. de Montería separó el Lote 25 esta mañana"
];

export default function HeroLanding({ onEnterExplorer }) {
  // Statistics loaded from backend
  const [stats, setStats] = useState({ activeSessions: 4, soldCount: 15, soldThisMonth: 4 });
  const [lotes, setLotes] = useState([]);
  const [availableLotes, setAvailableLotes] = useState([]);

  // Real-time stats loading
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.warn("Error cargando stats de landing:", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch available lots for the booking form dropdown
  useEffect(() => {
    const fetchLotes = async () => {
      try {
        const data = await getLotes();
        setLotes(data);
        setAvailableLotes(data.filter(l => l.estado === 'DISPONIBLE'));
      } catch (err) {
        console.warn("Error obteniendo lotes para dropdown:", err);
      }
    };
    fetchLotes();
  }, []);

  // Countdown timer for Stage 1 pricing (Urgency)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const targetDateStr = import.meta.env.VITE_URGENCY_DATE || '2026-06-30T23:59:59';
    const targetTime = new Date(targetDateStr).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const distance = targetTime - now;
      if (distance <= 0) {
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
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // Social Proof Live Alert rotation
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(true);

  useEffect(() => {
    const alertInterval = setInterval(() => {
      setShowAlert(false);
      setTimeout(() => {
        setCurrentAlertIndex((prev) => (prev + 1) % LIVE_ALERTS.length);
        setShowAlert(true);
      }, 500); // fade out duration
    }, 8000);
    return () => clearInterval(alertInterval);
  }, []);

  // General Booking Form state
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedLoteId, setSelectedLoteId] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [mockChecked, setMockChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const recaptchaContainerRef = useRef(null);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
  const isRealRecaptchaAvailable = siteKey && siteKey !== 'your-site-key' && siteKey.trim() !== '';

  useEffect(() => {
    if (isRealRecaptchaAvailable && window.onRecaptchaLoad === undefined) {
      window.onRecaptchaLoad = () => {
        if (recaptchaContainerRef.current) {
          try {
            window.grecaptcha.render(recaptchaContainerRef.current, {
              sitekey: siteKey,
              callback: (token) => setCaptchaToken(token),
              'expired-callback': () => setCaptchaToken('')
            });
          } catch (e) {
            console.error('Error rendering recaptcha in hero landing:', e);
          }
        }
      };

      const scriptId = 'recaptcha-script-querube';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      } else if (window.grecaptcha) {
        window.onRecaptchaLoad();
      }
    }
  }, [isRealRecaptchaAvailable, siteKey]);

  const handleMockCheckbox = () => {
    const newChecked = !mockChecked;
    setMockChecked(newChecked);
    setCaptchaToken(newChecked ? 'mock-captcha-token-development' : '');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    if (!nombre.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Por favor completa todos los campos.');
      setIsSubmitting(false);
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg('Por favor ingresa un correo electrónico válido (ej: tu@correo.com).');
      setIsSubmitting(false);
      return;
    }

    if (!validateColombiaPhone(phone)) {
      setErrorMsg('El teléfono debe tener 10 dígitos y comenzar con 3 (ej: 3001234567).');
      setIsSubmitting(false);
      return;
    }

    if (!captchaToken) {
      setErrorMsg('Por favor completa la verificación de seguridad.');
      setIsSubmitting(false);
      return;
    }

    try {
      const bookingLoteId = selectedLoteId ? Number(selectedLoteId) : null;

      await crearReserva({
        nombre,
        email,
        phone,
        captcha: captchaToken,
        loteId: bookingLoteId // if null, backend handles general inquiry
      });

      setSuccess(true);

      // Track conversion event
      if (window.trackEvent) {
        window.trackEvent('landing_reserva_completed', { lote_id: bookingLoteId });
      }

      // Pre-compose WhatsApp redirection text
      const selectedLoteLabel = bookingLoteId
        ? lotes.find(l => l.id === bookingLoteId)?.numero
        : 'general';

      const whatsappMsg = `Hola, acabo de registrar una solicitud de reserva en la web de Querube para el lote ${selectedLoteLabel !== 'general' ? `Lote ${selectedLoteLabel}` : 'campestre general'}. Mi nombre es ${nombre}. Deseo recibir la cotización formal y los planos catastrales.`;

      const advisorPhone = import.meta.env.VITE_WHATSAPP_NUMBER || "573123456789";
      const whatsappUrl = `https://wa.me/${advisorPhone}?text=${encodeURIComponent(whatsappMsg)}`;

      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1500);

    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la reserva. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingLots = 73 - stats.soldCount;

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
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        fontFamily: 'var(--font-body)',
        backgroundColor: 'var(--ink-950)'
      }}
      className="custom-scrollbar hl-container"
    >
      {/* Top countdown banner */}
      <UrgencyBar availableCount={remainingLots} />

      {/* Main Immersive Hero Section */}
      <section style={{ position: 'relative', width: '100%', minHeight: '95vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 16px 20px', boxSizing: 'border-box' }}>
        <motion.img
          src="/renders/hero_amanecer.png"
          alt="Urbanización Querube Sunrise"
          className="hl-hero-bg"
          initial={{ scale: 1.05, filter: 'brightness(0.95)' }}
          animate={{ scale: 1.0, filter: 'brightness(1.0)' }}
          transition={{ duration: 8, ease: 'easeOut' }}
        />
        <div className="hl-hero-overlay" />
        
        <div className="hl-hero-content" style={{ padding: 0 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="hl-glass-hero-card"
          >
            {/* Elegant Emblem */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, delay: 0.2 }}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(10, 16, 9, 0.75)',
                border: '1px solid rgba(199, 168, 109, 0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 24px rgba(199, 168, 109, 0.18)',
                justifyContent: 'center'
              }}
              className="animate-pulse"
            >
              <QuerubeLogo width={38} height={38} />
            </motion.div>

            {/* Luxury Subtitle */}
            <span style={{ fontSize: '0.82rem', color: 'var(--gold-400)', letterSpacing: '0.22em', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'var(--font-header)' }}>
              Parcelación de Campo Exclusiva
            </span>

            {/* Luxury Main Headline */}
            <h1 className="hl-title-luxury" style={{ margin: 0 }}>
              Construye tu Legado en la Naturaleza
              <span style={{ color: 'var(--gold-300)', marginTop: 8 }}>Querube</span>
            </h1>

            {/* Elegant Separator */}
            <div style={{ width: 100, height: 2, background: 'linear-gradient(90deg, transparent, var(--gold-400), transparent)', margin: '4px 0' }} />

            {/* Emotional Sub-headline */}
            <p style={{ fontSize: '1.08rem', color: 'var(--text-200)', maxWidth: 640, margin: 0, lineHeight: 1.5 }}>
              Lotes campestres organizados desde <span style={{ color: 'var(--gold-300)', fontWeight: 700 }}>200m²</span> en San Pedro de Urabá.
              El refugio privado que tu familia merece, con urbanismo premium y valorización del 18% anual.
            </p>

            {/* Premium feature tags */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.78rem', color: 'var(--text-400)', margin: '4px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🌿 Áreas Verdes Privadas</span>
              <span style={{ color: 'var(--glass-border)' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🏔️ Vistas de Ensueño</span>
              <span style={{ color: 'var(--glass-border)' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>📜 Escritura Pública Independiente</span>
            </div>

            {/* Live Activity Ticker (Social Proof) */}
            <div className="hl-ticker-badge" style={{ marginTop: 4 }}>
              <span className="hl-ticker-dot animate-ping" />
              <span>⚡ {stats.activeSessions} personas explorando el plano catastral ahora mismo</span>
            </div>

            {/* Call To Action Group */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginTop: 8 }}>
              <motion.button
                onClick={() => {
                  if (window.trackEvent) window.trackEvent('hero_cta_clicked');
                  onEnterExplorer();
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="glass-panel-interactive animate-pulse-gold"
                style={{
                  height: 56,
                  padding: '0 32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--gold-400), var(--gold-500))',
                  color: '#020617',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 10px 30px rgba(199, 168, 109, 0.25)'
                }}
              >
                <Eye size={16} />
                INGRESAR AL VISOR 3D INTERACTIVO
              </motion.button>

              <motion.button
                onClick={() => {
                  document.getElementById('reserva-seccion')?.scrollIntoView({ behavior: 'smooth' });
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: 56,
                  padding: '0 24px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(199, 168, 109, 0.25)',
                  color: 'var(--text-100)',
                  fontWeight: '600',
                  fontSize: '0.90rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Pre-Reservar Mi Lote
              </motion.button>
            </div>

            {/* Micro urgency tag */}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span>⚡ FASE 1: Solo quedan</span>
              <span style={{ color: 'var(--gold-300)', fontWeight: 700 }}>{remainingLots} lotes</span>
              <span>de 73 disponibles en el plano catastral.</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ticker Live Alert popup rotating */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, x: -50, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="hl-live-alert"
          >
            <Sparkles size={16} style={{ color: 'var(--gold-400)', flexShrink: 0 }} />
            <span>{LIVE_ALERTS[currentAlertIndex]}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anchoring Section (Price Anchor) */}
      <section className="hl-anchoring-section">
        <div className="hl-anchoring-header">
          <TrendingUp size={20} style={{ color: 'var(--gold-400)' }} />
          <span>Plusvalía Cognitiva y Anclaje de Inversión</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-400)', lineHeight: 1.4, margin: '0 0 4px 0' }}>
          La escasez de tierra urbanizable en las grandes urbes ha disparado los precios. En Querube, obtienes escrituras públicas independientes, topografía regular y la tranquilidad del campo por una fracción del costo.
        </p>

        <div className="hl-anchoring-grid">
          <div className="hl-anchoring-card">
            <div className="hl-anchoring-label">Lote Rionegro / Medellín (200m²)</div>
            <div className="hl-anchoring-price" style={{ color: 'var(--text-400)', textDecoration: 'line-through' }}>
              $450'000.000 COP
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-600)', marginTop: 4, display: 'block' }}>Precio promedio catastral</span>
          </div>

          <div className="hl-anchoring-card featured">
            <div className="hl-anchoring-label">Lote Querube - Fase 1 (200m²)</div>
            <div className="hl-anchoring-price">
              $280'000.000 COP
            </div>
            <span className="hl-anchoring-saving">¡Ahorras $170M COP de inmediato!</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-100)' }}>Cierre de Precios de Fase 1</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>La siguiente etapa registrará un incremento del 15%</div>
          </div>
          {/* Countdown Clock in Box */}
          <div className="hl-countdown-container">
            <div className="hl-countdown-box">
              <span className="hl-countdown-num">{timeLeft.days}</span>
              <span className="hl-countdown-lbl">días</span>
            </div>
            <div className="hl-countdown-box">
              <span className="hl-countdown-num">{timeLeft.hours}</span>
              <span className="hl-countdown-lbl">horas</span>
            </div>
            <div className="hl-countdown-box">
              <span className="hl-countdown-num">{timeLeft.minutes}</span>
              <span className="hl-countdown-lbl">min</span>
            </div>
            <div className="hl-countdown-box">
              <span className="hl-countdown-num">{timeLeft.seconds}</span>
              <span className="hl-countdown-lbl">seg</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pain vs Pleasure Life Contrast Slider */}
      <PushPullSlider />

      {/* Value Propositions */}
      <ValueProposition />

      {/* Testimonials */}
      <div style={{ padding: '40px 0', background: 'rgba(10, 16, 9, 0.94)' }}>
        <h3 style={{ textAlign: 'center', fontSize: '1.6rem', color: 'var(--gold-300)', fontFamily: 'var(--font-luxury)', marginBottom: 10 }}>
          Testimonios Reales
        </h3>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-400)', maxWidth: 500, margin: '0 auto 24px', padding: '0 16px' }}>
          Familias e inversionistas que ya aseguraron su patrimonio en nuestra parcelación.
        </p>
        <TestimonialsCarousel />
      </div>

      {/* General Form Reservation Section */}
      <section id="reserva-seccion" style={{ padding: '40px 16px', borderTop: '1px solid var(--glass-border)' }}>
        <div className="hl-form-section">
          <div>
            <h3 className="hl-form-title">Pre-Reserva tu Lote en Querube</h3>
            <p className="hl-form-subtitle">Completa el formulario para reservar tu ubicación campestre. Un asesor comercial te contactará en 15 minutos.</p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '30px 10px', textAlign: 'center' }}
            >
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <Check size={32} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', color: '#10b981', fontWeight: 'bold', marginBottom: 4 }}>¡Solicitud de Reserva Registrada!</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-200)', lineHeight: 1.4 }}>
                  Gracias por tu confianza. Te estamos redirigiendo de inmediato al WhatsApp comercial para brindarte atención catastral prioritaria.
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {errorMsg && (
                <div style={{ padding: '10px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 8, color: '#f87171', fontSize: '0.8rem' }}>
                  {errorMsg}
                </div>
              )}

              {/* Nombre input */}
              <div className="hl-field-wrap">
                <label className="hl-field-label">Nombre Completo</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Juan Carlos Pérez"
                    className="hl-input"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              {/* Email input */}
              <div className="hl-field-wrap">
                <label className="hl-field-label">Correo Electrónico</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="hl-input"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              {/* Teléfono input */}
              <div className="hl-field-wrap">
                <label className="hl-field-label">Teléfono de Contacto (WhatsApp)</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 3001234567"
                    className="hl-input"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              {/* Lote dropdown */}
              <div className="hl-field-wrap">
                <label className="hl-field-label">Lote de Interés</label>
                <select
                  value={selectedLoteId}
                  onChange={(e) => setSelectedLoteId(e.target.value)}
                  className="hl-select"
                >
                  <option value="">Quiero asesoría general para elegir mi lote</option>
                  {availableLotes.map((l) => (
                    <option key={l.id} value={l.id} style={{ backgroundColor: 'var(--ink-800)', color: '#fff' }}>
                      Lote {l.numero} — {l.metraje}m² — ${l.precio.toLocaleString('es-CO')} COP
                    </option>
                  ))}
                </select>
              </div>

              {/* reCAPTCHA verification container */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4, minHeight: 74 }}>
                {isRealRecaptchaAvailable ? (
                  <div ref={recaptchaContainerRef} id="recaptcha-google-hero-container"></div>
                ) : (
                  /* Simulated Secure Tick box for Development */
                  <div
                    onClick={handleMockCheckbox}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 6,
                      width: '100%',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{
                      width: 18,
                      height: 18,
                      borderRadius: 3,
                      border: '1px solid ' + (mockChecked ? '#10b981' : 'var(--text-400)'),
                      background: mockChecked ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981'
                    }}>
                      {mockChecked && <Check size={12} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                      <span style={{ fontSize: '0.75rem', color: mockChecked ? 'var(--text-100)' : 'var(--text-200)' }}>No soy un robot</span>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-400)' }}>Simulación de seguridad (Modo Dev)</span>
                    </div>
                    <Lock size={12} style={{ marginLeft: 'auto', color: 'var(--text-400)' }} />
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || !captchaToken}
                className="hl-btn-submit"
              >
                {isSubmitting ? 'Procesando Reserva...' : 'PRE-RESERVAR LOTE AHORA'}
              </button>

              <p style={{ fontSize: '0.68rem', color: 'var(--text-600)', textAlign: 'center', lineHeight: 1.3 }}>
                Sus datos están seguros. Al hacer clic en reservar usted acepta nuestros términos de tratamiento de datos personales conforme a la Ley 1581 de 2012.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Embed map location or description */}
      <section style={{ padding: '40px 16px', background: 'rgba(10, 16, 9, 0.96)', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-luxury)', fontSize: '1.5rem', color: 'var(--gold-300)', marginBottom: 8 }}>
            Ubicación Estratégica en San Pedro de Urabá
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-400)', marginBottom: 20 }}>
            Situado en el corazón de la zona de mayor crecimiento y valorización campestre de Antioquia.
            A pocos minutos del casco urbano y con acceso a vías principales.
          </p>

          <div style={{ width: '100%', height: 350, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3941.1396112959817!2d-76.38138760000001!3d8.278385!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e5a32e18520b227%3A0xc47e305cb79c5c24!2sSan%20Pedro%20de%20Urab%C3%A1%2C%20Antioquia!5e0!3m2!1ses-419!2sco!4v1718617500000!5m2!1ses-419!2sco"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Elegant Footer */}
      <footer style={{
        padding: '40px 24px',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-600)',
        borderTop: '1px solid var(--glass-border)',
        background: '#0a1009',
        lineHeight: 1.8
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
          <QuerubeLogo width={24} height={24} />
          <span style={{ fontFamily: 'var(--font-luxury)', fontSize: '0.9rem', color: 'var(--gold-400)', fontWeight: 'bold', letterSpacing: '0.04em' }}>
            URBANIZACIÓN QUERUBE SAS
          </span>
        </div>
        © 2026 Urbanización Querube SAS · Nit: 901.234.567-8 · San Pedro de Urabá, Antioquia. Todos los derechos reservados.
        <br />
        Las representaciones y proyecciones son meramente de carácter ilustrativo y comercial. Precios y disponibilidad sujetos a cambios sin previo aviso.
      </footer>
    </motion.div>
  );
}
