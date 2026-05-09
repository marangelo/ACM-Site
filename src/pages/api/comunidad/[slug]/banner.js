import fsp from 'node:fs/promises';
import path from 'node:path';

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export async function GET({ params }) {
  const bannerDir = path.join(process.cwd(), 'data', 'uploads', 'comunidad', 'banners', params.slug);

  try {
    const files = await fsp.readdir(bannerDir);
    const bannerFile = files.find(f => f.startsWith('banner'));
    if (!bannerFile) throw new Error('no banner');

    const image = await fsp.readFile(path.join(bannerDir, bannerFile));
    const ext = path.extname(bannerFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new Response(image, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
