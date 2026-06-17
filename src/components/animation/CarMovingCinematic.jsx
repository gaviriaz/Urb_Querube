/**
 * CarMovingCinematic.jsx
 *
 * Low-poly car with MeshPhysicalMaterial (clearcoat metallic paint),
 * transparent glass, rotating wheels, headlight glow, and exhaust smoke.
 * Follows a Cartesian path via useFrame.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SMOKE_COUNT = 5;

export function CarMovingCinematic({ path, duration = 8000, autoplay = true }) {
  const groupRef = useRef(null);
  const partsRef = useRef({});

  const model = useMemo(() => {
    const group = new THREE.Group();

    // ── Materials ──
    const paintMat = new THREE.MeshPhysicalMaterial({
      color: '#1B3A5C',
      roughness: 0.2,
      metalness: 0.7,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#88CCEE',
      roughness: 0.05,
      metalness: 0.0,
      transparent: true,
      opacity: 0.25,
      transmission: 0.85,
    });
    const tireMat = new THREE.MeshStandardMaterial({
      color: '#1A1A1A', roughness: 0.95, metalness: 0.0,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: '#C0C0C0', roughness: 0.15, metalness: 0.9,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: '#E0E0E0', roughness: 0.1, metalness: 0.95,
    });
    const headlightMat = new THREE.MeshStandardMaterial({
      color: '#FFFFDD', emissive: '#FFFFAA', emissiveIntensity: 0.8,
      roughness: 0.1, metalness: 0.3,
    });
    const taillightMat = new THREE.MeshStandardMaterial({
      color: '#FF2222', emissive: '#FF0000', emissiveIntensity: 0.6,
      roughness: 0.2, metalness: 0.3,
    });

    // ── Body — lower chassis ──
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.22, 2.0), paintMat
    );
    chassis.position.y = 0.25;
    chassis.castShadow = true;
    group.add(chassis);

    // ── Body — cabin ──
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.28, 1.1), paintMat
    );
    cabin.position.set(0, 0.5, -0.15);
    cabin.castShadow = true;
    group.add(cabin);

    // ── Windshield (front) ──
    const windshield = new THREE.Mesh(
      new THREE.PlaneGeometry(0.74, 0.26), glassMat
    );
    windshield.position.set(0, 0.52, 0.38);
    windshield.rotation.x = -0.15;
    group.add(windshield);

    // ── Rear window ──
    const rearWindow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.74, 0.24), glassMat
    );
    rearWindow.position.set(0, 0.52, -0.68);
    rearWindow.rotation.x = 0.1;
    rearWindow.rotation.y = Math.PI;
    group.add(rearWindow);

    // ── Side windows ──
    const sideWindowGeo = new THREE.PlaneGeometry(0.9, 0.22);
    const leftWindow = new THREE.Mesh(sideWindowGeo, glassMat);
    leftWindow.position.set(-0.42, 0.5, -0.15);
    leftWindow.rotation.y = -Math.PI / 2;
    group.add(leftWindow);
    const rightWindow = new THREE.Mesh(sideWindowGeo, glassMat);
    rightWindow.position.set(0.42, 0.5, -0.15);
    rightWindow.rotation.y = Math.PI / 2;
    group.add(rightWindow);

    // ── Headlights ──
    const headlightGeo = new THREE.CircleGeometry(0.06, 12);
    const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    leftHeadlight.position.set(-0.3, 0.28, 1.01);
    group.add(leftHeadlight);
    const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    rightHeadlight.position.set(0.3, 0.28, 1.01);
    group.add(rightHeadlight);

    // ── Taillights ──
    const taillightGeo = new THREE.BoxGeometry(0.12, 0.06, 0.02);
    const leftTaillight = new THREE.Mesh(taillightGeo, taillightMat);
    leftTaillight.position.set(-0.32, 0.28, -1.01);
    group.add(leftTaillight);
    const rightTaillight = new THREE.Mesh(taillightGeo, taillightMat);
    rightTaillight.position.set(0.32, 0.28, -1.01);
    group.add(rightTaillight);

    // ── Bumpers ──
    const bumperGeo = new THREE.BoxGeometry(0.88, 0.06, 0.06);
    const frontBumper = new THREE.Mesh(bumperGeo, chromeMat);
    frontBumper.position.set(0, 0.16, 1.0);
    group.add(frontBumper);
    const rearBumper = new THREE.Mesh(bumperGeo, chromeMat);
    rearBumper.position.set(0, 0.16, -1.0);
    group.add(rearBumper);

    // ── Wheels ──
    const wheels = [];
    const positions = [
      [-0.45, 0.14, 0.6],
      [0.45, 0.14, 0.6],
      [-0.45, 0.14, -0.6],
      [0.45, 0.14, -0.6],
    ];
    positions.forEach((pos) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(...pos);

      // Tire
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16), tireMat
      );
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Rim
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.09, 12), rimMat
      );
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      group.add(wheelGroup);
      wheels.push(wheelGroup);
    });

    // ── Exhaust smoke ──
    const smokeMat = new THREE.MeshStandardMaterial({
      color: '#BBBBBB', transparent: true, opacity: 0.2, roughness: 1,
    });
    const smokeParticles = [];
    for (let i = 0; i < SMOKE_COUNT; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), smokeMat.clone());
      s.position.set(0.2, 0.1, -1.1 - i * 0.1);
      s.visible = false;
      group.add(s);
      smokeParticles.push(s);
    }

    partsRef.current = { wheels, smokeParticles };
    return group;
  }, []);

  const totalSegments = path.length - 1;

  useFrame(() => {
    if (!autoplay || !groupRef.current || totalSegments <= 0) return;

    const loopMs = duration;
    const t = (performance.now() % loopMs) / loopMs;

    // Path interpolation
    const segFloat = t * totalSegments;
    const segIdx = Math.min(Math.floor(segFloat), totalSegments - 1);
    const localT = segFloat - segIdx;
    const p0 = path[segIdx];
    const p1 = path[segIdx + 1] || path[segIdx];

    const x = THREE.MathUtils.lerp(p0.x, p1.x, localT);
    const y = THREE.MathUtils.lerp(p0.y, p1.y, localT);
    const z = THREE.MathUtils.lerp(p0.z, p1.z, localT);

    groupRef.current.position.set(x, y, z);

    // Face forward
    const dir = new THREE.Vector3(p1.x - p0.x, 0, p1.z - p0.z);
    if (dir.lengthSq() > 0.0001) {
      dir.normalize();
      groupRef.current.lookAt(x + dir.x, y, z + dir.z);
    }

    // Wheel rotation
    const wheelSpeed = t * Math.PI * 2 * 20;
    const { wheels, smokeParticles } = partsRef.current;
    if (wheels) {
      wheels.forEach((w) => {
        w.children[0].rotation.x = wheelSpeed; // tire
        w.children[1].rotation.x = wheelSpeed; // rim
      });
    }

    // Subtle suspension bounce
    groupRef.current.position.y = y + Math.sin(performance.now() * 0.008) * 0.004;

    // Exhaust smoke
    if (smokeParticles) {
      const now = performance.now();
      smokeParticles.forEach((s, i) => {
        s.visible = true;
        const phase = ((now * 0.002) + i * 1.0) % (SMOKE_COUNT * 1.0);
        const life = phase / (SMOKE_COUNT * 1.0);
        s.position.z = -1.1 - life * 0.6;
        s.position.y = 0.1 + life * 0.15;
        s.scale.setScalar(1 + life * 2.5);
        s.material.opacity = 0.18 * (1 - life);
      });
    }
  });

  return <primitive object={model} ref={groupRef} />;
}
