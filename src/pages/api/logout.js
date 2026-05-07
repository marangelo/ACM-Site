import { destroySession } from '../../lib/auth';

export async function GET({ cookies }) {
  const token = cookies.get('session')?.value;
  if (token) {
    await destroySession(token);
  }
  cookies.delete('session', { path: '/' });
  return new Response(null, {
    status: 302,
    headers: { Location: '/admin/login' }
  });
}
