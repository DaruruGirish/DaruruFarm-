const fs = require('fs');
const path = require('path');

function loadBackendEnv() {
  const envPath = path.join(__dirname, '..', '..', 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing ${envPath}. Copy backend/.env.example to backend/.env first.`);
  }
  const out = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

function assertDevSeedAllowed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to load synthetic test data. This script is for local UI testing only.');
    process.exit(1);
  }
}

function dbConfig() {
  const env = loadBackendEnv();
  return {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USERNAME || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_DATABASE || 'daruru_farm',
  };
}

module.exports = { loadBackendEnv, assertDevSeedAllowed, dbConfig };
