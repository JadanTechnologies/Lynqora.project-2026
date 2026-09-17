import { safeHttpRequest, NetworkResponse } from './network.util.ts';
import { CheckResult, RiskIndicator } from './check.types.ts';
import type { CheckStatus } from './check.types.ts';

export interface RedirectCheckResult {
  check: CheckResult;
  risks: RiskIndicator[];
}

export class RedirectCheckService {
  static async check(url: string): Promise<RedirectCheckResult> {
    const risks: RiskIndicator[] = [];
    const evidence: Record<string, any> = { originalUrl: url };
    let status: CheckStatus = 'PASSED';
    let score = 5;
    let result = 'No redirects detected';
    let details = '';

    let response: NetworkResponse | null = null;
    let error: Error | null = null;

    try {
      response = await safeHttpRequest(url, { timeout: 10000, maxRedirects: 5 });
    } catch (err: any) {
      error = err;
    }

    if (response) {
      evidence.finalUrl = response.finalUrl;
      evidence.redirectCount = response.redirectCount;
      evidence.redirectChain = response.finalUrl;

      const originalHostname = new URL(url).hostname.toLowerCase();
      const finalHostname = new URL(response.finalUrl).hostname.toLowerCase();
      evidence.originalHostname = originalHostname;
      evidence.finalHostname = finalHostname;

      if (response.redirectCount > 0) {
        result = `${response.redirectCount} redirect(s) detected`;
        details = `Original: ${url}\nFinal destination: ${response.finalUrl}`;
      } else {
        result = 'No redirects';
        details = `Direct connection to ${url}.`;
      }

      // Check for cross-domain redirects
      if (originalHostname !== finalHostname) {
        status = 'WARNING';
        score = 2;
        result = 'Cross-domain redirect detected';
        details = `Original domain: ${originalHostname}\nRedirected to: ${finalHostname}`;
        risks.push({
          type: 'CROSS_DOMAIN_REDIRECT',
          severity: 'MEDIUM',
          title: 'Cross-Domain Redirect',
          description: `The website redirects from ${originalHostname} to an unrelated domain ${finalHostname}. This may indicate domain forwarding or potential cloaking.`,
          evidence: { originalHostname, finalHostname, finalUrl: response.finalUrl },
        });
      }

      // Check for too many redirects
      if (response.redirectCount > 3) {
        status = 'WARNING';
        score = Math.min(score, 2);
        risks.push({
          type: 'SUSPICIOUS_REDIRECT_PATTERN',
          severity: 'MEDIUM',
          title: 'Multiple Redirects',
          description: `The website redirects ${response.redirectCount} times before reaching the final destination.`,
          evidence: { redirectCount: response.redirectCount, finalUrl: response.finalUrl },
        });
      }
    } else {
      status = 'NOT_AVAILABLE';
      score = 0;
      result = 'Redirect analysis not available';
      details = error?.message || 'Could not analyze redirects.';
      evidence.error = error?.message;
    }

    return {
      check: {
        checkType: 'REDIRECTS',
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