import { CheckResult, RiskIndicator } from './check.types.ts';

export interface ScoringConfig {
  https: number;
  validCertificate: number;
  dns: number;
  domainConsistency: number;
  securityHeaders: number;
  accessibility: number;
  domainInformation: number;
  redirectBehavior: number;
  domainFormat: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  https: 20,
  validCertificate: 15,
  dns: 10,
  domainConsistency: 15,
  securityHeaders: 15,
  accessibility: 10,
  domainInformation: 10,
  redirectBehavior: 5,
  domainFormat: 0,
};

export class ScoringService {
  static calculateScore(checks: CheckResult[], config: ScoringConfig = DEFAULT_SCORING_CONFIG): number {
    let score = 0;

    const sslCheck = checks.find((c) => c.checkType === 'SSL');
    if (sslCheck) {
      score += sslCheck.score;
    }

    const dnsCheck = checks.find((c) => c.checkType === 'DNS');
    if (dnsCheck) {
      score += dnsCheck.score;
    }

    const redirectCheck = checks.find((c) => c.checkType === 'REDIRECTS');
    if (redirectCheck) {
      score += redirectCheck.score;
    }

    const headerCheck = checks.find((c) => c.checkType === 'SECURITY_HEADERS');
    if (headerCheck) {
      score += headerCheck.score;
    }

    const accessibilityCheck = checks.find((c) => c.checkType === 'WEBSITE_ACCESSIBILITY');
    if (accessibilityCheck) {
      score += accessibilityCheck.score;
    }

    const domainCheck = checks.find((c) => c.checkType === 'DOMAIN');
    if (domainCheck) {
      score += domainCheck.score;
    }

    const domainAgeCheck = checks.find((c) => c.checkType === 'DOMAIN_AGE');
    if (domainAgeCheck) {
      score += domainAgeCheck.score;
    }

    // Cap at 100
    return Math.min(100, Math.max(0, score));
  }

  static getScoreCategory(score: number): { label: string; color: string; description: string } {
    if (score >= 80) {
      return {
        label: 'Strong Technical Signals',
        color: 'emerald',
        description: 'Multiple technical signals are present. This is not a guarantee of legitimacy.',
      };
    } else if (score >= 60) {
      return {
        label: 'Moderate Technical Signals',
        color: 'sky',
        description: 'Some technical signals are present, but gaps exist.',
      };
    } else if (score >= 40) {
      return {
        label: 'Limited Technical Signals',
        color: 'amber',
        description: 'Few technical signals are available. Further review is recommended.',
      };
    } else {
      return {
        label: 'Weak Technical Signals',
        color: 'rose',
        description: 'Very few technical signals are present. This does not automatically mean the site is fraudulent.',
      };
    }
  }

  static getCheckScore(check: CheckResult, config: ScoringConfig): number {
    return check.score;
  }
}