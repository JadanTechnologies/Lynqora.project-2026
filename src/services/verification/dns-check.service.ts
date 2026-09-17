import dns from 'dns';
import { promisify } from 'util';
import { CheckResult, RiskIndicator } from './check.types.ts';
import type { CheckStatus } from './check.types.ts';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveCname = promisify(dns.resolveCname);
const resolveMx = promisify(dns.resolveMx);
const resolveNs = promisify(dns.resolveNs);
const resolveSoa = promisify(dns.resolveSoa);

export interface DnsCheckResult {
  check: CheckResult;
  risks: RiskIndicator[];
}

export class DnsCheckService {
  static async check(hostname: string): Promise<DnsCheckResult> {
    const risks: RiskIndicator[] = [];
    const evidence: Record<string, any> = { hostname };
    let status: CheckStatus = 'PASSED';
    let score = 10;
    let result = 'DNS configuration available';
    let details = '';

    const checks: string[] = [];

    // A Record
    let aRecords: string[] = [];
    try {
      aRecords = await resolve4(hostname);
      evidence.aRecords = aRecords;
      checks.push(`A Record: ✓ Available (${aRecords.length} record(s))`);
    } catch {
      checks.push('A Record: ✗ Not available');
    }

    // AAAA Record
    let aaaaRecords: string[] = [];
    try {
      aaaaRecords = await resolve6(hostname);
      evidence.aaaaRecords = aaaaRecords;
      if (aaaaRecords.length > 0) {
        checks.push(`AAAA Record: ✓ Available (${aaaaRecords.length} record(s))`);
      }
    } catch {
      // Not all domains have AAAA, that's fine
    }

    // CNAME
    try {
      const cname = await resolveCname(hostname);
      evidence.cname = cname;
      checks.push(`CNAME: ✓ ${cname}`);
    } catch {
      // Not all domains have CNAME
    }

    // MX Records
    let mxRecords: any[] = [];
    try {
      mxRecords = await resolveMx(hostname);
      evidence.mxRecords = mxRecords.map((m) => ({ exchange: m.exchange, priority: m.priority }));
      if (mxRecords.length > 0) {
        checks.push(`MX Records: ✓ Available (${mxRecords.length} record(s))`);
      }
    } catch {
      checks.push('MX Records: ✗ Not available');
    }

    // NS Records
    let nsRecords: string[] = [];
    try {
      nsRecords = await resolveNs(hostname);
      evidence.nsRecords = nsRecords;
      checks.push(`Nameservers: ✓ Available (${nsRecords.length} record(s))`);
    } catch {
      checks.push('Nameservers: ✗ Not available');
    }

    // SOA Record
    try {
      const soa = await resolveSoa(hostname);
      evidence.soa = soa;
    } catch {
      // ignore
    }

    const hasA = aRecords.length > 0;
    const hasMx = mxRecords.length > 0;
    const hasNs = nsRecords.length > 0;

    if (!hasA && !hasNs) {
      status = 'FAILED';
      score = 0;
      result = 'DNS not resolvable';
      details = 'The domain could not be resolved via DNS.';
      risks.push({
        type: 'DNS_CONFIGURATION_ISSUE',
        severity: 'HIGH',
        title: 'DNS Resolution Failed',
        description: 'The domain has no A records and no nameservers.',
        evidence,
      });
    } else if (!hasA) {
      status = 'WARNING';
      score = 5;
      result = 'DNS partially available';
      details = 'Domain has nameservers but no A record.';
      risks.push({
        type: 'DNS_CONFIGURATION_ISSUE',
        severity: 'MEDIUM',
        title: 'Missing A Record',
        description: 'The domain has nameservers but no IPv4 A record.',
        evidence,
      });
    } else {
      result = 'DNS configuration available';
      details = checks.join('\n');
    }

    return {
      check: {
        checkType: 'DNS',
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