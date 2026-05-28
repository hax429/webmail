import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host = req.headers.get('host') ?? new URL(req.url).host;
  const res = NextResponse.redirect(`${proto}://${host}/login`, 303);
  res.cookies.set('mail_auth', '', { path: '/', maxAge: 0 });
  return res;
}
