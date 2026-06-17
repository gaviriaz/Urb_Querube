import { Router } from 'express';
import { prisma } from '../utils/db';
import { verifyJWT } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// GET all lotes
router.get('/', async (req, res) => {
  try {
    const lotes = await prisma.lote.findMany({
      include: {
        reservas: true
      },
      orderBy: { numero: 'asc' }
    });

    // Format response
    const formatted = lotes.map(lote => ({
      id: lote.id,
      numero: lote.numero,
      metraje: lote.metraje,
      precio: lote.precio,
      estado: lote.estado,
      position: { x: lote.x, y: lote.y, z: lote.z },
      disponible: lote.estado === 'DISPONIBLE'
    }));

    res.json(formatted);
  } catch (err) {
    logger.error('Error getting lotes:', err);
    res.status(500).json({ message: 'Error al obtener lotes' });
  }
});

// GET lote by ID
router.get('/:id', async (req, res) => {
  try {
    const loteId = parseInt(req.params.id, 10);
    if (isNaN(loteId)) {
      return res.status(400).json({ message: 'ID de lote inválido' });
    }

    const lote = await prisma.lote.findUnique({
      where: { id: loteId },
      include: { reservas: true }
    });

    if (!lote) {
      return res.status(404).json({ message: 'Lote no encontrado' });
    }

    res.json({
      id: lote.id,
      numero: lote.numero,
      metraje: lote.metraje,
      precio: lote.precio,
      estado: lote.estado,
      position: { x: lote.x, y: lote.y, z: lote.z }
    });
  } catch (err) {
    logger.error('Error getting lote:', err);
    res.status(500).json({ message: 'Error al obtener lote' });
  }
});

// UPDATE lote estado (protected)
router.patch('/:id/estado', verifyJWT, async (req, res) => {
  try {
    const loteId = parseInt(req.params.id, 10);
    if (isNaN(loteId)) {
      return res.status(400).json({ message: 'ID de lote inválido' });
    }

    const { estado } = req.body;
    
    if (!['DISPONIBLE', 'RESERVADO', 'VENDIDO'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const lote = await prisma.lote.update({
      where: { id: loteId },
      data: { estado: estado as any }
    });

    logger.info(`Lote ${lote.numero} estado actualizado: ${estado}`);

    // Emit WebSocket event
    const wsServer = req.app.get('wsServer');
    if (wsServer && typeof wsServer.broadcast === 'function') {
      wsServer.broadcast('loteEstadoActualizado', {
        loteId: lote.id,
        estado: estado
      });
    }

    res.json({ success: true, lote });
  } catch (err) {
    logger.error('Error updating lote estado:', err);
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
});

export default router;
