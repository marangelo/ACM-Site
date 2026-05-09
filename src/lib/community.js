import fsp from 'node:fs/promises';
import path from 'node:path';

const DATA_PATH = path.join(process.cwd(), 'data', 'community.json');

export function sanitizeSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/\.\./g, '');
}

export async function getPosts() {
  try {
    const data = await fsp.readFile(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.posts || [];
  } catch { return []; }
}

export async function getPost(slug) {
  const posts = await getPosts();
  return posts.find(p => p.slug === slug) || null;
}

export async function createPost(title, content, author, date) {
  const posts = await getPosts();

  let slug = sanitizeSlug(title);
  if (posts.find(p => p.slug === slug)) {
    slug = slug + '-' + Date.now().toString(36);
  }

  const post = {
    id: Date.now().toString(36),
    slug,
    title,
    content,
    author,
    date,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };

  posts.unshift(post);
  await fsp.writeFile(DATA_PATH, JSON.stringify({ posts }, null, 2));
  return post;
}

export async function updatePost(slug, { title, content, author, date }) {
  const posts = await getPosts();
  const idx = posts.findIndex(p => p.slug === slug);
  if (idx === -1) return null;

  if (title !== undefined) posts[idx].title = title;
  if (content !== undefined) posts[idx].content = content;
  if (author !== undefined) posts[idx].author = author;
  if (date !== undefined) posts[idx].date = date;

  await fsp.writeFile(DATA_PATH, JSON.stringify({ posts }, null, 2));
  return posts[idx];
}

export async function setPostStatus(slug, status) {
  const posts = await getPosts();
  const idx = posts.findIndex(p => p.slug === slug);
  if (idx === -1) return null;

  posts[idx].status = status;
  await fsp.writeFile(DATA_PATH, JSON.stringify({ posts }, null, 2));
  return posts[idx];
}

export async function deletePost(slug) {
  const posts = await getPosts();
  const filtered = posts.filter(p => p.slug !== slug);
  await fsp.writeFile(DATA_PATH, JSON.stringify({ posts: filtered }, null, 2));
}
