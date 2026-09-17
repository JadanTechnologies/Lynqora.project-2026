import { RiskIndicator } from './check.types.ts';

export class RiskService {
  static aggregateRisks(riskLists: RiskIndicator[][]): RiskIndicator[] {
    const all: RiskIndicator[] = [];
    for (const list of riskLists) {
      all.push(...list);
    }
    return all.sort((a, b) => this.severityWeight(b.severity) - this.severityWeight(a.severity));
  }

  static severityWeight(severity: string): number {
    switch (severity) {
      case 'CRITICAL': return 5;
      case 'HIGH': return 4;
      case 'MEDIUM': return 3;
      case 'LOW': return 2;
      case 'INFO': return 1;
      default: return 0;
    }
  }

  static getOverallRiskLevel(risks: RiskIndicator[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (risks.length === 0) return 'LOW';

    const maxWeight = Math.max(...risks.map((r) => this.severityWeight(r.severity)));
    if (maxWeight >= 4) return 'HIGH';
    if (maxWeight >= 3) return 'MEDIUM';
    return 'LOW';
  }

  static formatRiskForDisplay(risk: RiskIndicator): string {
    return `${risk.title}: ${risk.description}`;
  }
}