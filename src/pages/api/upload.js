import fs from 'node:fs/promises';
import path from 'node:path';
import { addImages } from '../../lib/gallery';
import { validateSession } from '../../lib/auth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST({ request, cookies }) {
  const token = cookies.get('session')?.value;
  const isValid = await validateSession(token);
  if (!isValid) {
    return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const slug = formData.get('slug');
    const files = formData.getAll('photos');

    if (!slug || files.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Faltan datos' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const uploadDir = path.join(process.cwd(), 'data', 'uploads', slug);
    await fs.mkdir(uploadDir, { recursive: true });

    const savedFiles = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_SIZE) continue;

      const ext = path.extname(file.name) || '.jpg';
      const timestamp = Date.now();
      const safeName = `${timestamp}-${Math.random().toString(36).slice(2, 6)}${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(uploadDir, safeName);

      await fs.writeFile(filePath, buffer);
      savedFiles.push(safeName);
    }

    if (savedFiles.length > 0) {
      await addImages(slug, savedFiles);
    }

    return new Response(JSON.stringify({ success: true, files: savedFiles }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
