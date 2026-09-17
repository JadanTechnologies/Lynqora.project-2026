import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { initDatabase, pg } from './src/db/database.ts';
import { UserService } from './src/services/user.service.ts';
import { VerificationService } from './src/services/verification.service.ts';
import { AuditService } from './src/services/audit.service.ts';
import { NotificationService } from './src/services/notification.service.ts';
import { 
  signToken, 
  requireAuth, 
  requireAdmin, 
  AuthenticatedRequest 
} from './src/lib/auth.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize relational PostgreSQL database
  try {
    await initDatabase();
  } catch (dbErr) {
    console.error('[Server] Database initialization failed:', dbErr);
  }

  app.use(express.json());
  app.use(cookieParser());

  // Trust proxy for IP address extraction in containers
  app.set('trust proxy', 1);

  const getClientIp = (req: express.Request): string => {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  };

  /* ---------------------------------------------------- */
  /*                  AUTH API ROUTES                     */
  /* ---------------------------------------------------- */

  // POST /api/auth/register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';

      const user = await UserService.register({
        name,
        email,
        password,
        ipAddress: ip,
        userAgent
      });

      const token = signToken(user);
      res.cookie('lynqora_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.status(201).json({ user, token });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed.' });
    }
  });

  // POST /api/auth/login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';

      const user = await UserService.authenticate({
        email,
        password,
        ipAddress: ip,
        userAgent
      });

      const token = signToken(user);
      const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

      res.cookie('lynqora_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge
      });

      res.json({ user, token });
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Authentication failed.' });
    }
  });

  // POST /api/auth/logout
  app.post('/api/auth/logout', requireAuth, async (req: AuthenticatedRequest, res) => {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    if (req.user) {
      await AuditService.log({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'LOGOUT',
        entityType: 'USER',
        entityId: req.user.id,
        ipAddress: ip,
        userAgent
      });
    }

    res.clearCookie('lynqora_token');
    res.json({ message: 'Logged out successfully.' });
  });

  // GET /api/me
  app.get('/api/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await UserService.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      res.json({ user });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch user profile.' });
    }
  });

  // PUT /api/me/profile
  app.put('/api/me/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { name } = req.body;
      const updated = await UserService.updateProfile(req.user!.id, name);
      res.json({ user: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update profile.' });
    }
  });

  // PUT /api/me/password
  app.put('/api/me/password', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      await UserService.updatePassword({
        userId: req.user!.id,
        currentPassword,
        newPassword
      });
      res.json({ message: 'Password updated successfully.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to change password.' });
    }
  });

  /* ---------------------------------------------------- */
  /*               NOTIFICATIONS API                      */
  /* ---------------------------------------------------- */

  app.get('/api/notifications', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const notifs = await NotificationService.getUserNotifications(req.user!.id);
      res.json({ notifications: notifs });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
  });

  app.patch('/api/notifications/:id/read', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      await NotificationService.markAsRead(req.user!.id, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to mark notification as read.' });
    }
  });

  app.post('/api/notifications/read-all', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      await NotificationService.markAllAsRead(req.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to mark all as read.' });
    }
  });

  /* ---------------------------------------------------- */
  /*            VERIFICATION API ROUTES                   */
  /* ---------------------------------------------------- */

  // POST /api/verifications
  app.post('/api/verifications', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'Website URL or domain is required.' });
      }

      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';

      const verification = await VerificationService.submitVerification({
        userId: req.user!.id,
        userEmail: req.user!.email,
        urlOrDomain: url,
        ipAddress: ip,
        userAgent
      });

      res.status(201).json({ verification });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Verification submission failed.' });
    }
  });

  // GET /api/verifications (user's requests)
  app.get('/api/verifications', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const verifications = await VerificationService.getUserVerifications(req.user!.id);
      res.json({ verifications });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch verifications.' });
    }
  });

  // GET /api/verifications/:verificationId (details)
  app.get('/api/verifications/:verificationId', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
      const data = await VerificationService.getVerificationDetails(
        req.params.verificationId,
        req.user!.id,
        isAdmin
      );

      if (!data) {
        return res.status(404).json({ error: 'Verification request not found.' });
      }

      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to retrieve verification details.' });
    }
  });

  // GET /api/public/verifications/:verificationId (PUBLIC)
  app.get('/api/public/verifications/:verificationId', async (req, res) => {
    try {
      const publicData = await VerificationService.getPublicVerification(req.params.verificationId);
      if (!publicData) {
        return res.status(404).json({ error: 'Verification record not found or invalid Verification ID.' });
      }
      res.json(publicData);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve public verification.' });
    }
  });

  // GET /api/stats (User dashboard statistics)
  app.get('/api/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const countRes = await pg.query<any>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'VERIFIED') as verified,
          COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW') as under_review,
          COUNT(*) FILTER (WHERE status = 'UNVERIFIED') as unverified,
          COUNT(*) FILTER (WHERE status = 'RISK_DETECTED') as risk_detected,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending
        FROM website_verifications
        WHERE user_id = $1
      `, [userId]);

      const r = countRes.rows[0];
      res.json({
        totalRequests: parseInt(r.total || '0', 10),
        verified: parseInt(r.verified || '0', 10),
        underReview: parseInt(r.under_review || '0', 10),
        unverified: parseInt(r.unverified || '0', 10),
        riskDetected: parseInt(r.risk_detected || '0', 10),
        pending: parseInt(r.pending || '0', 10)
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve user stats.' });
    }
  });

  /* ---------------------------------------------------- */
  /*               ADMIN API ROUTES                       */
  /* ---------------------------------------------------- */

  // GET /api/admin/stats
  app.get('/api/admin/stats', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const verifRes = await pg.query<any>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'VERIFIED') as verified,
          COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW') as under_review,
          COUNT(*) FILTER (WHERE status = 'UNVERIFIED') as unverified,
          COUNT(*) FILTER (WHERE status = 'RISK_DETECTED') as risk_detected,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending
        FROM website_verifications
      `);

      const userRes = await pg.query<any>(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_users,
          COUNT(*) FILTER (WHERE status = 'SUSPENDED') as suspended_users,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending_users
        FROM users
      `);

      const vr = verifRes.rows[0];
      const ur = userRes.rows[0];

      res.json({
        totalRequests: parseInt(vr.total || '0', 10),
        verified: parseInt(vr.verified || '0', 10),
        underReview: parseInt(vr.under_review || '0', 10),
        unverified: parseInt(vr.unverified || '0', 10),
        riskDetected: parseInt(vr.risk_detected || '0', 10),
        pending: parseInt(vr.pending || '0', 10),
        totalUsers: parseInt(ur.total_users || '0', 10),
        activeUsers: parseInt(ur.active_users || '0', 10),
        suspendedUsers: parseInt(ur.suspended_users || '0', 10),
        pendingUsers: parseInt(ur.pending_users || '0', 10)
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch admin stats.' });
    }
  });

  // GET /api/admin/users
  app.get('/api/admin/users', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { search, role, status, limit, offset } = req.query;
      const data = await UserService.listUsers({
        search: search as string,
        role: role as string,
        status: status as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0
      });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list users.' });
    }
  });

  // PATCH /api/admin/users/:id
  app.patch('/api/admin/users/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, role } = req.body;
      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';

      const updated = await UserService.updateUserStatus({
        adminId: req.user!.id,
        adminEmail: req.user!.email,
        targetUserId: req.params.id,
        status,
        role,
        ipAddress: ip,
        userAgent
      });

      res.json({ user: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update user.' });
    }
  });

  // GET /api/admin/verifications
  app.get('/api/admin/verifications', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { search, status, riskLevel, limit, offset } = req.query;
      const list = await VerificationService.getAllVerifications({
        search: search as string,
        status: status as string,
        riskLevel: riskLevel as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0
      });
      res.json({ verifications: list });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list verifications.' });
    }
  });

  // GET /api/admin/verifications/:verificationId
  app.get('/api/admin/verifications/:verificationId', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const data = await VerificationService.getVerificationDetails(req.params.verificationId, undefined, true);
      if (!data) {
        return res.status(404).json({ error: 'Verification not found.' });
      }
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to load verification.' });
    }
  });

  // PATCH /api/admin/verifications/:verificationId
  app.patch('/api/admin/verifications/:verificationId', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, riskLevel, adminNotes } = req.body;
      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';

      const updated = await VerificationService.updateStatus({
        adminUserId: req.user!.id,
        adminEmail: req.user!.email,
        verificationId: req.params.verificationId,
        status,
        riskLevel: riskLevel || 'UNKNOWN',
        adminNotes,
        ipAddress: ip,
        userAgent
      });

      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update verification status.' });
    }
  });

  // GET /api/admin/audit-logs
  app.get('/api/admin/audit-logs', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { limit, offset, action } = req.query;
      const logs = await AuditService.getLogs(
        limit ? parseInt(limit as string, 10) : 100,
        offset ? parseInt(offset as string, 10) : 0,
        action as string
      );
      res.json({ logs });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve audit logs.' });
    }
  });

  // GET /api/admin/settings
  app.get('/api/admin/settings', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const settingsRes = await pg.query('SELECT * FROM system_settings ORDER BY key ASC');
      res.json({ settings: settingsRes.rows });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch settings.' });
    }
  });

  // PATCH /api/admin/settings
  app.patch('/api/admin/settings', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ error: 'Setting key is required.' });

      await pg.query(
        'UPDATE system_settings SET value = $1, updated_at = NOW() WHERE key = $2',
        [value, key]
      );

      const ip = getClientIp(req);
      await AuditService.log({
        userId: req.user!.id,
        userEmail: req.user!.email,
        action: 'SETTINGS_UPDATED',
        entityType: 'SYSTEM_SETTINGS',
        entityId: key,
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || '',
        metadata: { key, newValue: value }
      });

      res.json({ success: true, key, value });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update setting.' });
    }
  });

  /* ---------------------------------------------------- */
  /*            VITE MIDDLEWARE & SPA SERVING             */
  /* ---------------------------------------------------- */

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lynqora production server running on http://localhost:${PORT}`);
  });
}

startServer();
