import { Router } from 'express';
import { prisma } from '../utils/db';
import { verifyJWT } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Map DB enum to UI Status values
const mapEnumToUiStatus = (estado: string): string => {
  if (estado === 'DISPONIBLE') return 'Disponible';
  if (estado === 'RESERVADO') return 'Reservado';
  if (estado === 'VENDIDO') return 'Vendido';
  return 'Disponible';
};

// Map UI Status to DB enum values
const mapUiStatusToEnum = (status: string): 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' => {
  const norm = String(status).trim().toUpperCase();
  if (norm === 'RESERVADO') return 'RESERVADO';
  if (norm === 'VENDIDO') return 'VENDIDO';
  return 'DISPONIBLE';
};

// GET overrides dictionary
router.get('/', async (req, res) => {
  try {
    const lotes = await prisma.lote.findMany();
    const overridesMap: Record<string, any> = {};

    lotes.forEach(lote => {
      overridesMap[String(lote.id)] = {
        price: lote.precio,
        status: mapEnumToUiStatus(lote.estado),
        tags: lote.tags || '',
        description: lote.description || ''
      };
    });

    res.json(overridesMap);
  } catch (err) {
    logger.error('Error getting overrides:', err);
    res.status(500).json({ error: 'Error al obtener overrides' });
  }
});

// POST overrides for specific lot
router.post('/:lotId', verifyJWT, async (req, res) => {
  try {
    const lotId = parseInt(req.params.lotId, 10);
    if (isNaN(lotId)) {
      return res.status(400).json({ error: 'ID de lote inválido' });
    }

    const { price, status, tags, description } = req.body;

    // Fetch existing lot to compare and write logs
    const existing = await prisma.lote.findUnique({
      where: { id: lotId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    const oldPrice = existing.precio;
    const oldStatus = mapEnumToUiStatus(existing.estado);
    const oldTags = existing.tags || '';
    const oldDescription = existing.description || '';

    const newPrice = price !== undefined && price !== null ? Number(price) : 0;
    const newStatus = status || 'Disponible';
    const newTags = tags || '';
    const newDescription = description || '';

    const logStatements: any[] = [];

    if (newPrice !== oldPrice) {
      logStatements.push({
        lotId,
        fieldChanged: 'price',
        oldValue: String(oldPrice),
        newValue: String(newPrice)
      });
    }
    if (newStatus !== oldStatus) {
      logStatements.push({
        lotId,
        fieldChanged: 'status',
        oldValue: oldStatus,
        newValue: newStatus
      });
    }
    if (newTags !== oldTags) {
      logStatements.push({
        lotId,
        fieldChanged: 'tags',
        oldValue: oldTags,
        newValue: newTags
      });
    }
    if (newDescription !== oldDescription) {
      logStatements.push({
        lotId,
        fieldChanged: 'description',
        oldValue: oldDescription,
        newValue: newDescription
      });
    }

    // Write logs to DB if any changes occurred
    if (logStatements.length > 0) {
      await prisma.overridesLog.createMany({
        data: logStatements
      });
    }

    // Update Lote
    const updatedLote = await prisma.lote.update({
      where: { id: lotId },
      data: {
        precio: newPrice,
        estado: mapUiStatusToEnum(newStatus),
        tags: newTags,
        description: newDescription
      }
    });

    logger.info(`Overrides actualizados para lote ${updatedLote.numero} por admin`);

    // Emit WebSocket broadcast to update statuses in real-time
    const wsServer = req.app.get('wsServer');
    if (wsServer && typeof wsServer.broadcast === 'function') {
      wsServer.broadcast('loteEstadoActualizado', {
        loteId,
        estado: mapUiStatusToEnum(newStatus)
      });
    }

    res.json({ success: true });
  } catch (err) {
    logger.error('Error updating overrides:', err);
    res.status(500).json({ error: 'Error al actualizar overrides' });
  }
});

export default router;
