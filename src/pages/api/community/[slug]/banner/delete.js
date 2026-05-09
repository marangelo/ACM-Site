import { deleteBanner } from '../../../../../lib/community';
import { validateSession } from '../../../../../lib/auth';

export async function POST({ params, cookies }) {
  const token = cookies.get('session')?.value;
  const isValid = await validateSession(token);
  if (!isValid) {
    return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    await deleteBanner(params.slug);
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
