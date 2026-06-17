/**
 * validation.js
 * Client-side input validation for Querube
 */

export function validateEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function validateColombiaPhone(phone) {
  if (!phone) return false;
  // Clear all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');
  // Colombian mobile numbers have exactly 10 digits and start with 3
  return cleanPhone.startsWith('3') && cleanPhone.length === 10;
}
