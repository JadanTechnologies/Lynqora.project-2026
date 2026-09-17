import crypto from 'crypto';

/**
 * Generates a unique human-readable Lynqora verification ID
 * Format: LQ-2026-XXXXXX
 * Example: LQ-2026-8F72K4
 */
export function generateVerificationId(year = 2026): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 without ambiguous 0/O/1/I
  let code = '';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return `LQ-${year}-${code}`;
}
