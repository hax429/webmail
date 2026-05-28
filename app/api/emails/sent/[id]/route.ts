import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await resend.emails.get(id);
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ html: data.html, text: data.text });
}
