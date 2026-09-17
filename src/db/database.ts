import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'data', 'pgdata');

// Ensure directory exists
if (!fs.existsSync(path.resolve(process.cwd(), 'data'))) {
  fs.mkdirSync(path.resolve(process.cwd(), 'data'), { recursive: true });
}

export const pg = new PGlite(dbPath);

export async function initDatabase() {
  console.log('[Database] Initializing PostgreSQL via PGlite at:', dbPath);

  await pg.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      email_verified BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS website_verifications (
      id TEXT PRIMARY KEY,
      verification_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      domain TEXT NOT NULL,
      normalized_domain TEXT NOT NULL,
      website_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      risk_level TEXT NOT NULL DEFAULT 'UNKNOWN',
      admin_notes TEXT,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      verified_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS verification_checks (
      id TEXT PRIMARY KEY,
      verification_id TEXT NOT NULL REFERENCES website_verifications(verification_id) ON DELETE CASCADE,
      check_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NOT_CHECKED',
      result TEXT,
      details TEXT,
      checked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      metadata TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_verifications_user ON website_verifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_verifications_status ON website_verifications(status);
    CREATE INDEX IF NOT EXISTS idx_verifications_domain ON website_verifications(normalized_domain);
    CREATE INDEX IF NOT EXISTS idx_checks_verif ON verification_checks(verification_id);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
  `);

  console.log('[Database] Schema verified successfully.');
  await seedDatabase();
}

async function seedDatabase() {
  const userCount = await pg.query<{ count: string }>('SELECT COUNT(*) as count FROM users');
  if (parseInt(userCount.rows[0].count, 10) > 0) {
    return;
  }

  console.log('[Database] Seeding initial Lynqora Phase 1 users and configuration...');

  const adminPasswordHash = await bcrypt.hash('ChangeMe!2026', 10);
  const demoPasswordHash = await bcrypt.hash('DemoUser!2026', 10);

  const adminId = 'usr_admin_01';
  const demoId = 'usr_demo_02';

  // Seed Admin and Demo users
  await pg.query(`
    INSERT INTO users (id, name, email, password_hash, role, status, email_verified, created_at, updated_at)
    VALUES 
      ($1, 'Lynqora Administrator', 'admin@lynqora.com', $2, 'SUPER_ADMIN', 'ACTIVE', true, NOW(), NOW()),
      ($3, 'Alex Mercer (Demo)', 'demo@lynqora.com', $4, 'USER', 'ACTIVE', true, NOW(), NOW())
  `, [adminId, adminPasswordHash, demoId, demoPasswordHash]);

  // Seed Default Settings
  const settings = [
    { id: 'set_1', key: 'platform_name', value: 'Lynqora', description: 'Platform display name' },
    { id: 'set_2', key: 'platform_tagline', value: 'Know Who You Trust Online.', description: 'Platform tagline' },
    { id: 'set_3', key: 'support_email', value: 'support@lynqora.com', description: 'Public support contact' },
    { id: 'set_4', key: 'default_verification_status', value: 'PENDING', description: 'Initial status for submitted domains' },
    { id: 'set_5', key: 'allow_new_submissions', value: 'true', description: 'Whether users can submit new domains' },
    { id: 'set_6', key: 'default_expiration_days', value: '365', description: 'Validity duration in days for verified domains' },
    { id: 'set_7', key: 'session_duration_hours', value: '24', description: 'User session duration in hours' },
    { id: 'set_8', key: 'audit_logging_enabled', value: 'true', description: 'Global audit logging enabled' }
  ];

  for (const s of settings) {
    await pg.query(
      'INSERT INTO system_settings (id, key, value, description, updated_at) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (key) DO NOTHING',
      [s.id, s.key, s.value, s.description]
    );
  }

  // Seed initial sample verification requests (clearly labeled demo)
  const initialVerifications = [
    {
      id: 'v_demo_1',
      verification_id: 'LQ-2026-8F72K4',
      user_id: demoId,
      domain: 'example.com',
      normalized_domain: 'example.com',
      website_url: 'https://example.com',
      status: 'UNDER_REVIEW',
      risk_level: 'UNKNOWN',
      admin_notes: 'Initial sample demonstration request for UI testing. Pending manual review.',
      submitted_at: '2026-09-17T08:30:00Z',
    },
    {
      id: 'v_demo_2',
      verification_id: 'LQ-2026-4A91KD',
      user_id: demoId,
      domain: 'testsite.com',
      normalized_domain: 'testsite.com',
      website_url: 'https://www.testsite.com/',
      status: 'UNVERIFIED',
      risk_level: 'UNKNOWN',
      admin_notes: 'Demonstration unverified sample record.',
      submitted_at: '2026-09-16T14:15:00Z',
    },
    {
      id: 'v_demo_3',
      verification_id: 'LQ-2026-9C31BE',
      user_id: adminId,
      domain: 'trustportal-preview.org',
      normalized_domain: 'trustportal-preview.org',
      website_url: 'https://trustportal-preview.org',
      status: 'PENDING',
      risk_level: 'UNKNOWN',
      admin_notes: 'Testing pending verification pipeline queue.',
      submitted_at: '2026-09-17T09:10:00Z',
    }
  ];

  const checkTypes = [
    'DOMAIN_OWNERSHIP',
    'SSL',
    'DOMAIN_AGE',
    'DNS',
    'WEBSITE_ACCESSIBILITY',
    'REDIRECTS',
    'SECURITY_HEADERS',
    'BUSINESS_IDENTITY',
    'THREAT_INTELLIGENCE'
  ];

  for (const v of initialVerifications) {
    await pg.query(`
      INSERT INTO website_verifications 
        (id, verification_id, user_id, domain, normalized_domain, website_url, status, risk_level, admin_notes, submitted_at, updated_at, created_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $10)
    `, [v.id, v.verification_id, v.user_id, v.domain, v.normalized_domain, v.website_url, v.status, v.risk_level, v.admin_notes, v.submitted_at]);

    // Insert 9 standard checks for each verification
    for (let i = 0; i < checkTypes.length; i++) {
      const checkId = `chk_${v.verification_id}_${i + 1}`;
      await pg.query(`
        INSERT INTO verification_checks 
          (id, verification_id, check_type, status, result, details, created_at)
        VALUES 
          ($1, $2, $3, 'NOT_CHECKED', 'Not Checked', 'Automated check queued for Phase 2 verification engine.', NOW())
      `, [checkId, v.verification_id, checkTypes[i]]);
    }
  }

  // Seed sample audit logs
  await pg.query(`
    INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, ip_address, user_agent, metadata, created_at)
    VALUES
      ('log_seed_1', $1, 'admin@lynqora.com', 'ADMIN_LOGIN', 'USER', $1, '127.0.0.1', 'Mozilla/5.0 Lynqora Seed Agent', '{"note": "Initial system bootstrap"}', NOW() - INTERVAL '2 hours'),
      ('log_seed_2', $2, 'demo@lynqora.com', 'REGISTER', 'USER', $2, '127.0.0.1', 'Mozilla/5.0 Lynqora Seed Agent', '{"note": "Demo user registered"}', NOW() - INTERVAL '1 day'),
      ('log_seed_3', $2, 'demo@lynqora.com', 'VERIFICATION_CREATED', 'WEBSITE_VERIFICATION', 'LQ-2026-8F72K4', '127.0.0.1', 'Mozilla/5.0 Lynqora Seed Agent', '{"domain": "example.com"}', NOW() - INTERVAL '3 hours')
  `, [adminId, demoId]);

  // Seed sample notifications
  await pg.query(`
    INSERT INTO notifications (id, user_id, type, title, message, read, created_at)
    VALUES
      ('notif_1', $1, 'SYSTEM', 'Welcome to Lynqora', 'Your Lynqora account is active and ready. Phase 1 foundation online.', false, NOW()),
      ('notif_2', $1, 'VERIFICATION', 'Submission Received', 'Domain verification request for example.com (LQ-2026-8F72K4) received and under review.', false, NOW())
  `, [demoId]);

  console.log('[Database] Database seeded successfully with admin@lynqora.com and demo@lynqora.com!');
}
