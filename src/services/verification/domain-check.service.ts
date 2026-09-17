import { normalizeDomain, validateDomain } from '../../lib/domain.ts';
import { CheckResult } from './check.types.ts';

export class DomainCheckService {
  static check(originalUrl: string, normalizedDomain: string): CheckResult {
    const validation = validateDomain(originalUrl);
    const normalized = normalizeDomain(originalUrl);

    const evidence: Record<string, any> = {
      originalUrl,
      normalizedDomain: normalized,
      hostname: normalized,
    };

    if (!validation.isValid) {
      return {
        checkType: 'DOMAIN',
        status: 'FAILED',
        score: 0,
        result: 'Invalid domain format',
        details: validation.error || 'The submitted domain is invalid.',
        evidence,
        checkedAt: new Date().toISOString(),
      };
    }

    // Check for suspicious patterns
    const suspiciousPatterns: string[] = [];
    if (normalized.includes('--')) {
      suspiciousPatterns.push('Domain contains double hyphens');
    }
    if (/\d{4,}/.test(normalized.replace(/\D/g, ''))) {
      suspiciousPatterns.push('Domain contains long numeric sequences');
    }

    const passed = suspiciousPatterns.length === 0;

    return {
      checkType: 'DOMAIN',
      status: passed ? 'PASSED' : 'WARNING',
      score: passed ? 10 : 5,
      result: passed ? 'Valid domain format' : 'Domain has unusual patterns',
      details: passed
        ? 'The domain has a valid format and structure.'
        : `Unusual patterns detected: ${suspiciousPatterns.join('; ')}. This is a technical signal only.`,
      evidence,
      checkedAt: new Date().toISOString(),
    };
  }
}