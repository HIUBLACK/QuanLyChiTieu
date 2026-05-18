import { Router } from 'express';
import { pool } from '../db/pool.js';
import { defaultCategories } from '../lib/defaultCategories.js';
import { requireAuth } from '../middleware/auth.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { signToken } from '../utils/token.js';
import { assertEmail } from '../utils/validation.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const client = await pool.connect();

  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'fullName, email and password are required' });
    }

    if (!assertEmail(email)) {
      return res.status(400).json({ error: 'Email is invalid' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email already exists' });
    }

    const { passwordHash, salt } = hashPassword(password);
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, salt)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, created_at`,
      [fullName.trim(), email.toLowerCase(), passwordHash, salt],
    );

    const user = userResult.rows[0];
    for (const category of defaultCategories) {
      await client.query(
        `INSERT INTO categories (user_id, name, type, color, icon)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, category.name, category.type, category.color, category.icon],
      );
    }

    await client.query('COMMIT');

    const token = signToken({ userId: user.id, email: user.email });
    return res.status(201).json({ token, user });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  } finally {
    client.release();
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      `SELECT id, full_name, email, password_hash, salt, created_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }

    const userRecord = result.rows[0];
    const isValid = verifyPassword(password, userRecord.password_hash, userRecord.salt);

    if (!isValid) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }

    const token = signToken({ userId: userRecord.id, email: userRecord.email });
    const user = {
      id: userRecord.id,
      full_name: userRecord.full_name,
      email: userRecord.email,
      created_at: userRecord.created_at,
    };

    return res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

authRouter.post('/logout', requireAuth, async (_req, res) => {
  res.json({ ok: true });
});
