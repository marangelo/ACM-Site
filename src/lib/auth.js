import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { query } from './db.js';
import { initDatabase } from './init-db.js';

const SESSION_DURATION = 24 * 60 * 60 * 1000;

function getAdminPassword() {
  const fromEnv = typeof process !== 'undefined' && process.env && process.env.ADMIN_PASSWORD;
  const fromMeta = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.ADMIN_PASSWORD;
  const fromFile = (() => {
    try {
      const envPath = path.join(process.cwd(), '.env');
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/^ADMIN_PASSWORD=(.+)$/m);
      return match ? match[1].trim() : null;
    } catch { return null; }
  })();
  return fromEnv || fromMeta || fromFile || 'admin123';
}

export async function createSession(password) {
  await initDatabase();
  const adminPassword = getAdminPassword();
  if (password !== adminPassword) return null;

  const token = crypto.randomBytes(32).toString('hex');
  await query(
    'INSERT INTO sessions (token, created_at) VALUES (?, ?)',
    [token, Date.now()]
  );
  return token;
}

export async function validateSession(token) {
  if (!token) return false;
  await initDatabase();
  const rows = await query(
    'SELECT created_at FROM sessions WHERE token = ?',
    [token]
  );
  if (rows.length === 0) return false;
  const { created_at } = rows[0];
  if (Date.now() - created_at > SESSION_DURATION) {
    await query('DELETE FROM sessions WHERE token = ?', [token]);
    return false;
  }
  return true;
}

export async function destroySession(token) {
  await initDatabase();
  await query('DELETE FROM sessions WHERE token = ?', [token]);
}
