/**
 * Domain Normalization and Validation Helper for Lynqora
 * 
 * Normalized domain rule:
 * - strips protocol (http://, https://)
 * - strips leading 'www.'
 * - strips trailing slash, path, query parameters, hashes, ports
 * - validates structure
 */
export function normalizeDomain(input: string): string {
  if (!input) return '';
  let cleaned = input.trim().toLowerCase();

  // Strip protocol
  cleaned = cleaned.replace(/^https?:\/\//i, '');

  // Strip credentials or port if present
  cleaned = cleaned.replace(/^[^@]+@/, '');
  
  // Cut off at first slash, question mark, or hash
  const pathIndex = cleaned.search(/[\/\?#:]/);
  if (pathIndex !== -1) {
    cleaned = cleaned.substring(0, pathIndex);
  }

  // Strip leading www.
  cleaned = cleaned.replace(/^www\./i, '');

  // Strip trailing periods or slashes
  cleaned = cleaned.replace(/[\.\/]+$/, '');

  return cleaned;
}

export function validateDomain(domain: string): { isValid: boolean; error?: string } {
  const normalized = normalizeDomain(domain);

  if (!normalized) {
    return { isValid: false, error: 'Domain name cannot be empty.' };
  }

  if (normalized.length < 3 || normalized.length > 253) {
    return { isValid: false, error: 'Domain length must be between 3 and 253 characters.' };
  }

  // Standard domain regex checking labels and at least one dot
  // Allows valid international/modern TLDs (minimum 2 chars)
  const domainPattern = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/;
  if (!domainPattern.test(normalized)) {
    return { isValid: false, error: 'Please enter a valid domain format (e.g. example.com).' };
  }

  // Check against localhost or reserved strings
  if (normalized === 'localhost' || normalized.endsWith('.local') || normalized.endsWith('.internal')) {
    return { isValid: false, error: 'Private and local domains cannot be submitted for public verification.' };
  }

  return { isValid: true };
}

export function formatWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}
