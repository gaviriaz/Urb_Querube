import * as THREE from 'three';

// Common standard materials for low-poly styling
const createMaterials = () => {
  return {
    skin: new THREE.MeshStandardMaterial({ color: '#ffcc99', roughness: 0.6 }),
    clothes: new THREE.MeshStandardMaterial({ color: '#2d5f3e', roughness: 0.7 }), // Forest green
    legs: new THREE.MeshStandardMaterial({ color: '#1d3524', roughness: 0.8 }),
    carBody: new THREE.MeshStandardMaterial({ color: '#c5a059', roughness: 0.3, metalness: 0.6 }), // Gold metallic
    carCabin: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2, metalness: 0.9, transparent: true, opacity: 0.8 }),
    tire: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.9 }),
    metal: new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.8, roughness: 0.2 }),
    light: new THREE.MeshBasicMaterial({ color: '#fef08a' }), // Yellow light
    exhaust: new THREE.MeshBasicMaterial({ color: '#94a3b8', transparent: true, opacity: 0.5 }),
  };
};

/**
 * Creates a low-poly walking person mesh
 */
export function createPersonMesh() {
  const mats = createMaterials();
  const group = new THREE.Group();
  group.name = 'person';

  // Torso / Body
  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.18), mats.clothes);
  bodyMesh.position.y = 0.75;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Head
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), mats.skin);
  headMesh.position.y = 1.12;
  headMesh.castShadow = true;
  group.add(headMesh);

  // Left Arm Pivot & Mesh
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.2, 0.95, 0);
  const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), mats.clothes);
  leftArmMesh.position.y = -0.15; // Offset to rotate around shoulder
  leftArmMesh.castShadow = true;
  leftArmPivot.add(leftArmMesh);
  group.add(leftArmPivot);

  // Right Arm Pivot & Mesh
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.2, 0.95, 0);
  const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), mats.clothes);
  rightArmMesh.position.y = -0.15;
  rightArmMesh.castShadow = true;
  rightArmPivot.add(rightArmMesh);
  group.add(rightArmPivot);

  // Left Leg Pivot & Mesh
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.09, 0.5, 0);
  const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.1), mats.legs);
  leftLegMesh.position.y = -0.2; // Offset to rotate around hip
  leftLegMesh.castShadow = true;
  leftLegPivot.add(leftLegMesh);
  group.add(leftLegPivot);

  // Right Leg Pivot & Mesh
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.09, 0.5, 0);
  const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.1), mats.legs);
  rightLegMesh.position.y = -0.2;
  rightLegMesh.castShadow = true;
  rightLegPivot.add(rightLegMesh);
  group.add(rightLegPivot);

  // Store pivots in userData for animation access
  group.userData = {
    type: 'person',
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot
  };

  return group;
}

/**
 * Animates the walk cycle of a person
 * @param {THREE.Group} group
 * @param {number} progress - 0.0 to 1.0
 */
export function animatePerson(group, progress) {
  if (!group || group.userData.type !== 'person') return;

  // 15 full walking cycles along the road
  const angle = progress * Math.PI * 2 * 15;
  const swing = Math.sin(angle);

  // Arms and legs move in opposite directions
  group.userData.leftArmPivot.rotation.x = swing * 0.45;
  group.userData.rightArmPivot.rotation.x = -swing * 0.45;
  group.userData.leftLegPivot.rotation.x = -swing * 0.35;
  group.userData.rightLegPivot.rotation.x = swing * 0.35;
}

/**
 * Creates a low-poly motorcycle and rider mesh
 */
export function createMotoMesh() {
  const mats = createMaterials();
  const group = new THREE.Group();
  group.name = 'moto';

  // Body Group (vibrates with engine)
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  // Main chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.95), mats.carBody);
  chassis.position.y = 0.45;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  bodyGroup.add(chassis);

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.4), mats.tire);
  seat.position.set(0, 0.6, -0.1);
  seat.castShadow = true;
  bodyGroup.add(seat);

  // Handlebar structure
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 6), mats.metal);
  fork.position.set(0, 0.65, 0.35);
  fork.rotation.x = -Math.PI / 8; // sloped forward
  bodyGroup.add(fork);

  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), mats.metal);
  handlebar.position.set(0, 0.88, 0.28);
  handlebar.rotation.z = Math.PI / 2;
  bodyGroup.add(handlebar);

  // Front wheel (attached to main group, rotates)
  const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 10), mats.tire);
  frontWheel.position.set(0, 0.22, 0.45);
  frontWheel.rotation.z = Math.PI / 2;
  frontWheel.castShadow = true;
  group.add(frontWheel);

  // Back wheel
  const backWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 10), mats.tire);
  backWheel.position.set(0, 0.22, -0.45);
  backWheel.rotation.z = Math.PI / 2;
  backWheel.castShadow = true;
  group.add(backWheel);

  // Rider mesh (simple representation)
  const rider = new THREE.Group();
  rider.position.set(0, 0.62, -0.05);
  
  const riderTorso = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.18), mats.clothes);
  riderTorso.position.y = 0.22;
  riderTorso.rotation.x = Math.PI / 12; // sloped forward riding position
  riderTorso.castShadow = true;
  rider.add(riderTorso);

  const riderHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mats.metal);
  riderHelmet.position.set(0, 0.52, 0.08);
  riderHelmet.castShadow = true;
  rider.add(riderHelmet);

  bodyGroup.add(rider);

  group.userData = {
    type: 'moto',
    bodyGroup,
    frontWheel,
    backWheel,
    initialBodyY: bodyGroup.position.y
  };

  return group;
}

/**
 * Animates the motorcycle (wheel rotation, motor vibration)
 * @param {THREE.Group} group
 * @param {number} progress
 */
export function animateMoto(group, progress) {
  if (!group || group.userData.type !== 'moto') return;

  // Roll wheels based on distance/progress (approx 50 rolls)
  const roll = progress * Math.PI * 2 * 50;
  // Rotate around local X axis
  // Since Cylinder is rotated Z-90, we rotate its local X axis which corresponds to rolling forward
  group.userData.frontWheel.rotation.x = roll;
  group.userData.backWheel.rotation.x = roll;

  // High speed motor vibration (approx 120Hz)
  const vibration = Math.sin(progress * 2400) * 0.006;
  group.userData.bodyGroup.position.y = group.userData.initialBodyY + vibration;
}

/**
 * Creates a low-poly family car mesh with exhaust smoke particles
 */
export function createCarMesh() {
  const mats = createMaterials();
  const group = new THREE.Group();
  group.name = 'car';

  // Car Body
  const carBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 2.1), mats.carBody);
  carBody.position.y = 0.42;
  carBody.castShadow = true;
  carBody.receiveShadow = true;
  group.add(carBody);

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.38, 1.1), mats.carCabin);
  cabin.position.set(0, 0.78, -0.15);
  cabin.castShadow = true;
  group.add(cabin);

  // Headlights
  const leftLight = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.05), mats.light);
  leftLight.position.set(-0.3, 0.45, 1.05);
  group.add(leftLight);

  const rightLight = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.05), mats.light);
  rightLight.position.set(0.3, 0.45, 1.05);
  group.add(rightLight);

  // Wheels (4)
  const wheels = [];
  const wheelOffsets = [
    { x: -0.48, z: 0.65 }, // Front-Left
    { x: 0.48, z: 0.65 },  // Front-Right
    { x: -0.48, z: -0.65 }, // Rear-Left
    { x: 0.48, z: -0.65 }   // Rear-Right
  ];

  wheelOffsets.forEach(offset => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 10), mats.tire);
    wheel.position.set(offset.x, 0.24, offset.z);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    group.add(wheel);
    wheels.push(wheel);
  });

  // Exhaust pipe
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6), mats.metal);
  pipe.position.set(0.25, 0.25, -1.08);
  pipe.rotation.x = Math.PI / 2;
  group.add(pipe);

  // Exhaust particles (simple smoke particle loop)
  const particles = [];
  const particleCount = 3;
  for (let i = 0; i < particleCount; i++) {
    const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.05 + i * 0.02, 6, 6), mats.exhaust.clone());
    // Put them behind the car initially
    smoke.position.set(0.25, 0.25, -1.15 - i * 0.2);
    group.add(smoke);
    
    particles.push({
      mesh: smoke,
      initialZ: -1.1,
      zOffset: -i * 0.3,
      speedZ: -0.012 - Math.random() * 0.005,
      speedY: 0.005 + Math.random() * 0.005,
      opacity: 0.6 - i * 0.15
    });
  }

  group.userData = {
    type: 'car',
    wheels,
    particles
  };

  return group;
}

/**
 * Animates the car (wheel rotation and exhaust smoke particles)
 * @param {THREE.Group} group
 * @param {number} progress
 */
export function animateCar(group, progress) {
  if (!group || group.userData.type !== 'car') return;

  // Roll wheels based on distance/progress (approx 70 rolls)
  const roll = progress * Math.PI * 2 * 75;
  group.userData.wheels.forEach(wheel => {
    wheel.rotation.x = roll;
  });

  // Exhaust smoke particle drift loop
  group.userData.particles.forEach(p => {
    // Increment offsets
    p.zOffset += p.speedZ;
    p.mesh.position.z = p.initialZ + p.zOffset;
    p.mesh.position.y = 0.25 + (p.zOffset * -0.3); // Rise slightly
    p.mesh.position.x = 0.25 + Math.sin(p.zOffset * 5) * 0.05; // Wobble

    // Fade out
    p.mesh.material.opacity = Math.max(0, 0.7 * (1 - Math.abs(p.zOffset) / 1.2));

    // Reset when too far
    if (p.zOffset < -1.1) {
      p.zOffset = 0;
      p.mesh.position.set(0.25, 0.25, p.initialZ);
      p.mesh.material.opacity = 0.7;
    }
  });
}
