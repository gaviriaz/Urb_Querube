/**
 * PersonWalkingCinematic.jsx
 *
 * Low-poly pedestrian with articulated walk-cycle animation
 * following a Cartesian path via R3F's useFrame hook.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * @param {{ path: Array<{x:number, y:number, z:number}>, duration?: number, autoplay?: boolean }} props
 */
export function PersonWalkingCinematic({ path, duration = 20000, autoplay = true }) {
  const groupRef = useRef(null);
  const partsRef = useRef({});

  const model = useMemo(() => {
    const group = new THREE.Group();

    // ── Materials ──
    const fabricMat = new THREE.MeshStandardMaterial({
      color: '#2D5F3E', roughness: 0.8, metalness: 0.05,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: '#FFD9B3', roughness: 0.6, metalness: 0.1,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: '#1A3A2E', roughness: 0.75, metalness: 0.0,
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: '#1A1A1A', roughness: 0.5, metalness: 0.25,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: '#2C1810', roughness: 0.7, metalness: 0.05,
    });

    // ── Body ──
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.5, 16), fabricMat
    );
    torso.position.y = 0.75;
    torso.castShadow = true;
    group.add(torso);

    // ── Head ──
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), skinMat);
    head.position.y = 1.18;
    head.castShadow = true;
    group.add(head);

    // ── Hair ──
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), hairMat
    );
    hair.position.y = 1.2;
    hair.castShadow = true;
    group.add(hair);

    // ── Arms ──
    const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.32, 12);
    const leftArm = new THREE.Mesh(armGeo, fabricMat);
    leftArm.position.set(-0.24, 0.85, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, fabricMat);
    rightArm.position.set(0.24, 0.85, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // ── Legs ──
    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.42, 12);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.1, 0.28, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.1, 0.28, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // ── Shoes ──
    const shoeGeo = new THREE.BoxGeometry(0.12, 0.07, 0.2);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-0.1, 0.04, 0.04);
    leftShoe.castShadow = true;
    group.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0.1, 0.04, 0.04);
    rightShoe.castShadow = true;
    group.add(rightShoe);

    // Store references for animation
    partsRef.current = { leftArm, rightArm, leftLeg, rightLeg };

    return group;
  }, []);

  const totalSegments = path.length - 1;

  useFrame(() => {
    if (!autoplay || !groupRef.current || totalSegments <= 0) return;

    const loopMs = duration;
    const t = (performance.now() % loopMs) / loopMs;

    // Position along path
    const segFloat = t * totalSegments;
    const segIdx = Math.min(Math.floor(segFloat), totalSegments - 1);
    const localT = segFloat - segIdx;

    const p0 = path[segIdx];
    const p1 = path[segIdx + 1] || path[segIdx];

    const x = THREE.MathUtils.lerp(p0.x, p1.x, localT);
    const y = THREE.MathUtils.lerp(p0.y, p1.y, localT);
    const z = THREE.MathUtils.lerp(p0.z, p1.z, localT);

    groupRef.current.position.set(x, y, z);

    // Face direction of travel
    const dir = new THREE.Vector3(p1.x - p0.x, 0, p1.z - p0.z);
    if (dir.lengthSq() > 0.0001) {
      dir.normalize();
      const target = new THREE.Vector3(x + dir.x, y, z + dir.z);
      groupRef.current.lookAt(target);
    }

    // Walk-cycle animation
    const walkSpeed = 8;
    const walkAngle = t * Math.PI * 2 * walkSpeed;

    const { leftArm, rightArm, leftLeg, rightLeg } = partsRef.current;
    if (leftArm) {
      leftArm.rotation.x = Math.sin(walkAngle) * 0.35;
      rightArm.rotation.x = Math.sin(walkAngle + Math.PI) * 0.35;
      leftLeg.rotation.x = Math.sin(walkAngle + Math.PI) * 0.3;
      rightLeg.rotation.x = Math.sin(walkAngle) * 0.3;
    }

    // Subtle body bob
    groupRef.current.position.y = y + Math.abs(Math.sin(walkAngle * 2)) * 0.015;
  });

  return <primitive object={model} ref={groupRef} />;
}
