import { pg } from '../db/database.ts';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AuditService } from './audit.service.ts';
import { User, UserRole, UserStatus } from '../types.ts';

export class UserService {
  static async register(params: {
    name: string;
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<User> {
    const { name, email, password, ipAddress, userAgent } = params;
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existing = await pg.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      throw new Error('An account with this email address already exists.');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const res = await pg.query<any>(`
      INSERT INTO users (id, name, email, password_hash, role, status, email_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'USER', 'ACTIVE', false, NOW(), NOW())
      RETURNING id, name, email, role, status, email_verified, created_at, updated_at, last_login_at
    `, [userId, name.trim(), cleanEmail, passwordHash]);

    const createdUser: User = {
      id: res.rows[0].id,
      name: res.rows[0].name,
      email: res.rows[0].email,
      role: res.rows[0].role,
      status: res.rows[0].status,
      emailVerified: res.rows[0].email_verified,
      createdAt: res.rows[0].created_at,
      updatedAt: res.rows[0].updated_at,
      lastLoginAt: res.rows[0].last_login_at
    };

    await AuditService.log({
      userId: createdUser.id,
      userEmail: createdUser.email,
      action: 'REGISTER',
      entityType: 'USER',
      entityId: createdUser.id,
      ipAddress,
      userAgent,
      metadata: { email: createdUser.email, role: createdUser.role }
    });

    return createdUser;
  }

  static async authenticate(params: {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<User> {
    const { email, password, ipAddress, userAgent } = params;
    const cleanEmail = email.trim().toLowerCase();

    const res = await pg.query<any>(`
      SELECT id, name, email, password_hash, role, status, email_verified, created_at, updated_at, last_login_at
      FROM users
      WHERE email = $1
    `, [cleanEmail]);

    // Constant-time like comparison to avoid enumeration
    if (res.rows.length === 0) {
      // Run dummy bcrypt compare to protect against timing attacks
      await bcrypt.compare(password, '$2a$10$dummyhashfortimingprevention99999999999999999999999');
      throw new Error('Invalid email or password.');
    }

    const row = res.rows[0];

    const isValid = await bcrypt.compare(password, row.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    if (row.status === 'SUSPENDED') {
      throw new Error('This account has been suspended. Please contact Lynqora Security Support.');
    }

    // Update last_login_at
    await pg.query('UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1', [row.id]);

    const user: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
      emailVerified: row.email_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: new Date().toISOString()
    };

    const isAdm = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      action: isAdm ? 'ADMIN_LOGIN' : 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      ipAddress,
      userAgent,
      metadata: { role: user.role }
    });

    return user;
  }

  static async getUserById(userId: string): Promise<User | null> {
    const res = await pg.query<any>(`
      SELECT id, name, email, role, status, email_verified, created_at, updated_at, last_login_at
      FROM users WHERE id = $1
    `, [userId]);

    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      status: r.status,
      emailVerified: r.email_verified,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      lastLoginAt: r.last_login_at
    };
  }

  static async listUsers(filters?: {
    search?: string;
    role?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number }> {
    let query = 'SELECT id, name, email, role, status, email_verified, created_at, updated_at, last_login_at FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const params: any[] = [];

    if (filters?.role && filters.role !== 'ALL') {
      params.push(filters.role);
      query += ` AND role = $${params.length}`;
      countQuery += ` AND role = $${params.length}`;
    }

    if (filters?.status && filters.status !== 'ALL') {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
      countQuery += ` AND status = $${params.length}`;
    }

    if (filters?.search) {
      params.push(`%${filters.search.toLowerCase()}%`);
      query += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`;
      countQuery += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`;
    }

    const countRes = await pg.query<{ count: string }>(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    query += ' ORDER BY created_at DESC';

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const res = await pg.query<any>(query, params);

    return {
      total,
      users: res.rows.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        status: r.status,
        emailVerified: r.email_verified,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        lastLoginAt: r.last_login_at
      }))
    };
  }

  static async updateUserStatus(params: {
    adminId: string;
    adminEmail: string;
    targetUserId: string;
    status: UserStatus;
    role?: UserRole;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<User> {
    const { adminId, adminEmail, targetUserId, status, role, ipAddress, userAgent } = params;

    const userRes = await pg.query<any>('SELECT * FROM users WHERE id = $1', [targetUserId]);
    if (userRes.rows.length === 0) {
      throw new Error('User not found.');
    }
    const target = userRes.rows[0];

    // Prevent suspending yourself if you are an admin
    if (adminId === targetUserId && status === 'SUSPENDED') {
      throw new Error('Administrators cannot suspend their own account.');
    }

    const newRole = role || target.role;

    await pg.query(`
      UPDATE users 
      SET status = $1, role = $2, updated_at = NOW() 
      WHERE id = $3
    `, [status, newRole, targetUserId]);

    const action = status === 'SUSPENDED' ? 'USER_SUSPENDED' : (target.status === 'SUSPENDED' ? 'USER_REACTIVATED' : 'USER_UPDATED');

    await AuditService.log({
      userId: adminId,
      userEmail: adminEmail,
      action,
      entityType: 'USER',
      entityId: targetUserId,
      ipAddress,
      userAgent,
      metadata: {
        targetEmail: target.email,
        previousStatus: target.status,
        newStatus: status,
        previousRole: target.role,
        newRole
      }
    });

    const updated = await this.getUserById(targetUserId);
    return updated!;
  }

  static async updatePassword(params: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    const { userId, currentPassword, newPassword } = params;

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    const res = await pg.query<any>('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (res.rows.length === 0) throw new Error('User not found.');

    const isValid = await bcrypt.compare(currentPassword, res.rows[0].password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect.');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pg.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);
  }

  static async updateProfile(userId: string, name: string): Promise<User> {
    if (!name.trim()) throw new Error('Name cannot be blank.');
    await pg.query('UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2', [name.trim(), userId]);
    const user = await this.getUserById(userId);
    return user!;
  }
}
