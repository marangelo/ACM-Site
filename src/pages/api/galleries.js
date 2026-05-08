import { createGallery, getGalleries } from '../../lib/gallery';
import { validateSession } from '../../lib/auth';

export async function POST({ request, cookies }) {
  const token = cookies.get('session')?.value;
  const isValid = await validateSession(token);
  if (!isValid) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/login' }
    });
  }

  const formData = await request.formData();
  const title = formData.get('title');
  const date = formData.get('date');
  const description = formData.get('description') || '';

  if (!title || !date) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/new?error=' + encodeURIComponent('Título y fecha son obligatorios') }
    });
  }

  const gallery = await createGallery(title, date, description);

  return new Response(null, {
    status: 302,
    headers: { Location: `/admin/gallery/${gallery.slug}?message=` + encodeURIComponent('Galería creada exitosamente') }
  });
}
