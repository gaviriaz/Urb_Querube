/**
 * Convierte capas SIG (GPKG/SHP) a GeoJSON WGS84 en public/data/
 * Fuente: Cotas.gpkg, Loteo.gpkg, Manzana.gpkg, predio.shp, Vias.gpkg
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const wkx = require('wkx');
const proj4 = require('proj4');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, '..', 'public', 'data');

proj4.defs(
  'EPSG:9377',
  '+proj=tmerc +lat_0=4 +lon_0=-73 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs'
);
const toWgs84 = proj4('EPSG:9377', 'EPSG:4326');

function parseGpkgGeometry(buffer) {
  if (!buffer || buffer.length < 8) return null;
  let wkb = buffer;
  if (buffer[0] === 0x47 && buffer[1] === 0x50) {
    const flags = buffer[3];
    const envelopeType = (flags >> 1) & 0x07;
    const envelopeSizes = [0, 32, 48, 48, 64];
    const headerSize = 8 + (envelopeSizes[envelopeType] || 0);
    wkb = buffer.slice(headerSize);
  }
  return wkx.Geometry.parse(wkb).toGeoJSON();
}

function transformCoords(coords) {
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    const [lng, lat] = toWgs84.forward([coords[0], coords[1]]);
    return [lng, lat];
  }
  return coords.map(transformCoords);
}

function reprojectGeometry(geometry) {
  if (!geometry) return null;
  return {
    type: geometry.type,
    coordinates: transformCoords(geometry.coordinates)
  };
}

function cleanProperties(props) {
  const clean = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === 'geom' || key === 'geometry') continue;
    clean[key] = value;
  }
  return clean;
}

function exportGpkg(gpkgPath, tableName, geomColumn, outFile) {
  const db = new Database(gpkgPath, { readonly: true });
  const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
  db.close();

  const features = rows.map((row) => {
    const geomBuf = row[geomColumn];
    const geometry = reprojectGeometry(parseGpkgGeometry(geomBuf));
    const properties = cleanProperties(row);
    return { type: 'Feature', geometry, properties };
  }).filter((f) => f.geometry);

  const geojson = { type: 'FeatureCollection', features };
  const outPath = path.join(OUT, outFile);
  fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2), 'utf8');
  console.log(`✅ ${outFile}: ${features.length} features`);
  return features.length;
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

exportGpkg(path.join(ROOT, 'Loteo.gpkg'), 'predio', 'geom', 'loteo.geojson');
exportGpkg(path.join(ROOT, 'Manzana.gpkg'), 'disuelto', 'geom', 'manzana.geojson');
exportGpkg(path.join(ROOT, 'Vias.gpkg'), 'Vias', 'geometry', 'vias.geojson');
exportGpkg(path.join(ROOT, 'Cotas.gpkg'), 'lneas', 'geom', 'cotas.geojson');

// predio.shp: conservar si ya está en WGS84 y es válido
const predioOut = path.join(OUT, 'predio.geojson');
const predioShp = path.join(ROOT, 'predio.shp');
if (fs.existsSync(predioOut)) {
  console.log(`ℹ️  predio.geojson conservado (exportar predio.shp manualmente si necesita actualización)`);
} else if (fs.existsSync(predioShp)) {
  console.warn('⚠️  predio.shp encontrado pero sin conversor SHP; exporte predio.geojson desde QGIS.');
}

console.log('\n🔄 Ejecute: node rename_lots_clockwise.cjs');
