import { deleteImage } from '../../../../lib/gallery';
import { validateSession } from '../../../../lib/auth';

export async function POST({ params, request, cookies }) {
  const token = cookies.get('session')?.value;
  const isValid = await validateSession(token);
  if (!isValid) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/login' }
    });
  }

  const formData = await request.formData();
  const filename = formData.get('filename');

  if (filename) {
    await deleteImage(params.slug, filename);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: `/admin/gallery/${params.slug}?message=Foto eliminada` }
  });
}
