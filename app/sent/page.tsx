import Link from 'next/link';
import { resend } from '@/lib/resend';

export const dynamic = 'force-dynamic';

type SentRow = {
  id: string;
  from?: string;
  to?: string[] | string;
  subject?: string;
  created_at?: string;
  last_event?: string;
};

export default async function SentPage({
  searchParams,
}: {
  searchParams: Promise<{ just?: string }>;
}) {
  const { just } = await searchParams;

  const { data, error } = await resend.emails.list({ limit: 100 });

  if (error) {
    return (
      <div>
        <h1>Sent</h1>
        <p style={{ color: '#b00' }}>Failed to load: {error.message}</p>
      </div>
    );
  }

  const rows: SentRow[] = (data?.data ?? []) as any;

  return (
    <div>
      <h1>Sent</h1>
      {just && (
        <p style={{ color: '#080', background: '#efffef', padding: 8, border: '1px solid #cfe9cf' }}>
          Sent! Resend id: <code>{just}</code>
        </p>
      )}
      {rows.length === 0 ? (
        <p style={{ color: '#666' }}>No emails sent yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th style={th}>To</th>
              <th style={th}>Subject</th>
              <th style={th}>Status</th>
              <th style={th}>Sent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}>{Array.isArray(r.to) ? r.to.join(', ') : r.to}</td>
                <td style={td}>
                  <Link href={`/sent/${r.id}`}>{r.subject || '(no subject)'}</Link>
                </td>
                <td style={td}>{r.last_event ?? '—'}</td>
                <td style={{ ...td, color: '#666' }}>
                  {r.created_at ? new Date(r.created_at).toLocaleString() : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: '8px 4px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '8px 4px' };
