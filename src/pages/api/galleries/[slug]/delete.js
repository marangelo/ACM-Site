import { deleteGallery } from '../../../../lib/gallery';
import { validateSession } from '../../../../lib/auth';

export async function POST({ params, cookies }) {
  const token = cookies.get('session')?.value;
  const isValid = await validateSession(token);
  if (!isValid) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/login' }
    });
  }

  await deleteGallery(params.slug);

  return new Response(null, {
    status: 302,
    headers: { Location: '/admin?message=' + encodeURIComponent('Galería eliminada') }
  });
}
