import { DomainCheckService } from './domain-check.service.ts';
import { SslCheckService } from './ssl-check.service.ts';
import { DnsCheckService } from './dns-check.service.ts';
import { AccessibilityCheckService } from './accessibility-check.service.ts';
import { RedirectCheckService } from './redirect-check.service.ts';
import { SecurityHeadersCheckService } from './security-header-check.service.ts';
import { DomainAgeCheckService } from './domain-age-check.service.ts';
import { DomainAgeService } from './domain-age-provider.service.ts';
import { ScoringService } from './scoring.service.ts';
import { RiskService } from './risk.service.ts';
import { CheckResult, RiskIndicator, VerificationRunResult } from './check.types.ts';
import { AuditService } from '../audit.service.ts';
import { normalizeDomain, validateDomain, formatWebsiteUrl } from '../../lib/domain.ts';

export interface VerificationRunOptions {
  verificationId: string;
  domain: string;
  websiteUrl: string;
  userId: string;
  userEmail: string;
  runId: string;
}

export class VerificationEngine {
  private domainAgeService: DomainAgeService;

  constructor() {
    this.domainAgeService = new DomainAgeService();
  }

  async runChecks(options: VerificationRunOptions): Promise<VerificationRunResult> {
    const { verificationId, domain, websiteUrl, runId } = options;
    const checks: CheckResult[] = [];
    const allRisks: RiskIndicator[] = [];

    // 1. Domain Check
    try {
      const domainResult = DomainCheckService.check(websiteUrl, domain);
      checks.push(domainResult);
      allRisks.push(...this.extractRisks(domainResult));
    } catch (err: any) {
      checks.push(this.failedCheck('DOMAIN', err));
    }

    // 2. SSL Check
    try {
      const sslResult = await SslCheckService.check(websiteUrl);
      checks.push(sslResult.check);
      allRisks.push(...sslResult.risks);
    } catch (err: any) {
      checks.push(this.failedCheck('SSL', err));
    }

    // 3. DNS Check
    try {
      const dnsResult = await DnsCheckService.check(domain);
      checks.push(dnsResult.check);
      allRisks.push(...dnsResult.risks);
    } catch (err: any) {
      checks.push(this.failedCheck('DNS', err));
    }

    // 4. Accessibility Check
    try {
      const accessibilityResult = await AccessibilityCheckService.check(websiteUrl);
      checks.push(accessibilityResult.check);
      allRisks.push(...accessibilityResult.risks);
    } catch (err: any) {
      checks.push(this.failedCheck('WEBSITE_ACCESSIBILITY', err));
    }

    // 5. Redirect Check
    try {
      const redirectResult = await RedirectCheckService.check(websiteUrl);
      checks.push(redirectResult.check);
      allRisks.push(...redirectResult.risks);
    } catch (err: any) {
      checks.push(this.failedCheck('REDIRECTS', err));
    }

    // 6. Security Headers Check
    try {
      const headersResult = await SecurityHeadersCheckService.check(websiteUrl);
      checks.push(headersResult.check);
      allRisks.push(...headersResult.risks);
    } catch (err: any) {
      checks.push(this.failedCheck('SECURITY_HEADERS', err));
    }

    // 7. Domain Age Check
    try {
      const domainAgeResult = await DomainAgeCheckService.check(domain, this.domainAgeService);
      checks.push(domainAgeResult.check);
      allRisks.push(...domainAgeResult.risks);
    } catch (err: any) {
      checks.push(this.failedCheck('DOMAIN_AGE', err));
    }

    // Calculate score
    const score = ScoringService.calculateScore(checks);

    // Aggregate risks
    const aggregatedRisks = RiskService.aggregateRisks([allRisks]);

    return {
      checks,
      riskIndicators: aggregatedRisks,
      score,
      status: 'COMPLETED',
    };
  }

  private extractRisks(check: CheckResult): RiskIndicator[] {
    // Some checks include embedded risks; this extracts them if present
    return [];
  }

  private failedCheck(checkType: string, err: Error): CheckResult {
    return {
      checkType,
      status: 'NOT_AVAILABLE',
      score: 0,
      result: 'Check failed',
      details: err.message || 'Unknown error',
      evidence: { error: err.message },
      checkedAt: new Date().toISOString(),
    };
  }
}