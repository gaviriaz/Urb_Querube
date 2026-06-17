import React from 'react';
import QuerubeLogo from './QuerubeLogo';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <WebGLFallbackScreen />;
    }

    return this.props.children;
  }
}

export function detectWebGLContext() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

export function WebGLFallbackScreen() {
  const handleContact = () => {
    const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "573123456789";
    const message = `Hola, estoy intentando ingresar al visualizador 3D de Querube pero mi dispositivo no es compatible. Me gustaría recibir asesoría sobre los lotes disponibles directamente.`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0a1009',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--font-body)',
      color: 'var(--text-100)',
      textAlign: 'center',
      zIndex: 99999
    }}>
      <div style={{ marginBottom: '24px' }}>
        <QuerubeLogo width={64} height={64} />
      </div>
      <h1 style={{ fontFamily: 'var(--font-header)', fontSize: '1.8rem', color: 'var(--gold-400)', marginBottom: '8px' }}>
        Querube — Loteo Campestre
      </h1>
      <p style={{ color: 'var(--text-300)', fontSize: '0.9rem', maxWidth: '450px', marginBottom: '24px', lineHeight: '1.5' }}>
        El visualizador 3D interactivo no pudo iniciarse en este dispositivo. Esto se debe comúnmente a la falta de soporte WebGL o aceleración de hardware en su navegador.
      </p>
      
      {/* Stylized static illustration representing location and status */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        aspectRatio: '16/10',
        borderRadius: '8px',
        border: '1px solid var(--glass-border)',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '32px',
        color: 'var(--text-400)',
        fontSize: '0.8rem',
        padding: '20px',
        gap: '10px'
      }}>
        <div style={{ fontSize: '2rem' }}>📍</div>
        <strong style={{ color: 'var(--gold-300)' }}>San Pedro de Urabá, Antioquia</strong>
        <span>Loteo campestre de alto valor · 73 Lotes exclusivos</span>
      </div>

      <button
        onClick={handleContact}
        style={{
          padding: '12px 24px',
          borderRadius: '8px',
          backgroundColor: 'var(--gold-500, #c7a86d)',
          color: '#0a1009',
          fontWeight: 'bold',
          fontSize: '0.95rem',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(199,168,109,0.3)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s'
        }}
      >
        💬 Contactar Asesor por WhatsApp
      </button>
    </div>
  );
}
