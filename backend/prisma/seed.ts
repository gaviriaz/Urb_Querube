import { PrismaClient, LoteEstado } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Centroid calculator helper
function getCentroid(coords: any): [number, number] {
  const points: [number, number][] = [];
  function collect(arr: any) {
    if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
      points.push([arr[0], arr[1]]);
    } else if (Array.isArray(arr)) {
      arr.forEach(collect);
    }
  }
  collect(coords);
  if (points.length === 0) return [0, 0];
  const lon = points.reduce((s, p) => s + p[0], 0) / points.length;
  const lat = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [lon, lat];
}

// Convert SQLite status to Prisma enum
function mapSqliteStatusToEnum(status: string): LoteEstado {
  const norm = String(status).trim().toUpperCase();
  if (norm === 'RESERVADO') return LoteEstado.RESERVADO;
  if (norm === 'VENDIDO') return LoteEstado.VENDIDO;
  return LoteEstado.DISPONIBLE;
}

async function main() {
  console.log('Iniciando sembrado de la base de datos...');

  const geojsonPath = path.join(__dirname, '../../public/data/loteo.geojson');
  if (!fs.existsSync(geojsonPath)) {
    throw new Error(`GeoJSON loteo no encontrado en la ruta: ${geojsonPath}`);
  }

  const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
  const features = geojsonData.features.filter((f: any) => f.properties.LOTE !== 'REMANENTE');

  console.log(`Leídos ${features.length} lotes desde GeoJSON.`);

  // Try to load sqlite overrides
  let sqliteOverrides: Record<string, any> = {};
  const dbPath = path.join(__dirname, '../../overrides.db');
  if (fs.existsSync(dbPath)) {
    try {
      // Import better-sqlite3 dynamically
      const Database = require('better-sqlite3');
      const db = new Database(dbPath);
      const rows = db.prepare("SELECT * FROM overrides").all();
      rows.forEach((row: any) => {
        sqliteOverrides[row.lot_id] = row;
      });
      console.log(`Cargadas ${rows.length} filas de overrides desde SQLite.`);
    } catch (e: any) {
      console.warn('No se pudo leer overrides.db de SQLite, continuando con valores por defecto.', e.message);
    }
  }

  let seededCount = 0;

  for (const feature of features) {
    const props = feature.properties || {};
    const geom = feature.geometry || {};
    
    // Find unique lot ID
    const lotId = Number(props.fid ?? props.OBJECTID ?? props.GLOBALID);
    if (isNaN(lotId)) {
      console.warn('Saltando lote con ID no numérico:', props);
      continue;
    }

    const number = parseInt(props.ETIQUETA || '0', 10);
    const area = Math.round(Number(props['SHAPE.AREA'] ?? props.AREA_M2 ?? 120));

    // Get centroid for position
    const centroid = getCentroid(geom.coordinates);

    // Look for existing overrides in SQLite database
    const sqliteOverride = sqliteOverrides[String(lotId)];
    const price = sqliteOverride ? Number(sqliteOverride.price) : 150000000; // default 150M COP
    const estado = sqliteOverride ? mapSqliteStatusToEnum(sqliteOverride.status) : LoteEstado.DISPONIBLE;
    const tags = sqliteOverride ? sqliteOverride.tags : (props._MANZANA ? `Manzana ${props._MANZANA}` : null);
    const description = sqliteOverride ? sqliteOverride.description : `Lote en Urbanización Querube, Manzana ${props._MANZANA || 'N/A'}`;

    await prisma.lote.upsert({
      where: { id: lotId },
      update: {
        numero: number,
        metraje: area,
        precio: price,
        estado,
        x: centroid[0],
        y: centroid[1],
        z: 0.0,
        tags,
        description
      },
      create: {
        id: lotId,
        numero: number,
        metraje: area,
        precio: price,
        estado,
        x: centroid[0],
        y: centroid[1],
        z: 0.0,
        tags,
        description
      }
    });

    seededCount++;
  }

  console.log(`Se sembraron/actualizaron con éxito ${seededCount} lotes en PostgreSQL.`);
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
