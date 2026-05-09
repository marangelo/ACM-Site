import { updatePost, getPost } from '../../../../lib/community';
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
  const title = formData.get('title');
  const content = formData.get('content');
  const author = formData.get('author');
  const date = formData.get('date');
  const status = formData.get('status');

  if (!title || !content) {
    return new Response(null, {
      status: 302,
      headers: { Location: `/admin/comunidad/${params.slug}?error=` + encodeURIComponent('Título y contenido son obligatorios') }
    });
  }

  await updatePost(params.slug, { title, content, author, date, status });

  return new Response(null, {
    status: 302,
    headers: { Location: `/admin/comunidad/${params.slug}?message=` + encodeURIComponent('Publicación actualizada') }
  });
}
