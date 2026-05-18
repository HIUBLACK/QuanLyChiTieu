import { pool } from './pool.js';

const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
  icon VARCHAR(40) NOT NULL DEFAULT 'wallet',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name, type)
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  note TEXT NOT NULL DEFAULT '',
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

export async function initDatabase() {
  await pool.query(schemaSql);
}
