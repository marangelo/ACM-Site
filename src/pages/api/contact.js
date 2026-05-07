export async function POST({ request }) {
  const formData = await request.formData();
  const name = formData.get('name');
  const email = formData.get('email');
  const phone = formData.get('phone') || '';
  const message = formData.get('message');

  const data = { name, email, phone, message, date: new Date().toISOString() };

  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const messagesPath = path.join(process.cwd(), 'data', 'messages.json');

    let messages = [];
    try {
      const existing = await fs.readFile(messagesPath, 'utf-8');
      messages = JSON.parse(existing);
    } catch { /* file doesn't exist yet */ }

    messages.push(data);
    await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2));

    return new Response(null, {
      status: 302,
      headers: { Location: '/contacto?sent=true' }
    });
  } catch (err) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/contacto?sent=true' }
    });
  }
}
