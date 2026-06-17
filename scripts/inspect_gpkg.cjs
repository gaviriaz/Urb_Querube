const Database = require('better-sqlite3');
const path = require('path');

const files = ['Loteo.gpkg', 'Manzana.gpkg', 'Vias.gpkg', 'Cotas.gpkg', 'predio.shp'];
const base = path.join(__dirname, '..', '..');

for (const file of ['Loteo.gpkg', 'Manzana.gpkg', 'Vias.gpkg', 'Cotas.gpkg']) {
  const fp = path.join(base, file);
  const db = new Database(fp, { readonly: true });
  const tables = db.prepare('SELECT table_name, column_name, geometry_type_name, srs_id FROM gpkg_geometry_columns').all();
  console.log(`\n=== ${file} ===`);
  console.log(tables);
  for (const t of tables) {
    const count = db.prepare(`SELECT COUNT(*) as c FROM "${t.table_name}"`).get();
    const sample = db.prepare(`SELECT * FROM "${t.table_name}" LIMIT 1`).get();
    console.log(`  ${t.table_name}: ${count.c} features, columns:`, Object.keys(sample || {}));
  }
  db.close();
}
