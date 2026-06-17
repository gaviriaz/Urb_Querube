import * as THREE from 'three';
import maplibregl from 'maplibre-gl';

/**
 * Creates a smooth CatmullCurve3 curve in Mercator coordinates from a list of LngLats
 * @param {Array<Array<number>>} viasCoords - Geographic coordinates [lng, lat][]
 * @param {object} mapInstance - MapLibre map instance for terrain queries
 * @returns {object} Path object containing curve, points, and id
 */
export function createPathFromVias(viasCoords, mapInstance) {
  if (!viasCoords || viasCoords.length < 2) return null;

  const points = viasCoords.map(coord => {
    // Query terrain elevation if enabled
    const elevation = mapInstance && mapInstance.getTerrain() 
      ? mapInstance.queryTerrainElevation(coord) 
      : 0;
    
    // Convert to Mercator coordinate space
    const mercator = maplibregl.MercatorCoordinate.fromLngLat(coord, elevation + 0.12); // subtle height offset to prevent clipping
    return new THREE.Vector3(mercator.x, mercator.y, mercator.z);
  });

  // Create smooth Catmull-Rom curve (smooth path, no step = no geleo)
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);

  return {
    id: 'guided_tour_path',
    name: 'Vía Principal de Recorrido',
    points: viasCoords,
    curve
  };
}

/**
 * Gets the 3D position along the path at progress [0, 1]
 * @param {object} path - Path object
 * @param {number} progress - Animation progress from 0 to 1
 * @returns {THREE.Vector3} Vector3 position in Mercator units
 */
export function getPositionAlongPath(path, progress) {
  if (!path || !path.curve) return new THREE.Vector3();
  return path.curve.getPoint(Math.max(0, Math.min(progress, 1)));
}

/**
 * Gets the rotation angle along the path at progress [0, 1]
 * @param {object} path - Path object
 * @param {number} progress - Animation progress from 0 to 1
 * @returns {number} Rotation angle in radians around Z axis
 */
export function getRotationAlongPath(path, progress) {
  if (!path || !path.curve) return 0;
  
  const t1 = Math.max(0, Math.min(progress, 1));
  const t2 = Math.min(t1 + 0.003, 1); // tiny step ahead for derivative
  
  const p1 = path.curve.getPoint(t1);
  const p2 = path.curve.getPoint(t2);
  
  const direction = new THREE.Vector3()
    .subVectors(p2, p1)
    .normalize();
  
  // Calculate angle in Mercator projection
  // X is East (+X), Y is South (+Y)
  // angle of 0 points East. We want 0 to point South and rotate clockwise.
  // We use -Math.atan2(direction.y, direction.x) to get the angle in standard WebGL coords
  // adding Math.PI/2 aligns our model facing direction.
  return -Math.atan2(direction.y, direction.x) + Math.PI / 2;
}

/**
 * Gets the bearing along the path at progress [0, 1] in degrees
 * @param {object} path - Path object
 * @param {number} progress - Animation progress from 0 to 1
 * @returns {number} Bearing in degrees (0 to 360 clockwise from North)
 */
export function getBearingAlongPath(path, progress) {
  if (!path || !path.curve) return 0;
  
  const t1 = Math.max(0, Math.min(progress, 1));
  const t2 = Math.min(t1 + 0.003, 1);
  
  const p1 = path.curve.getPoint(t1);
  const p2 = path.curve.getPoint(t2);
  
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y; // Y increases South
  
  // dx = sin(bearing), -dy = cos(bearing)
  let bearing = Math.atan2(dx, -dy) * 180 / Math.PI;
  if (bearing < 0) bearing += 360;
  
  return bearing;
}

