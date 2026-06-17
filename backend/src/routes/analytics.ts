import { Router } from 'express';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';
import { cache } from '../utils/redis';

const router = Router();

// Helper to get client IP
const getClientIp = (req: any): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || '127.0.0.1';
};

// POST /api/analytics
router.post('/analytics', async (req, res) => {
  try {
    const { event, data } = req.body;
    if (!event) {
      return res.status(400).json({ error: 'event es requerido.' });
    }

    const ip = getClientIp(req);
    const analytics = await prisma.analytics.create({
      data: {
        event,
        data: data || {},
        ip
      }
    });

    res.json({ success: true, id: analytics.id });
  } catch (err) {
    logger.error('Error logging analytics:', err);
    res.status(500).json({ error: 'Error al registrar analítica' });
  }
});

// POST /api/leads
router.post('/leads', async (req, res) => {
  try {
    const { lot_id, session_id, qualifier } = req.body;
    if (!lot_id) {
      return res.status(400).json({ error: 'lot_id es requerido.' });
    }

    const parsedLotId = parseInt(lot_id, 10);
    if (isNaN(parsedLotId)) {
      return res.status(400).json({ error: 'lot_id inválido' });
    }

    await prisma.lead.create({
      data: {
        lotId: parsedLotId,
        sessionId: session_id || 'anonymous',
        qualifier: qualifier || null
      }
    });

    res.json({ success: true });
  } catch (err) {
    logger.error('Error registering lead:', err);
    res.status(500).json({ error: 'Error al registrar lead' });
  }
});

// POST /api/flight-metrics
router.post('/flight-metrics', async (req, res) => {
  try {
    const { event_type, station_index, station_label, session_id } = req.body;
    if (!event_type) {
      return res.status(400).json({ error: 'event_type es requerido.' });
    }

    await prisma.flightMetric.create({
      data: {
        eventType: event_type,
        stationIndex: station_index !== undefined ? Number(station_index) : null,
        stationLabel: station_label || null,
        sessionId: session_id || 'anonymous'
      }
    });

    res.json({ success: true });
  } catch (err) {
    logger.error('Error registering flight metric:', err);
    res.status(500).json({ error: 'Error al registrar métrica de vuelo' });
  }
});

// GET /api/clicks
router.get('/clicks', async (req, res) => {
  try {
    const clicks = await prisma.lotClick.findMany();
    const clicksMap: Record<string, number> = {};
    clicks.forEach(c => {
      clicksMap[String(c.lotId)] = c.clickCount;
    });
    res.json(clicksMap);
  } catch (err) {
    logger.error('Error getting clicks:', err);
    res.status(500).json({ error: 'Error al obtener clics' });
  }
});

// POST /api/clicks/:lotId
router.post('/clicks/:lotId', async (req, res) => {
  try {
    const lotId = parseInt(req.params.lotId, 10);
    if (isNaN(lotId)) {
      return res.status(400).json({ error: 'ID de lote inválido' });
    }

    await prisma.lotClick.upsert({
      where: { lotId },
      update: { clickCount: { increment: 1 } },
      create: { lotId, clickCount: 1 }
    });

    res.json({ success: true });
  } catch (err) {
    logger.error('Error logging click:', err);
    res.status(500).json({ error: 'Error al registrar clic' });
  }
});

// POST /api/heartbeat (Uses Redis with automatic 35s TTL)
router.post('/heartbeat', async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id es requerido.' });
    }

    const key = `heartbeat:${session_id}`;
    await cache.set(key, 'active', 35); // Key expires in 35 seconds

    res.json({ success: true });
  } catch (err) {
    logger.error('Error registering heartbeat:', err);
    res.status(500).json({ error: 'Error al registrar heartbeat' });
  }
});

// GET /api/stats
router.get('/stats', async (req, res) => {
  try {
    // Retrieve active keys from Redis
    const keys = await cache.keys('heartbeat:*');
    const activeCount = keys.length;
    
    // Social proof fallback: at least 3 active sessions simulated
    const activeSessions = Math.max(3, activeCount + Math.floor(Math.random() * 3));

    // Count total sold/reserved lots from DB
    const soldOrReservedCount = await prisma.lote.count({
      where: {
        estado: { in: ['VENDIDO', 'RESERVADO'] }
      }
    });

    // Sold this month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyCount = await prisma.lote.count({
      where: {
        estado: { in: ['VENDIDO', 'RESERVADO'] },
        createdAt: { gte: currentMonthStart }
      }
    });

    // Fallback: if no real sales this month, say 3 sold for nice social proof
    const soldThisMonth = Math.max(3, monthlyCount);

    res.json({
      activeSessions,
      soldCount: soldOrReservedCount,
      soldThisMonth
    });
  } catch (err) {
    logger.error('Error getting stats:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
