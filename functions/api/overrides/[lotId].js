async function getCryptoKey(secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function verifyToken(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [base64Payload, signatureHex] = parts;
    const key = await getCryptoKey(secret);
    const encoder = new TextEncoder();
    
    const expectedBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(base64Payload)
    );
    const expectedArray = Array.from(new Uint8Array(expectedBuffer));
    const expectedHex = expectedArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (expectedHex !== signatureHex) return null;
    
    const jsonStr = decodeURIComponent(escape(atob(base64Payload)));
    const payload = JSON.parse(jsonStr);
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const db = env.DB;
  const lotId = params.lotId;

  if (!db) {
    return new Response(JSON.stringify({ error: "Base de datos D1 no configurada." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Verify Auth Token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "No autorizado. Token faltante." }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = env.ADMIN_JWT_SECRET || "querube-secret-key-123456789-prod-fallback";
  const decoded = await verifyToken(token, JWT_SECRET);

  if (!decoded) {
    return new Response(JSON.stringify({ error: "Token inválido o expirado." }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const { price, status, tags, description } = body;

    // 1. Fetch current values for comparison
    const existing = await db.prepare("SELECT * FROM overrides WHERE lot_id = ?").bind(lotId).first();
    const oldPrice = existing ? existing.price : null;
    const oldStatus = existing ? existing.status : 'Disponible';
    const oldTags = existing ? existing.tags : '';
    const oldDescription = existing ? existing.description : '';

    const now = Date.now();
    const newPrice = price !== undefined && price !== null ? price : null;
    const newStatus = status || 'Disponible';
    const newTags = tags || '';
    const newDescription = description || '';

    const statements = [];

    if (newPrice !== oldPrice) {
      statements.push(db.prepare("INSERT INTO overrides_log (lot_id, field_changed, old_value, new_value, timestamp) VALUES (?, ?, ?, ?, ?)")
        .bind(lotId, 'price', String(oldPrice), String(newPrice), now));
    }
    if (newStatus !== oldStatus) {
      statements.push(db.prepare("INSERT INTO overrides_log (lot_id, field_changed, old_value, new_value, timestamp) VALUES (?, ?, ?, ?, ?)")
        .bind(lotId, 'status', oldStatus, newStatus, now));
    }
    if (newTags !== oldTags) {
      statements.push(db.prepare("INSERT INTO overrides_log (lot_id, field_changed, old_value, new_value, timestamp) VALUES (?, ?, ?, ?, ?)")
        .bind(lotId, 'tags', oldTags, newTags, now));
    }
    if (newDescription !== oldDescription) {
      statements.push(db.prepare("INSERT INTO overrides_log (lot_id, field_changed, old_value, new_value, timestamp) VALUES (?, ?, ?, ?, ?)")
        .bind(lotId, 'description', oldDescription, newDescription, now));
    }

    // 2. Perform the actual upsert
    statements.push(db.prepare(`
      INSERT INTO overrides (lot_id, price, status, tags, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(lot_id) DO UPDATE SET
        price = excluded.price,
        status = excluded.status,
        tags = excluded.tags,
        description = excluded.description,
        updated_at = excluded.updated_at
    `).bind(lotId, newPrice, newStatus, newTags, newDescription, now));

    await db.batch(statements);

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
