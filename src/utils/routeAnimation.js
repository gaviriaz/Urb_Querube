/**
 * Route Animation System
 * Calculates the route from the nearest road point to a lot centroid
 * and animates a vehicle/person marker along that path.
 */

// ─── Find nearest point on a LineString to a target ───
function nearestPointOnLine(line, target) {
  let minDist = Infinity;
  let nearest = null;
  let nearestIdx = 0;

  for (let i = 0; i < line.length; i++) {
    const dx = line[i][0] - target[0];
    const dy = line[i][1] - target[1];
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      nearest = line[i];
      nearestIdx = i;
    }
  }
  return { point: nearest, index: nearestIdx, dist: Math.sqrt(minDist) };
}

// ─── Find nearest road point and build a route to the lot ───
export function calculateRouteToLot(viasGeojson, lotCentroid) {
  if (!viasGeojson || !lotCentroid) return null;

  let bestRoadPt = null;
  let bestDist = Infinity;
  let bestViaCoords = null;
  let bestIdx = 0;

  viasGeojson.features.forEach((feat) => {
    if (!feat.geometry) return;
    const coords = feat.geometry.coordinates;
    const result = nearestPointOnLine(coords, lotCentroid);
    if (result.dist < bestDist) {
      bestDist = result.dist;
      bestRoadPt = result.point;
      bestIdx = result.index;
      bestViaCoords = coords;
    }
  });

  if (!bestRoadPt) return null;

  const routePoints = [];
  if (bestViaCoords) {
    for (let i = 0; i <= bestIdx; i++) {
      routePoints.push(bestViaCoords[i]);
    }
  }
  routePoints.push(lotCentroid);

  return {
    route: routePoints,
    roadPoint: bestRoadPt,
    lotPoint: lotCentroid,
    totalPoints: routePoints.length
  };
}

// ─── Route GeoJSON for map rendering ───
export function routeToGeoJSON(routePoints) {
  if (!routePoints || routePoints.length < 2) return null;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: routePoints
        },
        properties: {}
      }
    ]
  };
}

// ─── Calculate total route distance in meters ───
export function routeDistance(routePoints) {
  if (!routePoints || routePoints.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    const [lon1, lat1] = routePoints[i];
    const [lon2, lat2] = routePoints[i + 1];
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
      * Math.sin(dLon / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
}

// ─── Interpolate position along route by progress [0,1] ───
export function interpolateRoute(routePoints, progress) {
  if (!routePoints || routePoints.length < 2) return null;

  const t = Math.max(0, Math.min(1, progress));
  const distances = [0];
  for (let i = 1; i < routePoints.length; i++) {
    const dx = routePoints[i][0] - routePoints[i - 1][0];
    const dy = routePoints[i][1] - routePoints[i - 1][1];
    distances.push(distances[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const totalDist = distances[distances.length - 1];
  if (totalDist === 0) return { lng: routePoints[0][0], lat: routePoints[0][1], bearing: 0 };

  const targetDist = t * totalDist;

  for (let i = 1; i < distances.length; i++) {
    if (distances[i] >= targetDist) {
      const segLen = distances[i] - distances[i - 1];
      const segT = segLen > 0 ? (targetDist - distances[i - 1]) / segLen : 0;
      const p1 = routePoints[i - 1];
      const p2 = routePoints[i];
      const lng = p1[0] + (p2[0] - p1[0]) * segT;
      const lat = p1[1] + (p2[1] - p1[1]) * segT;
      const bearing = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180 / Math.PI;
      return { lng, lat, bearing };
    }
  }

  const last = routePoints[routePoints.length - 1];
  return { lng: last[0], lat: last[1], bearing: 0 };
}

// ─── Vehicle type configurations ───
export const VEHICLE_TYPES = {
  person: {
    emoji: '🚶',
    label: 'Persona Caminando',
    speed: 1.4,
    zoomBoost: 0.4,
    icon: 'walking'
  },
  moto: {
    emoji: '🏍️',
    label: 'Motocicleta',
    speed: 8.3,
    zoomBoost: 0.1,
    icon: 'motorcycle'
  },
  car: {
    emoji: '🚗',
    label: 'Automóvil',
    speed: 5.6,
    zoomBoost: 0,
    icon: 'car'
  }
};

// ─── Camera perspective configurations (metros reales) ───
// Para visualización tipo Revit/Blender: maximizar detalle arquitectónico
export const CAMERA_MODES = {
  first: {
    label: '1ᵉʳᵃ Persona',
    emoji: '👁️',
    description: 'Vista peatonal - detalle máximo',
    zoom: 22.5,
    pitch: 85,
    behindMeters: 1.5,
    height: 1.65
  },
  second: {
    label: '2ᵈᵃ Persona',
    emoji: '🎥',
    description: 'Vista caminando - close up',
    zoom: 21.5,
    pitch: 78,
    behindMeters: 5,
    height: 2.8
  },
  third: {
    label: '3ᵉʳᵃ Persona',
    emoji: '🚁',
    description: 'Vista dron baja - detalle',
    zoom: 20.5,
    pitch: 68,
    behindMeters: 14,
    height: 8
  },
  fourth: {
    label: '4ᵗᵃ Persona',
    emoji: '🛰️',
    description: 'Vista panorámica elegante',
    zoom: 19.2,
    pitch: 55,
    behindMeters: 35,
    height: 25
  }
};

// ─── Calculate camera position for a given perspective ───
export function getCameraForPerspective(position, mode, bearing, vehicleType = 'car') {
  const config = CAMERA_MODES[mode] || CAMERA_MODES.third;
  const vehicleConfig = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES.car;

  const behindM = config.behindMeters;
  const bearingRad = (bearing || 0) * Math.PI / 180;
  const behindRad = bearingRad + Math.PI;

  const latRad = position.lat * Math.PI / 180;
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos(latRad);

  const camLng = position.lng + (Math.sin(behindRad) * behindM) / metersPerDegLng;
  const camLat = position.lat + (Math.cos(behindRad) * behindM) / metersPerDegLat;

  // Add subtle cinematic sway for more dynamic feel
  const swayAmount = 0.000015;
  const swayLng = Math.sin(bearingRad * 2) * swayAmount;
  const swayLat = Math.cos(bearingRad * 3) * swayAmount;

  return {
    center: [camLng + swayLng, camLat + swayLat],
    zoom: config.zoom + (vehicleConfig.zoomBoost || 0),
    pitch: config.pitch,
    bearing: bearing || 0
  };
}
