const DEFAULT_PASSWORD_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"; // SHA-256 of 'admin123'

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

async function signToken(payload, secret) {
  const encoder = new TextEncoder();
  const key = await getCryptoKey(secret);
  const jsonStr = JSON.stringify(payload);
  const base64Payload = btoa(unescape(encodeURIComponent(jsonStr)));
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(base64Payload)
  );
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${base64Payload}.${signatureHex}`;
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const ip = request.headers.get("CF-Connecting-IP") || "127.0.0.1";
  const now = Date.now();
  const db = env.DB;

  const JWT_SECRET = env.ADMIN_JWT_SECRET || "querube-secret-key-123456789-prod-fallback";

  // Create tables if they do not exist (D1 initialization check)
  if (db) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS overrides (
        lot_id TEXT PRIMARY KEY,
        price REAL,
        status TEXT,
        tags TEXT,
        description TEXT,
        updated_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS login_attempts (
        ip TEXT PRIMARY KEY,
        attempts INTEGER,
        last_attempt INTEGER
      );
    `);
  }

  // Rate Limiting Check
  if (db) {
    const attempt = await db.prepare("SELECT * FROM login_attempts WHERE ip = ?").bind(ip).first();
    if (attempt) {
      if (attempt.attempts >= 5 && attempt.last_attempt > now - 10 * 60 * 1000) {
        return new Response(JSON.stringify({ error: "Demasiados intentos. Intente de nuevo en 10 minutos." }), {
          status: 429,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  }

  try {
    const body = await request.json();
    const { password } = body;

    const expectedHash = env.ADMIN_PASSWORD_HASH || DEFAULT_PASSWORD_HASH;
    const inputHash = await hashPassword(password || "");

    if (inputHash === expectedHash) {
      if (db) {
        await db.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
      }

      const token = await signToken({ user: "admin", exp: now + 12 * 60 * 60 * 1000 }, JWT_SECRET);
      return new Response(JSON.stringify({ token }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      if (db) {
        const attempt = await db.prepare("SELECT * FROM login_attempts WHERE ip = ?").bind(ip).first();
        if (attempt) {
          const newAttempts = attempt.last_attempt > now - 10 * 60 * 1000 ? attempt.attempts + 1 : 1;
          await db.prepare("UPDATE login_attempts SET attempts = ?, last_attempt = ? WHERE ip = ?")
            .bind(newAttempts, now, ip).run();
        } else {
          await db.prepare("INSERT INTO login_attempts (ip, attempts, last_attempt) VALUES (?, 1, ?)")
            .bind(ip, now).run();
        }
      }

      return new Response(JSON.stringify({ error: "Contraseña incorrecta." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Petición inválida." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
