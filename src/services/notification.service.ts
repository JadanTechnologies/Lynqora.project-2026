import { pg } from '../db/database.ts';
import crypto from 'crypto';

export class NotificationService {
  static async create(userId: string, type: string, title: string, message: string): Promise<void> {
    try {
      const id = `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      await pg.query(`
        INSERT INTO notifications (id, user_id, type, title, message, read, created_at)
        VALUES ($1, $2, $3, $4, $5, false, NOW())
      `, [id, userId, type, title, message]);
    } catch (err) {
      console.error('[NotificationService] Failed to insert notification:', err);
    }
  }

  static async getUserNotifications(userId: string) {
    const res = await pg.query<any>(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [userId]);

    return res.rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      title: r.title,
      message: r.message,
      read: Boolean(r.read),
      createdAt: r.created_at
    }));
  }

  static async markAsRead(userId: string, notificationId: string): Promise<void> {
    await pg.query(`
      UPDATE notifications 
      SET read = true 
      WHERE id = $1 AND user_id = $2
    `, [notificationId, userId]);
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await pg.query(`
      UPDATE notifications 
      SET read = true 
      WHERE user_id = $1
    `, [userId]);
  }
}
