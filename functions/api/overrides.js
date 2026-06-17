export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;

  if (!db) {
    // Return empty overrides map if D1 is not bound yet (development or unconfigured state)
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Ensure tables exist just in case
    await db.exec(`
      CREATE TABLE IF NOT EXISTS overrides (
        lot_id TEXT PRIMARY KEY,
        price REAL,
        status TEXT,
        tags TEXT,
        description TEXT,
        updated_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS overrides_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_id TEXT,
        field_changed TEXT,
        old_value TEXT,
        new_value TEXT,
        timestamp INTEGER
      );
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_id TEXT,
        timestamp INTEGER,
        session_id TEXT
      );
      CREATE TABLE IF NOT EXISTS flight_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT,
        station_index INTEGER,
        station_label TEXT,
        session_id TEXT,
        timestamp INTEGER
      );
    `);

    const { results } = await db.prepare("SELECT * FROM overrides").all();
    const overridesMap = {};
    results.forEach(row => {
      overridesMap[row.lot_id] = {
        price: row.price,
        status: row.status,
        tags: row.tags,
        description: row.description
      };
    });

    return new Response(JSON.stringify(overridesMap), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
