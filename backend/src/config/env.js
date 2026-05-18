import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: toNumber(process.env.PORT, 3001),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN_DAYS: toNumber(process.env.JWT_EXPIRES_IN_DAYS, 7),
};

export function validateEnv() {
  const missing = [];

  if (!env.DATABASE_URL) {
    missing.push('DATABASE_URL');
  }

  if (!env.JWT_SECRET) {
    missing.push('JWT_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
