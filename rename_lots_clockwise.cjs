/**
 * Rename lots sequentially (Lt 1 → Lt N) in clockwise order per Manzana.
 * 
 * Algorithm:
 * 1. Group lots by Manzana (MZ-001, MZ-002, etc.)
 * 2. Sort manzanas by their centroid position (south→north, east→west) 
 * 3. Within each manzana, compute the angle from the manzana centroid to each lot centroid
 * 4. Sort lots clockwise (starting from 12 o'clock / north, going clockwise)
 * 5. Assign sequential labels: Lt 1, Lt 2, ...
 */

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'public', 'data', 'loteo.geojson');
const OUTPUT = path.join(__dirname, 'public', 'data', 'loteo.geojson');

// Parse GeoJSON
const raw = fs.readFileSync(INPUT, 'utf8');
const geojson = JSON.parse(raw);

// Robust centroid calculator
function getCentroid(coords, geomType) {
  const points = [];
  function collect(arr) {
    if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
      points.push(arr);
    } else if (Array.isArray(arr)) {
      arr.forEach(collect);
    }
  }
  collect(coords);
  if (points.length === 0) return null;
  const lon = points.reduce((s, p) => s + p[0], 0) / points.length;
  const lat = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [lon, lat];
}

// Separate REMANENTE and actual lots
const remanentes = geojson.features.filter(f => f.properties.LOTE === 'REMANENTE');
const lots = geojson.features.filter(f => f.properties.LOTE !== 'REMANENTE');

console.log(`Total features: ${geojson.features.length}`);
console.log(`Lots: ${lots.length}, Remanentes: ${remanentes.length}`);

// Add centroid to each lot
lots.forEach(lot => {
  lot._centroid = getCentroid(lot.geometry.coordinates, lot.geometry.type);
});

// Group by Manzana
const manzanaMap = {};
lots.forEach(lot => {
  const mz = lot.properties.Manzana || 'UNKNOWN';
  if (!manzanaMap[mz]) manzanaMap[mz] = [];
  manzanaMap[mz].push(lot);
});

const manzanaNames = Object.keys(manzanaMap).sort(); // MZ-001, MZ-002, ...
console.log(`Manzanas: ${manzanaNames.join(', ')}`);

// For each manzana, compute manzana centroid, then sort lots clockwise
let globalLotNumber = 1;

manzanaNames.forEach(mzName => {
  const mzLots = manzanaMap[mzName];
  
  // Manzana centroid
  const mzCentroid = [
    mzLots.reduce((s, l) => s + (l._centroid ? l._centroid[0] : 0), 0) / mzLots.length,
    mzLots.reduce((s, l) => s + (l._centroid ? l._centroid[1] : 0), 0) / mzLots.length
  ];

  // Compute angle from manzana centroid to each lot centroid
  // atan2 gives angle from east (positive X axis), we want clockwise from north
  mzLots.forEach(lot => {
    if (!lot._centroid) {
      lot._angle = 999;
      return;
    }
    const dx = lot._centroid[0] - mzCentroid[0]; // east-west
    const dy = lot._centroid[1] - mzCentroid[1]; // north-south
    // atan2(dx, dy) gives angle from north, clockwise
    let angle = Math.atan2(dx, dy) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    lot._angle = angle;
  });

  // Sort clockwise (ascending angle from north)
  mzLots.sort((a, b) => a._angle - b._angle);

  // Assign sequential labels
  mzLots.forEach(lot => {
    lot.properties.ETIQUETA = String(globalLotNumber);
    lot.properties.LOTE = 'LT';
    lot.properties._LABEL = `Lt ${globalLotNumber}`;
    lot.properties._MANZANA = mzName;
    console.log(`  Lt ${globalLotNumber} (fid=${lot.properties.fid}, ${mzName}, angle=${lot._angle.toFixed(1)}°)`);
    globalLotNumber++;
  });
});

console.log(`\nTotal lots renamed: ${globalLotNumber - 1}`);

// Clean up temp properties and reassemble
const allFeatures = [];

// Add lots first (in new order)
manzanaNames.forEach(mzName => {
  manzanaMap[mzName].forEach(lot => {
    delete lot._centroid;
    delete lot._angle;
    allFeatures.push(lot);
  });
});

// Then add remanentes
remanentes.forEach(r => allFeatures.push(r));

// Write output
const output = {
  type: 'FeatureCollection',
  features: allFeatures
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');
console.log(`\n✅ Wrote ${OUTPUT} with ${allFeatures.length} features`);
