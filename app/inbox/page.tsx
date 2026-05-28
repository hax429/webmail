import Link from 'next/link';
import { listReceived } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function InboxPage() {
  const rows = listReceived(200);

  if (rows.length === 0) {
    return (
      <div>
        <h1>Inbox</h1>
        <p style={{ color: '#666' }}>
          No received emails yet. Once your MX records point to Resend and the
          webhook is configured to POST to <code>/api/webhook</code>, messages will
          show up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Inbox</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
            <th style={th}>From</th>
            <th style={th}>Subject</th>
            <th style={th}>Received</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={td}>{r.from_addr}</td>
              <td style={td}>
                <Link href={`/inbox/${r.id}`}>{r.subject || '(no subject)'}</Link>
              </td>
              <td style={{ ...td, color: '#666' }}>
                {new Date(r.received_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = { padding: '8px 4px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '8px 4px' };
