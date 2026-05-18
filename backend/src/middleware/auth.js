import { pool } from '../db/pool.js';
import { verifyToken } from '../utils/token.js';

export async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

    if (!token) {
      return res.status(401).json({ error: 'Missing access token' });
    }

    const payload = verifyToken(token);
    const result = await pool.query(
      'SELECT id, full_name, email, created_at FROM users WHERE id = $1',
      [payload.userId],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
