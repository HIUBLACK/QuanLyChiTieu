import app from '../src/app.js';
import { validateEnv } from '../src/config/env.js';
import { initDatabase } from '../src/db/init.js';

let initialized = false;

async function ensureReady() {
  if (initialized) {
    return;
  }

  validateEnv();
  await initDatabase();
  initialized = true;
}

export default async function handler(req, res) {
  await ensureReady();
  return app(req, res);
}
