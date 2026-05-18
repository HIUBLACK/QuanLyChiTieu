import { Router } from 'express';
import { pool } from '../db/pool.js';
import { ensureTransactionType, parseMonth } from '../utils/validation.js';

export const transactionRouter = Router();

transactionRouter.get('/', async (req, res) => {
  try {
    const month = parseMonth(req.query.month);
    const result = await pool.query(
      `SELECT
         t.id,
         t.category_id,
         t.type,
         t.amount::float8 AS amount,
         t.note,
         t.transaction_date,
         t.created_at,
         t.updated_at,
         c.name AS category_name,
         c.color AS category_color,
         c.icon AS category_icon
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
         AND TO_CHAR(t.transaction_date, 'YYYY-MM') = $2
       ORDER BY t.transaction_date DESC, t.created_at DESC`,
      [req.user.id, month],
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List transactions error:', error);
    res.status(500).json({ error: error.message || 'Failed to load transactions' });
  }
});

transactionRouter.post('/', async (req, res) => {
  try {
    const { categoryId, type, amount, note, transactionDate } = req.body;

    if (!categoryId || !type || !amount || !transactionDate) {
      return res.status(400).json({ error: 'categoryId, type, amount and transactionDate are required' });
    }

    ensureTransactionType(type);

    const category = await pool.query(
      'SELECT id, type FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, req.user.id],
    );

    if (category.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.rows[0].type !== type) {
      return res.status(400).json({ error: 'Transaction type must match category type' });
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, category_id, type, amount, note, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, category_id, type, amount::float8 AS amount, note, transaction_date, created_at, updated_at`,
      [req.user.id, categoryId, type, amount, note || '', transactionDate],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

transactionRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, type, amount, note, transactionDate } = req.body;

    if (!categoryId || !type || !amount || !transactionDate) {
      return res.status(400).json({ error: 'categoryId, type, amount and transactionDate are required' });
    }

    ensureTransactionType(type);

    const category = await pool.query(
      'SELECT id, type FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, req.user.id],
    );

    if (category.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.rows[0].type !== type) {
      return res.status(400).json({ error: 'Transaction type must match category type' });
    }

    const result = await pool.query(
      `UPDATE transactions
       SET category_id = $1,
           type = $2,
           amount = $3,
           note = $4,
           transaction_date = $5,
           updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING id, category_id, type, amount::float8 AS amount, note, transaction_date, created_at, updated_at`,
      [categoryId, type, amount, note || '', transactionDate, id, req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

transactionRouter.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});
