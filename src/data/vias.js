/**
 * Urbanización Querube - Main Road Trajectory
 * These geographic coordinates correspond to the main road segment (Feature 0) in vias.geojson.
 * Used by the path finder to interpolate smooth curves in Three.js Mercator space.
 */
export const viasUrbanizacion = [
  [ -76.38647747298171, 8.263788400729357 ], // Entrance / South end
  [ -76.38646586600719, 8.264599664727886 ],
  [ -76.38643204617208, 8.264700006971658 ],
  [ -76.38543377060986, 8.26689122883002 ],
  [ -76.38538426664795, 8.26704530535902 ],
  [ -76.3851355621729,  8.268797197870636 ]  // Exit / North end
];

/**
 * Cartesian path (meters) for R3F Cinematic Mode.
 * Mirrors the real road shape projected into a local coordinate system.
 * Y is always ground-level (0); X = lateral, Z = longitudinal.
 */
export const viasCinematic = [
  { x:  0.0, y: 0, z:  40 },   // Entrance (south)
  { x:  0.2, y: 0, z:  30 },
  { x:  0.5, y: 0, z:  20 },
  { x:  1.5, y: 0, z:  10 },   // Gentle curve east
  { x:  3.0, y: 0, z:   0 },   // Mid-point
  { x:  4.5, y: 0, z: -10 },
  { x:  5.5, y: 0, z: -20 },   // Curve continues
  { x:  6.0, y: 0, z: -30 },
  { x:  6.2, y: 0, z: -40 },   // Exit (north)
];
