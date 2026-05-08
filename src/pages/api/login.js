import { createSession } from '../../lib/auth';

export async function POST({ request, cookies }) {
  const formData = await request.formData();
  const password = formData.get('password');

  if (!password) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/login?error=' + encodeURIComponent('Ingresa la contraseña') }
    });
  }

  const token = await createSession(password);

  if (!token) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/login?error=' + encodeURIComponent('Contraseña incorrecta') }
    });
  }

  cookies.set('session', token, {
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24
  });

  return new Response(null, {
    status: 302,
    headers: { Location: '/admin' }
  });
}
