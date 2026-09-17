export type CheckStatus = 'PASSED' | 'FAILED' | 'WARNING' | 'NOT_AVAILABLE' | 'NOT_CHECKED';

export interface CheckResult {
  checkType: string;
  status: CheckStatus;
  score: number;
  result: string;
  details: string;
  evidence: Record<string, any>;
  checkedAt: string;
}

export interface RiskIndicator {
  type: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  evidence: Record<string, any>;
}

export interface VerificationRunResult {
  checks: CheckResult[];
  riskIndicators: RiskIndicator[];
  score: number;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
  error?: string;
}