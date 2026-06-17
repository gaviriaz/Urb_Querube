import { Router } from 'express';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';
import { verifyRecaptcha } from '../utils/recaptcha';
import { sendReservationConfirmation, sendAdminNotification } from '../utils/email';

const router = Router();

// POST a new reservation
router.post('/', async (req, res) => {
  try {
    const { email, phone, nombre, captcha, loteId } = req.body;

    if (!email || !phone || !nombre || !loteId) {
      return res.status(400).json({ error: 'Todos los campos son requeridos (email, phone, nombre, loteId)' });
    }

    const parsedLoteId = parseInt(loteId, 10);
    if (isNaN(parsedLoteId)) {
      return res.status(400).json({ error: 'ID de lote inválido' });
    }

    // Get client IP
    const clientIpRaw = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const clientIp = Array.isArray(clientIpRaw) ? clientIpRaw[0] : String(clientIpRaw);

    // Validate reCAPTCHA token
    const isCaptchaValid = await verifyRecaptcha(captcha || '', clientIp);
    if (!isCaptchaValid) {
      return res.status(400).json({ error: 'Validación de reCAPTCHA fallida. Intente de nuevo.' });
    }

    // Check if Lote exists
    const lote = await prisma.lote.findUnique({
      where: { id: parsedLoteId }
    });

    if (!lote) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    // Find or create User by email
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          phone,
          name: nombre
        }
      });
    }

    // Create reservation
    const reserva = await prisma.reserva.create({
      data: {
        userId: user.id,
        loteId: parsedLoteId,
        nombre,
        email,
        phone,
        captcha: captcha || 'Validated',
        ip: clientIp
      }
    });

    // Update Lote state to RESERVED
    await prisma.lote.update({
      where: { id: parsedLoteId },
      data: { estado: 'RESERVADO' }
    });

    logger.info(`Reserva creada para Lote ${lote.numero} por usuario ${nombre}`);

    // Emit WebSocket events to active viewers
    const wsServer = req.app.get('wsServer');
    if (wsServer && typeof wsServer.broadcast === 'function') {
      wsServer.broadcast('nuevaReserva', {
        reservaId: reserva.id,
        loteId: parsedLoteId,
        nombre: nombre,
        createdAt: new Date()
      });

      wsServer.broadcast('loteEstadoActualizado', {
        loteId: parsedLoteId,
        estado: 'RESERVADO'
      });
    }

    // Enviar correos de notificación de forma asíncrona pero manejando errores
    try {
      logger.info(`Enviando correos de reserva del Lote ${lote.numero}...`);
      await Promise.all([
        sendReservationConfirmation(email, nombre, lote.numero, lote.metraje),
        sendAdminNotification(nombre, email, phone, lote.numero, lote.metraje)
      ]);
    } catch (mailErr) {
      logger.error('Error enviando notificaciones por correo de SendGrid:', mailErr);
    }

    res.json({ success: true, reservaId: reserva.id });
  } catch (err) {
    logger.error('Error creating reservation:', err);
    res.status(500).json({ error: 'Error interno del servidor al crear reserva' });
  }
});

export default router;
