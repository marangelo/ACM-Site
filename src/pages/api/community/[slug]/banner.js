import fsp from 'node:fs/promises';
import path from 'node:path';
import { setPostBanner } from '../../../../lib/community';
import { validateSession } from '../../../../lib/auth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST({ params, request, cookies }) {
  const token = cookies.get('session')?.value;
  const isValid = await validateSession(token);
  if (!isValid) {
    return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('banner');

    if (!file || !ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ success: false, error: 'Formato no permitido. Usa JPG, PNG o WebP' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ success: false, error: 'La imagen supera los 5MB' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const uploadDir = path.join(process.cwd(), 'data', 'uploads', 'comunidad', 'banners', params.slug);
    await fsp.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || '.jpg';
    const filename = `banner${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fsp.writeFile(path.join(uploadDir, filename), buffer);

    await setPostBanner(params.slug, filename);

    return new Response(JSON.stringify({ success: true, filename }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
