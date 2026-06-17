import { logger } from './logger';

export async function verifyRecaptcha(token: string, ip?: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Gracefully bypass if no key is configured yet in local development
  if (!secretKey || secretKey === 'your-secret-key' || secretKey.trim() === '') {
    logger.warn('Google reCAPTCHA secret key is not configured. Skipping token validation.');
    return true;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ip || ''
      })
    });

    if (!response.ok) {
      logger.error(`reCAPTCHA API returned HTTP status ${response.status}`);
      return false;
    }

    const data = await response.json() as any;
    
    if (data.success) {
      logger.info('reCAPTCHA token successfully validated.');
      return true;
    } else {
      logger.warn(`reCAPTCHA validation failed: ${JSON.stringify(data['error-codes'])}`);
      return false;
    }
  } catch (err) {
    logger.error('Error verifying reCAPTCHA token:', err);
    return false;
  }
}
