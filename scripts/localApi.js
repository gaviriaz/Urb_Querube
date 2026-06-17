import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'overrides.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
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
    session_id TEXT,
    qualifier TEXT
  );

  CREATE TABLE IF NOT EXISTS flight_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT,
    station_index INTEGER,
    station_label TEXT,
    session_id TEXT,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS lot_clicks (
    lot_id TEXT PRIMARY KEY,
    click_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS session_heartbeats (
    session_id TEXT PRIMARY KEY,
    timestamp INTEGER
  );
`);

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "querube-secret-key-123456789-local-dev";
// SHA-256 of 'admin123'
const DEFAULT_PASSWORD_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

// Helpers
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

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || '127.0.0.1';
}

export default async function handleLocalApi(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  const url = new URL(req.url, 'http://localhost');
  const pathParts = url.pathname.split('/').filter(Boolean); // e.g. ["api", "overrides"]

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    // GET /api/overrides
    if (req.method === 'GET' && pathParts[0] === 'api' && pathParts[1] === 'overrides' && pathParts.length === 2) {
      const rows = db.prepare("SELECT * FROM overrides").all();
      const overridesMap = {};
      rows.forEach(row => {
        overridesMap[row.lot_id] = {
          price: row.price,
          status: row.status,
          tags: row.tags,
          description: row.description
        };
      });
      res.statusCode = 200;
      res.end(JSON.stringify(overridesMap));
      return;
    }

    // POST /api/login
    if (req.method === 'POST' && pathParts[0] === 'api' && pathParts[1] === 'login' && pathParts.length === 2) {
      const ip = getClientIp(req);
      const now = Date.now();

      // Check rate limit (max 5 attempts per 10 minutes)
      const attempt = db.prepare("SELECT * FROM login_attempts WHERE ip = ?").get(ip);
      if (attempt) {
        if (attempt.attempts >= 5 && attempt.last_attempt > now - 10 * 60 * 1000) {
          res.statusCode = 429;
          res.end(JSON.stringify({ error: "Demasiados intentos. Intente de nuevo en 10 minutos." }));
          return;
        }
      }

      const body = await parseJsonBody(req);
      const { password } = body;

      const expectedHash = process.env.ADMIN_PASSWORD_HASH || DEFAULT_PASSWORD_HASH;
      const inputHash = await hashPassword(password || "");

      if (inputHash === expectedHash) {
        // Success: reset rate limit
        db.prepare("DELETE FROM login_attempts WHERE ip = ?").run(ip);

        // Sign token (expires in 12 hours)
        const token = await signToken({ user: "admin", exp: now + 12 * 60 * 60 * 1000 }, JWT_SECRET);
        res.statusCode = 200;
        res.end(JSON.stringify({ token }));
      } else {
        // Failure: increment rate limit
        if (attempt) {
          const newAttempts = attempt.last_attempt > now - 10 * 60 * 1000 ? attempt.attempts + 1 : 1;
          db.prepare("UPDATE login_attempts SET attempts = ?, last_attempt = ? WHERE ip = ?")
            .run(newAttempts, now, ip);
        } else {
          db.prepare("INSERT INTO login_attempts (ip, attempts, last_attempt) VALUES (?, ?, ?)")
            .run(ip, 1, now);
        }
        res.statusCode = 401;
        res.end(JSON.stringify({ error: "Contraseña incorrecta." }));
      }
      return;
    }

    // POST /api/overrides/:lotId
    if (req.method === 'POST' && pathParts[0] === 'api' && pathParts[1] === 'overrides' && pathParts.length === 3) {
      const lotId = pathParts[2];

      // Validate authentication token
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: "No autorizado. Token faltante." }));
        return;
      }

      const token = authHeader.substring(7);
      const decoded = await verifyToken(token, JWT_SECRET);
      if (!decoded) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: "Token inválido o expirado." }));
        return;
      }

      const body = await parseJsonBody(req);
      const { price, status, tags, description } = body;

      // 1. Fetch current values for comparison
      const existing = db.prepare("SELECT * FROM overrides WHERE lot_id = ?").get(lotId);
      const oldPrice = existing ? existing.price : null;
      const oldStatus = existing ? existing.status : 'Disponible';
      const oldTags = existing ? existing.tags : '';
      const oldDescription = existing ? existing.description : '';

      // 2. Perform comparison and write logs
      const now = Date.now();
      const newPrice = price !== undefined && price !== null ? price : null;
      const newStatus = status || 'Disponible';
      const newTags = tags || '';
      const newDescription = description || '';

      if (newPrice !== oldPrice) {
        db.prepare("INSERT INTO overrides_log (lot_id, field_changed, old_value, new_value, timestamp) VALUES (?, ?, ?, ?, ?)")
          .run(lotId, 'price', String(oldPrice), String(newPrice), now);
      }
      if (newStatus !== oldStatus) {
        db.prepare("INSERT INTO overrides_log (lot_id, field_changed, old_value, new_value, timestamp) VALUES (?, ?, ?, ?, ?)")
          .run(lotId, 'status', oldStatus, newStatus, now);
      }
      if (newTags !== oldTags) {
        db.prepare("INSERT INTO overrides_log (lot_id, field_changed, old_value, new_value, timestamp) VALUES (?, ?, ?, ?, ?)")
          .run(lotId, 'tags', oldTags, newTags, now);
      }
      if (newDescription !== oldDescription) {
        db.prepare("INSERT INTO overrides_log (lot_id, field_changed, old_value, new_value, timestamp) VALUES (?, ?, ?, ?, ?)")
          .run(lotId, 'description', oldDescription, newDescription, now);
      }

      // 3. Upsert values
      db.prepare(`
        INSERT INTO overrides (lot_id, price, status, tags, description, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(lot_id) DO UPDATE SET
          price = excluded.price,
          status = excluded.status,
          tags = excluded.tags,
          description = excluded.description,
          updated_at = excluded.updated_at
      `).run(lotId, newPrice, newStatus, newTags, newDescription, now);

      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // POST /api/leads
    if (req.method === 'POST' && pathParts[0] === 'api' && pathParts[1] === 'leads' && pathParts.length === 2) {
      const body = await parseJsonBody(req);
      const { lot_id, session_id, qualifier } = body;
      if (!lot_id) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "lot_id es requerido." }));
        return;
      }
      db.prepare("INSERT INTO leads (lot_id, timestamp, session_id, qualifier) VALUES (?, ?, ?, ?)")
        .run(lot_id, Date.now(), session_id || 'anonymous', qualifier ? JSON.stringify(qualifier) : null);

      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // POST /api/flight-metrics
    if (req.method === 'POST' && pathParts[0] === 'api' && pathParts[1] === 'flight-metrics' && pathParts.length === 2) {
      const body = await parseJsonBody(req);
      const { event_type, station_index, station_label, session_id } = body;
      if (!event_type) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "event_type es requerido." }));
        return;
      }
      db.prepare("INSERT INTO flight_metrics (event_type, station_index, station_label, session_id, timestamp) VALUES (?, ?, ?, ?, ?)")
        .run(event_type, station_index !== undefined ? station_index : null, station_label || null, session_id || 'anonymous', Date.now());

      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // GET /api/clicks
    if (req.method === 'GET' && pathParts[0] === 'api' && pathParts[1] === 'clicks' && pathParts.length === 2) {
      const rows = db.prepare("SELECT * FROM lot_clicks").all();
      const clicksMap = {};
      rows.forEach(row => {
        clicksMap[row.lot_id] = row.click_count;
      });
      res.statusCode = 200;
      res.end(JSON.stringify(clicksMap));
      return;
    }

    // POST /api/clicks/:lotId
    if (req.method === 'POST' && pathParts[0] === 'api' && pathParts[1] === 'clicks' && pathParts.length === 3) {
      const lotId = pathParts[2];
      db.prepare(`
        INSERT INTO lot_clicks (lot_id, click_count)
        VALUES (?, 1)
        ON CONFLICT(lot_id) DO UPDATE SET click_count = click_count + 1
      `).run(lotId);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // POST /api/heartbeat
    if (req.method === 'POST' && pathParts[0] === 'api' && pathParts[1] === 'heartbeat' && pathParts.length === 2) {
      const body = await parseJsonBody(req);
      const { session_id } = body;
      if (session_id) {
        db.prepare(`
          INSERT INTO session_heartbeats (session_id, timestamp)
          VALUES (?, ?)
          ON CONFLICT(session_id) DO UPDATE SET timestamp = excluded.timestamp
        `).run(session_id, Date.now());
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // GET /api/stats
    if (req.method === 'GET' && pathParts[0] === 'api' && pathParts[1] === 'stats' && pathParts.length === 2) {
      const now = Date.now();
      
      // Clean old heartbeats (older than 35s)
      db.prepare("DELETE FROM session_heartbeats WHERE timestamp < ?").run(now - 35000);
      
      // Count active heartbeats
      const activeCountRow = db.prepare("SELECT COUNT(*) as cnt FROM session_heartbeats").get();
      const rawActive = activeCountRow ? activeCountRow.cnt : 0;
      // Social proof fallback: at least 3 active sessions simulated if no real activity
      const activeSessions = Math.max(3, rawActive + Math.floor(Math.random() * 3));

      // Count sold/reserved lots from overrides
      const soldRow = db.prepare("SELECT COUNT(*) as cnt FROM overrides WHERE status = 'Vendido'").get();
      const reservedRow = db.prepare("SELECT COUNT(*) as cnt FROM overrides WHERE status = 'Reservado'").get();
      const soldCount = (soldRow ? soldRow.cnt : 0) + (reservedRow ? reservedRow.cnt : 0);

      // Sold this month (updated_at is in current calendar month)
      const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      const monthlyRow = db.prepare("SELECT COUNT(*) as cnt FROM overrides WHERE (status = 'Vendido' OR status = 'Reservado') AND updated_at >= ?").get(currentMonthStart);
      
      // Fallback: if no real sales this month, say 3 sold for nice social proof
      const soldThisMonth = Math.max(3, monthlyRow ? monthlyRow.cnt : 0);

      res.statusCode = 200;
      res.end(JSON.stringify({
        activeSessions,
        soldCount,
        soldThisMonth
      }));
      return;
    }

    // Default 404
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Endpoint no encontrado." }));
  } catch (error) {
    console.error("Local API Error:", error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Error interno del servidor mock." }));
  }
}
