import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

const poolConfig = {
  connectionString: env.DATABASE_URL,
  max: env.NODE_ENV === 'production' ? 5 : 10,
  idleTimeoutMillis: 10000,
};

if (env.DATABASE_URL.includes('supabase.co')) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

export const pool = new Pool(poolConfig);
