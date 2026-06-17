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

    await db.prepare(`
      INSERT INTO overrides (lot_id, price, status, tags, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(lot_id) DO UPDATE SET
        price = excluded.price,
        status = excluded.status,
        tags = excluded.tags,
        description = excluded.description,
        updated_at = excluded.updated_at
    `).bind(
      lotId,
      price !== undefined && price !== null ? price : null,
      status || 'Disponible',
      tags || '',
      description || '',
      Date.now()
    ).run();

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
