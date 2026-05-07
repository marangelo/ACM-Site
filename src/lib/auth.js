import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const SESSIONS_PATH = path.join(process.cwd(), 'data', 'sessions.json');
const SESSION_DURATION = 24 * 60 * 60 * 1000;

async function readSessions() {
  try {
    const data = await fs.readFile(SESSIONS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch { return {}; }
}

async function writeSessions(sessions) {
  await fs.writeFile(SESSIONS_PATH, JSON.stringify(sessions, null, 2));
}

export async function createSession(password) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (password !== adminPassword) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const sessions = await readSessions();
  sessions[token] = { createdAt: Date.now() };
  await writeSessions(sessions);
  return token;
}

export async function validateSession(token) {
  if (!token) return false;
  const sessions = await readSessions();
  const session = sessions[token];
  if (!session) return false;
  if (Date.now() - session.createdAt > SESSION_DURATION) {
    delete sessions[token];
    await writeSessions(sessions);
    return false;
  }
  return true;
}

export async function destroySession(token) {
  const sessions = await readSessions();
  delete sessions[token];
  await writeSessions(sessions);
}
