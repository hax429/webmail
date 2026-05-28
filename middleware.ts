import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/login', '/api/logout', '/api/webhook'];

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const password = process.env.AUTH_PASSWORD;
  if (!password) return NextResponse.next(); // no password configured → no gate

  const expected = await sha256(password);
  const got = req.cookies.get('mail_auth')?.value;
  if (got && got === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  if (pathname !== '/') url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/|favicon\\.ico).*)'],
};
