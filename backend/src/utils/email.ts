import { logger } from './logger';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@querube.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'Urbanización Querube';

  // Gracefully bypass if SendGrid API Key is placeholder or blank in local development
  if (!apiKey || apiKey === 'your-sendgrid-key' || apiKey.trim() === '') {
    logger.warn(`SendGrid API Key not configured. Skipping confirmation email to: ${to}`);
    return true;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }]
          }
        ],
        from: {
          email: fromEmail,
          name: fromName
        },
        subject: subject,
        content: [
          {
            type: 'text/html',
            value: html
          }
        ]
      })
    });

    if (response.status === 202) {
      logger.info(`Email successfully queued by SendGrid for: ${to}`);
      return true;
    } else {
      const errorText = await response.text();
      logger.error(`SendGrid API returned status ${response.status}: ${errorText}`);
      return false;
    }
  } catch (err) {
    logger.error('Error sending email via SendGrid:', err);
    return false;
  }
}

export async function sendReservationConfirmation(to: string, nombre: string, loteNumero: number, area: number) {
  const subject = `¡Tu Reserva del Lote ${loteNumero} ha sido Confirmada! — Querube`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
      <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700; border-bottom: 2px solid #d4a843; padding-bottom: 12px;">¡Reserva Exitosa en Querube!</h2>
      <p style="font-size: 15px; line-height: 1.6; margin-top: 16px;">Hola <strong>${nombre}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.6;">Te confirmamos que hemos recibido y registrado tu reserva para el lote campestre en la parcelación <strong>Urbanización Querube</strong>:</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Lote Seleccionado:</td>
            <td style="padding: 4px 0; color: #0f172a; font-weight: 700; text-align: right;">Lote número ${loteNumero}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Área del Terreno:</td>
            <td style="padding: 4px 0; color: #0f172a; text-align: right;">${area} m²</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Estado de Reserva:</td>
            <td style="padding: 4px 0; color: #d97706; font-weight: 700; text-align: right; text-transform: uppercase;">Confirmada (Temporal)</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 15px; line-height: 1.6;">Uno de nuestros asesores de ventas se pondrá en contacto contigo en breve a tu teléfono registrado para concretar los detalles de pago y escrituración.</p>
      
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 0;">Atentamente,<br/><strong>Equipo Comercial de Urbanización Querube</strong></p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

export async function sendAdminNotification(buyerName: string, buyerEmail: string, buyerPhone: string, loteNumero: number, area: number) {
  const to = process.env.ADMIN_EMAIL || 'ventas@querube.com';
  const subject = `🚨 Nueva Reserva Registrada: Lote ${loteNumero} — Visor 3D`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
      <h2 style="color: #ef4444; margin-top: 0; font-size: 20px; font-weight: 700; border-bottom: 2px solid #ef4444; padding-bottom: 12px;">Nueva Reserva de Lote</h2>
      <p style="font-size: 15px; line-height: 1.6; margin-top: 16px;">Se ha registrado una nueva reserva en tiempo real desde el visor 3D para la parcelación <strong>Querube</strong>:</p>
      
      <h3 style="font-size: 16px; margin: 20px 0 10px 0; color: #0f172a;">Detalles del Cliente:</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Nombre:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #f1f5f9;">${buyerName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Correo:</td>
          <td style="padding: 6px 0; color: #0f172a; text-align: right; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${buyerEmail}">${buyerEmail}</a></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Teléfono:</td>
          <td style="padding: 6px 0; color: #0f172a; text-align: right; border-bottom: 1px solid #f1f5f9;"><a href="tel:${buyerPhone}">${buyerPhone}</a></td>
        </tr>
      </table>

      <h3 style="font-size: 16px; margin: 20px 0 10px 0; color: #0f172a;">Detalles del Terreno:</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Lote:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #f1f5f9;">Lote ${loteNumero}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Área:</td>
          <td style="padding: 6px 0; color: #0f172a; text-align: right; border-bottom: 1px solid #f1f5f9;">${area} m²</td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center;">
        Este correo ha sido generado de forma automática por el visor 3D Querube.
      </p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}
