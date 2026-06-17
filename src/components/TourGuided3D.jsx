import React from 'react';
import { motion } from 'framer-motion';
import { Play, Square, User, Bike, Car } from 'lucide-react';

/**
 * TourGuided3D Component
 * Flashing overlay displaying the active step name, description, progress bar,
 * and a prominent button to control the 3D route tour.
 */
export function TourGuided3D({
  currentStep,
  isPlaying,
  tourSteps,
  onStartTour,
  onStopTour
}) {
  const step = tourSteps[currentStep];
  if (!step) return null;

  const IconComponent = step.icon === 'walking' ? User : step.icon === 'motorcycle' ? Bike : Car;

  return (
    <div style={{
      position: 'absolute',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      width: '90%',
      maxWidth: '380px',
      pointerEvents: 'auto'
    }}>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          background: 'rgba(10, 16, 9, 0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--gold-400)',
          borderRadius: '16px',
          padding: '18px 24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(212, 168, 67, 0.12)',
            border: '1px solid rgba(212, 168, 67, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-400)'
          }}>
            <IconComponent size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '0.68rem',
              color: 'var(--gold-400)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Recorrido Terrestre 3D
            </div>
            <div style={{
              fontSize: '0.92rem',
              fontWeight: 800,
              color: '#ffffff',
              marginTop: '1px'
            }}>
              {step.name}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{
          fontSize: '0.78rem',
          color: 'var(--text-300)',
          lineHeight: '1.4'
        }}>
          {step.description}
        </div>

        {/* Buttons and controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '4px'
        }}>
          {/* Progress indicators (Dots) */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {tourSteps.map((s, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === currentStep ? '16px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: idx === currentStep ? 'var(--gold-400)' : 'rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                title={s.name}
              />
            ))}
          </div>

          {/* Action button */}
          <button
            onClick={onStopTour}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Square size={11} fill="currentColor" />
            <span>Detener</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default TourGuided3D;
