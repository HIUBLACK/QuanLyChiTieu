import { Router } from 'express';
import { pool } from '../db/pool.js';
import { parseMonth } from '../utils/validation.js';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', async (req, res) => {
  try {
    const month = parseMonth(req.query.month);
    const monthlyTotals = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float8 AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float8 AS expense
       FROM transactions
       WHERE user_id = $1
         AND TO_CHAR(transaction_date, 'YYYY-MM') = $2`,
      [req.user.id, month],
    );

    const balanceTotals = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float8
         - COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float8 AS balance
       FROM transactions
       WHERE user_id = $1`,
      [req.user.id],
    );

    const byCategory = await pool.query(
      `SELECT
         c.id,
         c.name,
         c.type,
         c.color,
         COALESCE(SUM(t.amount), 0)::float8 AS total
       FROM categories c
       LEFT JOIN transactions t
         ON t.category_id = c.id
         AND TO_CHAR(t.transaction_date, 'YYYY-MM') = $2
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY total DESC, c.name ASC`,
      [req.user.id, month],
    );

    const monthlyTrend = await pool.query(
      `SELECT
         TO_CHAR(transaction_date, 'YYYY-MM') AS month,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float8 AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float8 AS expense
       FROM transactions
       WHERE user_id = $1
         AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
       GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
       ORDER BY month ASC`,
      [req.user.id],
    );

    const recentTransactions = await pool.query(
      `SELECT
         t.id,
         t.type,
         t.amount::float8 AS amount,
         t.note,
         t.transaction_date,
         c.name AS category_name,
         c.color AS category_color
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
       ORDER BY t.transaction_date DESC, t.created_at DESC
       LIMIT 5`,
      [req.user.id],
    );

    res.json({
      month,
      totals: {
        income: monthlyTotals.rows[0].income,
        expense: monthlyTotals.rows[0].expense,
        balance: balanceTotals.rows[0].balance,
      },
      byCategory: byCategory.rows,
      monthlyTrend: monthlyTrend.rows,
      recentTransactions: recentTransactions.rows,
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: error.message || 'Failed to load dashboard summary' });
  }
});
