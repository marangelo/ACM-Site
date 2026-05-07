import fs from 'node:fs/promises';
import path from 'node:path';

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

export async function GET({ params }) {
  const parts = params.path;
  if (!parts || parts.length === 0) {
    return new Response('Not found', { status: 404 });
  }

  const imagePath = path.join(process.cwd(), 'data', 'uploads', ...parts);

  const normalized = path.normalize(imagePath);
  if (!normalized.startsWith(path.join(process.cwd(), 'data', 'uploads'))) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const image = await fs.readFile(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new Response(image, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch {
    return new Response('Image not found', { status: 404 });
  }
}
