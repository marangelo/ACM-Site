import { setPostStatus } from '../../../../lib/community';
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
  const status = formData.get('status');

  if (status && (status === 'draft' || status === 'published')) {
    await setPostStatus(params.slug, status);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: '/admin/comunidad?message=' + encodeURIComponent('Estado actualizado') }
  });
}
