import { query } from './db.js';
import fsp from 'node:fs/promises';
import path from 'node:path';

const SQL = `
CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(64) PRIMARY KEY,
  created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR(36) PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  author VARCHAR(255) DEFAULT '',
  date DATE DEFAULT NULL,
  status ENUM('draft','published') DEFAULT 'draft',
  banner VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS galleries (
  id VARCHAR(36) PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  date DATE DEFAULT NULL,
  description TEXT,
  cover_image VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gallery_slug VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gallery_slug) REFERENCES galleries(slug) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

let initialized = false;

export async function initDatabase() {
  if (initialized) return;
  try {
    const statements = SQL.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      await query(stmt.trim());
    }
    initialized = true;
    console.log('[DB] Tables initialized successfully');
  } catch (err) {
    console.error('[DB] Failed to initialize tables:', err.message);
    throw err;
  }
}

export async function migrateData() {
  await initDatabase();

  const dataDir = path.join(process.cwd(), 'data');

  // Migrate sessions
  try {
    const sessionsData = await fsp.readFile(path.join(dataDir, 'sessions.json'), 'utf-8');
    const sessions = JSON.parse(sessionsData);
    for (const [token, session] of Object.entries(sessions)) {
      await query(
        'INSERT IGNORE INTO sessions (token, created_at) VALUES (?, ?)',
        [token, session.createdAt]
      );
    }
    console.log('[DB] Sessions migrated');
  } catch { /* no sessions to migrate */ }

  // Migrate posts
  try {
    const postsData = await fsp.readFile(path.join(dataDir, 'community.json'), 'utf-8');
    const { posts } = JSON.parse(postsData);
    for (const post of posts) {
      await query(
        `INSERT IGNORE INTO posts (id, slug, title, content, author, date, status, banner, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [post.id, post.slug, post.title, post.content, post.author || '', post.date || null, post.status || 'draft', post.banner || '', post.createdAt || new Date().toISOString()]
      );
    }
    console.log('[DB] Posts migrated:', posts.length);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('[DB] Posts migration error:', err.message);
  }

  // Migrate galleries
  try {
    const galleriesData = await fsp.readFile(path.join(dataDir, 'galleries.json'), 'utf-8');
    const { galleries } = JSON.parse(galleriesData);
    for (const gallery of galleries) {
      await query(
        `INSERT IGNORE INTO galleries (id, slug, title, date, description, cover_image, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [gallery.id, gallery.slug, gallery.title, gallery.date || null, gallery.description || '', gallery.coverImage || '', gallery.createdAt || new Date().toISOString()]
      );
      if (gallery.images && gallery.images.length > 0) {
        for (const filename of gallery.images) {
          await query(
            'INSERT IGNORE INTO images (gallery_slug, filename) VALUES (?, ?)',
            [gallery.slug, filename]
          );
        }
      }
    }
    console.log('[DB] Galleries migrated:', galleries.length);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('[DB] Galleries migration error:', err.message);
  }
}
