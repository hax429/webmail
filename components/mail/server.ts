// Server-side data adapters: fetch from SQLite (inbox) and Resend (sent),
// shape into ReceivedUI / SentUI for the client shell.

import { listReceived } from '@/lib/db';
import type { ReceivedUI, SentUI } from './types';
import { parseAddress, snippetFrom } from './utils';

export function loadReceived(limit = 200): ReceivedUI[] {
  const rows = listReceived(limit);
  return rows.map((r) => {
    const parsed = parseAddress(r.from_addr);
    return {
      id: r.id,
      from_addr: r.from_addr,
      from_name: parsed.name,
      from_email: parsed.email,
      to_addrs: r.to_addrs,
      subject: r.subject,
      snippet: snippetFrom(r.text || r.html),
      text: r.text,
      html: r.html,
      received_at: r.received_at,
      // No unread/starred persistence yet — UI tracks these in-session.
      unread: true,
      starred: false,
    };
  });
}

type ResendListItem = {
  id: string;
  from?: string;
  to?: string[] | string;
  subject?: string;
  created_at?: string;
  last_event?: string;
  html?: string | null;
  text?: string | null;
};

export async function loadSent(limit = 100): Promise<SentUI[]> {
  if (!process.env.RESEND_API_KEY) return [];
  const { resend } = await import('@/lib/resend');
  const { data, error } = await resend.emails.list({ limit });
  if (error) {
    console.error('[loadSent]', error.message);
    return [];
  }
  const rows = ((data as { data?: ResendListItem[] } | null)?.data ?? []) as ResendListItem[];
  return rows.map((r) => ({
    id: r.id,
    from: r.from ?? '',
    to: r.to ?? [],
    subject: r.subject ?? null,
    snippet: snippetFrom(r.text ?? r.html ?? null),
    text: r.text ?? null,
    html: r.html ?? null,
    created_at: r.created_at ?? new Date().toISOString(),
    last_event: (r.last_event ?? null) as SentUI['last_event'],
  }));
}
