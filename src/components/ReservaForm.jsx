import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, User, Mail, Phone, Lock, Check } from 'lucide-react';
import { crearReserva } from '../services/apiLotes';
import { validateEmail, validateColombiaPhone } from '../utils/validation';

export default function ReservaForm({ lotId, lotLabel, onClose, onComplete }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [mockChecked, setMockChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  
  const recaptchaContainerRef = useRef(null);

  // Check if reCAPTCHA key is configured in frontend env
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
  const isRealRecaptchaAvailable = siteKey && siteKey !== 'your-site-key' && siteKey.trim() !== '';

  useEffect(() => {
    if (isRealRecaptchaAvailable) {
      const scriptId = 'recaptcha-script-querube';
      
      // Callback helper for reCAPTCHA onload
      window.onRecaptchaLoad = () => {
        if (recaptchaContainerRef.current) {
          try {
            window.grecaptcha.render(recaptchaContainerRef.current, {
              sitekey: siteKey,
              callback: (token) => {
                setCaptchaToken(token);
              },
              'expired-callback': () => {
                setCaptchaToken('');
              }
            });
          } catch (e) {
            console.error('Error rendering reCAPTCHA:', e);
          }
        }
      };

      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      } else if (window.grecaptcha) {
        // If script already loaded, render it directly
        window.onRecaptchaLoad();
      }
    }
  }, [isRealRecaptchaAvailable, siteKey]);

  const handleMockCheckbox = () => {
    const newChecked = !mockChecked;
    setMockChecked(newChecked);
    setCaptchaToken(newChecked ? 'mock-captcha-token-development' : '');
  };

  const handleSubmit = async (e) => {
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
      setErrorMsg('El teléfono debe tener 10 dígitos y empezar con 3 (ej: 3001234567).');
      setIsSubmitting(false);
      return;
    }

    if (!captchaToken) {
      setErrorMsg('Por favor completa la verificación de seguridad.');
      setIsSubmitting(false);
      return;
    }

    try {
      await crearReserva({
        nombre,
        email,
        phone,
        captcha: captchaToken,
        loteId: Number(lotId)
      });
      setSuccess(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la reserva. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
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
      borderRadius: '8px',
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-300)' }}>
          <Calendar size={15} />
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'var(--font-luxury)' }}>
            Reservar Lote {lotLabel}
          </span>
        </div>
        <button onClick={onClose} disabled={isSubmitting} style={{ padding: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-400)', cursor: 'pointer', border: 'none' }}>
          <X size={14} />
        </button>
      </div>

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16, textAlign: 'center' }}
        >
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#10b981', justifyContent: 'center' }}>
            <Check size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', color: '#10b981', fontWeight: 700, margin: '0 0 4px 0' }}>¡Reserva Registrada!</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-300)', margin: 0 }}>El lote ahora se muestra como RESERVADO en tiempo real.</p>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
          {errorMsg && (
            <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 6, color: '#f87171', fontSize: '0.75rem' }}>
              {errorMsg}
            </div>
          )}

          {/* Nombre Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-400)', textTransform: 'uppercase', fontWeight: 600 }}>Nombre Completo</label>
            <div style={{ position: 'relative' }}>
              <User size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                style={{ width: '100%', height: 48, padding: '0 12px 0 30px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 6, color: '#fff', fontSize: '16px', outline: 'none' }}
              />
            </div>
          </div>

          {/* Email Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-400)', textTransform: 'uppercase', fontWeight: 600 }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                style={{ width: '100%', height: 48, padding: '0 12px 0 30px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 6, color: '#fff', fontSize: '16px', outline: 'none' }}
              />
            </div>
          </div>

          {/* Teléfono Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-400)', textTransform: 'uppercase', fontWeight: 600 }}>Teléfono / WhatsApp</label>
            <div style={{ position: 'relative' }}>
              <Phone size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 3001234567"
                style={{ width: '100%', height: 48, padding: '0 12px 0 30px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 6, color: '#fff', fontSize: '16px', outline: 'none' }}
              />
            </div>
          </div>

          {/* reCAPTCHA Security Area */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4, minHeight: 74 }}>
            {isRealRecaptchaAvailable ? (
              <div ref={recaptchaContainerRef} id="recaptcha-google-container"></div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: '0.75rem', color: mockChecked ? 'var(--text-100)' : 'var(--text-200)' }}>No soy un robot</span>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-400)' }}>Simulación de seguridad (Modo Dev)</span>
                </div>
                <Lock size={12} style={{ marginLeft: 'auto', color: 'var(--text-400)' }} />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !captchaToken}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 6,
              background: (!captchaToken || isSubmitting) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--gold-400), var(--gold-500))',
              color: (!captchaToken || isSubmitting) ? 'var(--text-500)' : '#020617',
              fontSize: '0.9rem',
              fontWeight: 800,
              cursor: (!captchaToken || isSubmitting) ? 'not-allowed' : 'pointer',
              border: 'none',
              marginTop: 4
            }}
          >
            {isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}
          </button>
        </form>
      )}
    </div>
  );
}
