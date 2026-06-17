import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, DollarSign } from 'lucide-react';
import { gsap } from 'gsap';

export default function ROIVisualizer({ initialValue, years = 3 }) {
  const pathRef = useRef(null);
  const containerRef = useRef(null);

  // Proyecciones de valorización
  // Querube: 12% anual
  // CDT: 7% anual
  // Dólar/TRM: 5% anual
  const rateQuerube = 0.12;
  const rateCDT = 0.07;
  const rateTRM = 0.05;

  const valueQuerube = initialValue * Math.pow(1 + rateQuerube, years);
  const valueCDT = initialValue * Math.pow(1 + rateCDT, years);
  const valueTRM = initialValue * Math.pow(1 + rateTRM, years);

  const gainQuerube = valueQuerube - initialValue;
  const diffCDT = valueQuerube - valueCDT;

  useEffect(() => {
    if (pathRef.current) {
      // Animar el trazo del SVG para dibujar la curva
      const length = pathRef.current.getTotalLength();
      gsap.fromTo(
        pathRef.current,
        { strokeDashoffset: length, strokeDasharray: length },
        { strokeDashoffset: 0, duration: 1.5, ease: 'power2.out' }
      );
    }
  }, [years, initialValue]);

  // Generar puntos de la curva para el SVG
  // Mapeamos 5 puntos (año 0, año 1/3, año 2/3, etc. hasta el final)
  const width = 280;
  const height = 120;
  const padding = 15;

  const points = [];
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    const yearVal = years * t;
    const priceAtYear = initialValue * Math.pow(1 + rateQuerube, yearVal);
    
    // Mapeo a coordenadas SVG
    const x = padding + t * (width - 2 * padding);
    // Normalizar Y entre el valor inicial y el valor proyectado máximo
    const minVal = initialValue;
    const maxVal = initialValue * Math.pow(1 + rateQuerube, 10); // Escala máxima a 10 años
    const ratio = (priceAtYear - minVal) / (maxVal - minVal);
    const y = height - padding - ratio * (height - 2 * padding);
    points.push(`${x},${y}`);
  }
  const pathData = `M ${points.join(' L ')}`;

  return (
    <div ref={containerRef} className="roi-visualizer-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Gráfica de Línea SVG */}
      <div style={{ position: 'relative', background: 'rgba(255,255,255,0.01)', borderRadius: 8, padding: 8, border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-400)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>
          Curva de Valorización (Querube 12% vs CDT 7%)
        </div>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

          {/* Curva de Querube (Dorado) */}
          <path
            ref={pathRef}
            d={pathData}
            fill="none"
            stroke="var(--gold-400)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Puntos en los extremos */}
          <circle cx={points[0].split(',')[0]} cy={points[0].split(',')[1]} r="4" fill="#0a1009" stroke="var(--gold-400)" strokeWidth="2" />
          <circle cx={points[points.length - 1].split(',')[0]} cy={points[points.length - 1].split(',')[1]} r="5" fill="var(--gold-400)" />
          
          {/* Etiquetas */}
          <text x={padding} y={height - 2} fill="var(--text-400)" fontSize="8">Hoy</text>
          <text x={width - padding - 30} y={height - 2} fill="var(--text-400)" fontSize="8">Año {years}</text>
        </svg>
      </div>

      {/* Tabla Comparativa de Rendimientos */}
      <div className="roi-comparison-table" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(239, 68, 68, 0.04)', borderRadius: 4, border: '1px solid rgba(239, 68, 68, 0.1)', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-200)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>🏦 CDT Bancario (7%):</span>
          </span>
          <span style={{ fontWeight: 600, fontFamily: 'var(--font-luxury)' }}>${Math.round(valueCDT).toLocaleString('es-CO')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(249, 115, 22, 0.04)', borderRadius: 4, border: '1px solid rgba(249, 115, 22, 0.1)', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-200)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>💵 Dólar/TRM (5%):</span>
          </span>
          <span style={{ fontWeight: 600, fontFamily: 'var(--font-luxury)' }}>${Math.round(valueTRM).toLocaleString('es-CO')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 4, border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--status-available)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>🌿 Lote Querube (12%):</span>
          </span>
          <span style={{ color: 'var(--status-available)', fontWeight: 'bold', fontFamily: 'var(--font-luxury)' }}>
            ${Math.round(valueQuerube).toLocaleString('es-CO')}
          </span>
        </div>
      </div>

      {/* Anclaje de Valor Emocional */}
      <div style={{ background: 'rgba(199, 168, 109, 0.06)', border: '1px solid rgba(199, 168, 109, 0.15)', padding: '10px 12px', borderRadius: 6, fontSize: '0.76rem', color: 'var(--gold-300)', lineHeight: 1.4, textAlign: 'center' }}>
        ⚠️ Con un CDT bancario dejas de ganar <strong style={{ fontFamily: 'var(--font-luxury)', fontSize: '0.82rem' }}>${Math.round(diffCDT).toLocaleString('es-CO')} COP</strong> frente al lote en {years} {years === 1 ? 'año' : 'años'}. ¡Haz que tu capital trabaje a tu favor!
      </div>
    </div>
  );
}
