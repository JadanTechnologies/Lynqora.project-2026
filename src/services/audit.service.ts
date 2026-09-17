import { pg } from '../db/database.ts';
import crypto from 'crypto';

export interface LogAuditParams {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | string | null;
}

export class AuditService {
  static async log(params: LogAuditParams): Promise<void> {
    try {
      const id = `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const metaStr = typeof params.metadata === 'object' && params.metadata !== null
        ? JSON.stringify(params.metadata)
        : (params.metadata || null);

      await pg.query(`
        INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, ip_address, user_agent, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `, [
        id,
        params.userId || null,
        params.userEmail || null,
        params.action,
        params.entityType,
        params.entityId,
        params.ipAddress || null,
        params.userAgent ? params.userAgent.substring(0, 255) : null,
        metaStr
      ]);
    } catch (err) {
      console.error('[AuditService] Failed to record audit log:', err);
    }
  }

  static async getLogs(limit = 100, offset = 0, actionFilter?: string) {
    let query = 'SELECT * FROM audit_logs';
    const values: any[] = [];
    
    if (actionFilter) {
      query += ' WHERE action = $1';
      values.push(actionFilter);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
    values.push(limit, offset);

    const res = await pg.query<any>(query, values);
    return res.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: row.metadata,
      createdAt: row.created_at
    }));
  }
}
