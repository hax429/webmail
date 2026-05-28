import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { resend, DEFAULT_FROM } from '@/lib/resend';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const to = String(form.get('to') ?? '').trim();
  const subject = String(form.get('subject') ?? '').trim();
  const text = String(form.get('text') ?? '');
  const from = String(form.get('from') ?? DEFAULT_FROM);

  if (!to || !subject) {
    return NextResponse.json({ error: 'to and subject are required' }, { status: 400 });
  }

  const { data, error } = await resend.emails.send(
    {
      from,
      to: to.split(',').map((s) => s.trim()),
      subject,
      text,
    },
    { idempotencyKey: `compose/${randomUUID()}` }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host = req.headers.get('host') ?? new URL(req.url).host;
  return NextResponse.redirect(`${proto}://${host}/sent?just=${data!.id}`, 303);
}
