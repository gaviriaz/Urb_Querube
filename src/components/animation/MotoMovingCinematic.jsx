/**
 * MotoMovingCinematic.jsx
 *
 * Low-poly motorcycle with rider, rotating wheels, engine vibration,
 * and translucent exhaust smoke particles. Follows a Cartesian path.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SMOKE_COUNT = 6;

export function MotoMovingCinematic({ path, duration = 12000, autoplay = true }) {
  const groupRef = useRef(null);
  const partsRef = useRef({});

  const model = useMemo(() => {
    const group = new THREE.Group();

    // ── Materials ──
    const bodyMat = new THREE.MeshStandardMaterial({
      color: '#1A1A2E', roughness: 0.3, metalness: 0.8,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: '#C0C0C0', roughness: 0.15, metalness: 0.95,
    });
    const rubberMat = new THREE.MeshStandardMaterial({
      color: '#1A1A1A', roughness: 0.95, metalness: 0.0,
    });
    const seatMat = new THREE.MeshStandardMaterial({
      color: '#2C2C2C', roughness: 0.7, metalness: 0.1,
    });
    const riderMat = new THREE.MeshStandardMaterial({
      color: '#2D2D2D', roughness: 0.65, metalness: 0.1,
    });
    const helmetMat = new THREE.MeshStandardMaterial({
      color: '#E74C3C', roughness: 0.3, metalness: 0.4,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: '#FFD9B3', roughness: 0.6, metalness: 0.1,
    });

    // ── Frame / body ──
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.15, 0.9), bodyMat
    );
    frame.position.y = 0.35;
    frame.castShadow = true;
    group.add(frame);

    // ── Tank ──
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.1, 0.35, 12), bodyMat
    );
    tank.position.set(0, 0.48, 0.1);
    tank.rotation.x = Math.PI / 2;
    tank.castShadow = true;
    group.add(tank);

    // ── Seat ──
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.06, 0.35), seatMat
    );
    seat.position.set(0, 0.45, -0.15);
    group.add(seat);

    // ── Front wheel ──
    const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 20);
    const frontWheel = new THREE.Mesh(wheelGeo, rubberMat);
    frontWheel.position.set(0, 0.18, 0.45);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.castShadow = true;
    group.add(frontWheel);

    // ── Rear wheel ──
    const rearWheel = new THREE.Mesh(wheelGeo, rubberMat);
    rearWheel.position.set(0, 0.18, -0.4);
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.castShadow = true;
    group.add(rearWheel);

    // ── Forks ──
    const forkGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8);
    const leftFork = new THREE.Mesh(forkGeo, chromeMat);
    leftFork.position.set(-0.07, 0.35, 0.42);
    leftFork.rotation.x = 0.15;
    group.add(leftFork);
    const rightFork = new THREE.Mesh(forkGeo, chromeMat);
    rightFork.position.set(0.07, 0.35, 0.42);
    rightFork.rotation.x = 0.15;
    group.add(rightFork);

    // ── Handlebars ──
    const handlebar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8), chromeMat
    );
    handlebar.position.set(0, 0.52, 0.35);
    handlebar.rotation.z = Math.PI / 2;
    group.add(handlebar);

    // ── Exhaust pipe ──
    const exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.03, 0.5, 8), chromeMat
    );
    exhaust.position.set(0.12, 0.22, -0.2);
    exhaust.rotation.x = Math.PI / 2;
    group.add(exhaust);

    // ── Rider body ──
    const riderTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.35, 12), riderMat
    );
    riderTorso.position.set(0, 0.72, -0.1);
    riderTorso.rotation.x = -0.25;
    riderTorso.castShadow = true;
    group.add(riderTorso);

    // ── Rider head (helmet) ──
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16), helmetMat
    );
    helmet.position.set(0, 0.95, 0.0);
    helmet.castShadow = true;
    group.add(helmet);

    // ── Visor ──
    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3),
      new THREE.MeshStandardMaterial({
        color: '#111111', roughness: 0.1, metalness: 0.9,
        transparent: true, opacity: 0.7,
      })
    );
    visor.position.set(0, 0.95, 0.05);
    group.add(visor);

    // ── Rider arms ──
    const armGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.25, 8);
    const riderLeftArm = new THREE.Mesh(armGeo, riderMat);
    riderLeftArm.position.set(-0.16, 0.75, 0.1);
    riderLeftArm.rotation.x = -0.6;
    riderLeftArm.rotation.z = 0.2;
    group.add(riderLeftArm);
    const riderRightArm = new THREE.Mesh(armGeo, riderMat);
    riderRightArm.position.set(0.16, 0.75, 0.1);
    riderRightArm.rotation.x = -0.6;
    riderRightArm.rotation.z = -0.2;
    group.add(riderRightArm);

    // ── Smoke particles ──
    const smokeMat = new THREE.MeshStandardMaterial({
      color: '#CCCCCC', transparent: true, opacity: 0.25, roughness: 1,
    });
    const smokeParticles = [];
    for (let i = 0; i < SMOKE_COUNT; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), smokeMat.clone());
      s.position.set(0.12, 0.22, -0.5 - i * 0.12);
      s.visible = false;
      group.add(s);
      smokeParticles.push(s);
    }

    partsRef.current = { frontWheel, rearWheel, smokeParticles };
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

    // Wheel rotation (tied to distance)
    const wheelSpeed = t * Math.PI * 2 * 30;
    const { frontWheel, rearWheel, smokeParticles } = partsRef.current;
    if (frontWheel) {
      frontWheel.rotation.x = wheelSpeed;
      rearWheel.rotation.x = wheelSpeed;
    }

    // Engine vibration
    groupRef.current.position.y = y + Math.sin(performance.now() * 0.05) * 0.003;

    // Smoke particles lifecycle
    if (smokeParticles) {
      const now = performance.now();
      smokeParticles.forEach((s, i) => {
        s.visible = true;
        const phase = ((now * 0.003) + i * 1.2) % (SMOKE_COUNT * 1.2);
        const life = phase / (SMOKE_COUNT * 1.2);
        s.position.z = -0.5 - life * 0.8;
        s.position.y = 0.22 + life * 0.2;
        s.scale.setScalar(1 + life * 2);
        s.material.opacity = 0.2 * (1 - life);
      });
    }
  });

  return <primitive object={model} ref={groupRef} />;
}
