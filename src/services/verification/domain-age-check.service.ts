import { CheckResult, RiskIndicator } from './check.types.ts';
import { DomainAgeService } from './domain-age-provider.service.ts';

export interface DomainAgeCheckResult {
  check: CheckResult;
  risks: RiskIndicator[];
}

export class DomainAgeCheckService {
  static async check(domain: string, service: DomainAgeService): Promise<DomainAgeCheckResult> {
    const risks: RiskIndicator[] = [];
    const evidence: Record<string, any> = { domain };

    if (!service.availableProviders.length) {
      return {
        check: {
          checkType: 'DOMAIN_AGE',
          status: 'NOT_AVAILABLE',
          score: 0,
          result: 'Domain information not available',
          details: 'No domain registration provider is configured.',
          evidence,
          checkedAt: new Date().toISOString(),
        },
        risks,
      };
    }

    try {
      const info = await service.getRegistrationInfo(domain);
      evidence.registrationInfo = info;

      if (info.error) {
        return {
          check: {
            checkType: 'DOMAIN_AGE',
            status: 'NOT_AVAILABLE',
            score: 0,
            result: 'Domain information not available',
            details: info.error,
            evidence,
            checkedAt: new Date().toISOString(),
          },
          risks,
        };
      }

      if (info.cached) {
        evidence.cached = true;
        evidence.cachedAt = info.cachedAt;
      }

      evidence.provider = info.provider;

      if (info.registrationDate) {
        const regDate = new Date(info.registrationDate);
        evidence.registrationDate = info.registrationDate;
        evidence.ageInDays = info.ageInDays;

        const ageInDays = info.ageInDays ?? 0;
        const ageYears = Math.floor(ageInDays / 365);
        const ageMonths = Math.floor((ageInDays % 365) / 30);

        let score = 5;
        let result = '';
        let details = '';

        if (ageInDays < 30) {
          score = 1;
          result = 'Recently registered domain';
          details = `Domain registered ${ageInDays} days ago. This is a technical signal only, not proof of fraud.`;
          risks.push({
            type: 'RECENT_DOMAIN',
            severity: 'MEDIUM',
            title: 'Recently Registered Domain',
            description: `The domain was registered approximately ${ageInDays} days ago. Domain age is one signal and should not be treated as proof of legitimacy.`,
            evidence: { registrationDate: info.registrationDate, ageInDays },
          });
        } else if (ageInDays < 365) {
          score = 3;
          result = 'Relatively new domain';
          details = `Domain registered ${ageInDays} days ago (~${ageMonths} months).`;
        } else {
          score = 10;
          result = 'Established domain';
          details = `Domain registered on ${regDate.toISOString().split('T')[0]} (~${ageYears} years old).`;
        }

        if (info.expirationDate) {
          evidence.expirationDate = info.expirationDate;
        }

        if (info.registrar) {
          evidence.registrar = info.registrar;
        }

        if (info.domainStatus && info.domainStatus.length > 0) {
          evidence.domainStatus = info.domainStatus;
        }

        return {
          check: {
            checkType: 'DOMAIN_AGE',
            status: info.ageInDays && info.ageInDays < 30 ? 'WARNING' : 'PASSED',
            score,
            result,
            details,
            evidence,
            checkedAt: new Date().toISOString(),
          },
          risks,
        };
      }

      return {
        check: {
          checkType: 'DOMAIN_AGE',
          status: 'NOT_AVAILABLE',
          score: 0,
          result: 'Registration date not available',
          details: 'The provider did not return a registration date.',
          evidence,
          checkedAt: new Date().toISOString(),
        },
        risks,
      };
    } catch (err: any) {
      return {
        check: {
          checkType: 'DOMAIN_AGE',
          status: 'NOT_AVAILABLE',
          score: 0,
          result: 'Domain information check failed',
          details: err.message,
          evidence: { ...evidence, error: err.message },
          checkedAt: new Date().toISOString(),
        },
        risks,
      };
    }
  }
}