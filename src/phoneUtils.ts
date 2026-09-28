/**
 * Utility functions for phone and WhatsApp formatting.
 * Ensures Mexican 10-digit mobile numbers are properly prefixed with '52'
 * so WhatsApp doesn't misinterpret them as Chile (+56) or Brazil (+55).
 */

export const cleanPhoneDigits = (phone: string | undefined | null): string => {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
};

export const formatWhatsAppPhone = (phone: string | undefined | null): string => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  
  // Mexican 10-digit numbers (e.g. 5624222449, 5512345678, 2291234567)
  // Must have 52 prepended for WhatsApp API routing
  if (digits.length === 10) {
    return '52' + digits;
  }
  
  // Already prefixed with 52
  if (digits.length === 12 && digits.startsWith('52')) {
    return digits;
  }
  
  // Prefixed with 521 (legacy WhatsApp Mexico format)
  if (digits.length === 13 && digits.startsWith('521')) {
    return digits;
  }
  
  return digits;
};

export const formatDisplayPhone = (phone: string | undefined | null): string => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  return String(phone);
};
