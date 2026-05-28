import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { insertReceived } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const payload = await req.text(); // raw body required for signature verification
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'webhook secret not configured' }, { status: 500 });
  }

  let event: any;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get('svix-id') ?? '',
        timestamp: req.headers.get('svix-timestamp') ?? '',
        signature: req.headers.get('svix-signature') ?? '',
      },
      webhookSecret: secret,
    });
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  if (event.type !== 'email.received') {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const emailId: string = event.data.email_id;

  const { data: full, error } = await resend.emails.receiving.get(emailId);
  if (error || !full) {
    return NextResponse.json({ error: error?.message ?? 'fetch failed' }, { status: 502 });
  }

  insertReceived({
    id: full.id,
    from_addr: full.from ?? '',
    to_addrs: Array.isArray(full.to) ? full.to.join(', ') : (full.to ?? ''),
    subject: full.subject ?? null,
    text: full.text ?? null,
    html: full.html ?? null,
    received_at: full.created_at ?? new Date().toISOString(),
    raw_json: JSON.stringify(full),
  });

  return NextResponse.json({ ok: true });
}
