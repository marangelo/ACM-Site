import { query } from './db.js';
import { initDatabase } from './init-db.js';

export function sanitizeSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/\.\./g, '');
}

export async function getPosts() {
  await initDatabase();
  const rows = await query(
    'SELECT * FROM posts ORDER BY date DESC'
  );
  return rows.map(mapPost);
}

export async function getPost(slug) {
  await initDatabase();
  const rows = await query('SELECT * FROM posts WHERE slug = ?', [slug]);
  return rows.length > 0 ? mapPost(rows[0]) : null;
}

export async function createPost(title, content, author, date) {
  await initDatabase();
  let slug = sanitizeSlug(title);
  const existing = await query('SELECT slug FROM posts WHERE slug = ?', [slug]);
  if (existing.length > 0) {
    slug = slug + '-' + Date.now().toString(36);
  }

  const id = Date.now().toString(36);
  const createdAt = new Date().toISOString();

  await query(
    `INSERT INTO posts (id, slug, title, content, author, date, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)`,
    [id, slug, title, content, author || '', date || null, createdAt]
  );

  return { id, slug, title, content, author: author || '', date: date || null, status: 'draft', banner: '', createdAt };
}

export async function updatePost(slug, { title, content, author, date, status }) {
  await initDatabase();
  const fields = [];
  const params = [];

  if (title !== undefined) { fields.push('title = ?'); params.push(title); }
  if (content !== undefined) { fields.push('content = ?'); params.push(content); }
  if (author !== undefined) { fields.push('author = ?'); params.push(author); }
  if (date !== undefined) { fields.push('date = ?'); params.push(date); }
  if (status !== undefined && (status === 'draft' || status === 'published')) {
    fields.push('status = ?'); params.push(status);
  }

  if (fields.length === 0) return getPost(slug);

  params.push(slug);
  await query(
    `UPDATE posts SET ${fields.join(', ')} WHERE slug = ?`,
    params
  );

  return getPost(slug);
}

export async function setPostBanner(slug, filename) {
  await initDatabase();
  await query('UPDATE posts SET banner = ? WHERE slug = ?', [filename, slug]);
  return getPost(slug);
}

export async function setPostStatus(slug, status) {
  await initDatabase();
  await query("UPDATE posts SET status = ? WHERE slug = ?", [status, slug]);
  return getPost(slug);
}

export async function deleteBanner(slug) {
  await initDatabase();
  await query("UPDATE posts SET banner = '' WHERE slug = ?", [slug]);
}

export async function deletePost(slug) {
  await initDatabase();
  await query('DELETE FROM posts WHERE slug = ?', [slug]);
}

function mapPost(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content || '',
    author: row.author || '',
    date: row.date ? row.date.toISOString?.()?.split('T')[0] || row.date : '',
    status: row.status || 'draft',
    banner: row.banner || '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
  };
}
