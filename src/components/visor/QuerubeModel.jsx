/**
 * QuerubeModel.jsx
 *
 * Procedural 3D representation of the Urbanización Querube terrain:
 * terrain plane, asphalt road, sidewalks, and residential lots
 * using realistic PBR materials (MeshStandardMaterial).
 *
 * The geometry follows the viasCinematic path from vias.js.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { viasCinematic } from '../../data/vias';

/* ── Material palette (memoized once) ── */
function useMaterials() {
  return useMemo(() => ({
    terreno: new THREE.MeshStandardMaterial({
      color: '#C8D8A8',
      roughness: 0.92,
      metalness: 0.0,
    }),
    asfalto: new THREE.MeshStandardMaterial({
      color: '#3A3A3A',
      roughness: 0.85,
      metalness: 0.05,
    }),
    anden: new THREE.MeshStandardMaterial({
      color: '#E8E3DC',
      roughness: 0.6,
      metalness: 0.05,
    }),
    lote: new THREE.MeshStandardMaterial({
      color: '#D5E8C6',
      roughness: 0.7,
      metalness: 0.0,
    }),
    loteSold: new THREE.MeshStandardMaterial({
      color: '#E8D6B0',
      roughness: 0.7,
      metalness: 0.0,
    }),
    casaWall: new THREE.MeshStandardMaterial({
      color: '#F5F0E8',
      roughness: 0.55,
      metalness: 0.02,
    }),
    casaRoof: new THREE.MeshStandardMaterial({
      color: '#8B4513',
      roughness: 0.7,
      metalness: 0.1,
    }),
    grass: new THREE.MeshStandardMaterial({
      color: '#7BB661',
      roughness: 0.95,
      metalness: 0.0,
    }),
    zonasVerdes: new THREE.MeshStandardMaterial({
      color: '#5A9E3F',
      roughness: 0.9,
      metalness: 0.0,
    }),
  }), []);
}

/* ── Road segment builder ── */
function RoadSegments({ materials }) {
  const segments = useMemo(() => {
    const segs = [];
    for (let i = 0; i < viasCinematic.length - 1; i++) {
      const p0 = viasCinematic[i];
      const p1 = viasCinematic[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midZ = (p0.z + p1.z) / 2;
      const dx = p1.x - p0.x;
      const dz = p1.z - p0.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);

      segs.push({ midX, midZ, length, angle, key: i });
    }
    return segs;
  }, []);

  return (
    <group>
      {segments.map(({ midX, midZ, length, angle, key }) => (
        <group key={key} position={[midX, 0.02, midZ]} rotation={[0, -angle, 0]}>
          {/* Asphalt road */}
          <mesh receiveShadow castShadow>
            <boxGeometry args={[5, 0.04, length + 0.2]} />
            <primitive object={materials.asfalto} attach="material" />
          </mesh>
          {/* Left sidewalk */}
          <mesh position={[-3.0, 0.01, 0]} receiveShadow>
            <boxGeometry args={[1.0, 0.06, length + 0.2]} />
            <primitive object={materials.anden} attach="material" />
          </mesh>
          {/* Right sidewalk */}
          <mesh position={[3.0, 0.01, 0]} receiveShadow>
            <boxGeometry args={[1.0, 0.06, length + 0.2]} />
            <primitive object={materials.anden} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── Residential lots along the road ── */
function LotBlocks({ materials }) {
  const lots = useMemo(() => {
    const result = [];
    const step = 8;
    const lotW = 5;
    const lotD = 6;
    const offset = 6.5; // distance from road center

    for (let i = 0; i < viasCinematic.length - 1; i++) {
      const p0 = viasCinematic[i];
      const p1 = viasCinematic[i + 1];
      const dx = p1.x - p0.x;
      const dz = p1.z - p0.z;
      const segLen = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);

      // Normal vector perpendicular to segment
      const nx = Math.cos(angle);
      const nz = -Math.sin(angle);

      const count = Math.floor(segLen / step);
      for (let j = 0; j < count; j++) {
        const t = (j + 0.5) / count;
        const cx = THREE.MathUtils.lerp(p0.x, p1.x, t);
        const cz = THREE.MathUtils.lerp(p0.z, p1.z, t);

        // Left side lot
        result.push({
          x: cx + nx * offset,
          z: cz + nz * offset,
          angle,
          side: 'left',
          hasHouse: Math.random() > 0.5,
          isSold: Math.random() > 0.6,
          key: `L${i}-${j}`,
        });

        // Right side lot
        result.push({
          x: cx - nx * offset,
          z: cz - nz * offset,
          angle,
          side: 'right',
          hasHouse: Math.random() > 0.5,
          isSold: Math.random() > 0.6,
          key: `R${i}-${j}`,
        });
      }
    }
    return result;
  }, []);

  return (
    <group>
      {lots.map((lot) => (
        <group key={lot.key} position={[lot.x, 0.03, lot.z]} rotation={[0, -lot.angle, 0]}>
          {/* Lot ground */}
          <mesh receiveShadow>
            <boxGeometry args={[5, 0.06, 6]} />
            <primitive object={lot.isSold ? materials.loteSold : materials.lote} attach="material" />
          </mesh>

          {/* House (if built) */}
          {lot.hasHouse && (
            <group position={[0, 1.2, 0]}>
              {/* Walls */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[3.5, 2.4, 4]} />
                <primitive object={materials.casaWall} attach="material" />
              </mesh>
              {/* Roof */}
              <mesh position={[0, 1.5, 0]} castShadow>
                <coneGeometry args={[2.8, 1.2, 4]} />
                <primitive object={materials.casaRoof} attach="material" />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

/* ── Decorative trees ── */
function Trees() {
  const trees = useMemo(() => {
    const result = [];
    for (let i = 0; i < 40; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const idx = Math.floor(Math.random() * (viasCinematic.length - 1));
      const p0 = viasCinematic[idx];
      const p1 = viasCinematic[idx + 1];
      const t = Math.random();
      const x = THREE.MathUtils.lerp(p0.x, p1.x, t) + side * (12 + Math.random() * 15);
      const z = THREE.MathUtils.lerp(p0.z, p1.z, t) + (Math.random() - 0.5) * 5;
      const scale = 0.7 + Math.random() * 0.6;
      result.push({ x, z, scale, key: i });
    }
    return result;
  }, []);

  return (
    <group>
      {trees.map((t) => (
        <group key={t.key} position={[t.x, 0, t.z]} scale={t.scale}>
          {/* Trunk */}
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 2.4, 8]} />
            <meshStandardMaterial color="#5D4037" roughness={0.9} />
          </mesh>
          {/* Canopy */}
          <mesh position={[0, 3.0, 0]} castShadow>
            <sphereGeometry args={[1.4, 12, 10]} />
            <meshStandardMaterial color="#4CAF50" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── Zone labels (simple text meshes) ── */
function ZonaVerde({ position, size }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#5A9E3F" roughness={0.9} />
    </mesh>
  );
}

/* ══════════════════════════════════════════════ */
/*  Main model export                            */
/* ══════════════════════════════════════════════ */
export function QuerubeModel() {
  const materials = useMaterials();

  return (
    <group>
      {/* Terrain base plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 200, 1, 1]} />
        <primitive object={materials.terreno} attach="material" />
      </mesh>

      {/* Road + sidewalks */}
      <RoadSegments materials={materials} />

      {/* Lots and houses */}
      <LotBlocks materials={materials} />

      {/* Green zones */}
      <ZonaVerde position={[-18, 0.01, 15]} size={[12, 10]} />
      <ZonaVerde position={[20, 0.01, -20]} size={[10, 14]} />

      {/* Decorative vegetation */}
      <Trees />
    </group>
  );
}
