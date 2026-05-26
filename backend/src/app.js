import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { requireAuth } from './middleware/auth.js';
import { authRouter } from './routes/authRoutes.js';
import { categoryRouter } from './routes/categoryRoutes.js';
import { transactionRouter } from './routes/transactionRoutes.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: false,
  }),
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    message: 'Expense Manager API',
    health: '/api/health',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'expense-manager-api',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/categories', requireAuth, categoryRouter);
app.use('/api/transactions', requireAuth, transactionRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

app.use((error, _req, res, _next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
