import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Building, TreePine, ArrowRightLeft } from 'lucide-react';

export default function PushPullSlider() {
  const [sliderValue, setSliderValue] = useState(50); // range: 0 to 100

  // Calculate interpolation values
  const pullPercentage = sliderValue; // 0 (100% City) to 100 (100% Querube)
  const pushPercentage = 100 - sliderValue;

  // Background styling based on slider
  const getBackgroundColor = () => {
    // Interpolate background color: Slate grey for City, Deep Forest Green for Querube
    const r = Math.round(30 - (30 - 10) * (sliderValue / 100)); // 30 to 10
    const g = Math.round(41 - (41 - 22) * (sliderValue / 100)); // 41 to 22
    const b = Math.round(59 - (59 - 14) * (sliderValue / 100)); // 59 to 14
    return `rgba(${r}, ${g}, ${b}, 0.85)`;
  };

  const getBorderColor = () => {
    const goldRatio = sliderValue / 100;
    return `rgba(199, 168, 109, ${0.08 + goldRatio * 0.35})`; // border glows with gold as we slide to Querube
  };

  const pushItems = [
    { text: '🏢 Tráfico pesado y humo diario', value: 0 },
    { text: '🏙️ Ruido constante y bocinas', value: 20 },
    { text: '🥵 Cemento, polución y calor urbano', value: 40 },
    { text: '⚠️ Ansiedad y espacios reducidos', value: 60 },
  ];

  const pullItems = [
    { text: '🌿 Aire puro de montaña y frescura', value: 100 },
    { text: '🌲 Silencio absoluto y canto de aves', value: 80 },
    { text: '🏡 Amplios lotes desde 130m² para crecer', value: 60 },
    { text: '🏆 Seguridad, comunidad y paz familiar', value: 40 },
  ];

  return (
    <div
      style={{
        maxWidth: 750,
        margin: '32px auto',
        width: 'calc(100% - 32px)',
        padding: '30px 24px',
        borderRadius: 16,
        background: getBackgroundColor(),
        border: `1px solid ${getBorderColor()}`,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        textAlign: 'left',
        fontFamily: 'var(--font-body)',
        color: '#fff',
        transition: 'background-color 0.4s ease, border-color 0.4s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative gold ambient glow for Querube side */}
      <div
        style={{
          position: 'absolute',
          right: '-10%',
          top: '-10%',
          width: '40%',
          height: '120%',
          background: 'radial-gradient(circle, rgba(199, 168, 109, 0.08) 0%, rgba(199, 168, 109, 0) 70%)',
          pointerEvents: 'none',
          opacity: sliderValue / 100,
          transition: 'opacity 0.4s ease'
        }}
      />

      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'rgba(199, 168, 109, 0.08)',
          border: '1px solid var(--gold-400)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold-300)'
        }}>
          <ArrowRightLeft size={16} />
        </div>
        <div>
          <h4 style={{
            fontSize: '1.25rem',
            color: 'var(--gold-300)',
            fontWeight: 700,
            fontFamily: 'var(--font-luxury)',
            margin: 0
          }}>
            Contraste de Estilo de Vida
          </h4>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Desliza para comparar tu presente vs tu futuro en Querube
          </span>
        </div>
      </div>

      {/* Main Slider Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', fontWeight: 'bold' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: `rgba(226, 232, 240, ${0.4 + pushPercentage * 0.006})` }}>
            <Building size={14} />
            Vida Actual (Ciudad)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: `rgba(199, 168, 109, ${0.3 + pullPercentage * 0.007})` }}>
            <TreePine size={14} />
            Tu Vida en Querube
          </span>
        </div>

        {/* Custom Input Range */}
        <div style={{ position: 'relative', width: '100%', height: 28, display: 'flex', alignItems: 'center' }}>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            style={{
              width: '100%',
              height: 6,
              background: 'linear-gradient(90deg, #64748b 0%, var(--gold-400) 100%)',
              borderRadius: 3,
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none',
              accentColor: 'var(--gold-400)'
            }}
          />
        </div>
      </div>

      {/* Push vs Pull columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
        background: 'rgba(0,0,0,0.15)',
        padding: 16,
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.03)'
      }}>
        {/* LEFT: Push Column (Pain) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-400)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Dolor: Estrés y Rutina
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pushItems.map((item, i) => {
              // Fade out item if slider value goes past its threshold
              const active = pushPercentage >= item.value;
              const opacity = active ? 0.9 : 0.15;
              const blur = active ? 'none' : 'blur(0.5px)';

              return (
                <div
                  key={i}
                  style={{
                    fontSize: '0.78rem',
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity,
                    filter: blur,
                    transition: 'opacity 0.3s ease, filter 0.3s ease'
                  }}
                >
                  <span style={{ fontSize: '0.85rem' }}>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Pull Column (Pleasure) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold-300)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Placer: Libertad y Futuro
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pullItems.map((item, i) => {
              // Fade in item as slider value goes past its threshold
              const active = pullPercentage >= (100 - item.value);
              const opacity = active ? 0.95 : 0.15;
              const blur = active ? 'none' : 'blur(0.5px)';

              return (
                <div
                  key={i}
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-100)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity,
                    filter: blur,
                    transition: 'opacity 0.3s ease, filter 0.3s ease'
                  }}
                >
                  <span style={{ fontSize: '0.85rem' }}>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Motivational Bottom Text */}
      <div style={{
        fontSize: '0.82rem',
        textAlign: 'center',
        padding: '8px 16px',
        borderRadius: 6,
        background: 'rgba(212,168,67,0.05)',
        border: '1px solid rgba(212,168,67,0.12)',
        color: 'var(--gold-300)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontStyle: 'italic'
      }}>
        <Sparkles size={13} style={{ color: 'var(--gold-400)' }} />
        <span>
          {sliderValue < 30 && "La ciudad te quita tiempo y salud..."}
          {sliderValue >= 30 && sliderValue < 70 && "Es momento de planear un cambio real de vida."}
          {sliderValue >= 70 && "Querube es tu espacio privado de paz y valorización familiar."}
        </span>
      </div>
    </div>
  );
}
