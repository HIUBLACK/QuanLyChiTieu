import app from './src/app.js';
import { env, validateEnv } from './src/config/env.js';
import { initDatabase } from './src/db/init.js';

async function start() {
  try {
    validateEnv();
    await initDatabase();

    app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`Backend running on http://0.0.0.0:${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}

start();
