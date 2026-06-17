/**
 * UrbanizacionQuerubeCinematic.jsx
 *
 * Orchestrator that mounts the full cinematic R3F scene:
 * SceneCinematic canvas + QuerubeModel terrain/lots + animated
 * Person, Moto and Car following the cinematic path.
 */
import { useState, useMemo } from 'react';
import SceneCinematic from './SceneCinematic';
import { QuerubeModel } from './QuerubeModel';
import { PersonWalkingCinematic } from '../animation/PersonWalkingCinematic';
import { MotoMovingCinematic } from '../animation/MotoMovingCinematic';
import { CarMovingCinematic } from '../animation/CarMovingCinematic';
import { viasCinematic } from '../../data/vias';

/* ── Offset the path laterally for moto and car so they use the road ── */
function offsetPath(base, xOffset) {
  return base.map((p) => ({ x: p.x + xOffset, y: p.y, z: p.z }));
}

/* ── Reversed path for return trips ── */
function reversePath(p) {
  return [...p].reverse();
}

export default function UrbanizacionQuerubeCinematic() {
  const [activeVehicle, setActiveVehicle] = useState('all'); // 'all' | 'person' | 'moto' | 'car'

  /* Derived paths (memoized) */
  const paths = useMemo(() => ({
    // Person walks on the left sidewalk
    person: offsetPath(viasCinematic, -3.0),
    // Moto on the right lane
    moto: offsetPath(viasCinematic, 1.2),
    // Car on the left lane (opposite direction)
    car: reversePath(offsetPath(viasCinematic, -1.2)),
  }), []);

  const showPerson = activeVehicle === 'all' || activeVehicle === 'person';
  const showMoto   = activeVehicle === 'all' || activeVehicle === 'moto';
  const showCar    = activeVehicle === 'all' || activeVehicle === 'car';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <SceneCinematic>
        {/* Terrain, roads, lots, trees */}
        <QuerubeModel />

        {/* Animated entities */}
        {showPerson && (
          <PersonWalkingCinematic path={paths.person} duration={24000} />
        )}
        {showMoto && (
          <MotoMovingCinematic path={paths.moto} duration={14000} />
        )}
        {showCar && (
          <CarMovingCinematic path={paths.car} duration={10000} />
        )}
      </SceneCinematic>

      {/* ── Floating vehicle selector HUD ── */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 8,
        padding: '8px 16px',
        background: 'rgba(10, 16, 9, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(199, 168, 109, 0.25)',
        borderRadius: 30,
        zIndex: 100,
      }}>
        {[
          { key: 'all',    label: '🎬 Todo',   },
          { key: 'person', label: '🚶 Peatón', },
          { key: 'moto',   label: '🏍️ Moto',  },
          { key: 'car',    label: '🚗 Carro',  },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveVehicle(key)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: activeVehicle === key ? 700 : 500,
              fontFamily: 'Inter, system-ui, sans-serif',
              background: activeVehicle === key
                ? 'rgba(199, 168, 109, 0.9)'
                : 'rgba(255, 255, 255, 0.06)',
              color: activeVehicle === key ? '#020617' : '#E0E0E0',
              transition: 'all 0.2s ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Badge ── */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        padding: '6px 14px',
        background: 'rgba(10, 16, 9, 0.75)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(199, 168, 109, 0.2)',
        borderRadius: 6,
        color: '#C7A86D',
        fontSize: '0.72rem',
        fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        letterSpacing: '0.04em',
        zIndex: 100,
      }}>
        🎥 MODO CINEMÁTICO
      </div>
    </div>
  );
}
