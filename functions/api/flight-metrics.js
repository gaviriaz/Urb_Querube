export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: "Base de datos D1 no configurada." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const { event_type, station_index, station_label, session_id } = body;
    if (!event_type) {
      return new Response(JSON.stringify({ error: "event_type es requerido." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await db.prepare("INSERT INTO flight_metrics (event_type, station_index, station_label, session_id, timestamp) VALUES (?, ?, ?, ?, ?)")
      .bind(event_type, station_index !== undefined ? station_index : null, station_label || null, session_id || 'anonymous', Date.now())
      .run();

    return new Response(JSON.stringify({ success: true }), {
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
