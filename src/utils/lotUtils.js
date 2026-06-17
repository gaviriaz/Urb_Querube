import maplibregl from 'maplibre-gl';

const degToRad = (deg) => deg * Math.PI / 180;

export const haversineDistanceMeters = (coordA, coordB) => {
  if (!coordA || !coordB) return 0;
  const [lon1, lat1] = coordA;
  const [lon2, lat2] = coordB;
  const R = 6371000;
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const computeRingAreaMeters = (ring) => {
  if (!Array.isArray(ring) || ring.length < 3) return 0;
  const mercator = ring.map((coord) => maplibregl.MercatorCoordinate.fromLngLat(coord));
  let area = 0;
  for (let i = 0; i < mercator.length; i++) {
    const current = mercator[i];
    const next = mercator[(i + 1) % mercator.length];
    area += (current.x * next.y) - (next.x * current.y);
  }
  return Math.abs(area) * 0.5;
};

const computeRingPerimeterMeters = (ring) => {
  if (!Array.isArray(ring) || ring.length < 2) return 0;
  let perimeter = 0;
  for (let i = 1; i < ring.length; i++) {
    perimeter += haversineDistanceMeters(ring[i - 1], ring[i]);
  }
  return perimeter;
};

export const computeFeatureMetrics = (feature) => {
  const props = feature?.properties || {};
  const geom = feature?.geometry;
  let area = Number(props['SHAPE.AREA'] ?? props.SHAPE_AREA ?? props.AREA_M2 ?? 0) || 0;
  let perimeter = Number(props['SHAPE.LEN'] ?? props.SHAPE_LEN ?? props.PERIMETER_M ?? 0) || 0;

  // SHAPE.LEN en la fuente SIG suele ser el perímetro del predio completo, no del lote
  const suspectPerimeter = perimeter > 500;
  const suspectArea = area > 5000;

  if (geom) {
    const coords = geom.coordinates;
    if (geom.type === 'Polygon') {
      const outerRing = coords[0];
      if (suspectArea || !area) area = computeRingAreaMeters(outerRing);
      if (suspectPerimeter || !perimeter) perimeter = computeRingPerimeterMeters(outerRing);
    } else if (geom.type === 'MultiPolygon') {
      if (suspectArea || !area) {
        area = 0;
        coords.forEach((polygon) => { area += computeRingAreaMeters(polygon[0]); });
      }
      if (suspectPerimeter || !perimeter) {
        perimeter = 0;
        coords.forEach((polygon) => { perimeter += computeRingPerimeterMeters(polygon[0]); });
      }
    }
  }

  return {
    AREA_M2: Math.round(area),
    PERIMETER_M: Math.round(perimeter)
  };
};

export const getLotDisplayLabel = (props = {}) => {
  if (props._LABEL && String(props._LABEL).trim()) {
    return String(props._LABEL).trim();
  }

  const etiqueta = props.ETIQUETA;
  if (etiqueta !== undefined && etiqueta !== null && String(etiqueta).trim() && String(etiqueta) !== '0') {
    return `Lt ${String(etiqueta).trim()}`;
  }

  const lote = props.LOTE;
  if (lote && String(lote).trim() && !['LT', 'REMANENTE'].includes(String(lote).trim().toUpperCase())) {
    return String(lote).trim();
  }

  const fid = props.fid ?? props.OBJECTID ?? props.GLOBALID ?? 'N/A';
  return `Lote ${fid}`;
};

export const extractLotInfo = (feature) => {
  const props = feature?.properties || feature || {};
  const geom = feature?.geometry;
  const metrics = computeFeatureMetrics(feature || { properties: props, geometry: geom });
  const id = props.fid ?? props.OBJECTID ?? props.GLOBALID;

  return {
    id,
    label: getLotDisplayLabel(props),
    area: metrics.AREA_M2,
    len: metrics.PERIMETER_M,
    matricula: props.MATRICULA || props.CIRCULO_MA || 'N/A',
    npn: props.NPN || 'N/A',
    direccion: props.DIRECCION || 'N/A',
    manzana: props.Manzana || props._MANZANA || '',
    geomCoordinates: geom?.coordinates,
    geometryType: geom?.type
  };
};

export const normalizeLoteoFeatures = (loteoGeojson) => {
  if (!loteoGeojson?.features) return null;
  return {
    ...loteoGeojson,
    features: loteoGeojson.features.map((feature) => {
      const metrics = computeFeatureMetrics(feature);
      const props = feature.properties || {};
      const label = getLotDisplayLabel({ ...props, _LABEL: props._LABEL });
      return {
        ...feature,
        properties: {
          ...props,
          ...metrics,
          _LABEL: props._LABEL || label
        }
      };
    })
  };
};
