import { createPost } from '../../lib/community';
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
  const content = formData.get('content');
  const author = formData.get('author') || 'Admin';
  const date = formData.get('date') || new Date().toISOString().split('T')[0];

  if (!title || !content) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/comunidad/new?error=' + encodeURIComponent('Título y contenido son obligatorios') }
    });
  }

  const post = await createPost(title, content, author, date);

  return new Response(null, {
    status: 302,
    headers: { Location: `/admin/comunidad/${post.slug}?message=` + encodeURIComponent('Publicación creada exitosamente') }
  });
}
