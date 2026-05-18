import { Router } from 'express';
import { pool } from '../db/pool.js';
import { ensureTransactionType } from '../utils/validation.js';

export const categoryRouter = Router();

categoryRouter.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, type, color, icon, created_at
       FROM categories
       WHERE user_id = $1
       ORDER BY type ASC, name ASC`,
      [req.user.id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

categoryRouter.post('/', async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }

    ensureTransactionType(type);

    const result = await pool.query(
      `INSERT INTO categories (user_id, name, type, color, icon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, type, color, icon, created_at`,
      [req.user.id, String(name).trim(), type, color || '#3b82f6', icon || 'wallet'],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Category already exists' });
    }

    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

categoryRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, color, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }

    ensureTransactionType(type);

    const result = await pool.query(
      `UPDATE categories
       SET name = $1, type = $2, color = $3, icon = $4
       WHERE id = $5 AND user_id = $6
       RETURNING id, name, type, color, icon, created_at`,
      [String(name).trim(), type, color || '#3b82f6', icon || 'wallet', id, req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Category already exists' });
    }

    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

categoryRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usage = await pool.query(
      'SELECT COUNT(*)::int AS total FROM transactions WHERE category_id = $1 AND user_id = $2',
      [id, req.user.id],
    );

    if (usage.rows[0].total > 0) {
      return res.status(400).json({
        error: 'Cannot delete category that is already used by transactions',
      });
    }

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});
