export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export type VerificationStatus = 
  | 'PENDING' 
  | 'UNDER_REVIEW' 
  | 'VERIFIED' 
  | 'UNVERIFIED' 
  | 'RISK_DETECTED';

export type RiskLevel = 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH';

export type CheckType =
  | 'DOMAIN_OWNERSHIP'
  | 'SSL'
  | 'DOMAIN_AGE'
  | 'DNS'
  | 'WEBSITE_ACCESSIBILITY'
  | 'REDIRECTS'
  | 'SECURITY_HEADERS'
  | 'BUSINESS_IDENTITY'
  | 'THREAT_INTELLIGENCE';

export type CheckStatus = 'NOT_CHECKED' | 'PENDING' | 'PASSED' | 'FAILED' | 'WARNING' | 'NOT_AVAILABLE';

export type RiskSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface VerificationRun {
  id: string;
  verificationId: string;
  startedAt: string;
  completedAt?: string | null;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  score: number;
  error?: string | null;
  createdAt: string;
}

export interface VerificationRiskIndicator {
  id: string;
  verificationRunId: string;
  type: string;
  severity: RiskSeverity;
  title: string;
  description?: string;
  evidence?: string;
  createdAt: string;
}

export interface ExtendedVerificationCheck extends VerificationCheck {
  score?: number;
  evidence?: string;
  responseTime?: number;
  metadata?: string;
}

export interface TechnicalCheckResult {
  checkType: string;
  status: CheckStatus;
  score: number;
  result: string;
  details: string;
  evidence: Record<string, any>;
  checkedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface WebsiteVerification {
  id: string;
  verificationId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  domain: string;
  normalizedDomain: string;
  websiteUrl: string;
  status: VerificationStatus;
  riskLevel: RiskLevel;
  score?: number;
  adminNotes?: string | null;
  submittedAt: string;
  updatedAt: string;
  verifiedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface VerificationCheck {
  id: string;
  verificationId: string;
  checkType: CheckType;
  status: CheckStatus;
  result?: string | null;
  details?: string | null;
  score?: number;
  checkedAt?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  updatedAt: string;
}

export interface PublicVerificationDetails {
  verificationId: string;
  domain: string;
  websiteUrl: string;
  status: VerificationStatus;
  riskLevel: RiskLevel;
  submittedAt: string;
  verifiedAt?: string | null;
  expiresAt?: string | null;
  checks: Array<{
    checkType: CheckType;
    status: CheckStatus;
    result?: string | null;
    details?: string | null;
  }>;
}

export interface DashboardStats {
  totalRequests: number;
  verified: number;
  underReview: number;
  unverified: number;
  riskDetected: number;
  pending: number;
}

export interface AdminStats extends DashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
}
