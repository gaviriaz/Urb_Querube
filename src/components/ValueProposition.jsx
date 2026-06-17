import React, { useEffect, useRef } from 'react';
import { Shield, TrendingUp, Users, Smartphone } from 'lucide-react';

export default function ValueProposition() {
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const children = containerRef.current.querySelectorAll('.fade-up');
    children.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const items = [
    {
      icon: <Shield size={32} style={{ color: 'var(--gold-400)' }} />,
      title: 'Inversión Blindada',
      desc: 'Escritura pública independiente, planos urbanísticos aprobados y servicios públicos certificados. Cero riesgos, total tranquilidad.'
    },
    {
      icon: <TrendingUp size={32} style={{ color: 'var(--gold-400)' }} />,
      title: 'Valorización del 18%',
      desc: 'San Pedro de Urabá ha crecido un 18% en valorización en los últimos 3 años. Tu capital crece solo mientras disfrutas del campo.'
    },
    {
      icon: <Users size={32} style={{ color: 'var(--gold-400)' }} />,
      title: 'Comunidad Selecta',
      desc: 'Calles de seis metros de ancho con demarcación, arborización nativa y vecinos que comparten tus valores en Querube.'
    },
    {
      icon: <Smartphone size={32} style={{ color: 'var(--gold-400)' }} />,
      title: 'Proceso Digital Ágil',
      desc: 'Elige tu lote en 3D hoy, califica tus necesidades y habla con un asesor por WhatsApp en minutos. Trato directo y sin fricciones.'
    }
  ];

  return (
    <div
      ref={containerRef}
      style={{
        padding: '60px 24px',
        background: 'rgba(10, 16, 9, 0.96)',
        borderTop: '1px solid var(--glass-border)',
        borderBottom: '1px solid var(--glass-border)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 32,
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%'
      }}
    >
      {items.map((item, idx) => (
        <div
          key={item.title}
          className="fade-up"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: 24,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid var(--glass-border)',
            transitionDelay: `${idx * 0.1}s`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(199, 168, 109, 0.08)', border: '1px solid rgba(199, 168, 109, 0.15)' }}>
            {item.icon}
          </div>
          <h4 style={{ fontSize: '1.15rem', color: 'var(--gold-300)', fontWeight: 700, fontFamily: 'var(--font-luxury)' }}>
            {item.title}
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-400)', lineHeight: 1.5 }}>
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
