import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get('password') ?? '');
  const next = String(form.get('next') ?? '/');
  const remember = form.get('remember') === '1';

  const expected = process.env.AUTH_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: 'auth not configured' }, { status: 500 });
  }

  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host = req.headers.get('host') ?? new URL(req.url).host;

  if (password !== expected) {
    const params = new URLSearchParams({ error: '1' });
    if (next && next !== '/') params.set('next', next);
    return NextResponse.redirect(`${proto}://${host}/login?${params}`, 303);
  }

  const token = createHash('sha256').update(expected).digest('hex');
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  const res = NextResponse.redirect(`${proto}://${host}${safeNext}`, 303);
  res.cookies.set('mail_auth', token, {
    httpOnly: true,
    secure: proto === 'https',
    sameSite: 'lax',
    path: '/',
    // Persistent (30d) when "remember me" is checked; session cookie otherwise
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
  return res;
}
