// Vercel Edge Function — contact form → Resend
// POST /api/contact  { name, email, message }
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const origin = req.headers.get('origin') || '';
  const allowed = ['https://whetudigital.co.nz', 'https://www.whetudigital.co.nz'];
  const corsOrigin = allowed.includes(origin) ? origin : allowed[0];

  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
  }

  const { name = '', email = '', message = '' } = body;
  if (!name.trim() || !email.trim() || !message.trim()) {
    return new Response(JSON.stringify({ error: 'All fields required' }), { status: 400, headers });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers });
  }
  if (message.length > 2000) {
    return new Response(JSON.stringify({ error: 'Message too long' }), { status: 400, headers });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'Server config error' }), { status: 500, headers });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Whetū Digital Contact <hello@whetudigital.co.nz>',
      to:   ['hello@whetudigital.co.nz'],
      reply_to: email,
      subject: `New enquiry from ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#05050e;color:#f0f0ff;border-radius:12px">
          <h2 style="color:#a78bfa;margin:0 0 24px">New Whetū Digital enquiry</h2>
          <p><strong style="color:#a78bfa">Name:</strong> ${name}</p>
          <p><strong style="color:#a78bfa">Email:</strong> <a href="mailto:${email}" style="color:#a78bfa">${email}</a></p>
          <p><strong style="color:#a78bfa">Message:</strong></p>
          <p style="background:#0d0d1a;padding:16px;border-radius:8px;border-left:3px solid #a78bfa">${message.replace(/\n/g, '<br>')}</p>
          <hr style="border-color:#1a1a2e;margin:24px 0">
          <p style="color:#6b6b8a;font-size:12px">Sent via whetudigital.co.nz contact form</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
    return new Response(JSON.stringify({ error: 'Failed to send' }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
