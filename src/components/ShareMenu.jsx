import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Copy, Check, Share2, Clipboard } from 'lucide-react';

// X/Twitter icon — lucide-react dropped the Twitter icon in recent versions
const XIcon = ({ size = 13, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export default function ShareMenu({ url, lotLabel, npn, onCopied, onClose }) {
  const shareText = `Explora el lote ${lotLabel} en la parcelación Querube 3D:`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${shareText} ${url}`);
    onCopied();
    onClose();
  };

  const copyNPN = () => {
    navigator.clipboard.writeText(npn);
    onCopied('Código predial copiado');
    onClose();
  };

  const shareWhatsApp = () => {
    const encoded = encodeURIComponent(`${shareText} ${url}`);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    onClose();
  };

  const shareTwitter = () => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      style={{
        position: 'absolute',
        top: 50,
        right: 16,
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 8,
        boxShadow: 'var(--glass-shadow)',
        zIndex: 50,
        width: 180,
        padding: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
    >
      <button
        onClick={shareWhatsApp}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          width: '100%',
          textAlign: 'left',
          fontSize: '0.78rem',
          color: 'var(--text-100)',
          borderRadius: 4,
          cursor: 'pointer'
        }}
        className="glass-panel-interactive"
      >
        <MessageSquare size={13} style={{ color: '#25D366' }} />
        <span>WhatsApp</span>
      </button>
      <button
        onClick={shareTwitter}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          width: '100%',
          textAlign: 'left',
          fontSize: '0.78rem',
          color: 'var(--text-100)',
          borderRadius: 4,
          cursor: 'pointer'
        }}
        className="glass-panel-interactive"
      >
        <XIcon size={13} style={{ color: '#1DA1F2' }} />
        <span>Twitter / X</span>
      </button>
      <button
        onClick={copyToClipboard}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          width: '100%',
          textAlign: 'left',
          fontSize: '0.78rem',
          color: 'var(--text-100)',
          borderRadius: 4,
          cursor: 'pointer'
        }}
        className="glass-panel-interactive"
      >
        <Copy size={13} style={{ color: 'var(--gold-400)' }} />
        <span>Copiar enlace</span>
      </button>
      <button
        onClick={copyNPN}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          width: '100%',
          textAlign: 'left',
          fontSize: '0.78rem',
          color: 'var(--text-100)',
          borderRadius: 4,
          cursor: 'pointer'
        }}
        className="glass-panel-interactive"
      >
        <Clipboard size={13} style={{ color: 'var(--text-400)' }} />
        <span>Copiar NPN</span>
      </button>
    </motion.div>
  );
}
