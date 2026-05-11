import { query } from './db.js';
import { initDatabase } from './init-db.js';
import fsp from 'node:fs/promises';
import path from 'node:path';

export function sanitizeSlug(slug) {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/\.\./g, '');
}

export async function getGalleries() {
  await initDatabase();
  const rows = await query('SELECT * FROM galleries ORDER BY date DESC');
  const galleries = [];
  for (const g of rows) {
    const images = await query('SELECT filename FROM images WHERE gallery_slug = ? ORDER BY id ASC', [g.slug]);
    galleries.push(mapGallery(g, images.map(i => i.filename)));
  }
  return galleries;
}

export async function getGallery(slug) {
  await initDatabase();
  const rows = await query('SELECT * FROM galleries WHERE slug = ?', [slug]);
  if (rows.length === 0) return null;
  const images = await query('SELECT filename FROM images WHERE gallery_slug = ? ORDER BY id ASC', [slug]);
  return mapGallery(rows[0], images.map(i => i.filename));
}

export async function createGallery(title, date, description) {
  await initDatabase();
  let slug = sanitizeSlug(title);
  const existing = await query('SELECT slug FROM galleries WHERE slug = ?', [slug]);
  if (existing.length > 0) {
    slug = slug + '-' + Date.now().toString(36);
  }

  const id = Date.now().toString(36);
  await query(
    `INSERT INTO galleries (id, slug, title, date, description)
     VALUES (?, ?, ?, ?, ?)`,
    [id, slug, title, date || null, description || '']
  );

  return { id, slug, title, date: date || '', description: description || '', coverImage: '', images: [] };
}

export async function deleteGallery(slug) {
  await initDatabase();
  await query('DELETE FROM images WHERE gallery_slug = ?', [slug]);
  await query('DELETE FROM galleries WHERE slug = ?', [slug]);

  const uploadDir = path.join(process.cwd(), 'data', 'uploads', slug);
  await fsp.rm(uploadDir, { recursive: true, force: true }).catch(() => {});
}

export async function addImages(slug, filenames) {
  await initDatabase();
  for (const filename of filenames) {
    await query(
      'INSERT INTO images (gallery_slug, filename) VALUES (?, ?)',
      [slug, filename]
    );
  }
  const gallery = await getGallery(slug);
  if (gallery && !gallery.coverImage && filenames.length > 0) {
    await query('UPDATE galleries SET cover_image = ? WHERE slug = ?', [filenames[0], slug]);
    gallery.coverImage = filenames[0];
  }
  return gallery;
}

export async function deleteImage(slug, filename) {
  await initDatabase();
  await query(
    'DELETE FROM images WHERE gallery_slug = ? AND filename = ?',
    [slug, filename]
  );

  const gallery = await getGallery(slug);
  if (gallery && gallery.coverImage === filename) {
    const newCover = gallery.images.length > 0 ? gallery.images[0] : '';
    await query('UPDATE galleries SET cover_image = ? WHERE slug = ?', [newCover, slug]);
  }

  const filePath = path.join(process.cwd(), 'data', 'uploads', slug, filename);
  await fsp.rm(filePath, { force: true }).catch(() => {});
  return getGallery(slug);
}

function mapGallery(row, imageFilenames) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: row.date ? row.date.toISOString?.()?.split('T')[0] || row.date : '',
    description: row.description || '',
    coverImage: row.cover_image || (imageFilenames.length > 0 ? imageFilenames[0] : ''),
    images: imageFilenames,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
  };
}
