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
    const { lot_id, session_id } = body;
    if (!lot_id) {
      return new Response(JSON.stringify({ error: "lot_id es requerido." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await db.prepare("INSERT INTO leads (lot_id, timestamp, session_id) VALUES (?, ?, ?)")
      .bind(lot_id, Date.now(), session_id || 'anonymous')
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
