import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_PATH = path.join(process.cwd(), 'data', 'galleries.json');

export function sanitizeSlug(slug) {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/\.\./g, '');
}

export async function getGalleries() {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.galleries || [];
  } catch { return []; }
}

export async function getGallery(slug) {
  const galleries = await getGalleries();
  return galleries.find(g => g.slug === slug) || null;
}

export async function createGallery(title, date, description) {
  const galleries = await getGalleries();
  const slug = sanitizeSlug(title);

  const newGallery = {
    id: Date.now().toString(36),
    slug,
    title,
    date,
    description,
    coverImage: '',
    images: []
  };

  galleries.unshift(newGallery);
  await fs.writeFile(DATA_PATH, JSON.stringify({ galleries }, null, 2));
  return newGallery;
}

export async function deleteGallery(slug) {
  const galleries = await getGalleries();
  const filtered = galleries.filter(g => g.slug !== slug);
  await fs.writeFile(DATA_PATH, JSON.stringify({ galleries: filtered }, null, 2));

  const uploadDir = path.join(process.cwd(), 'data', 'uploads', slug);
  await fs.rm(uploadDir, { recursive: true, force: true });
}

export async function addImages(slug, filenames) {
  const galleries = await getGalleries();
  const gallery = galleries.find(g => g.slug === slug);
  if (!gallery) return null;

  gallery.images.push(...filenames);
  if (!gallery.coverImage && filenames.length > 0) {
    gallery.coverImage = filenames[0];
  }

  await fs.writeFile(DATA_PATH, JSON.stringify({ galleries }, null, 2));
  return gallery;
}

export async function deleteImage(slug, filename) {
  const galleries = await getGalleries();
  const gallery = galleries.find(g => g.slug === slug);
  if (!gallery) return null;

  gallery.images = gallery.images.filter(i => i !== filename);
  if (gallery.coverImage === filename) {
    gallery.coverImage = gallery.images[0] || '';
  }

  await fs.writeFile(DATA_PATH, JSON.stringify({ galleries }, null, 2));

  const filePath = path.join(process.cwd(), 'data', 'uploads', slug, filename);
  await fs.rm(filePath, { force: true });
  return gallery;
}
