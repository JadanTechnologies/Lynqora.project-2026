import { safeHttpRequest } from './network.util.ts';
import { CheckResult, RiskIndicator } from './check.types.ts';
import type { CheckStatus } from './check.types.ts';

export interface SecurityHeadersCheckResult {
  check: CheckResult;
  risks: RiskIndicator[];
}

export class SecurityHeadersCheckService {
  static async check(url: string): Promise<SecurityHeadersCheckResult> {
    const risks: RiskIndicator[] = [];
    const evidence: Record<string, any> = { url };
    let status: CheckStatus = 'PASSED';
    let score = 15;
    let result = 'Security headers present';
    let details = '';

    const expectedHeaders: Record<string, { description: string; weight: number }> = {
      'strict-transport-security': { description: 'HTTP Strict Transport Security', weight: 4 },
      'content-security-policy': { description: 'Content Security Policy', weight: 4 },
      'x-content-type-options': { description: 'X-Content-Type-Options', weight: 2 },
      'x-frame-options': { description: 'X-Frame-Options', weight: 2 },
      'referrer-policy': { description: 'Referrer-Policy', weight: 2 },
      'permissions-policy': { description: 'Permissions-Policy', weight: 1 },
    };

    let response: any = null;
    let error: Error | null = null;

    try {
      response = await safeHttpRequest(url, { timeout: 10000, maxRedirects: 5 });
    } catch (err: any) {
      error = err;
    }

    if (response) {
      evidence.responseHeaders = response.headers;
      const headersLower: Record<string, string> = {};
      for (const [k, v] of Object.entries(response.headers)) {
        headersLower[k.toLowerCase()] = v as string;
      }

      const headerStatus: Record<string, string> = {};
      let presentCount = 0;
      let totalWeight = 0;
      let earnedWeight = 0;

      for (const [headerName, info] of Object.entries(expectedHeaders)) {
        totalWeight += info.weight;
        if (headersLower[headerName]) {
          headerStatus[headerName] = `✓ Present`;
          presentCount++;
          earnedWeight += info.weight;
        } else {
          headerStatus[headerName] = '⚠ Missing';
        }
      }

      evidence.headerStatus = headerStatus;
      evidence.presentCount = presentCount;
      evidence.totalCount = Object.keys(expectedHeaders).length;

      score = Math.round((earnedWeight / totalWeight) * 15);

      if (presentCount === Object.keys(expectedHeaders).length) {
        result = 'All security headers present';
        details = 'All recommended security headers were detected.';
      } else if (presentCount === 0) {
        status = 'WARNING';
        result = 'No security headers detected';
        details = 'No recommended security headers were found in the response.';
        risks.push({
          type: 'MISSING_SECURITY_HEADERS',
          severity: 'MEDIUM',
          title: 'Missing Security Headers',
          description: 'The website does not set any recommended security headers.',
          evidence: headerStatus,
        });
      } else {
        status = 'WARNING';
        result = 'Some security headers missing';
        details = `${presentCount} of ${Object.keys(expectedHeaders).length} recommended security headers detected.`;
        risks.push({
          type: 'MISSING_SECURITY_HEADERS',
          severity: 'LOW',
          title: 'Partial Security Headers',
          description: `Some recommended security headers are missing. This is a technical signal only.`,
          evidence: headerStatus,
        });
      }
    } else {
      status = 'NOT_AVAILABLE';
      score = 0;
      result = 'Security headers check not available';
      details = error?.message || 'Could not retrieve headers.';
      evidence.error = error?.message;
    }

    return {
      check: {
        checkType: 'SECURITY_HEADERS',
        status,
        score,
        result,
        details,
        evidence,
        checkedAt: new Date().toISOString(),
      },
      risks,
    };
  }
}