const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', '..', 'Loteo.gpkg'), { readonly: true });
const rows = db.prepare('SELECT fid, "SHAPE.AREA", "SHAPE.LEN", LOTE, ETIQUETA, Manzana FROM predio ORDER BY fid LIMIT 10').all();
console.log(rows);
const stats = db.prepare('SELECT MIN("SHAPE.AREA") as minA, MAX("SHAPE.AREA") as maxA, COUNT(*) as c FROM predio').get();
console.log('stats:', stats);
db.close();
