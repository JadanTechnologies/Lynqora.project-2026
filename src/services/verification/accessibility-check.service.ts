import { safeHttpRequest, NetworkResponse } from './network.util.ts';
import { CheckResult, RiskIndicator } from './check.types.ts';
import type { CheckStatus } from './check.types.ts';

export interface AccessibilityCheckResult {
  check: CheckResult;
  risks: RiskIndicator[];
}

export class AccessibilityCheckService {
  static async check(url: string): Promise<AccessibilityCheckResult> {
    const risks: RiskIndicator[] = [];
    const evidence: Record<string, any> = { originalUrl: url };
    let status: CheckStatus = 'PASSED';
    let score = 10;
    let result = 'Website accessible';
    let details = '';

    // Try HTTPS first
    let httpsUrl = url;
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      httpsUrl = `https://${url}`;
    }

    let response: NetworkResponse | null = null;
    let httpError: Error | null = null;

    try {
      response = await safeHttpRequest(httpsUrl, { timeout: 10000, maxRedirects: 5 });
    } catch (err: any) {
      httpError = err;
    }

    if (response) {
      evidence.httpsResponse = {
        status: response.status,
        finalUrl: response.finalUrl,
        redirectCount: response.redirectCount,
        responseTime: response.responseTime,
        contentType: response.contentType,
      };

      if (response.status >= 200 && response.status < 400) {
        result = 'Website responded successfully';
        details = `HTTPS response: ${response.status} OK. Response time: ${response.responseTime}ms.`;
      } else if (response.status >= 400 && response.status < 500) {
        status = 'WARNING';
        score = 5;
        result = 'Client error response';
        details = `Website returned HTTP ${response.status}. This may be temporary.`;
        risks.push({
          type: 'HTTP_ERROR',
          severity: 'LOW',
          title: 'HTTP Client Error',
          description: `The website returned HTTP ${response.status}. This does not automatically indicate fraud.`,
          evidence: { status: response.status },
        });
      } else if (response.status >= 500) {
        status = 'WARNING';
        score = 3;
        result = 'Server error response';
        details = `Website returned HTTP ${response.status}. Server may be experiencing issues.`;
        risks.push({
          type: 'SERVER_ERROR',
          severity: 'MEDIUM',
          title: 'Server Error',
          description: `The website returned HTTP ${response.status}. The server may be misconfigured or down.`,
          evidence: { status: response.status },
        });
      }
    } else {
      status = 'NOT_AVAILABLE';
      score = 0;
      result = 'Website not accessible';
      details = httpError?.message || 'Could not connect to the website.';
      evidence.error = httpError?.message;

      risks.push({
        type: 'DOMAIN_UNAVAILABLE',
        severity: 'HIGH',
        title: 'Website Unavailable',
        description: `The website could not be reached: ${httpError?.message}`,
        evidence: { url: httpsUrl, error: httpError?.message },
      });
    }

    return {
      check: {
        checkType: 'WEBSITE_ACCESSIBILITY',
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