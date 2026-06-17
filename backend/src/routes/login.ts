import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { cache } from '../utils/redis';

const router = Router();

const DEFAULT_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; // SHA-256 of 'admin123'
const JWT_SECRET = process.env.JWT_SECRET || 'querube-secret-key-123456789-prod-fallback';

// Helper to hash password
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

router.post('/', async (req, res) => {
  try {
    const { password } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const ipStr = Array.isArray(clientIp) ? clientIp[0] : String(clientIp);
    const key = `login_attempts:${ipStr}`;

    // Get current failed attempts from Redis
    const attempts = Number(await cache.get(key) || 0);

    if (attempts >= 5) {
      return res.status(429).json({ error: 'Demasiados intentos. Intente de nuevo en 10 minutos.' });
    }

    const expectedHash = process.env.ADMIN_PASSWORD_HASH || DEFAULT_PASSWORD_HASH;
    const inputHash = hashPassword(password || '');

    if (inputHash === expectedHash) {
      // Clear failed attempts in Redis
      await cache.del(key);

      // Generate JWT
      const token = jwt.sign({ user: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
      
      logger.info(`Admin logged in successfully from IP ${ipStr}`);
      return res.json({ token });
    } else {
      // Increment failed attempts count
      const newAttempts = await cache.incr(key);
      if (newAttempts === 1) {
        await cache.expire(key, 10 * 60); // 10 minutes expiry
      }

      logger.warn(`Failed login attempt (${newAttempts}/5) from IP ${ipStr}`);
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }
  } catch (err) {
    logger.error('Error in login router:', err);
    res.status(500).json({ error: 'Error interno en login' });
  }
});

export default router;
