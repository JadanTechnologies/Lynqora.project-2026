import { pg } from '../db/database.ts';
import { normalizeDomain, validateDomain, formatWebsiteUrl } from '../lib/domain.ts';
import { generateVerificationId } from '../lib/verificationId.ts';
import { AuditService } from './audit.service.ts';
import { NotificationService } from './notification.service.ts';
import { 
  WebsiteVerification, 
  VerificationCheck, 
  PublicVerificationDetails, 
  VerificationStatus, 
  RiskLevel,
  CheckType 
} from '../types.ts';
import crypto from 'crypto';
import { VerificationEngine } from './verification/verification.engine.ts';
import { VerificationRunResult } from './verification/check.types.ts';

const STANDARD_CHECKS: { type: CheckType; label: string; desc: string }[] = [
  { type: 'DOMAIN_OWNERSHIP', label: 'Domain Ownership', desc: 'DNS TXT or meta-tag cryptographic challenge validation' },
  { type: 'SSL', label: 'SSL/TLS Certificate', desc: 'Active valid SSL cipher suite and certificate transparency check' },
  { type: 'DOMAIN_AGE', label: 'Domain Age & Registration', desc: 'WHOIS registration lifespan and authoritative registrar status' },
  { type: 'DNS', label: 'DNS Configuration', desc: 'Nameserver integrity, DNSSEC validation, and authoritative records' },
  { type: 'WEBSITE_ACCESSIBILITY', label: 'Website Accessibility', desc: 'HTTP/HTTPS server responsiveness and uptime verification' },
  { type: 'REDIRECTS', label: 'Redirect & Forwarding Audit', desc: 'Safe redirect chain analysis and cloaking detection' },
  { type: 'SECURITY_HEADERS', label: 'Security Headers', desc: 'HSTS, Content-Security-Policy, and X-Frame-Options validation' },
  { type: 'BUSINESS_IDENTITY', label: 'Business Entity Identity', desc: 'Verified legal organization identity and registry cross-reference' },
  { type: 'THREAT_INTELLIGENCE', label: 'Threat Intelligence Feeds', desc: 'Known malicious domain, phishing, and malware blacklist telemetry' }
];

export class VerificationService {
  /**
   * Submits a domain for verification in Lynqora (Phase 1)
   */
  static async submitVerification(params: {
    userId: string;
    userEmail: string;
    urlOrDomain: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<WebsiteVerification> {
    const { userId, userEmail, urlOrDomain, ipAddress, userAgent } = params;

    // 1. Validation & Normalization
    const validation = validateDomain(urlOrDomain);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid domain entered');
    }

    const normalized = normalizeDomain(urlOrDomain);
    const websiteUrl = formatWebsiteUrl(urlOrDomain);

    // Check system settings: allow_new_submissions
    const settingRes = await pg.query<{ value: string }>(
      "SELECT value FROM system_settings WHERE key = 'allow_new_submissions'"
    );
    if (settingRes.rows.length > 0 && settingRes.rows[0].value === 'false') {
      throw new Error('New website verifications are temporarily paused by system administrator.');
    }

    // Check default verification status setting
    const defaultStatusRes = await pg.query<{ value: string }>(
      "SELECT value FROM system_settings WHERE key = 'default_verification_status'"
    );
    const initialStatus = (defaultStatusRes.rows[0]?.value as VerificationStatus) || 'PENDING';

    // 2. Generate unique human-readable Verification ID
    let verificationId = generateVerificationId(2026);
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await pg.query('SELECT id FROM website_verifications WHERE verification_id = $1', [verificationId]);
      if (existing.rows.length === 0) {
        isUnique = true;
      } else {
        verificationId = generateVerificationId(2026);
        attempts++;
      }
    }

    // 3. Create verification record
    const id = `ver_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const insertRes = await pg.query<any>(`
      INSERT INTO website_verifications (
        id, verification_id, user_id, domain, normalized_domain, website_url, 
        status, risk_level, submitted_at, updated_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'UNKNOWN', NOW(), NOW(), NOW())
      RETURNING *
    `, [id, verificationId, userId, normalized, normalized, websiteUrl, initialStatus]);

    const created = insertRes.rows[0];

    // 4. Create placeholder check records for Phase 2 readiness
    for (const check of STANDARD_CHECKS) {
      const checkId = `chk_${verificationId}_${check.type.toLowerCase()}`;
      await pg.query(`
        INSERT INTO verification_checks (
          id, verification_id, check_type, status, result, details, created_at
        ) VALUES ($1, $2, $3, 'NOT_CHECKED', 'Not Checked', $4, NOW())
      `, [checkId, verificationId, check.type, `${check.desc}. Advanced automated checks scheduled for Phase 2.`]);
    }

    // 5. Audit Log
    await AuditService.log({
      userId,
      userEmail,
      action: 'VERIFICATION_CREATED',
      entityType: 'WEBSITE_VERIFICATION',
      entityId: verificationId,
      ipAddress,
      userAgent,
      metadata: {
        domain: normalized,
        verificationId,
        websiteUrl,
        status: initialStatus
      }
    });

    // 6. User Notification
    await NotificationService.create(
      userId,
      'VERIFICATION_SUBMITTED',
      `Verification Request Created: ${normalized}`,
      `Your verification request for ${normalized} has been assigned ID ${verificationId} and is currently ${initialStatus.replace('_', ' ')}.`
    );

    return {
      id: created.id,
      verificationId: created.verification_id,
      userId: created.user_id,
      domain: created.domain,
      normalizedDomain: created.normalized_domain,
      websiteUrl: created.website_url,
      status: created.status,
      riskLevel: created.risk_level,
      adminNotes: created.admin_notes,
      submittedAt: created.submitted_at,
      updatedAt: created.updated_at,
      verifiedAt: created.verified_at,
      expiresAt: created.expires_at,
      createdAt: created.created_at
    };
  }

  /**
   * Retrieves public verification data (sanitized, zero private info)
   */
  static async getPublicVerification(verificationId: string): Promise<PublicVerificationDetails | null> {
    const res = await pg.query<any>(`
      SELECT verification_id, domain, normalized_domain, website_url, status, risk_level, submitted_at, verified_at, expires_at
      FROM website_verifications
      WHERE verification_id = $1
    `, [verificationId.toUpperCase()]);

    if (res.rows.length === 0) {
      return null;
    }

    const row = res.rows[0];

    // Fetch checks
    const checksRes = await pg.query<any>(`
      SELECT check_type, status, result, details
      FROM verification_checks
      WHERE verification_id = $1
      ORDER BY created_at ASC
    `, [row.verification_id]);

    return {
      verificationId: row.verification_id,
      domain: row.normalized_domain,
      websiteUrl: row.website_url,
      status: row.status,
      riskLevel: row.risk_level,
      submittedAt: row.submitted_at,
      verifiedAt: row.verified_at,
      expiresAt: row.expires_at,
      checks: checksRes.rows.map(c => ({
        checkType: c.check_type,
        status: c.status,
        result: c.result,
        details: c.details
      }))
    };
  }

  /**
   * Retrieves user verification requests
   */
  static async getUserVerifications(userId: string): Promise<WebsiteVerification[]> {
    const res = await pg.query<any>(`
      SELECT * FROM website_verifications
      WHERE user_id = $1
      ORDER BY submitted_at DESC
    `, [userId]);

    return res.rows.map(r => ({
      id: r.id,
      verificationId: r.verification_id,
      userId: r.user_id,
      domain: r.domain,
      normalizedDomain: r.normalized_domain,
      websiteUrl: r.website_url,
      status: r.status,
      riskLevel: r.risk_level,
      submittedAt: r.submitted_at,
      updatedAt: r.updated_at,
      verifiedAt: r.verified_at,
      expiresAt: r.expires_at,
      createdAt: r.created_at
    }));
  }

  /**
   * Retrieves single verification details with checks
   */
  static async getVerificationDetails(verificationId: string, userId?: string, isAdmin = false) {
    let query = 'SELECT v.*, u.email as user_email, u.name as user_name FROM website_verifications v JOIN users u ON v.user_id = u.id WHERE v.verification_id = $1';
    const params = [verificationId.toUpperCase()];

    if (!isAdmin && userId) {
      query += ' AND v.user_id = $2';
      params.push(userId);
    }

    const res = await pg.query<any>(query, params);
    if (res.rows.length === 0) {
      return null;
    }

    const row = res.rows[0];

    // Fetch checks
    const checksRes = await pg.query<any>(`
      SELECT * FROM verification_checks
      WHERE verification_id = $1
      ORDER BY created_at ASC
    `, [row.verification_id]);

    const verification: WebsiteVerification = {
      id: row.id,
      verificationId: row.verification_id,
      userId: row.user_id,
      userEmail: isAdmin ? row.user_email : undefined,
      userName: isAdmin ? row.user_name : undefined,
      domain: row.domain,
      normalizedDomain: row.normalized_domain,
      websiteUrl: row.website_url,
      status: row.status,
      riskLevel: row.risk_level,
      adminNotes: isAdmin ? row.admin_notes : undefined,
      submittedAt: row.submitted_at,
      updatedAt: row.updated_at,
      verifiedAt: row.verified_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    };

    const checks: VerificationCheck[] = checksRes.rows.map(c => ({
      id: c.id,
      verificationId: c.verification_id,
      checkType: c.check_type,
      status: c.status,
      result: c.result,
      details: c.details,
      checkedAt: c.checked_at,
      createdAt: c.created_at
    }));

    return { verification, checks };
  }

  /**
   * Admin: List all verifications with optional filters
   */
  static async getAllVerifications(filters?: {
    search?: string;
    status?: string;
    riskLevel?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = `
      SELECT v.*, u.email as user_email, u.name as user_name 
      FROM website_verifications v 
      JOIN users u ON v.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.status && filters.status !== 'ALL') {
      params.push(filters.status);
      query += ` AND v.status = $${params.length}`;
    }

    if (filters?.riskLevel && filters.riskLevel !== 'ALL') {
      params.push(filters.riskLevel);
      query += ` AND v.risk_level = $${params.length}`;
    }

    if (filters?.search) {
      params.push(`%${filters.search.toLowerCase()}%`);
      query += ` AND (LOWER(v.normalized_domain) LIKE $${params.length} OR LOWER(v.verification_id) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`;
    }

    query += ' ORDER BY v.submitted_at DESC';

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const res = await pg.query<any>(query, params);

    return res.rows.map(row => ({
      id: row.id,
      verificationId: row.verification_id,
      userId: row.user_id,
      userEmail: row.user_email,
      userName: row.user_name,
      domain: row.domain,
      normalizedDomain: row.normalized_domain,
      websiteUrl: row.website_url,
      status: row.status,
      riskLevel: row.risk_level,
      adminNotes: row.admin_notes,
      submittedAt: row.submitted_at,
      updatedAt: row.updated_at,
      verifiedAt: row.verified_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    }));
  }

  /**
   * Admin: Manually update verification status, risk level, admin notes
   */
  static async updateStatus(params: {
    adminUserId: string;
    adminEmail: string;
    verificationId: string;
    status: VerificationStatus;
    riskLevel: RiskLevel;
    adminNotes?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { adminUserId, adminEmail, verificationId, status, riskLevel, adminNotes, ipAddress, userAgent } = params;

    const existing = await pg.query<any>('SELECT * FROM website_verifications WHERE verification_id = $1', [verificationId.toUpperCase()]);
    if (existing.rows.length === 0) {
      throw new Error(`Verification ${verificationId} not found.`);
    }

    const prev = existing.rows[0];
    const verifiedAt = status === 'VERIFIED' ? (prev.verified_at || new Date().toISOString()) : null;
    
    // Set 1-year expiration if verified
    let expiresAt = prev.expires_at;
    if (status === 'VERIFIED' && !expiresAt) {
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 1);
      expiresAt = exp.toISOString();
    } else if (status !== 'VERIFIED') {
      expiresAt = null;
    }

    await pg.query(`
      UPDATE website_verifications
      SET status = $1, risk_level = $2, admin_notes = $3, verified_at = $4, expires_at = $5, updated_at = NOW()
      WHERE verification_id = $6
    `, [status, riskLevel, adminNotes ?? prev.admin_notes, verifiedAt, expiresAt, verificationId.toUpperCase()]);

    // Audit log
    await AuditService.log({
      userId: adminUserId,
      userEmail: adminEmail,
      action: 'VERIFICATION_STATUS_CHANGED',
      entityType: 'WEBSITE_VERIFICATION',
      entityId: verificationId.toUpperCase(),
      ipAddress,
      userAgent,
      metadata: {
        domain: prev.normalized_domain,
        previousStatus: prev.status,
        newStatus: status,
        previousRisk: prev.risk_level,
        newRisk: riskLevel,
        adminNotesUpdated: adminNotes !== undefined
      }
    });

    // Notify user of update
    await NotificationService.create(
      prev.user_id,
      'STATUS_UPDATE',
      `Verification Status Updated: ${prev.normalized_domain}`,
      `Your verification request (${verificationId}) status has been updated to ${status.replace('_', ' ')} with risk level ${riskLevel}.`
    );

    return await this.getVerificationDetails(verificationId, undefined, true);
  }

  /**
   * Phase 2: Run automated verification checks
   */
  static async runVerification(params: {
    verificationId: string;
    userId: string;
    userEmail: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<VerificationRunResult & { runId: string }> {
    const { verificationId, userId, userEmail, ipAddress, userAgent } = params;

    // Fetch verification record
    const existing = await pg.query<any>(
      'SELECT * FROM website_verifications WHERE verification_id = $1',
      [verificationId.toUpperCase()]
    );

    if (existing.rows.length === 0) {
      throw new Error(`Verification ${verificationId} not found.`);
    }

    const verification = existing.rows[0];

    // Create verification run record
    const runId = `run_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    await pg.query(`
      INSERT INTO verification_runs (id, verification_id, started_at, status)
      VALUES ($1, $2, NOW(), 'RUNNING')
    `, [runId, verificationId.toUpperCase()]);

    // Log start
    await AuditService.log({
      userId,
      userEmail,
      action: 'VERIFICATION_RUN_STARTED',
      entityType: 'WEBSITE_VERIFICATION',
      entityId: verificationId.toUpperCase(),
      ipAddress,
      userAgent,
      metadata: { domain: verification.normalized_domain, runId }
    });

    // Run checks
    const engine = new VerificationEngine();
    let result: VerificationRunResult;
    try {
      result = await engine.runChecks({
        verificationId: verificationId.toUpperCase(),
        domain: verification.normalized_domain,
        websiteUrl: verification.website_url,
        userId,
        userEmail,
        runId
      });
    } catch (err: any) {
      result = {
        checks: [],
        riskIndicators: [],
        score: 0,
        status: 'FAILED',
        error: err.message
      };
    }

    // Update verification run record
    await pg.query(`
      UPDATE verification_runs
      SET completed_at = NOW(), status = $1, score = $2, error = $3
      WHERE id = $4
    `, [result.status, result.score, result.error || null, runId]);

    // Store individual check results
    for (const check of result.checks) {
      const checkId = `chk_${verificationId.toUpperCase()}_${check.checkType.toLowerCase()}_${Date.now()}`;
      await pg.query(`
        INSERT INTO verification_checks (
          id, verification_id, check_type, status, result, details, score, evidence, response_time, metadata, checked_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (verification_id, check_type) DO UPDATE SET
          status = EXCLUDED.status,
          result = EXCLUDED.result,
          details = EXCLUDED.details,
          score = EXCLUDED.score,
          evidence = EXCLUDED.evidence,
          checked_at = EXCLUDED.checked_at
      `, [
        checkId,
        verificationId.toUpperCase(),
        check.checkType,
        check.status,
        check.result,
        check.details,
        check.score,
        JSON.stringify(check.evidence || {}),
        (check.evidence as any)?.responseTime || null,
        JSON.stringify({}),
        check.checkedAt
      ]);
    }

    // Store risk indicators
    for (const risk of result.riskIndicators) {
      const riskId = `risk_${runId}_${crypto.randomBytes(3).toString('hex')}`;
      await pg.query(`
        INSERT INTO verification_risk_indicators (
          id, verification_run_id, type, severity, title, description, evidence
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        riskId,
        runId,
        risk.type,
        risk.severity,
        risk.title,
        risk.description,
        JSON.stringify(risk.evidence || {})
      ]);
    }

    // Update verification record
    const riskLevel = RiskService.getOverallRiskLevel(result.riskIndicators);
    let newStatus: VerificationStatus = 'UNDER_REVIEW';
    
    if (result.riskIndicators.some((r) => r.severity === 'CRITICAL' || r.severity === 'HIGH')) {
      newStatus = 'RISK_DETECTED';
    }

    await pg.query(`
      UPDATE website_verifications
      SET status = $1, risk_level = $2, updated_at = NOW()
      WHERE verification_id = $3
    `, [newStatus, riskLevel, verificationId.toUpperCase()]);

    // Log completion
    await AuditService.log({
      userId,
      userEmail,
      action: 'VERIFICATION_RUN_COMPLETED',
      entityType: 'WEBSITE_VERIFICATION',
      entityId: verificationId.toUpperCase(),
      ipAddress,
      userAgent,
      metadata: { domain: verification.normalized_domain, runId, score: result.score, status: newStatus }
    });

    // Notify user
    await NotificationService.create(
      verification.user_id,
      'VERIFICATION_COMPLETED',
      `Verification Complete: ${verification.normalized_domain}`,
      `Technical verification for ${verification.normalized_domain} completed with score ${result.score}/100. Status: ${newStatus.replace('_', ' ')}.`
    );

    return { ...result, runId };
  }

  /**
   * Phase 2: Get verification run history
   */
  static async getVerificationHistory(verificationId: string): Promise<any[]> {
    const res = await pg.query<any>(`
      SELECT * FROM verification_runs
      WHERE verification_id = $1
      ORDER BY started_at DESC
    `, [verificationId.toUpperCase()]);
    return res.rows.map((r) => ({
      id: r.id,
      verificationId: r.verification_id,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      status: r.status,
      score: r.score,
      error: r.error,
      createdAt: r.created_at
    }));
  }

  /**
   * Phase 2: Get risk indicators for a verification run
   */
  static async getRiskIndicators(runId: string): Promise<any[]> {
    const res = await pg.query<any>(`
      SELECT * FROM verification_risk_indicators
      WHERE verification_run_id = $1
      ORDER BY created_at ASC
    `, [runId]);
    return res.rows;
  }
}

// Import RiskService at bottom to avoid circular dependency
import { RiskService } from './verification/risk.service.ts';
